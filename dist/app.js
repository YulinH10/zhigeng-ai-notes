import { CATEGORIES, categoryFor, dateKey, escapeHTML as e, plainText, readingMinutes, selectNotes, learningStats, validateBackup, makeSeedNotes } from './core.js';
import { markdown } from './markdown.js';

const ICONS = {
  leaf: '<path d="M12 21V11M12 15C5 16 3 11 3 6c6-1 10 2 9 9Zm0-5c0-6 4-8 10-7 0 6-4 9-10 7Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  book: '<path d="M12 6v15M3 4c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 2-2-2-5-3-9-2Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h2m6 0h2m-10 3h2"/>',
  bookmark: '<path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4Z"/>',
  edit: '<path d="m15 5 4 4M4 20l5-1L21 7a2.8 2.8 0 0 0-4-4L5 15Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sparkles: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
  terminal: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m6 9 3 3-3 3m7 0h5"/>',
  network: '<rect x="9" y="2" width="6" height="6" rx="2"/><rect x="2" y="16" width="6" height="6" rx="2"/><rect x="16" y="16" width="6" height="6" rx="2"/><path d="M12 8v4H5v4m7-4h7v4"/>',
  layers: '<path d="m12 2 10 6-10 6L2 8Zm-9 11 9 5 9-5M3 17l9 5 9-5"/>',
  code: '<path d="m7 6-6 6 6 6m10-12 6 6-6 6M14 3l-4 18"/>',
  settings: '<path d="m9 3-1 3-3 1-2 4 2 3v4l4 3 3-1 3 1 4-3v-4l2-3-2-4-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/>',
  upload: '<path d="M12 15V3m-5 5 5-5 5 5M4 15v5h16v-5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  moon: '<path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z"/>',
  list: '<path d="M9 5h12M9 12h12M9 19h12M3 5h1m-1 7h1m-1 7h1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  file: '<path d="M14 2H5v20h14V7Zm0 0v6h5M8 12h8m-8 4h5"/>',
  fire: '<path d="M13 2c1 6 7 7 7 12a8 8 0 0 1-16 0c0-3 2-6 5-8 0 3 1 4 2 5 2-3 2-5 2-9Z"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.book}</svg>`;
const NOTES_KEY = 'zhigeng.notes.v1', DRAFT_KEY = 'zhigeng.draft.v1', PREFS_KEY = 'zhigeng.prefs.v1';
let notes, draft = null, prefs = {}, storageProblem = '', rawBackup = '';
try {
  const raw = localStorage.getItem(NOTES_KEY);
  rawBackup = raw || '';
  notes = raw ? validateBackup(JSON.parse(raw)) : makeSeedNotes();
  if (!raw) localStorage.setItem(NOTES_KEY, JSON.stringify({ app: 'zhigeng-ai-notes', version: 1, notes }));
} catch (error) { notes = []; storageProblem = `无法读取笔记：${error.message}`; }
try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {}; } catch { /* The saved notes remain available if preferences are corrupt. */ }
if (!draft || typeof draft !== 'object' || typeof draft.title !== 'string' || typeof draft.content !== 'string' || !Array.isArray(draft.tags) || !CATEGORIES.some(c => c.id === draft.category)) draft = null;
let filters = { category: 'all', query: '', tag: '', sort: 'newest' };
let layout = prefs.layout === 'list' ? 'list' : 'grid';
let editorModel = null, editorTab = 'write', draftTimer, toastTimer, mobileOpen = false;
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1), calendarDate = '';
document.documentElement.dataset.theme = prefs.theme === 'dark' ? 'dark' : 'light';
const route = () => location.hash.slice(1) || 'notes';
const toast = message => { const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3200); };
function savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { toast('浏览器无法保存偏好设置'); } }
function commit(next, recover = false) {
  if (storageProblem && !recover) { toast('请先在设置中导入有效备份，恢复本地存储'); return false; }
  try {
    if (recover && rawBackup) localStorage.setItem(`${NOTES_KEY}.recovery`, rawBackup);
    localStorage.setItem(NOTES_KEY, JSON.stringify({ app: 'zhigeng-ai-notes', version: 1, notes: next }));
    notes = next;
    if (recover) storageProblem = '';
    return true;
  }
  catch { toast('保存失败：浏览器存储空间不足，请先导出备份'); return false; }
}
function go(path) {
  flushEditor(); mobileOpen = false;
  if (location.hash === `#${path}`) render(); else location.hash = path;
  window.scrollTo({ top: 0, behavior: 'instant' });
}
const formatDate = value => new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(new Date(`${value}T12:00:00`));
function summary(note) { return note.excerpt || plainText(note.content.split('\n').filter(l => !/^#|^>/.test(l)).join(' ')).slice(0, 100); }

function sidebar() {
  const r = route();
  const items = [{ id: 'notes', icon: 'book', title: '全部笔记', count: notes.length }, { id: 'topics', icon: 'grid', title: '知识专题' }, { id: 'calendar', icon: 'calendar', title: '学习日历' }, { id: 'favorites', icon: 'bookmark', title: '我的收藏', count: notes.filter(n => n.favorite).length }];
  return `<aside class="sidebar ${mobileOpen ? 'is-open' : ''}" aria-label="主导航">
    <a class="brand" href="#notes"><span class="brand-symbol">${icon('leaf')}</span><span class="brand-name">知更<span>AI NOTES</span></span></a>
    <div class="space-label"><span class="space-dot"></span>我的知识花园<span class="personal-label">个人</span></div>
    <button class="button primary new-note" data-action="new">${icon('plus')} 写一篇笔记 <kbd>N</kbd></button>
    <nav class="main-nav">${items.map(it => `<a href="#${it.id}" class="nav-link ${r === it.id && (it.id !== 'notes' || filters.category === 'all') ? 'active' : ''}" ${r === it.id ? 'aria-current="page"' : ''}>${icon(it.icon)}<span>${it.title}</span>${it.count !== undefined ? `<span class="nav-count">${it.count}</span>` : ''}</a>`).join('')}</nav>
    <div class="nav-section-title">知识分类 <span>${CATEGORIES.length}</span></div>
    <nav class="category-nav">${CATEGORIES.map(c => `<button class="nav-link ${r === 'notes' && filters.category === c.id ? 'active' : ''}" data-action="category" data-value="${c.id}"><span class="category-dot" style="--dot:${c.color}"></span><span>${c.name}</span><span class="nav-count">${notes.filter(n => n.category === c.id).length}</span></button>`).join('')}</nav>
    <a href="#drafts" class="nav-link draft-link ${r === 'drafts' ? 'active' : ''}">${icon('edit')}<span>草稿箱</span><span class="nav-count">${draft ? 1 : 0}</span></a>
    <div class="sidebar-bottom"><div class="little-note">${icon('leaf')}<p>每天学一点，<br>知识自会慢慢生长。</p><span>STAY CURIOUS.</span></div><button class="nav-link settings-link" data-action="settings">${icon('settings')}<span>设置与数据备份</span></button><div class="profile"><span class="avatar">Y</span><div>我的学习空间<small><span></span> 本地保存 · 仅此浏览器</small></div></div></div>
  </aside>`;
}

function header() {
  return `<header class="topbar"><div class="breadcrumb"><button class="icon-button mobile-menu" data-action="menu" aria-label="打开导航">${icon('menu')}</button><span>我的空间</span>${icon('chevron')}<strong>知识花园</strong></div><div class="topbar-right"><label class="search-box">${icon('search')}<input id="search-input" type="search" placeholder="搜索你的知识…" value="${e(filters.query)}" aria-label="搜索笔记" autocomplete="off"><kbd>⌘ K</kbd></label><span class="topbar-divider"></span><button class="icon-button" data-action="theme" aria-label="切换明暗主题" title="切换明暗主题">${icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button><button class="avatar small" data-action="settings" aria-label="打开个人设置">Y</button></div></header>`;
}

function gardenArt() {
  return `<svg class="garden-art" viewBox="0 0 390 215" fill="none" aria-hidden="true"><defs><pattern id="artdots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".65" fill="currentColor" opacity=".16"/></pattern></defs><rect width="390" height="215" fill="url(#artdots)"/><ellipse cx="205" cy="171" rx="115" ry="21" fill="currentColor" opacity=".035"/><path d="m89 132 106 45 116-50-107-44Z" fill="var(--art-paper)" stroke="currentColor" stroke-opacity=".35"/><path d="m89 132 1 10 105 45 116-49v-11M195 177v10" stroke="currentColor" stroke-opacity=".35"/><path d="m109 117 85 35 100-41-88-34Z" fill="var(--art-paper)" stroke="currentColor" stroke-opacity=".5"/><path d="M109 117v9l85 35 100-41v-9M194 152v9" stroke="currentColor" stroke-opacity=".5"/><path d="M202 130V71" stroke="currentColor" stroke-width="2"/><path d="M202 106c-34 1-48-16-49-40 29-3 48 12 49 40Z" fill="#c5d8a9" stroke="currentColor" stroke-width="1.2"/><path d="M202 90c0-29 18-47 49-45-1 30-18 47-49 45Z" fill="#6d9472" stroke="currentColor" stroke-width="1.2"/><path d="m169 79 32 29m1-19 33-29" stroke="currentColor" stroke-width="1.2"/><path d="M124 72 93 52m177 36 37-22M261 155l38 13M159 39l18-12" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="3 5"/><rect x="64" y="28" width="45" height="37" rx="9" fill="var(--art-paper)" stroke="currentColor" stroke-opacity=".25" transform="rotate(-10 64 28)"/><path d="m79 37-6 7 6 4m10-13 6 4-6 7m-5-12-2 14" stroke="currentColor" stroke-width="1.3"/><rect x="291" y="30" width="43" height="39" rx="10" fill="var(--art-paper)" stroke="currentColor" stroke-opacity=".25" transform="rotate(12 291 30)"/><path d="m302 41 5 4 8-2-4 7 1 8-7-4-8 1 4-7Z" stroke="currentColor" stroke-width="1.2"/><circle cx="312" cy="173" r="15" fill="var(--art-paper)" stroke="currentColor" stroke-opacity=".3"/><path d="M305 173h14m-7-7v14" stroke="currentColor" stroke-width="1.3"/><circle cx="183" cy="22" r="3" fill="#b4c98c"/><circle cx="99" cy="185" r="3" fill="#c1a876"/><path d="M269 19v9m-4-4h8M52 117v9m-4-4h8" stroke="currentColor" stroke-opacity=".5"/></svg>`;
}

function hero() {
  const stats = learningStats(notes);
  return `<section class="hero"><div class="hero-copy"><div class="eyebrow"><span></span> A LITTLE LEARNING, EVERY DAY</div><h1>知识，因记录而<span>生长。</span><svg viewBox="0 0 140 12" aria-hidden="true"><path d="M3 9C40 1 91 1 136 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></h1><p>把每一次「原来如此」，变成自己的知识。<br>记录、连接、回顾，在这里构建你的 AI 知识体系。</p><div class="hero-foot"><span>${icon('calendar')}${new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())}</span><span class="hero-separator"></span><span>今天也保持好奇心</span>${icon('sparkles')}</div></div><div class="hero-visual">${gardenArt()}<span>PLANT IDEAS. GROW KNOWLEDGE.</span></div></section>
    <section class="stats-row" aria-label="学习统计"><div>${icon('book')}<span>积累笔记<strong>${notes.length}<small>篇</small></strong></span></div><div>${icon('grid')}<span>探索主题<strong>${new Set(notes.map(n => n.category)).size}<small>个</small></strong></span></div><div>${icon('fire')}<span>连续学习<strong>${stats.streak}<small>天</small></strong></span><span class="stat-subtitle">从今天开始</span></div><div>${icon('edit')}<span>记录字数<strong>${stats.words >= 1000 ? (stats.words / 1000).toFixed(1) + 'k' : stats.words}<small>字</small></strong></span><span class="stat-subtitle">不含示例</span></div></section>`;
}

function cover(category, compact = false) {
  const idx = CATEGORIES.findIndex(c => c.id === category);
  const diagrams = [
    `<svg viewBox="0 0 320 115" fill="none"><g stroke="currentColor" stroke-opacity=".35">${[32, 57, 82].flatMap(y => [22, 47, 72, 97].map(z => `<path d="M99 ${y} 153 ${z}M164 ${z} 219 ${y}"/>`)).join('')}</g><g fill="var(--cover-node)" stroke="currentColor">${[32, 57, 82].map(y => `<circle cx="96" cy="${y}" r="5"/><circle cx="224" cy="${y}" r="5"/>`).join('')}${[22,47,72,97].map(y => `<circle cx="159" cy="${y}" r="5"/>`).join('')}</g><path d="M47 57h28m170 0h28" stroke="currentColor" stroke-dasharray="3 4"/><text x="22" y="61">x</text><text x="286" y="61">y</text></svg>`,
    `<div class="prompt-art"><span class="prompt-chevron">&gt;_</span><div><i>role</i><b>「保持好奇」</b><br><i>task</i><b>「把问题说清楚」</b><br><span class="prompt-cursor"></span></div></div><span class="cover-corner">{ }</span>`,
    `<svg viewBox="0 0 320 115" fill="none"><path d="M90 59h140M159 25v68" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="4 4"/><rect x="129" y="30" width="60" height="58" rx="16" fill="var(--cover-node)" stroke="currentColor"/><rect x="144" y="47" width="30" height="22" rx="6" stroke="currentColor"/><circle cx="153" cy="56" r="2" fill="currentColor"/><circle cx="165" cy="56" r="2" fill="currentColor"/><path d="M154 64h10m-5-22v5" stroke="currentColor"/><rect x="61" y="45" width="29" height="28" rx="7" stroke="currentColor"/><path d="m70 59 4 4 7-8" stroke="currentColor"/><rect x="230" y="45" width="29" height="28" rx="7" stroke="currentColor"/><path d="M239 54h11m-11 5h11m-11 5h7" stroke="currentColor"/><circle cx="159" cy="17" r="5" stroke="currentColor"/></svg>`,
    `<svg viewBox="0 0 320 115" fill="none"><rect x="66" y="29" width="39" height="54" rx="5" stroke="currentColor"/><path d="M76 42h19m-19 9h19m-19 9h13M118 57h26m-5-5 5 5-5 5m45-5h26m-5-5 5 5-5 5" stroke="currentColor" stroke-opacity=".7"/><path d="m164 36 22 12-22 12-22-12Zm-22 21 22 12 22-12m-44 9 22 12 22-12" stroke="currentColor"/><rect x="222" y="35" width="42" height="40" rx="9" fill="var(--cover-node)" stroke="currentColor"/><path d="M231 47h24m-24 8h24m-24 8h14" stroke="currentColor"/></svg>`,
    `<div class="code-art"><div><span></span><span></span><span></span><small>experiment.py</small></div><code><i>while</i> curious:<br>&nbsp;&nbsp;learn() <span># 保持探索</span><br>&nbsp;&nbsp;build()<br>&nbsp;&nbsp;<b>repeat()</b></code></div>`,
    `<svg viewBox="0 0 320 115" fill="none"><path d="M90 88c31-13 43 0 68-8 31-11 47 0 72-10" stroke="currentColor" stroke-opacity=".3"/><path d="M159 85V36m0 29c-25 2-34-11-35-27 23-1 35 10 35 27Zm0-12c-1-23 13-35 35-33 0 23-13 35-35 33Z" stroke="currentColor" stroke-width="1.4" fill="var(--cover-node)"/><circle cx="220" cy="32" r="13" stroke="currentColor" stroke-opacity=".3"/><path d="M99 27v10m-5-5h10" stroke="currentColor" stroke-opacity=".5"/></svg>`,
  ];
  return `<div class="note-cover cover-${category} ${compact ? 'compact' : ''}"><span class="cover-label">${categoryFor(category).english}</span>${diagrams[idx]}<span class="cover-index">0${idx + 1} / FIELD NOTES</span></div>`;
}

function noteCard(n) {
  const c = categoryFor(n.category);
  return `<article class="note-card"><a class="card-cover-link" href="#note/${encodeURIComponent(n.id)}" tabindex="-1" aria-hidden="true">${cover(n.category)}</a><div class="card-body"><div class="card-meta"><span style="--dot:${c.color}"><i></i>${c.name}</span>${n.demo ? '<small>示例</small>' : '<small>原创笔记</small>'}</div><h3><a href="#note/${encodeURIComponent(n.id)}">${e(n.title)}</a></h3><p class="card-excerpt">${e(summary(n))}</p><div class="card-tags">${n.tags.slice(0,3).map(t => `<button data-action="tag" data-value="${e(t)}"># ${e(t)}</button>`).join('')}</div><div class="card-footer"><span>${formatDate(n.date)}<i>·</i>${readingMinutes(n.content)} 分钟阅读</span><button class="icon-button bookmark-button ${n.favorite ? 'saved' : ''}" data-action="favorite" data-id="${e(n.id)}" aria-label="${n.favorite ? '取消收藏' : '收藏'} ${e(n.title)}" aria-pressed="${n.favorite}">${icon('bookmark')}</button></div></div></article>`;
}

function empty(title, text, button = true) {
  return `<div class="empty-state"><span>${icon('leaf')}</span><h3>${title}</h3><p>${text}</p>${button ? `<button class="button primary" data-action="new">${icon('plus')} 写下第一篇笔记</button>` : `<button class="button secondary" data-action="clear-filters">清除筛选</button>`}</div>`;
}

function notesView(favorites = false) {
  const selected = selectNotes(notes, { ...filters, favorite: favorites });
  const tags = [...new Set(notes.flatMap(n => n.tags))].slice(0, 8);
  const title = favorites ? '值得反复回看的知识' : filters.category === 'all' ? '最近的学习笔记' : categoryFor(filters.category).name;
  return `${favorites ? `<div class="page-intro"><span class="eyebrow">YOUR PERSONAL HIGHLIGHTS</span><h1>我的收藏<span>。</span></h1><p>把值得重读的想法，留在触手可及的地方。</p></div>` : hero()}
    <section class="notes-section"><div class="section-heading"><div><h2>${title}<span class="count-pill">${selected.length}</span></h2>${!favorites ? '<p>每一篇记录，都是理解世界的一小步。</p>' : ''}</div><div class="view-controls"><label class="sort-control"><select id="sort-select" aria-label="笔记排序"><option value="newest" ${filters.sort === 'newest' ? 'selected' : ''}>最近学习</option><option value="oldest" ${filters.sort === 'oldest' ? 'selected' : ''}>最早学习</option><option value="updated" ${filters.sort === 'updated' ? 'selected' : ''}>最近修改</option></select>${icon('down')}</label><div class="layout-switch"><button class="icon-button ${layout === 'grid' ? 'selected' : ''}" data-action="layout" data-value="grid" aria-label="卡片视图" aria-pressed="${layout === 'grid'}">${icon('grid')}</button><button class="icon-button ${layout === 'list' ? 'selected' : ''}" data-action="layout" data-value="list" aria-label="列表视图" aria-pressed="${layout === 'list'}">${icon('list')}</button></div></div></div>
    <div class="filter-bar"><div class="category-filters"><button class="filter-chip ${filters.category === 'all' ? 'active' : ''}" data-action="filter" data-value="all">全部</button>${CATEGORIES.map(c => `<button class="filter-chip ${filters.category === c.id ? 'active' : ''}" data-action="filter" data-value="${c.id}">${c.name}</button>`).join('')}</div></div>
    ${filters.query || filters.tag ? `<div class="search-status">${icon('search')} ${filters.query ? `搜索「${e(filters.query)}」` : ''}${filters.tag ? ` 标签 #${e(filters.tag)}` : ''}<span>找到 ${selected.length} 篇笔记</span><button data-action="clear-filters">清除 ${icon('close')}</button></div>` : ''}
    <div class="notes-grid ${layout === 'list' ? 'list-layout' : ''}">${selected.length ? selected.map(noteCard).join('') : empty(favorites ? '还没有收藏的笔记' : filters.query || filters.tag || filters.category !== 'all' ? '暂时没有找到相关笔记' : '你的知识花园，等待第一颗种子', favorites ? '点击笔记右下角的书签，就能把它收藏在这里。' : '换个关键词，或把今天的新发现写下来。', !filters.query && !filters.tag && filters.category === 'all')}</div>
    ${selected.length ? `<div class="collection-end"><span></span>${icon('leaf')}<p>知识的积累，从来不必着急</p><span></span></div>` : ''}
    ${tags.length ? `<div class="tag-explore"><span>${icon('code')}探索标签</span>${tags.map(t => `<button data-action="tag" data-value="${e(t)}"># ${e(t)}</button>`).join('')}</div>` : ''}</section>`;
}

function topicsView() {
  return `<div class="page-intro"><span class="eyebrow">CONNECT THE DOTS</span><h1>把零散的知识，<span>连起来。</span></h1><p>循着一个主题深入，让每次学习都找到自己的位置。</p></div><div class="topics-grid">${CATEGORIES.map(c => { const group = notes.filter(n => n.category === c.id); return `<button class="topic-card" data-action="category" data-value="${c.id}">${cover(c.id)}<div><span class="topic-icon" style="color:${c.color}">${icon(c.icon)}</span><h2>${c.name}</h2><p>${group.length} 篇笔记 · ${group.length ? [...new Set(group.flatMap(n => n.tags))].length : 0} 个标签</p><span class="topic-open">进入专题 ${icon('arrow')}</span></div></button>`; }).join('')}</div>`;
}

function calendarView() {
  const year = calendarMonth.getFullYear(), month = calendarMonth.getMonth();
  const start = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const actual = notes.filter(n => !n.demo), stats = learningStats(notes);
  const monthNotes = actual.filter(n => n.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));
  const displayed = selectNotes(actual, { date: calendarDate }).filter(n => calendarDate || monthNotes.includes(n));
  return `<div class="page-intro"><span class="eyebrow">SMALL STEPS, EVERY DAY</span><h1>每一天，<span>都算数。</span></h1><p>不必一口气走很远。记录真实的学习足迹，示例笔记不计入日历。</p></div><div class="calendar-layout"><section class="calendar-panel"><div class="calendar-title"><h2>${year} 年 ${month + 1} 月</h2><div><button class="icon-button" data-action="month" data-value="-1" aria-label="上个月">${icon('back')}</button><button class="button text-button" data-action="today">今天</button><button class="icon-button" data-action="month" data-value="1" aria-label="下个月">${icon('arrow')}</button></div></div><div class="calendar-grid">${['一','二','三','四','五','六','日'].map(d => `<span class="weekday">${d}</span>`).join('')}${'<span class="day-blank"></span>'.repeat(start)}${Array.from({length:total},(_, i) => { const key = dateKey(new Date(year,month,i+1)), count = actual.filter(n => n.date === key).length; return `<button class="calendar-day ${key === dateKey() ? 'today' : ''} ${count ? 'has-notes' : ''} ${key === calendarDate ? 'selected' : ''}" data-action="day" data-value="${key}" aria-label="${key}，${count} 篇笔记" aria-pressed="${key === calendarDate}"><span>${i+1}</span>${count ? `<small>${count} 篇</small>` : '<small>·</small>'}</button>`; }).join('')}</div><div class="calendar-legend"><span><i></i>有学习记录</span><span>本月 ${monthNotes.length} 篇笔记</span></div></section><aside class="calendar-summary">${icon('leaf')}<h2>把好奇心，<br>变成小小的习惯。</h2><div><strong>${stats.streak}</strong><span>天连续记录</span></div><p>已在 ${stats.days} 个日子里，<br>写下 ${stats.total} 篇自己的笔记。</p><button class="button primary" data-action="new">${icon('edit')} 记录今天</button></aside></div><div class="section-heading calendar-notes-title"><h2>${calendarDate ? `${formatDate(calendarDate)}的记录` : '本月学习记录'} <span class="count-pill">${displayed.length}</span></h2>${calendarDate ? '<button class="button text-button" data-action="clear-date">查看整月</button>' : ''}</div><div class="notes-grid">${displayed.length ? displayed.map(noteCard).join('') : empty('这一天的故事，等你来写', '一段思考、一个问题，也是一份值得留下的学习记录。')}</div>`;
}

function articleView(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return `<div class="page-intro"><h1>这篇笔记不在这里</h1><p>它可能已被删除，返回知识花园看看吧。</p><a class="button primary" href="#notes">返回笔记</a></div>`;
  const cat = categoryFor(note.category);
  return `<div class="reader-toolbar"><a href="#notes" class="back-link">${icon('back')} 返回知识花园</a><div><button class="button secondary" data-action="export-note" data-id="${e(id)}">${icon('download')}<span>导出 Markdown</span></button><button class="button primary" data-action="edit" data-id="${e(id)}">${icon('edit')} 编辑笔记</button></div></div><article class="reader"><div class="reader-category">${icon(cat.icon)}${cat.name}${note.demo ? '<span class="demo-label">示例笔记</span>' : ''}</div><h1>${e(note.title)}</h1><div class="reader-meta"><span class="avatar small">Y</span><strong>我的学习笔记</strong><span>${note.date}</span><span>${readingMinutes(note.content)} 分钟阅读</span><button class="icon-button ${note.favorite ? 'saved' : ''}" data-action="favorite" data-id="${e(id)}" aria-label="${note.favorite ? '取消收藏' : '收藏'}" aria-pressed="${note.favorite}">${icon('bookmark')}</button></div><div class="reader-cover">${cover(note.category)}</div><div class="prose">${markdown(note.content.replace(/^# .+\n+/, ''))}</div><div class="reader-bottom"><div class="card-tags">${note.tags.map(t => `<button data-action="tag" data-value="${e(t)}"># ${e(t)}</button>`).join('')}</div><button class="button danger-text" data-action="delete" data-id="${e(id)}">${icon('trash')} 删除笔记</button></div></article>`;
}

const template = '## 今天学到了什么\n\n用自己的话，写下今天最重要的一个收获。\n\n## 我的理解\n\n\n\n## 实践与验证\n\n\n\n## 还没想明白的问题\n\n- [ ] \n\n## 下一步\n\n';
function startEditor(id) {
  const existing = id ? notes.find(n => n.id === id) : null;
  if (existing && draft && draft.id !== existing.id && (draft.title.trim() || draft.content.trim())) {
    confirmDialog('保留当前草稿', '草稿箱已有一篇未完成的笔记。请先保存或导出它，再编辑另一篇笔记。', '继续草稿', () => startEditor(), false); return;
  }
  const source = existing ? draft?.id === existing.id ? draft : existing : draft;
  editorModel = source ? { ...source, tags: [...source.tags], demo: false } : { id: crypto.randomUUID(), title:'', content:'', category: filters.category === 'all' ? 'llm' : filters.category, tags:[], date:dateKey(), favorite:false, demo:false };
  editorTab = 'write'; go('write');
}

function editorView() {
  if (!editorModel) editorModel = draft ? { ...draft } : { id: crypto.randomUUID(), title:'', content:'', category:'llm', tags:[], date:dateKey(), favorite:false, demo:false };
  const n = editorModel;
  return `<section class="editor"><div class="reader-toolbar"><a href="#notes" class="back-link">${icon('back')} 返回笔记</a><div><span id="save-status" class="save-status">${icon('check')} 草稿自动保存在此浏览器</span><button class="button secondary" data-action="save-draft">稍后继续</button><button class="button primary" data-action="save-note">${icon('check')} 保存笔记</button></div></div><div class="editor-heading"><span class="eyebrow">MAKE ROOM FOR A NEW IDEA</span><input id="editor-title" class="title-input" maxlength="200" aria-label="笔记标题" placeholder="给今天的新发现起个名字…" value="${e(n.title)}"></div><form id="editor-form" onsubmit="return false"><div class="editor-metadata"><label>知识分类<select id="editor-category">${CATEGORIES.map(c => `<option value="${c.id}" ${n.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select></label><label>学习日期<input id="editor-date" type="date" min="1900-01-01" max="9999-12-31" value="${e(n.date)}"></label><label class="tags-input">标签<input id="editor-tags" maxlength="200" placeholder="用逗号分隔，如：LLM, 学习方法" value="${e(n.tags.join(', '))}"></label></div><div class="editor-tabs"><div><button type="button" class="${editorTab === 'write' ? 'active' : ''}" data-action="editor-tab" data-value="write">${icon('edit')} 写作</button><button type="button" class="${editorTab === 'preview' ? 'active' : ''}" data-action="editor-tab" data-value="preview">${icon('book')} 预览</button></div><div><button type="button" class="template-button" data-action="template">${icon('plus')} 插入每日学习模板</button><button type="button" class="icon-button" data-action="markdown-help" aria-label="Markdown 语法帮助">${icon('info')}</button></div></div><textarea id="editor-content" class="content-input ${editorTab !== 'write' ? 'hidden' : ''}" maxlength="200000" placeholder="写下你的思考，不必一开始就完整。&#10;&#10;支持 Markdown：## 标题、**加粗**、- 列表、代码块…" aria-label="笔记正文" spellcheck="false">${e(n.content)}</textarea><div class="prose editor-preview ${editorTab !== 'preview' ? 'hidden' : ''}">${n.content.trim() ? markdown(n.content) : '<p class="muted">写下一点内容，就能在这里看到预览。</p>'}</div><div class="editor-footer"><span>Markdown · <span id="word-count">${n.content.replace(/\s/g,'').length}</span> 字</span><span>一点新知，也值得被记住。${icon('leaf')}</span></div></form></section>`;
}

function draftsView() {
  return `<div class="page-intro"><span class="eyebrow">IDEAS IN PROGRESS</span><h1>未完待续的<span>想法。</span></h1><p>写作时自动保留一份工作草稿，完成后保存为正式笔记。</p></div>${draft ? `<section class="draft-card">${icon('edit')}<div><span class="eyebrow">自动保存的草稿</span><h2>${e(draft.title || '还没有标题的想法')}</h2><p>${e(plainText(draft.content).slice(0, 150) || '从第一句话开始。')}</p><small>${draft.date} · ${draft.content.length} 字</small></div><div><button class="button primary" data-action="new">继续写作 ${icon('arrow')}</button><button class="button text-button" data-action="export-draft">导出草稿</button><button class="button danger-text" data-action="discard-draft">删除草稿</button></div></section>` : empty('暂时没有未完成的草稿', '新的灵感出现时，随时写下第一句话。')}`;
}

function renderMain() {
  const r = route();
  const main = document.getElementById('main-content');
  let html;
  if (r === 'write') html = editorView();
  else if (r.startsWith('note/')) { let id; try { id = decodeURIComponent(r.slice(5)); } catch { id = ''; } html = articleView(id); }
  else if (r === 'topics') html = topicsView();
  else if (r === 'calendar') html = calendarView();
  else if (r === 'drafts') html = draftsView();
  else html = notesView(r === 'favorites');
  main.innerHTML = `${storageProblem ? `<div class="storage-alert">${icon('info')} ${e(storageProblem)}<button data-action="settings">恢复数据</button></div>` : ''}${html}<footer class="site-footer"><span>知更 <i>·</i> AI Notes</span><span>记录此刻，连接未来。<i>✳</i></span></footer>`;
  document.title = `${r.startsWith('note/') ? notes.find(n => `note/${encodeURIComponent(n.id)}` === r)?.title || '笔记' : ({notes:'知识花园',topics:'知识专题',calendar:'学习日历',favorites:'我的收藏',write:'写笔记',drafts:'草稿箱'})[r] || '知识花园'} · 知更 AI Notes`;
}

function render() {
  document.getElementById('app').innerHTML = `${sidebar()}${mobileOpen ? '<button class="sidebar-shade" data-action="menu" aria-label="关闭导航"></button>' : ''}<div class="app-content">${header()}<main id="main-content" tabindex="-1"></main></div>`;
  renderMain();
}

function syncEditor() {
  if (!document.getElementById('editor-content') || !editorModel) return;
  editorModel = { ...editorModel, title: document.getElementById('editor-title').value, content:document.getElementById('editor-content').value, category:document.getElementById('editor-category').value, date:document.getElementById('editor-date').value, tags:[...new Set(document.getElementById('editor-tags').value.split(/[,，]/).map(t => t.trim()).filter(Boolean))].slice(0,20), demo:false };
}
function flushEditor() {
  clearTimeout(draftTimer);
  if (!document.getElementById('editor-content') || !editorModel) return true;
  syncEditor();
  if (!editorModel.title.trim() && !editorModel.content.trim()) return true;
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(editorModel)); draft = {...editorModel}; const el = document.getElementById('save-status'); if(el) el.innerHTML = `${icon('check')} 草稿已保存`; return true; }
  catch { toast('草稿保存失败，请复制正文或导出备份'); return false; }
}

function saveNote() {
  syncEditor();
  if (!editorModel.title.trim()) { toast('先给这篇笔记起一个名字吧'); document.getElementById('editor-title').focus(); return; }
  if (!editorModel.content.trim()) { toast('写下一点内容，再保存为笔记'); document.getElementById('editor-content').focus(); return; }
  const candidate = { ...editorModel, title:editorModel.title.trim(), updatedAt:new Date().toISOString(), demo:false };
  let cleaned;
  try { cleaned = validateBackup({ app:'zhigeng-ai-notes', version:1, notes:[candidate] })[0]; } catch { toast('请检查学习日期和标签，每个标签不能超过 40 字'); return; }
  const next = notes.some(n => n.id === cleaned.id) ? notes.map(n => n.id === cleaned.id ? cleaned : n) : [...notes,cleaned];
  if (commit(next)) {
    clearTimeout(draftTimer); editorModel = null; draft = null;
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* Note is already safely saved. */ }
    go(`note/${encodeURIComponent(cleaned.id)}`); toast('又一颗知识的种子，已经种下');
  }
}

function openModal(content) { const m = document.getElementById('modal'); m.innerHTML = content; if(!m.open)m.showModal(); }
const modalHeader = title => `<div class="modal-heading"><h2 id="modal-title">${title}</h2><button class="icon-button" data-action="close-modal" aria-label="关闭">${icon('close')}</button></div>`;
let confirmCallback = null;
function confirmDialog(title, text, button, callback, danger = true) { confirmCallback = callback; openModal(`${modalHeader(title)}<p class="modal-description">${text}</p><div class="modal-buttons"><button class="button secondary" data-action="close-modal">取消</button><button class="button ${danger ? 'danger' : 'primary'}" data-action="confirm">${button}</button></div>`); }
function settingsModal() {
  openModal(`${modalHeader('让知识，妥善保存')}<p class="modal-description">笔记保存在<strong>当前浏览器、当前网址</strong>的本地存储中，不会自动同步到其他设备。清除浏览器数据会丢失笔记，建议定期导出备份。</p><div class="settings-stat"><span>${notes.filter(n=>!n.demo).length} 篇个人笔记</span><span>${notes.filter(n=>n.demo).length} 篇示例</span><span>${draft ? 1 : 0} 篇草稿</span></div><div class="settings-actions"><button class="settings-action" data-action="export">${icon('download')}<span>导出完整备份<small>JSON 格式，包含全部笔记与工作草稿</small></span>${icon('chevron')}</button><button class="settings-action" data-action="import">${icon('upload')}<span>导入笔记备份<small>合并导入；相同 ID 的笔记保留当前版本</small></span>${icon('chevron')}</button>${draft ? `<button class="settings-action" data-action="export-draft">${icon('file')}<span>导出工作草稿<small>保存为 Markdown 文件</small></span>${icon('chevron')}</button>` : ''}${notes.some(n=>n.demo) ? `<button class="settings-action" data-action="remove-demos">${icon('leaf')}<span>移除所有示例笔记<small>已编辑保存的笔记会保留</small></span>${icon('chevron')}</button>` : ''}${storageProblem ? `<button class="settings-action" data-action="raw-backup">${icon('download')}<span>下载原始存储数据<small>保留原数据，供手动恢复</small></span></button>` : ''}</div><div class="settings-foot">${icon('info')}${location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? '当前为本地使用版本。' : '这是仅在此浏览器中编辑的个人知识空间。'}支持标题、列表、代码块等常用 Markdown 语法。</div>`);
}

function download(content, name, type) { const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = name.replace(/[\\/:*?"<>|]/g,'-'); a.hidden = true; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000); }
function downloadNote(n) { download(`# ${n.title || '未命名草稿'}\n\n> 学习日期：${n.date} · 分类：${categoryFor(n.category).name}\n> 标签：${n.tags.join('、')}\n\n${n.content}\n`, `${n.title || '未命名草稿'}.md`, 'text/markdown;charset=utf-8'); }

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target) {
    const anchor = event.target.closest('a[href^="#"]');
    if(anchor) {
      event.preventDefault();
      if(anchor.classList.contains('skip-link')) { document.getElementById('main-content').focus(); return; }
      const destination = anchor.getAttribute('href').slice(1);
      if(['notes','favorites'].includes(destination)) filters = {...filters,category:'all',tag:'',query:''};
      go(destination);
    }
    return;
  }
  const action = target.dataset.action, value = target.dataset.value, id = target.dataset.id;
  if(action === 'new') startEditor();
  else if(action === 'edit') startEditor(id);
  else if(action === 'category') { filters = {...filters,category:value,query:'',tag:''}; go('notes'); }
  else if(action === 'filter') { filters.category = value; render(); }
  else if(action === 'tag') { filters = {...filters,tag:value,category:'all',query:''}; go('notes'); }
  else if(action === 'clear-filters') { filters = {...filters,category:'all',query:'',tag:''}; render(); }
  else if(action === 'layout') { layout = value; prefs.layout = value; savePrefs(); renderMain(); }
  else if(action === 'favorite') { if(commit(notes.map(n => n.id === id ? {...n,favorite:!n.favorite} : n))) { render(); toast(notes.find(n=>n.id===id)?.favorite ? '已加入收藏' : '已取消收藏'); } }
  else if(action === 'theme') { flushEditor(); document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; prefs.theme = document.documentElement.dataset.theme; savePrefs(); render(); }
  else if(action === 'settings') { flushEditor(); settingsModal(); }
  else if(action === 'menu') { flushEditor(); mobileOpen = !mobileOpen; render(); }
  else if(action === 'save-note') saveNote();
  else if(action === 'save-draft') { if(flushEditor()) { editorModel = null; go('drafts'); toast('草稿已保存，下次继续'); } }
  else if(action === 'editor-tab') { flushEditor(); editorTab = value; renderMain(); }
  else if(action === 'template') { syncEditor(); editorModel.content += (editorModel.content ? '\n\n' : '') + template; renderMain(); flushEditor(); toast('已插入每日学习模板'); }
  else if(action === 'markdown-help') openModal(`${modalHeader('Markdown 小抄')}<div class="prose"><p><code>## 二级标题</code> · <code>### 三级标题</code></p><p><code>**加粗**</code> · <code>*斜体*</code> · <code>&#96;行内代码&#96;</code></p><p><code>- 无序列表</code> · <code>1. 有序列表</code></p><p><code>- [ ] 待办事项</code> · <code>- [x] 已完成</code></p><p><code>&gt; 引用文字</code></p><p><code>[链接文字](https://example.com)</code></p><p>多行代码：在前后各加一行三个反引号。暂不支持表格、数学公式和原始 HTML。</p></div>`);
  else if(action === 'month') { calendarMonth = new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+Number(value),1); calendarDate=''; renderMain(); }
  else if(action === 'today') { calendarMonth = new Date(new Date().getFullYear(),new Date().getMonth(),1); calendarDate=dateKey(); renderMain(); }
  else if(action === 'day') { calendarDate = calendarDate === value ? '' : value; renderMain(); }
  else if(action === 'clear-date') { calendarDate=''; renderMain(); }
  else if(action === 'close-modal') document.getElementById('modal').close();
  else if(action === 'confirm') { const callback = confirmCallback; confirmCallback = null; document.getElementById('modal').close(); callback?.(); }
  else if(action === 'delete') confirmDialog('删除这篇笔记？', '删除后无法在应用内撤销。你可以先导出 Markdown，保留一份副本。', '删除笔记', () => { if(commit(notes.filter(n=>n.id!==id))) { go('notes'); toast('笔记已删除'); } });
  else if(action === 'remove-demos') confirmDialog('清理示例，开始自己的记录', '将移除所有未编辑的示例笔记。你自己创建或编辑保存的内容会完整保留。', '移除示例', () => { if(commit(notes.filter(n=>!n.demo))) { render(); toast('示例已移除，花园准备好了'); } });
  else if(action === 'discard-draft') confirmDialog('删除这份工作草稿？', '这只会删除未完成的工作草稿，已经保存的正式笔记不受影响。', '删除草稿', () => { try { localStorage.removeItem(DRAFT_KEY); draft=null; editorModel=null; render(); toast('草稿已删除'); } catch { toast('无法删除草稿，请检查浏览器存储'); } });
  else if(action === 'export') { flushEditor(); download(JSON.stringify({app:'zhigeng-ai-notes',version:1,exportedAt:new Date().toISOString(),notes,draft},null,2),`知更-知识备份-${dateKey()}.json`,'application/json'); toast('完整备份已导出'); }
  else if(action === 'import') { document.getElementById('import-file').value=''; document.getElementById('import-file').click(); }
  else if(action === 'export-note') { const n=notes.find(n=>n.id===id); if(n) downloadNote(n); }
  else if(action === 'export-draft') { if(draft) downloadNote(draft); }
  else if(action === 'raw-backup') download(rawBackup,'知更-原始存储.json','application/json');
});

document.addEventListener('input', event => {
  if (event.target.id === 'search-input') {
    filters.query = event.target.value;
    if(!['notes','favorites'].includes(route())) { flushEditor(); history.replaceState(null,'','#notes'); document.querySelector('.sidebar').outerHTML=sidebar(); }
    renderMain();
  }
  if (event.target.id.startsWith('editor-')) {
    syncEditor(); const count=document.getElementById('word-count'); if(count)count.textContent=editorModel.content.replace(/\s/g,'').length;
    const status=document.getElementById('save-status'); if(status)status.textContent='正在保存草稿…';
    clearTimeout(draftTimer); draftTimer=setTimeout(flushEditor,400);
  }
});
document.addEventListener('change', event => { if(event.target.id === 'sort-select') { filters.sort=event.target.value; renderMain(); } });
document.getElementById('import-file').addEventListener('change', async event => {
  const file=event.target.files[0]; if(!file)return;
  if(file.size>20*1024*1024) { toast('备份文件过大，请选择 20 MB 以内的文件'); return; }
  try {
    const parsed=JSON.parse(await file.text()); const incoming=validateBackup(parsed); const newNotes=incoming.filter(n=>!notes.some(existing=>existing.id===n.id));
    let restoredDraft=null;
    if(parsed.draft) {
      const d=parsed.draft;
      restoredDraft=validateBackup({app:'zhigeng-ai-notes',version:1,notes:[{...d,title:d.title||'未命名草稿',updatedAt:d.updatedAt||new Date().toISOString()}]})[0];
      if(!d.title)restoredDraft.title='';
    }
    const applyBackup = () => {
      if(!commit([...notes,...newNotes], !!storageProblem))return;
      let draftMessage='';
      if(restoredDraft && !draft) { try { localStorage.setItem(DRAFT_KEY,JSON.stringify(restoredDraft)); draft=restoredDraft; editorModel=null; draftMessage='，并恢复了工作草稿'; } catch { draftMessage='；草稿未能保存，请保留备份文件'; } }
      else if(restoredDraft && draft) draftMessage='；当前草稿已保留，备份中的草稿未覆盖';
      document.getElementById('modal').close(); render(); toast(`已导入 ${newNotes.length} 篇，跳过 ${incoming.length-newNotes.length} 篇已有笔记${draftMessage}`);
    };
    if(storageProblem) confirmDialog('从备份恢复笔记', `这份备份已通过校验，包含 ${incoming.length} 篇笔记。恢复前，会先在本地保留原始存储的副本；如果空间不足则停止恢复。`, '恢复备份', applyBackup, false);
    else applyBackup();
  } catch(error) { toast(error instanceof SyntaxError ? '文件不是有效的 JSON 备份' : error.message); }
});
document.addEventListener('keydown', event => {
  const typing = event.target.matches('input,textarea,select,[contenteditable]');
  if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k') { event.preventDefault(); document.getElementById('search-input')?.focus(); }
  if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='s'&&route()==='write') { event.preventDefault(); saveNote(); }
  if(!typing&&!event.metaKey&&!event.ctrlKey&&event.key.toLowerCase()==='n'&&!document.getElementById('modal').open) { event.preventDefault(); startEditor(); }
  if(event.key==='Escape'&&mobileOpen) { mobileOpen=false; render(); }
});
window.addEventListener('hashchange', () => { flushEditor(); render(); window.scrollTo(0,0); });
window.addEventListener('beforeunload', () => flushEditor());
// Updates from another tab become visible without silently overwriting an open editor.
window.addEventListener('storage', event => { if(event.key===NOTES_KEY) { try { notes=event.newValue ? validateBackup(JSON.parse(event.newValue)) : []; if(route()!=='write')render(); else toast('笔记已在其他标签页更新，保存前请留意同一篇笔记的修改'); } catch { toast('其他标签页的数据更新无法读取'); } } });
render();
