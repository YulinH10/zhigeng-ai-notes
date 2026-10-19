import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSeedNotes, setArchived, selectNotes, learningStats, validateBackup, wordCount, plainText } from '../dist/core.js';
import { markdown } from '../dist/markdown.js';
import { imageReferences, validateImageBackup, planImageImport, safeImageSource } from '../dist/images.js';

const note = {...makeSeedNotes(new Date(2026,9,19,12))[0],demo:false};
delete note.excerpt;
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=';

test('archiving and restoring preserve content, favorites and learning history', () => {
  const now = new Date(2026,9,19,12), archived = setArchived(note,true,now);
  assert.equal(archived.archivedAt,now.toISOString());
  assert.equal(selectNotes([archived]).length,0);
  assert.equal(selectNotes([archived],{favorite:true}).length,0);
  assert.equal(selectNotes([archived],{archive:'archived',query:'Transformer',category:'llm'})[0],archived);
  assert.equal(selectNotes([archived],{archive:'all',date:note.date})[0],archived);
  assert.deepEqual(learningStats([archived],now),learningStats([note],now));
  const restored = setArchived(archived,false);
  assert.deepEqual(restored,{...note,archivedAt:null});
  assert.equal(selectNotes([restored],{favorite:true}).length,1);
});

test('both backup versions preserve archive status and reject invalid timestamps', () => {
  for (const version of [1,2]) {
    const archived = setArchived(note,true);
    assert.deepEqual(validateBackup({app:'zhigeng-ai-notes',version,notes:[archived]}),[archived]);
    assert.throws(() => validateBackup({app:'zhigeng-ai-notes',version,notes:[{...note,archivedAt:'invalid'}]}));
  }
});

test('image IDs and data URLs do not inflate reading counts or leak into summaries', () => {
  const content = `学到了注意力\n\n![结构图](attachment:abc-123)\n![图](${png})`;
  assert.equal(wordCount(content),6);
  assert.match(plainText(content),/结构图/);
  assert.doesNotMatch(plainText(content),/attachment|base64|abc-123/);
});

test('Markdown renders attachment and raster images, while rejecting unsafe schemes and HTML', () => {
  assert.match(markdown('![图](attachment:abc-123)'),/data-attachment-id="abc-123"/);
  assert.match(markdown(`![图](${png})`),/src="data:image\/png;base64,/);
  assert.match(markdown('![图](https://example.com/a.png)'),/referrerpolicy="no-referrer"/);
  for (const source of ['javascript:alert','data:image/svg+xml;base64,PHN2Zz4=','file:///tmp/a.png','blob:unknown']) {
    assert.equal(safeImageSource(source),null);
    assert.doesNotMatch(markdown(`![图](${source})`),/<img/);
  }
  assert.doesNotMatch(markdown('`![图](attachment:abc)`\n\n```\n![图](attachment:def)\n```'),/<img/);
  const injected=markdown('![" onerror="alert](https://example.com/a.png)');
  assert.match(injected,/alt="&quot; onerror=&quot;alert"/);
});

test('image backups validate bytes and reject duplicates, SVGs and disguised payloads', async () => {
  const image={id:'one',name:'图片',dataURL:png};
  const [record]=validateImageBackup([image]);
  assert.equal(record.blob.type,'image/png');
  assert.ok(record.blob.size>8);
  assert.throws(()=>validateImageBackup([image,image]));
  assert.throws(()=>validateImageBackup([{...image,dataURL:'data:image/svg+xml;base64,PHN2Zz4='}]));
  assert.throws(()=>validateImageBackup([{...image,dataURL:'data:image/png;base64,PGh0bWw+'}]));
  assert.throws(()=>validateImageBackup([{...image,id:'../file'}]));
});

test('merged backups remap shared image IDs once and retain archived note content', () => {
  const records=validateImageBackup([{id:'same',dataURL:png},{id:'unused',dataURL:png}]);
  const original='![结构图](attachment:same)';
  const plan=planImageImport([original,original+'\n正文'],records);
  assert.equal(plan.images.length,1);
  assert.notEqual(plan.images[0].id,'same');
  assert.deepEqual(imageReferences(plan.contents[0]),[plan.images[0].id]);
  assert.deepEqual(imageReferences(plan.contents[1]),[plan.images[0].id]);
  assert.equal(records[0].id,'same');
  assert.throws(()=>planImageImport(['![丢失](attachment:missing)'],records));
  assert.deepEqual(planImageImport(['只有正文'],[]),{images:[],contents:['只有正文']});
});
