import type { HomeConfig } from "@/types/homeConfig";

/**
 * 个人主页（芭乐通信 / GUAVA DISPATCH）配置
 *
 * 只放「首页专属」的内容：
 *   - 站名        → siteConfig.title（本文件不重复维护）
 *   - 姓名/头像/签名/社交链接 → profileConfig
 *   - 首页文案/刊号/主稿/模块顺序 → 本文件
 *
 * 留空即隐藏：`now` 中 value 为空的行、`featuredPosts.limit` 为 0、
 * `recentDynamicLimit` 为 0、`showStats` 为 false 时对应板块都不会渲染，
 * 也不会用演示数据填充。
 */
export const homeConfig: HomeConfig = {
	// ── 刊头 ────────────────────────────────────────────────
	brand: {
		// 右侧英文标识
		englishName: "GUAVA DISPATCH",
		// 刊号行；{issue} 为按站点建立月份自动推算的期号，{month}/{year} 为构建日期
		editionLabel: "ISSUE {issue} · PERSONAL ARCHIVE",
		// 刊头导语
		tagline: "你好，我是喊我吃芭乐。",
		// 创刊标识
		since: "SINCE 2026",
	},

	// ── 人物封面 ────────────────────────────────────────────
	hero: {
		// 主标题上方的小标题
		kicker: "PERSONAL HOMEPAGE",
		// 简介段落
		introduction: "在这里记录想法、兴趣，以及值得反复翻阅的生活片段。",
		// 主按钮文案
		primaryAction: "阅读文章",
		// 个人状态行（例如「目前生活于中国 / 最近更新于…」）
		// 只填你愿意公开的内容；留空则不渲染，页面也不会推断任何隐私信息
		status: "",
	},

	// ── 本期主稿 ────────────────────────────────────────────
	featuredPosts: {
		// 手动指定代表文章（slug 不含扩展名，多篇按数组顺序取用）
		// 例：slugs: ["guide/firefly-wiki-link"]
		// 留空时按 fallbackToLatest 回退到最新文章；指定但不存在时构建阶段会告警并回退
		slugs: [],
		// 指定 slug 不可用时回退到最新文章
		fallbackToLatest: true,
		// 首页展示条数：1 = 整版主稿；2-3 = 主稿 + 短稿；0 = 隐藏该板块
		limit: 3,
	},

	// ── 此刻 / NOW ──────────────────────────────────────────
	// value 留空的行会自动隐藏；全部为空时整个板块隐藏
	now: [
		{
			label: "最近在读",
			value: "",
			icon: "material-symbols:book-2-outline",
			href: "/books/",
		},
		{
			label: "最近在看",
			value: "",
			icon: "material-symbols:movie-outline",
			href: "/TV-albums/",
		},
		{
			label: "最近在玩",
			value: "",
			icon: "material-symbols:sports-esports-outline",
			href: "/games/",
		},
		{
			label: "最近在听",
			value: "",
			icon: "material-symbols:headphones-outline",
			href: "/TV-albums/",
		},
		{
			label: "最近在做",
			value: "",
			icon: "material-symbols:edit-note-outline",
		},
	],

	// ── 最近动态 ────────────────────────────────────────────
	// 展示条数，0 表示不查询也不渲染；置顶动态优先
	recentDynamicLimit: 2,

	// ── 生活索引 ────────────────────────────────────────────
	// 入口顺序；同时受 siteConfig.pages 控制，关闭的页面自动消失
	// 可补充 "dynamic" / "changelog" / "notebooks" / "musicPage" / "places" / "routines"
	portalOrder: [
		"gallery",
		"books",
		"moviesGames",
		"games",
		"booknav",
		"guestbook",
	],

	// 入口文案覆盖（标题 / 说明 / 图标），未覆盖的字段使用内置默认值
	portals: {
		gallery: { title: "相册", description: "我看见的" },
		books: { title: "书架", description: "我读过的" },
		moviesGames: { title: "影视和音乐", description: "我喜欢的" },
		games: { title: "游戏", description: "我玩过的" },
		booknav: { title: "书签导航", description: "我收藏的" },
		guestbook: { title: "留言板", description: "写给我的" },
	},

	// ── 编辑式数据页脚 ──────────────────────────────────────
	showStats: true,

	// ── 随机阅读 ────────────────────────────────────────────
	// 从已发布、非草稿、非加密文章中随机挑一篇；没有合适文章时自动隐藏
	showRandomPost: true,
};
