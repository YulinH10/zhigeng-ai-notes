# 知更 · AI Notes

一个用来整理日常 AI 学习的中文博客与个人知识花园。采用原生 HTML、CSS 和 JavaScript，不需要安装依赖或配置数据库。

## GitHub 与在线访问

- 源码仓库：[YulinH10/zhigeng-ai-notes](https://github.com/YulinH10/zhigeng-ai-notes)
- 网站地址：[知更 · AI Notes](https://yulinh10.github.io/zhigeng-ai-notes/)
- 发布状态：[Deploy GitHub Pages](https://github.com/YulinH10/zhigeng-ai-notes/actions/workflows/pages.yml)

推送到 `main` 后，GitHub Actions 会先检查 JavaScript 语法并运行测试，通过后将 `dist/` 发布到 GitHub Pages。也可以在 Actions 页面手动运行工作流。仓库及站点公开可访问；工作流只上传静态站点文件。

首次从本地迁移：在 `http://localhost:4173` 的「设置与数据备份」导出完整 JSON 备份，然后在上述线上网站导入。GitHub Pages 网址和本地网址使用独立的浏览器存储，打开线上站点不会自动带入本地笔记。

## 本地启动

安装 Node.js 20 或更高版本后，在本目录运行：

```sh
node scripts/serve.mjs
```

打开 [http://localhost:4173](http://localhost:4173)。也可以使用 `npm start`。修改源文件后刷新页面即可。

## 使用方式

- 点击「写一篇笔记」，填写标题、日期、分类和标签。支持常用 Markdown 与实时切换预览。
- 点击「插入每日学习模板」，快速记录收获、理解、实验、疑问与下一步。
- 输入时自动保存一份工作草稿，稍后可从「草稿箱」继续。点击「保存笔记」完成记录。
- 在知识专题、标签和搜索框中整理与查找知识；使用书签收藏重要笔记。
- 学习日历和连续学习统计只计算自己保存的笔记，不把示例算作实际学习记录。
- 在「设置与数据备份」导出 JSON 完整备份或合并导入，也可以将单篇笔记导出为 Markdown。
- 内置六篇示例，可从设置统一移除；编辑保存过的示例会成为自己的笔记并保留。

快捷键：`N` 写笔记；`⌘/Ctrl + K` 搜索；`⌘/Ctrl + S` 保存当前笔记。

## 数据与部署说明

笔记保存在 **当前浏览器、当前网址的 localStorage** 中，不上传服务器，不自动跨设备同步。无痕窗口关闭、清除站点数据、换浏览器或换域名后，原笔记不会自动迁移。建议定期导出 JSON 备份，切换设备时先导出再导入。

备份包含正式笔记和一份工作草稿。导入采用合并模式，相同 ID 保留当前版本；已有草稿不会被覆盖。单篇 Markdown 导出便于阅读和迁移，完整恢复请使用 JSON。

这是个人使用的本地编辑版本，没有账号系统、云端数据库或向读者同步文章的服务端发布功能。`dist/` 可以直接托管到静态网站平台；托管后，每个访问者仍然只有各自浏览器中的笔记。若需要公开博客或多设备同步，需要继续接入服务端存储与登录权限。

界面使用 Noto 字体作为可选在线字体，加载失败时回退到设备自带中文字体；应用运行本身不依赖外部 JavaScript 或 API。

托管平台为 GitHub Pages，不需要 Sites 或其他托管服务。网站使用相对资源路径和 hash 路由，支持 `/zhigeng-ai-notes/` 项目路径。

## 文件与检查

```text
dist/               可直接部署的静态站点
  index.html        页面入口
  app.js            界面、编辑、草稿、搜索与本地持久化
  core.js           笔记模型、筛选、统计与备份校验
  markdown.js       安全的基础 Markdown 渲染
  styles.css        响应式布局与深浅色主题
scripts/serve.mjs    本地预览服务
tests/core.test.mjs  数据和 Markdown 安全测试
.github/workflows/pages.yml  测试与 GitHub Pages 自动发布
```

运行测试：

```sh
node --test tests/*.test.mjs
```

Markdown 支持标题、加粗、斜体、链接、引用、有序和无序列表、只读任务列表、行内代码和围栏代码块；暂不支持表格、数学公式、图片上传和原始 HTML。外部链接仅允许 HTTP/HTTPS。

## 已完成的验证

- 7 项自动化测试通过：备份格式与去重校验、组合搜索、连续学习计算、Markdown 渲染与 XSS 输入处理。
- 浏览器实测通过：新建、自动保存草稿、刷新恢复、保存、再编辑、收藏、多词搜索、清空筛选、学习日历、备份合并导入、主题持久化。
- 390px 手机视图无横向溢出，抽屉导航和专题页面正常。
- 备份下载按钮已实现；内置浏览器的下载事件检测超时，未自动确认下载文件落盘。首次使用时请在常规浏览器确认文件已保存。
- 页面预览保存在 `previews/`。
