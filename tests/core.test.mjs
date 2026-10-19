import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSeedNotes, validateBackup, selectNotes, learningStats, dateKey } from '../dist/core.js';
import { markdown } from '../dist/markdown.js';

const seeds = makeSeedNotes(new Date(2026, 9, 13, 12));
const wrap = notes => ({ app: 'zhigeng-ai-notes', version: 1, notes });
test('backup round trip preserves complete notes and demo summaries', () => {
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(wrap(seeds)))), seeds);
});
test('backup rejects duplicate IDs, unknown categories, impossible dates and oversized fields atomically', () => {
  for (const notes of [ [seeds[0], seeds[0]], [{...seeds[0], category:'unknown'}], [{...seeds[0], date:'2026-02-31'}], [{...seeds[0], title:'x'.repeat(201)}], [{...seeds[0], tags:['x'.repeat(41)]}] ]) assert.throws(() => validateBackup(wrap(notes)));
  assert.throws(() => validateBackup({ notes:seeds }));
});
test('search combines title, body and tags, then applies category and favorites', () => {
  assert.equal(selectNotes(seeds,{query:'transformer query'})[0].id, 'example-1');
  assert.equal(selectNotes(seeds,{category:'rag',favorite:true}).length,1);
  assert.equal(selectNotes(seeds,{tag:'学习方法'}).length,2);
  assert.equal(selectNotes(seeds,{query:'No match here'}).length,0);
  assert.equal(selectNotes(seeds,{sort:'oldest'})[0].id,'example-6');
});
test('streak excludes demo content and remains valid until the next day ends', () => {
  const today = new Date(2026,9,13,12);
  assert.deepEqual(learningStats(seeds,today),{days:0,streak:0,words:0,total:0});
  const actual = [0,1,2].map((i)=>({...seeds[i],demo:false}));
  assert.equal(learningStats(actual,today).streak,3);
  assert.equal(learningStats(actual,new Date(2026,9,14,12)).streak,3);
  assert.equal(learningStats(actual,new Date(2026,9,15,12)).streak,0);
  assert.equal(dateKey(new Date(2026,0,1,0)), '2026-01-01');
});
test('Markdown renders headings, lists, tasks and fenced code with HTML escaped', () => {
  const html=markdown('## 标题\n\n- **重点**\n- [x] 完成\n\n```js\n<script>alert(1)</script>\n```');
  assert.match(html,/<h2>标题<\/h2>/);
  assert.match(html,/<strong>重点<\/strong>/);
  assert.match(html,/aria-label="已完成"/);
  assert.match(html,/&lt;script&gt;/);
  assert.doesNotMatch(html,/<script/);
});
test('Markdown blocks script links and raw HTML and preserves safe external links', () => {
  const html=markdown('<img src=x onerror=alert(1)>\n\n[bad](javascript:alert) [data](data:text/html,evil) [safe](https://example.com)');
  assert.doesNotMatch(html,/<img|href="javascript:|href="data:/);
  assert.match(html,/href="https:\/\/example.com" target="_blank" rel="noopener noreferrer"/);
  assert.match(html,/&lt;img/);
});
test('unclosed code fences are still escaped and rendered', () => {
  assert.match(markdown('```\n<iframe>'), /<code>&lt;iframe&gt;<\/code>/);
});
