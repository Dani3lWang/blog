---
version: "1.34.0"
date: 2026-09-18
type: "improvement"
description: "同步上游 master（5 提交）：Astro 升级至 7.3.2，相册列表卡片重做为上下结构并支持标签折叠，样式按页面拆分并统一各页页头，修复平板端悬浮目录底部条目被裁剪"
---

本次同步上游 `ca61cd93` → `6d82554b` 共 5 个提交：

- **依赖升级**：Astro `7.2.10` → `7.3.2`，`@astrojs/mdx` 升至 `8.0.1`，`@astrojs/cloudflare` 升至 `14.3.1`，`@astrojs/markdown-remark` 升至 `7.3.1`，`@astrojs/markdown-satteri` 升至 `0.4.1`。
- **相册列表改版**：相册卡片由「封面叠字」改为「封面在上、信息在下」的结构。封面比例调整为 2:1，信息区显示标题、日期、标签、简介与地点，并新增「进入相册」入口。标签只展示前 2 个，其余折叠为 `+N`。封面是否撑满贴边跟随文章列表的 `postListLayout.grid.coverFullWidth` 设置。
- **样式按页拆分**：原先集中在 `layout-styles.css`、`gallery.css`、`media-grid.css`、`dynamic.css` 的样式拆到 `src/styles/pages/` 下按页面组织，各页按需引入，减少无关样式加载。
- **页头统一**：新增 `page-shell` / `page-heading` / `page-icon` 等公共类（`src/styles/pages/common.css`），相册、留言板、动态、书签导航、友链、赞助、项目、番组等页面改用统一的页头结构。
- **修复**：平板端悬浮目录面板与滚动容器共用同一处高度变量，解决底部条目被裁剪的问题。
- **其他**：新增 `src/icons/` 目录占位文件。

同步过程中保留本地定制：六个语言文件继续使用本地自定义键，相册详情链接维持 `/moments/gallery/` 路径，动态相册页保留 `LifeNavTabs`；上游的 Bilibili 追番与 MyAnimeList 页面代码继续丢弃。
