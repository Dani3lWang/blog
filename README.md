<div align="center">

# LXBlog

### 芭乐通信 · GUAVA DISPATCH

喊我吃芭乐的个人主页与内容档案。

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.23.0-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11.22.0-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)](https://astro.build/)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

[在线访问](https://lovelongxin.me) · [Firefly 上游](https://github.com/CuteLeaf/Firefly) · [Firefly 文档](https://docs-firefly.cuteleaf.cn/)

</div>

## 关于项目

LXBlog 是基于 [CuteLeaf/Firefly](https://github.com/CuteLeaf/Firefly) 长期维护的个人博客分支，站点名称为 **芭乐通信**。项目保留 Firefly 的 Astro 内容系统、响应式布局和可配置能力，并围绕个人写作、生活记录与长期归档进行了定制。

这个仓库包含站点专属的内容、配置和设计取舍。如果你需要一套干净、通用的博客模板，请直接使用 [Firefly](https://github.com/CuteLeaf/Firefly)。

## 当前形态

- **杂志式主页**：`/` 以刊头、本期主稿、此刻、最近动态、生活索引和数据页脚组织内容。
- **独立文章列表**：完整文章位于 `/posts/`，支持分页、分类、标签、归档、系列和上一篇／下一篇导航。
- **生活内容归档**：按配置启用动态、相册、书架、影视与音乐、游戏、书签导航、留言板和更新日志。
- **阅读体验**：支持亮暗主题、响应式布局、全文搜索、目录、沉浸阅读、代码高亮和 Swup 页面过渡。
- **内容输出**：提供 RSS、Atom、sitemap 和 `llms.txt`。
- **数据集成**：包含豆瓣评分缓存、Steam 游戏数据同步、GitHub 卡片、图片 LQIP、字体子集化和 Pagefind 索引。
- **Markdown 扩展**：支持 GFM、提醒块、Mermaid、PlantUML、增强代码块与 GitHub 仓库卡片。

部分页面虽然保留实现，但会在没有真实内容时关闭。页面是否公开以 `src/config/siteConfig.ts` 中的 `siteConfig.pages` 为准。

## 技术栈

- [Astro 7](https://astro.build/)：静态站点生成与页面路由
- [Svelte 5](https://svelte.dev/)：交互组件
- [TypeScript](https://www.typescriptlang.org/)：类型约束
- [Tailwind CSS](https://tailwindcss.com/)：样式工具
- [Swup](https://swup.js.org/)：页面过渡
- [Pagefind](https://pagefind.app/)：静态全文搜索
- [Biome](https://biomejs.dev/)：格式化与代码检查

## 本地开发

### 环境要求

- Node.js `>=22.23.0`
- pnpm `11.22.0`

项目通过 `packageManager` 固定 pnpm 版本，推荐使用 Corepack：

```bash
git clone https://github.com/Dani3lWang/lxblog.git
cd lxblog

corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

开发服务器默认运行在 <http://localhost:4321>。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 启动本地开发服务器 |
| `pnpm check` | 运行 Astro 类型与模板检查 |
| `pnpm type-check` | 运行 TypeScript 检查 |
| `pnpm build` | 执行完整生产构建 |
| `pnpm preview` | 预览生产构建结果 |
| `pnpm new-post <文件名>` | 创建文章草稿 |
| `pnpm new-d <内容>` | 创建一条动态 |
| `pnpm douban-ratings` | 增量同步豆瓣评分 |
| `pnpm sync-games` | 同步已配置的游戏平台数据 |
| `pnpm github-cards` | 更新 GitHub 卡片缓存 |
| `pnpm admin` | 启动本地内容管理工具 |

`pnpm build` 包含联网数据拉取和生成步骤，可能刷新 `src/constants/` 下的缓存文件。提交前请检查 Git diff，避免把网络失败造成的空缓存或无关时间戳变化纳入提交。

## 配置入口

配置统一放在 `src/config/`，常用入口如下：

| 文件 | 作用 |
| --- | --- |
| `siteConfig.ts` | 站点信息、页面开关、文章与订阅设置 |
| `homeConfig.ts` | 首页刊头、主稿、此刻、生活入口和模块顺序 |
| `profileConfig.ts` | 头像、签名和社交链接 |
| `navBarConfig.ts` | 顶部导航及子菜单 |
| `backgroundWallpaper.ts` | 背景与壁纸模式 |
| `sidebarConfig.ts` | 侧栏结构 |
| `musicConfig.ts` | 全局音乐播放器 |
| `dynamicConfig.ts` | 动态页与 Memos 数据源 |
| `gamesConfig.ts` | 游戏页展示和 Steam 同步 |
| `commentConfig.ts` | 评论系统 |

配置项是项目的公共接口。新增或调整配置时，应同步维护 `src/types/` 中的类型和 `src/config/index.ts` 的导出。

## 内容目录

| 路径 | 内容 |
| --- | --- |
| `src/content/posts/` | 文章与系列文章 |
| `src/content/dynamic/` | 短动态（首次运行 `pnpm new-d` 时自动创建） |
| `src/content/life/` | 书架、相册等生活记录 |
| `src/content/bangumi/` | 影视、动画和音乐条目 |
| `src/content/games/` | 游戏平台数据 |
| `src/content/changelog/` | 站点更新日志 |

文章与内容条目使用 Markdown／MDX，并由 `src/content.config.ts` 中的集合 schema 校验。封面图片优先与内容文件放在一起并使用相对路径。

## 分支与上游同步

- `master`：跟随 `upstream/master` 的上游镜像分支。
- `develop`：本地功能开发与验证分支。
- `kelly`：保留站点定制的稳定分支，也是部署分支。
- `origin`：本项目自己的远端仓库。
- `upstream`：`CuteLeaf/Firefly`，用于获取上游更新。

同步 Firefly 时先更新 `master`，再把需要的改动整合到本地分支。个人内容、站点配置和专属设计只保留在本仓库中，不写入上游。

## 部署

生产环境通过 Cloudflare 的 Git 集成从 `kelly` 分支构建。通用部署参数如下：

```text
安装命令：pnpm install --frozen-lockfile
构建命令：pnpm build
输出目录：dist
```

完整构建会访问外部数据源。部署环境中需要使用的令牌应通过平台环境变量提供，不要写入源码或提交历史。

## 贡献范围

这是个人站点仓库，内容、个人配置和站点专属功能在本仓库维护。对于能够在原版 Firefly 中复现的通用显示问题或代码缺陷，会在完成复现、验证并剥离个人配置后，再考虑向上游提交 Pull Request。

## 致谢与许可

本项目建立在以下开源项目和贡献之上：

- [CuteLeaf/Firefly](https://github.com/CuteLeaf/Firefly)
- [saicaca/fuwari](https://github.com/saicaca/fuwari)

项目遵循 [MIT License](./LICENSE)。使用和分发时请保留原项目版权声明及许可证文本。
