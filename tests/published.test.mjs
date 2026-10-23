import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { PUBLISHED_NOTES, includePublishedNotes } from '../dist/published.js';
import { validateBackup, makeSeedNotes } from '../dist/core.js';
import { markdown } from '../dist/markdown.js';

test('published articles are valid notes with deployable images and complete content', () => {
  const validated = validateBackup({ app: 'zhigeng-ai-notes', version: 1, notes: PUBLISHED_NOTES });
  assert.equal(validated.length, 1);
  const [article] = includePublishedNotes([]);
  assert.equal(article.id, 'aff079b6-aabc-4fb4-a889-3e55b7bd9a17');
  assert.equal((article.content.match(/^## Q\d+：/gm) || []).length, 11);
  const images = [...article.content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)];
  assert.equal(images.length, 2);
  for (const [, source] of images) {
    const url = new URL(source);
    assert.equal(url.origin, 'https://yulinh10.github.io');
    assert.ok(url.pathname.startsWith('/zhigeng-ai-notes/assets/articles/'));
    assert.ok(existsSync(new URL('../dist/' + url.pathname.slice('/zhigeng-ai-notes/'.length), import.meta.url)));
  }
  assert.equal((markdown(article.content).match(/<img /g) || []).length, 2);
  assert.equal(includePublishedNotes(makeSeedNotes()).length, 7);
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
