import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { PUBLISHED_NOTES, includePublishedNotes } from '../dist/published.js';
import { validateBackup, makeSeedNotes } from '../dist/core.js';
import { markdown } from '../dist/markdown.js';

test('published articles are valid notes with deployable images and complete content', () => {
  const validated = validateBackup({ app: 'zhigeng-ai-notes', version: 1, notes: PUBLISHED_NOTES });
  assert.equal(validated.length, 1);
  const [article] = includePublishedNotes([]);
  assert.equal(article.id, 'aff079b6-aabc-4fb4-a889-3e55b7bd9a17');
  assert.equal(article.title, '让 Agent 自己修 bad case');
  assert.doesNotMatch(article.content, /^## Q\d+：/m);
  assert.doesNotMatch(article.content, /阿福|蚂蚁|阿里|奇点学堂|萧恺|肖汉松|HAR-\d|alibaba-inc\.com|alidocs\.dingtalk\.com/);
  const images = [...article.content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)];
  const manifest = JSON.parse(readFileSync(new URL('../dist/assets/articles/harness/figures.json', import.meta.url), 'utf8'));
  assert.equal(images.length, 20);
  assert.deepEqual(manifest.map(figure => figure.sourceFigure), Array.from({ length: 20 }, (_, index) => index + 1));
  assert.deepEqual(images.map(([, source]) => source.split('/').pop()), manifest.map(figure => figure.file));
  for (const [, source] of images) {
    const url = new URL(source);
    assert.equal(url.origin, 'https://yulinh10.github.io');
    assert.ok(url.pathname.startsWith('/zhigeng-ai-notes/assets/articles/'));
    const file = new URL('../dist/' + url.pathname.slice('/zhigeng-ai-notes/'.length), import.meta.url);
    assert.ok(existsSync(file));
    const svg = readFileSync(file, 'utf8');
    assert.match(svg, /<svg[^>]+viewBox=/);
    assert.match(svg, /<title id="title">/);
    assert.doesNotMatch(svg.replace('http://www.w3.org/2000/svg', ''), /阿福|蚂蚁|阿里|奇点学堂|萧恺|肖汉松|HAR-\d|<script|<image|https?:\/\//i);
  }
  assert.equal((markdown(article.content).match(/<img /g) || []).length, 20);
  assert.equal(includePublishedNotes(makeSeedNotes()).length, 7);
});

test('unchanged earlier editions refresh while personal edits, tags and archives survive', () => {
  const old = { ...PUBLISHED_NOTES[0], title: 'Earlier article', content: 'An unchanged earlier edition.',
    tags: ['个人标签'], favorite: true, archivedAt: '2026-10-23T00:00:00Z' };
  const catalog = [{ ...PUBLISHED_NOTES[0], replaces: [{ title: old.title, contentFingerprint: '26:7fa56d041322199d' }] }];
  const [updated] = includePublishedNotes([old], catalog);
  assert.equal(updated.title, PUBLISHED_NOTES[0].title);
  assert.equal(updated.content, PUBLISHED_NOTES[0].content);
  assert.equal(updated.favorite, true);
  assert.equal(updated.archivedAt, old.archivedAt);
  assert.ok(updated.tags.includes('个人标签'));
  assert.ok(!Object.hasOwn(updated, 'replaces'));
  assert.deepEqual(includePublishedNotes([updated], catalog), [updated]);
  for (const edited of [{ ...old, title: 'My edit' }, { ...old, content: old.content + ' My own addition.' }]) {
    assert.equal(includePublishedNotes([edited], catalog)[0], edited);
  }
});

test('published articles do not duplicate or overwrite saved notes, edits, or archives', () => {
  const personal = { ...PUBLISHED_NOTES[0], title: '我的本地改写', archivedAt: '2026-10-23T00:00:00Z', favorite: true };
  const existing = [{ ...makeSeedNotes()[0], title: '另一篇笔记' }, personal];
  const merged = includePublishedNotes(existing);
  assert.deepEqual(merged, existing);
  assert.equal(merged[1], personal);
  assert.deepEqual(includePublishedNotes(merged), merged);
  const [fresh] = includePublishedNotes([]);
  fresh.tags.push('本地标签');
  assert.ok(!PUBLISHED_NOTES[0].tags.includes('本地标签'));
});
