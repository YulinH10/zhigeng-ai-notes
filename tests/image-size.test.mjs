import test from 'node:test';
import assert from 'node:assert/strict';
import { imageLayouts, setImageWidth, planImageImport, imageReferences } from '../dist/images.js';
import { markdown } from '../dist/markdown.js';
import { plainText, wordCount, validateBackup, makeSeedNotes } from '../dist/core.js';

test('each occurrence can be resized independently and reset without changing image data', () => {
  const text='前文\n![第一张](attachment:same)\n![第二张](attachment:same)\n后文';
  const resized=setImageWidth(text,1,50);
  assert.deepEqual(imageLayouts(resized).map(image=>image.width),[null,50]);
  assert.deepEqual(imageReferences(resized),['same']);
  assert.equal(resized,'前文\n![第一张](attachment:same)\n![第二张](attachment:same){width=50%}\n后文');
  assert.equal(setImageWidth(resized,1,null),text);
  assert.match(setImageWidth(resized,1,75),/\{width=75%\}/);
  assert.doesNotMatch(setImageWidth(resized,1,75),/width=50/);
});

test('size controls skip fenced and inline code and support external images', () => {
  const text='```md\n![示例](attachment:code)\n```\n`![示例](attachment:inline)`\n![实际](https://example.com/a.png)';
  assert.equal(imageLayouts(text).length,1);
  const sized=setImageWidth(text,0,25);
  assert.match(sized,/https:\/\/example.com\/a.png\)\{width=25%\}/);
  assert.match(sized,/`!\[示例\]\(attachment:inline\)`/);
  assert.equal((markdown(sized).match(/<img /g)||[]).length,1);
});

test('only bounded numeric widths become CSS, with automatic height preserving aspect ratio', () => {
  assert.match(markdown('![图](attachment:a){width=50%}'),/style="width:50%;max-height:none"/);
  for (const value of [0,9,101,999,NaN,50.5,'50;color:red']) assert.throws(()=>setImageWidth('![图](attachment:a)',0,value));
  for (const suffix of ['{width=0%}','{width=999%}','{width=50%;color:red}','{width=" onerror="alert}']) {
    const html=markdown('![图](attachment:a)'+suffix);
    assert.doesNotMatch(html,/<img[^>]+style=/);
    assert.doesNotMatch(html,/<img[^>]+onerror=/);
  }
  assert.throws(()=>setImageWidth('只有文字',0,50));
});

test('backup validation and image ID remapping preserve per-occurrence sizes', () => {
  const content='![图](attachment:same){width=35%}\n![再看](attachment:same){width=80%}';
  const note={...makeSeedNotes()[0],content};
  const backup=JSON.parse(JSON.stringify({app:'zhigeng-ai-notes',version:2,notes:[note]}));
  assert.equal(validateBackup(backup)[0].content,content);
  const plan=planImageImport([content],[{id:'same',blob:new Blob(['test'])}]);
  assert.deepEqual(imageLayouts(plan.contents[0]).map(image=>image.width),[35,80]);
  assert.deepEqual(imageReferences(plan.contents[0]),[plan.images[0].id]);
  assert.equal(wordCount(content),0);
  assert.doesNotMatch(plainText(content),/width|35|80/);
});
