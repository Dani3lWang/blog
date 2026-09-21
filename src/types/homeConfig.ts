/**
 * 个人主页（芭乐通信 / GUAVA DISPATCH）配置类型
 *
 * 设计约定：
 * - 中文站名沿用 siteConfig.title，个人姓名/头像/签名/社交链接沿用 profileConfig；
 * - 本文件只描述「首页专属」的品牌文案、主稿选择、模块开关与生活索引入口排序；
 * - 所有文案与开关都可由使用者显式配置，留空表示隐藏该模块，不使用演示数据兜底。
 */

/**
 * 生活索引入口键名。
 * 与 siteConfig.pages 的键名保持一致，因此开启/关闭页面会自动影响首页索引入口。
 */
export type HomePortalKey =
	| "gallery"
	| "books"
	| "moviesGames"
	| "games"
	| "booknav"
	| "guestbook"
	| "dynamic"
	| "changelog"
	| "notebooks"
	| "musicPage"
	| "places"
	| "routines";

/** 单个「此刻 / NOW」条目；value 留空则该项自动隐藏 */
export type HomeNowItem = {
	/** 左侧标签，例如「最近在读」 */
	label: string;
	/** 右侧内容，留空则整条隐藏 */
	value: string;
	/** Iconify 图标名，例如 "material-symbols:book-2-outline" */
	icon: string;
	/** 可选跳转地址，支持站内路径或完整 URL；不填则渲染为纯文本 */
	href?: string;
};

/** 单个生活索引入口的外观覆盖；未覆盖的字段回退到内置默认值 */
export type HomePortalOverride = {
	/** 卡片标题，不填则使用页面默认标题 */
	title?: string;
	/** 卡片的一句话说明，不填则使用内置默认说明 */
	description?: string;
	/** 卡片图标，不填则使用内置默认图标 */
	icon?: string;
};

export type HomeConfig = {
	/** 刊头品牌信息 */
	brand: {
		/** 英文标识，例如 "GUAVA DISPATCH" */
		englishName: string;
		/** 刊号行，支持占位符：{issue} 自动月度刊号、{month} 构建月份、{year} 构建年份 */
		editionLabel: string;
		/** 刊头导语（首屏主标题） */
		tagline: string;
		/** 创刊标识，例如 "SINCE 2026" */
		since: string;
	};
	/** 人物封面文案 */
	hero: {
		/** 小标题，例如 "PERSONAL HOMEPAGE" */
		kicker: string;
		/** 简介段落 */
		introduction: string;
		/** 主按钮文案 */
		primaryAction: string;
		/** 可选的个人状态行（生活地、最近状态等）；留空则不渲染，不推断隐私信息 */
		status?: string;
	};
	/** 本期主稿 */
	featuredPosts: {
		/** 手动指定的文章 slug（不含扩展名，例如 "guide/firefly-wiki-link"）；按数组顺序优先 */
		slugs: string[];
		/** 指定 slug 缺失或未配置时是否回退到最新文章 */
		fallbackToLatest: boolean;
		/** 首页展示的文章条数：1 篇为整版主稿，2-3 篇为主稿 + 短稿；设为 0 则整块隐藏 */
		limit: number;
	};
	/** 「此刻」状态条目；value 为空的条目自动隐藏，全部为空时整块隐藏 */
	now: HomeNowItem[];
	/** 最近动态展示条数，0 表示不查询也不渲染 */
	recentDynamicLimit: number;
	/** 生活索引入口顺序；同时受 siteConfig.pages 与 homeConfig.portals 控制 */
	portalOrder: HomePortalKey[];
	/** 生活索引入口的外观覆盖 */
	portals?: Partial<Record<HomePortalKey, HomePortalOverride>>;
	/** 是否显示编辑式站点数据页脚 */
	showStats: boolean;
	/** 是否显示随机阅读按钮；无可用文章时自动隐藏 */
	showRandomPost: boolean;
};
