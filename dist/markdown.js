import { escapeHTML } from './core.js';
import { safeImageSource } from './images.js';

// Deliberately supports a small, safe Markdown subset; raw HTML is always text.
function inline(source) {
  const slots = [];
  const token = html => { const id = slots.length; slots.push(html); return `\u0000${id}\u0000`; };
  let value = escapeHTML(source.replace(/\u0000/g, ''));
  value = value.replace(/`([^`]+)`/g, (_, code) => token(`<code>${code}</code>`));
  value = value.replace(/!\[([^\]]*)\]\(([^\s)]+)\)/g, (_, alt, href) => {
    const source = safeImageSource(href);
    if (!source) return token(`<span class="missing-image">${alt || '图片地址不受支持'}</span>`);
    const attributes = source.id ? `data-attachment-id="${source.id}"` : `src="${source.url}"`;
    return token(`<img class="note-image" ${attributes} alt="${alt || '笔记图片'}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`);
  });
  value = value.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (_, label, href) => {
    if (!/^https?:\/\//i.test(href)) return label;
    return token(`<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`);
  });
  value = value.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return value.replace(/\u0000(\d+)\u0000/g, (_, id) => slots[Number(id)]);
}

export function markdown(source = '') {
  const lines = String(source).replace(/\r\n?/g, '\n').split('\n');
  let html = '', list = '', code = null, language = '', paragraph = [];
  const flushParagraph = () => { if (paragraph.length) { html += `<p>${inline(paragraph.join('\n')).replace(/\n/g, '<br>')}</p>`; paragraph = []; } };
  const closeList = () => { if (list) { html += `</${list}>`; list = ''; } };
  for (const line of lines) {
    if (/^```/.test(line)) {
      flushParagraph(); closeList();
      if (code !== null) { html += `<pre><span class="code-language">${escapeHTML(language)}</span><code>${escapeHTML(code.join('\n'))}</code></pre>`; code = null; }
      else { code = []; language = line.slice(3).trim(); }
      continue;
    }
    if (code !== null) { code.push(line); continue; }
    if (!line.trim()) { flushParagraph(); closeList(); continue; }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    const item = line.match(/^\s*(?:([-*])|\d+\.)\s+(.+)$/);
    if (heading) { flushParagraph(); closeList(); const level = heading[1].length; html += `<h${level}>${inline(heading[2])}</h${level}>`; }
    else if (/^>\s?/.test(line)) { flushParagraph(); closeList(); html += `<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`; }
    else if (/^---+$/.test(line)) { flushParagraph(); closeList(); html += '<hr>'; }
    else if (item) {
      flushParagraph(); const type = item[1] ? 'ul' : 'ol'; if (list !== type) { closeList(); list = type; html += `<${type}>`; }
      const task = item[2].match(/^\[([ xX])\]\s+(.*)/);
      html += task ? `<li class="task-item"><span aria-label="${task[1] === ' ' ? '未完成' : '已完成'}">${task[1] === ' ' ? '☐' : '☑'}</span> ${inline(task[2])}</li>` : `<li>${inline(item[2])}</li>`;
    } else { closeList(); paragraph.push(line); }
  }
  flushParagraph(); closeList();
  if (code !== null) html += `<pre><span class="code-language">${escapeHTML(language)}</span><code>${escapeHTML(code.join('\n'))}</code></pre>`;
  return html;
}
