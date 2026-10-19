export const CATEGORIES = [
  { id: 'llm', name: '大语言模型', color: '#779987', icon: 'sparkles', english: 'LARGE LANGUAGE MODELS' },
  { id: 'prompt', name: 'Prompt 工程', color: '#baa06d', icon: 'terminal', english: 'PROMPT ENGINEERING' },
  { id: 'agent', name: 'AI Agent', color: '#8b8db1', icon: 'network', english: 'AUTONOMOUS AGENTS' },
  { id: 'rag', name: 'RAG 与知识库', color: '#749bae', icon: 'layers', english: 'RETRIEVAL AUGMENTED GENERATION' },
  { id: 'practice', name: '工具与实践', color: '#bd8d79', icon: 'code', english: 'BUILD & EXPERIMENT' },
  { id: 'thought', name: '思考与随笔', color: '#9a9a78', icon: 'leaf', english: 'THOUGHTS & REFLECTIONS' },
];

export const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const plainText = value => String(value).replace(/```[\s\S]*?```/g, ' [代码示例] ').replace(/[#*`>\[\]_-]/g, '').replace(/\s+/g, ' ').trim();
export const readingMinutes = content => Math.max(1, Math.ceil(String(content).length / 400));
export const categoryFor = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];

export function selectNotes(notes, { category = 'all', query = '', favorite = false, tag = '', date = '', sort = 'newest' } = {}) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return notes.filter(n => (category === 'all' || n.category === category) && (!favorite || n.favorite) && (!tag || n.tags.includes(tag)) && (!date || n.date === date) && terms.every(t => `${n.title} ${n.content} ${n.tags.join(' ')} ${categoryFor(n.category).name}`.toLocaleLowerCase().includes(t)))
    .sort((a, b) => sort === 'oldest' ? a.date.localeCompare(b.date) : sort === 'updated' ? b.updatedAt.localeCompare(a.updatedAt) : b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
}

export function learningStats(notes, now = new Date()) {
  const actual = notes.filter(n => !n.demo);
  const days = new Set(actual.map(n => n.date));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dateKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  return { days: days.size, streak, words: actual.reduce((s, n) => s + n.content.replace(/\s/g, '').length, 0), total: actual.length };
}

export function validateBackup(input) {
  if (!input || input.app !== 'zhigeng-ai-notes' || input.version !== 1 || !Array.isArray(input.notes) || input.notes.length > 10000) throw new Error('这不是有效的知更备份文件。');
  const ids = new Set();
  return input.notes.map(n => {
    if (!n || typeof n.id !== 'string' || !n.id || n.id.length > 150 || ids.has(n.id) || typeof n.title !== 'string' || !n.title.trim() || n.title.length > 200 || typeof n.content !== 'string' || n.content.length > 200000 || !Array.isArray(n.tags) || n.tags.length > 20 || n.tags.some(t => typeof t !== 'string' || t.length > 40) || !CATEGORIES.some(c => c.id === n.category) || typeof n.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(n.date) || Number.isNaN(Date.parse(n.date)) || new Date(`${n.date}T12:00:00Z`).toISOString().slice(0, 10) !== n.date) throw new Error('备份中有不完整、重复或不支持的笔记，未导入任何内容。');
    ids.add(n.id);
    return { id: n.id, title: n.title.trim(), content: n.content, category: n.category, tags: [...new Set(n.tags)], date: n.date, updatedAt: typeof n.updatedAt === 'string' && !Number.isNaN(Date.parse(n.updatedAt)) ? new Date(n.updatedAt).toISOString() : new Date().toISOString(), favorite: n.favorite === true, demo: n.demo === true, ...(n.demo === true && typeof n.excerpt === 'string' ? { excerpt: n.excerpt.slice(0,500) } : {}) };
  });
}

export function makeSeedNotes(now = new Date()) {
  const seeds = [
    { title: '从直觉出发，重新理解 Transformer', category: 'llm', tags: ['Transformer', '深度学习'], excerpt: '不急着看公式。先从“一个词如何理解另一个词”开始，把注意力机制串成一条清晰的线。', content: '# 从直觉出发，重新理解 Transformer\n\n> 这是一篇示例笔记，用来展示知识整理方式。可以编辑它，也可以在设置中移除全部示例。\n\n## 今天想弄清楚的问题\n\n一句话里的词，如何利用上下文来表达不同的意思？学习注意力机制时，我想先建立直觉，再对照原文和代码验证。\n\n## 用自己的话解释\n\nSelf-attention 会根据输入计算不同位置之间的关联，再对信息进行加权组合。理解它时，可以先区分三个角色：\n\n- **Query**：当前位置在寻找什么信息。\n- **Key**：其他位置能以什么特征被找到。\n- **Value**：匹配后实际聚合的信息。\n\n这些只是帮助记忆的比喻，具体计算仍然需要回到矩阵运算。\n\n## 接下来验证\n\n- [ ] 画出 Q、K、V 的维度变化\n- [ ] 用一个三词句子手算注意力权重\n- [ ] 区分训练时与生成时的注意力遮罩\n\n## 一句话收获\n\n先说清每一步输入和输出的形状，再去理解公式，会更有方向。' },
    { title: '好的 Prompt，从把问题说清楚开始', category: 'prompt', tags: ['Prompt', '学习方法'], excerpt: '角色、任务、上下文、输出格式。给自己的提示词加一点结构，也给结果留一把可以衡量的尺。', content: '# 好的 Prompt，从把问题说清楚开始\n\n> 示例笔记：这是一个可以直接改写的练习模板。\n\n## 今天的练习\n\n把模糊的“帮我总结一下”改写成有目标、有输入、有输出要求的任务。\n\n## 我的提示词模板\n\n```text\n任务：用三句话总结以下材料。\n读者：第一次接触这个主题的学习者。\n要求：保留核心观点，解释必要术语。\n格式：核心结论 / 证据 / 待验证问题。\n材料：\n[在这里粘贴文本]\n```\n\n## 如何判断是否变好\n\n- 是否忠实于给定材料？\n- 是否覆盖了真正重要的信息？\n- 是否明确区分事实、推断和未知？\n\n## 下一步\n\n用同一段材料对比两种提示词，记录输出差异。不要只凭一次结果下结论。' },
    { title: 'RAG 学习地图：让回答有据可查', category: 'rag', tags: ['RAG', '知识库'], excerpt: '从文档切分到检索，再到回答生成。用一张学习地图，拆开“给 AI 接上知识库”这件事。', content: '# RAG 学习地图：让回答有据可查\n\n> 示例笔记：用问题清单搭建学习路线。\n\n## 我想做什么\n\n做一个能回答自己学习笔记相关问题的小助手，并能找到回答参考的原文。\n\n## 拆成四个环节\n\n1. **整理**：把文档转成干净、可追溯的文本。\n2. **切分与索引**：保留片段和来源之间的关系。\n3. **检索**：根据问题找到可能有用的片段。\n4. **生成**：在提供的上下文中回答，并标注来源。\n\n## 需要分别检查的问题\n\n- 找不到答案，是文档里没有，还是检索没有找到？\n- 找到了片段，是否真的足以支持结论？\n- 证据不足时，系统会不会明确说不知道？\n\n## 最小实验\n\n先用十篇自己的笔记和十个手写问题，观察每一步的输出。' },
    { title: 'Agent 的第一课：从一个小任务开始', category: 'agent', tags: ['Agent', '工作流'], excerpt: '先让一个流程可靠地跑通，再考虑更复杂的自主规划。记下工具、状态与反馈之间的关系。', content: '# Agent 的第一课：从一个小任务开始\n\n> 示例笔记：把一个宽泛主题变成可验证的实验。\n\n## 今天的问题\n\n如果希望一个助手完成“整理本周的学习笔记”，需要向它提供哪些工具？\n\n## 最小流程\n\n1. 列出本周笔记。\n2. 按主题归类。\n3. 生成一份待检查的摘要。\n4. 人工核对后保存。\n\n## 记录每一步\n\n- 输入了什么？\n- 调用了什么工具？\n- 工具返回是否可靠？\n- 失败后如何退出或重试？\n\n## 我的思考\n\n先把任务边界、成功条件和失败处理写清楚，再决定哪些步骤需要模型判断。' },
    { title: '我的 AI 实验记录模板', category: 'practice', tags: ['实践', '实验记录'], excerpt: '假设、变量、结果、复盘。用可复用的小模板，把每一次动手变成下一次进步的起点。', content: '# 我的 AI 实验记录模板\n\n> 示例笔记：点击“编辑”，把它变成自己的第一篇实验日志。\n\n## 实验目标\n\n这次实验要回答什么具体问题？\n\n## 环境与输入\n\n- 使用的工具与版本：\n- 输入数据或测试问题：\n- 固定的参数：\n- 这次改变的变量：\n\n## 观察结果\n\n记录实际输出、失败案例与耗时。把观察和解释分开写。\n\n## 复盘\n\n1. 什么符合预期？\n2. 什么让我意外？\n3. 还有什么替代解释？\n\n## 下一次实验\n\n只选择一个需要优先验证的问题。' },
    { title: '慢一点，把学过的东西变成自己的', category: 'thought', tags: ['学习方法', '随笔'], excerpt: '收藏不等于理解，理解也不等于会用。给每天的学习留十分钟，用自己的语言重新讲一遍。', content: '# 慢一点，把学过的东西变成自己的\n\n> 示例随笔：一个留给日常思考的角落。\n\n今天想给自己定一个小习惯：读完一篇文章后，先关掉页面，写下自己记住的三件事。\n\n## 三个问题\n\n- 它试图解决什么问题？\n- 我能用自己的话解释吗？\n- 我可以在哪里试着使用它？\n\n如果解释不清楚，也是一种收获——至少知道下一次应该从哪里开始。\n\n## 写给明天\n\n不追求每一篇都完整。一个问题、一段实验、一次恍然大悟，都值得留下。' },
  ];
  return seeds.map((s, i) => { const d = new Date(now); d.setDate(d.getDate() - i); return { ...s, id: `example-${i + 1}`, date: dateKey(d), updatedAt: d.toISOString(), favorite: i === 0 || i === 2, demo: true }; });
}
