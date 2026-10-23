# 芭乐通信博客改进验收记录

验收日期：2026-10-23。开发分支：`develop`。本轮只作本地提交，未合入 `kelly`，未推送或部署。

## 实施结果

- 桌面和手机共用搜索关键词、防抖和请求序号；覆盖冷启动等待索引、失败重载、关闭与切页取消，以及键盘焦点。重试按钮改为加载状态时，外部点击监听仍能识别原始事件路径。
- 手机父级菜单保留直接链接，展开操作使用独立按钮；纯分组继续使用按钮。抽屉支持焦点约束、Escape 和解除滚动锁。
- 示例文章保留为草稿；空栏目与演示相册通过开关隐藏。注册表统一 sitemap、历史别名及产物清理，书影音复用的详情路由保留。零篇文章时首页进入关于页，文章列表保留空状态，RSS/Atom 仍有效。
- 两张影视原始封面已下载并与条目共置，列表和详情使用现有图片优化；只保留新封面的占位色生成数据，其余附带缓存变化还原。
- 非文章内页仅保留左侧个人资料，详情页仅保留目录，没有目录时不占列；目录重建后同步布局。导航音乐入口沿用唯一播放器。
- 手机生活索引两列，平板最多三列、宽屏最多四列，入口不足时均分宽度；移除裸 URL。图标使用内联 SVG，避免缺失符号引用。内页沿用首页视觉变量，整理单一 `h1` 和页面生成时间文案。
- CI 覆盖 `master`、`develop`、`kelly`，固定 pnpm/Biome，配置 Node 22.23.0 与 24 LTS。同步与部署工作流的职责保持原状。

## 已执行验证

本机使用 Node 24.13.0、pnpm 11.22.0、Playwright 1.61.1 和本机 Chrome。

| 检查 | 结果 |
| --- | --- |
| `pnpm install --frozen-lockfile` | 通过 |
| `pnpm check` | 0 errors、0 warnings；保留 `places.astro` 的一条既有 async hint |
| `pnpm type-check` | 通过，包含隔离声明约束 |
| 锁定版本的 Biome CI 检查 | 通过；保留既有非阻断提示 |
| `pnpm build` | 完整链通过：字体准备、数据生成、图片优化、页面清理、资源裁剪、字体子集、脚本压缩、Pagefind、产物验收 |
| 零篇公开文章 | 22 个正式 HTML 页面通过产物验收，Pagefind 索引 7 页，RSS/Atom 文章条目均为 0 |
| 一篇测试文章 | 仅隔离副本中生成；23 个正式 HTML 页面通过验收，Pagefind 索引 8 页，RSS/Atom 各 1 条 |
| Playwright 回归 | 两种文章场景各 9 项，合计 18 项通过 |
| Git 卫生 | 审查生成缓存；保留隐藏内容源文件；私有 Agent 上下文、截图和测试副本均不提交 |

产物检查覆盖：搜索入口文件、关闭栏目及别名、页面中的失效栏目链接、草稿 HTML/OG 输出、每页一个 `h1`、固定 Swup 容器、canonical、sitemap 以及订阅条目数。

浏览器检查覆盖：首次冷查询、连续输入、清空、无结果、失败重试、切页取消旧查询、手机输入聚焦、父级链接、抽屉焦点循环和 Escape、Swup 往返与前进后退、唯一音频元素、本地封面、目录与无目录布局。首页及六类内页检查 320、390、768、1024、1440px，覆盖明暗主题、减少动态效果和可见键盘焦点。

## 复现与交付

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm type-check
pnpm exec biome ci ./src
pnpm build
pnpm exec playwright install chromium
pnpm test:blog:scenarios
pnpm preview --host 127.0.0.1 --port 4321
```

测试副本、日志、trace 与截图位于 Git 忽略的 `.zcode/blog-verification/`。关键截图位于 `delivery/`：首页桌面/手机/深色、影视列表桌面/手机、手机菜单和影视详情。

测试文章只写入 `scenarios/run-*/src/content/posts/__smoke__/acceptance.md`，未写入原始内容目录或正式 `dist`。构建脚本通过共享的输出目录解析器适配 `dist` 和 Cloudflare 的 `dist/client`。

本记录证明本地 Node 24 的验收结果。Node 22.23.0 的远端 CI 矩阵、Cloudflare 构建与线上回归需在另行授权推送或部署后执行。
