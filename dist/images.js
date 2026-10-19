// Image bytes live in IndexedDB; Markdown contains short, portable attachment IDs.
export const IMAGE_ID = /^[a-zA-Z0-9_-]{1,80}$/;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const INPUT_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const attachmentPattern = () => /!\[([^\]]*)\]\(attachment:([a-zA-Z0-9_-]{1,80})\)/g;
let databasePromise;

export function imageReferences(content) {
  return [...new Set([...String(content).matchAll(attachmentPattern())].map(match => match[2]))];
}

export function replaceImageReferences(content, replacements) {
  return String(content).replace(attachmentPattern(), (match, alt, id) => replacements.has(id) ? `![${alt}](attachment:${replacements.get(id)})` : match);
}

// Use fresh IDs when merging backups so unrelated local images cannot be overwritten.
export function planImageImport(contents, records) {
  const needed = [...new Set(contents.flatMap(imageReferences))];
  const byId = new Map(records.map(record => [record.id, record]));
  const replacements = new Map();
  const images = needed.map(id => {
    const record = byId.get(id);
    if (!record) throw new Error('备份中缺少正文引用的图片，请使用包含图片的完整 JSON 备份。');
    const newId = crypto.randomUUID();
    replacements.set(id, newId);
    return { ...record, id: newId };
  });
  return { images, contents: contents.map(content => replaceImageReferences(content, replacements)) };
}

export function safeImageSource(source) {
  if (/^attachment:[a-zA-Z0-9_-]{1,80}$/.test(source)) return { id: source.slice(11) };
  if (/^https?:\/\//i.test(source)) return { url: source };
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(source) && source.length <= MAX_IMAGE_BYTES * 1.4) return { url: source };
  return null;
}

function database() {
  if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('当前浏览器不支持本地图片存储，请换用常规浏览器。')); return; }
    const request = indexedDB.open('zhigeng-images', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images', { keyPath: 'id' });
    request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); databasePromise = null; }; resolve(db); };
    request.onerror = () => reject(new Error('图片数据库无法打开，请检查浏览器的存储权限。'));
    request.onblocked = () => reject(new Error('请关闭其他知更标签页后重试。'));
  }).catch(error => { databasePromise = null; throw error; });
  return databasePromise;
}

export async function getImage(id) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction('images', 'readonly').objectStore('images').get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('图片读取失败。'));
  });
}

export async function addImages(records) {
  if (!records.length) return;
  const db = await database();
  await new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readwrite');
    for (const record of records) tx.objectStore('images').add(record);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(new Error('图片保存失败，可能是浏览器空间不足。原有笔记未受影响。'));
    tx.onerror = () => {}; // The transaction abort reports the failure exactly once.
  });
}

export async function deleteImages(ids) {
  if (!ids.length) return;
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readwrite');
    ids.forEach(id => tx.objectStore('images').delete(id));
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
  });
}

function decodeImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob), image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('无法读取这张图片，请使用 PNG、JPEG 或 WebP。')); };
    image.src = url;
  });
}
const canvasBlob = (canvas, type, quality) => new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('图片处理失败，请重试。')), type, quality));

export async function prepareImage(file) {
  if (!INPUT_TYPES.has(file.type)) throw new Error('支持粘贴或选择 PNG、JPEG、WebP 图片。');
  if (file.size > 10 * 1024 * 1024) throw new Error('单张原图请控制在 10 MB 以内。');
  const image = await decodeImage(file);
  if (image.naturalWidth * image.naturalHeight > 40000000) throw new Error('图片像素过大，请先裁剪或缩小后再插入。');
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await canvasBlob(canvas, 'image/webp', 0.88);
  if (blob.size > MAX_IMAGE_BYTES) throw new Error('压缩后图片仍超过 2 MB，请裁剪后再插入。');
  return { id: crypto.randomUUID(), name: String(file.name || '粘贴的图片').slice(0,120), blob, createdAt: new Date().toISOString() };
}

export function releaseImages(root) {
  root?.querySelectorAll('img[data-owned-url]').forEach(img => URL.revokeObjectURL(img.dataset.ownedUrl));
}

export async function hydrateImages(root) {
  await Promise.all([...root.querySelectorAll('img[data-attachment-id]')].map(async img => {
    if (img.dataset.ownedUrl || img.dataset.loading) return;
    img.dataset.loading = 'true';
    try {
      const record = await getImage(img.dataset.attachmentId);
      if (!record) throw new Error('图片未找到，请导入包含图片的完整备份。');
      if (!img.isConnected) return;
      const url = URL.createObjectURL(record.blob);
      img.dataset.ownedUrl = url;
      img.src = url;
      img.onerror = () => { img.alt = '这张图片无法显示'; img.classList.add('missing-image'); };
    } catch (error) {
      if (img.isConnected) { img.alt = error.message; img.classList.add('missing-image'); }
    }
  }));
}

const blobDataURL = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('图片导出失败，请重试。'));
  reader.readAsDataURL(blob);
});

export async function exportImages(contents) {
  const ids = [...new Set(contents.flatMap(imageReferences))], images = [], missingImages = [];
  for (const id of ids) {
    const record = await getImage(id);
    if (record) images.push({ id, name: record.name, dataURL: await blobDataURL(record.blob) });
    else missingImages.push(id);
  }
  return { images, missingImages };
}

export function validateImageBackup(input) {
  if (!Array.isArray(input) || input.length > 10000) throw new Error('备份中的图片列表无效。');
  const ids = new Set();
  return input.map(image => {
    if (!image || typeof image.id !== 'string' || !IMAGE_ID.test(image.id) || ids.has(image.id) || typeof image.dataURL !== 'string' || image.dataURL.length > MAX_IMAGE_BYTES * 1.4) throw new Error('备份中有重复、过大或无效的图片。');
    const match = image.dataURL.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match || match[2].length % 4 !== 0) throw new Error('备份中的图片编码或格式不受支持。');
    let binary;
    try { binary = atob(match[2]); } catch { throw new Error('备份中的图片编码已损坏。'); }
    if (binary.length > MAX_IMAGE_BYTES) throw new Error('备份中的单张图片超过 2 MB。');
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const validSignature = match[1] === 'image/png' ? [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v) : match[1] === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : binary.slice(0,4) === 'RIFF' && binary.slice(8,12) === 'WEBP';
    if (!validSignature) throw new Error('备份中的图片内容与格式不符。');
    ids.add(image.id);
    return { id: image.id, name: typeof image.name === 'string' ? image.name.slice(0,120) : '导入的图片', blob: new Blob([bytes], { type: match[1] }), createdAt: new Date().toISOString() };
  });
}

export async function portableMarkdown(content) {
  const { images, missingImages } = await exportImages([content]);
  const sources = new Map(images.map(image => [image.id, image.dataURL]));
  return { content: String(content).replace(attachmentPattern(), (match, alt, id) => sources.has(id) ? `![${alt}](${sources.get(id)})` : match), missingImages };
}

export function copyImage(id) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') return Promise.reject(new Error('这个浏览器不支持复制图片，请在图片上右键复制或保存。'));
  // Pass a promise immediately to preserve Safari's user-activation requirement.
  const png = getImage(id).then(async record => {
    if (!record) throw new Error('图片未找到。');
    if (record.blob.type === 'image/png') return record.blob;
    const image = await decodeImage(record.blob), canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    canvas.getContext('2d').drawImage(image, 0, 0);
    return canvasBlob(canvas, 'image/png');
  });
  return navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
}
