import { getCollection } from "astro:content";
import getReadingTime from "reading-time";
import { homeConfig, siteConfig } from "@/config";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import type { HomeNowItem, HomePortalKey } from "@/types/config";
import { getSortedPosts, getSortedPostsList } from "./content-utils";
import { dynamicPlainText, sortDynamics } from "./dynamic-utils";
import { getPublicContentState } from "./public-content";
import {
	getLatestActivityDate,
	getSiteRunningDays,
	getSiteWordCount,
	getVisitedCityCount,
} from "./site-stats-utils";
import { getPostUrlBySlug, url } from "./url-utils";

/**
 * 主页数据组合
 *
 * 首页只调用一次 getHomeData()，把文章、主稿、动态、统计和索引入口一次性算好，
 * 交给各板块组件渲染；子组件不再各自读取内容集合。
 */

/** 本期主稿（含短稿）条目 */
export type HomeFeaturedPost = {
	id: string;
	title: string;
	description: string;
	href: string;
	image: string;
	category: string | null;
	tags: string[];
	published: Date;
	minutes: number;
	pinned: boolean;
	encrypted: boolean;
};

/** 最近动态条目 */
export type HomeDynamicItem = {
	id: string;
	href: string;
	excerpt: string;
	location: string;
	published: Date;
	pinned: boolean;
};

/** 生活索引入口 */
export type HomePortal = {
	key: HomePortalKey;
	title: string;
	description: string;
	icon: string;
	href: string;
};

/** 编辑式数据页脚 */
export type HomeStats = {
	posts: number;
	dynamics: number;
	words: number;
	cities: number;
	siteDays: number;
	updatedAt: Date | null;
};

/** 随机阅读候选 */
export type HomeRandomCandidate = {
	title: string;
	href: string;
};

export type HomeData = {
	hasPublicPosts: boolean;
	/** 刊号行占位符解析结果 */
	issue: {
		/** 自动月度期号，例如 "004" */
		number: string;
		/** 构建月份，例如 "2026.09" */
		month: string;
		/** 构建年份，例如 "2026" */
		year: string;
	};
	/** 已解析占位符的刊号行 */
	editionLabel: string;
	/** 主稿（第一条） */
	featured: HomeFeaturedPost | null;
	/** 短稿（主稿之后的若干条） */
	secondary: HomeFeaturedPost[];
	/** 已过滤空值的「此刻」条目 */
	now: HomeNowItem[];
	/** 最近动态 */
	dynamics: HomeDynamicItem[];
	/** 生活索引入口 */
	portals: HomePortal[];
	/** 站点数据，showStats 为 false 时为 null */
	stats: HomeStats | null;
	/** 随机阅读候选池，不足 1 条时为 null */
	randomPool: HomeRandomCandidate[] | null;
};

/** 入口内置默认值：标题 / 说明 / 图标 / 路径 */
const PORTAL_DEFAULTS: Record<
	HomePortalKey,
	{ title: string; description: string; icon: string; href: string }
> = {
	gallery: {
		title: i18n(I18nKey.gallery),
		description: i18n(I18nKey.galleryDescription),
		icon: "material-symbols:photo-library-outline-rounded",
		href: "/moments/gallery/",
	},
	books: {
		title: i18n(I18nKey.books),
		description: i18n(I18nKey.booksSubtitle),
		icon: "material-symbols:book",
		href: "/books/",
	},
	moviesGames: {
		title: i18n(I18nKey.moviesGames),
		description: i18n(I18nKey.moviesGamesSubtitle),
		icon: "material-symbols:movie",
		href: "/TV-albums/",
	},
	games: {
		title: i18n(I18nKey.games),
		description: i18n(I18nKey.gamesSubtitle),
		icon: "material-symbols:sports-esports",
		href: "/games/",
	},
	booknav: {
		title: i18n(I18nKey.booknav),
		description: i18n(I18nKey.booknavDescription),
		icon: "material-symbols:bookmarks",
		href: "/booknav/",
	},
	guestbook: {
		title: i18n(I18nKey.guestbook),
		description: i18n(I18nKey.guestbookDescription),
		icon: "material-symbols:menu-book",
		href: "/moments/guestbook/",
	},
	dynamic: {
		title: i18n(I18nKey.dynamic),
		description: i18n(I18nKey.dynamicDescription),
		icon: "material-symbols:dynamic-feed",
		href: "/dynamic/",
	},
	changelog: {
		title: i18n(I18nKey.changelog),
		description: i18n(I18nKey.changelogSubtitle),
		icon: "material-symbols:update",
		href: "/changelog/",
	},
	notebooks: {
		// 笔记本 / 足迹 / 规划暂无 i18n 键，默认不在 portalOrder 中；
		// 需要展示时用 homeConfig.portals 覆盖文案即可（与 LifeStats 等组件保持同一种中文兜底写法）
		title: "笔记本",
		description: "",
		icon: "material-symbols:book-outline",
		href: "/moments/notebooks/",
	},
	musicPage: {
		title: i18n(I18nKey.musicPage),
		description: i18n(I18nKey.musicPageSubtitle),
		icon: "material-symbols:library-music",
		href: "/music/",
	},
	places: {
		title: "足迹",
		description: "",
		icon: "material-symbols:location-on-outline",
		href: "/places/",
	},
	routines: {
		title: "规划",
		description: "",
		icon: "material-symbols:schedule-outline",
		href: "/routines/",
	},
};

/** 归一化 slug：去掉扩展名与首尾斜杠，便于与文章 id 对齐 */
function normalizeSlug(slug: string): string {
	return slug
		.trim()
		.replace(/\\/g, "/")
		.replace(/\.(md|mdx|markdown)$/i, "")
		.replace(/^\/+|\/+$/g, "");
}

/** 概略估算阅读时长（分钟），与全站字数口径一致地剔除代码块 */
function estimateReadingMinutes(body: string | undefined): number {
	if (!body) return 1;
	const text = body.replace(/```[\s\S]*?```/g, "").replace(/\s+/g, " ");
	return Math.max(1, Math.round(getReadingTime(text).minutes));
}

/** 按站点建立时间推算月度期号（建立当月为 001） */
function resolveIssue(startDate: string | undefined, now: Date) {
	const start = new Date(startDate || "2025-01-01");
	const months =
		(now.getFullYear() - start.getFullYear()) * 12 +
		(now.getMonth() - start.getMonth()) +
		1;
	const number = String(Math.max(1, months)).padStart(3, "0");
	const month = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
	return { number, month, year: String(now.getFullYear()) };
}

/** 解析刊号行中的 {issue} / {month} / {year} 占位符 */
function resolveEditionLabel(
	template: string,
	issue: ReturnType<typeof resolveIssue>,
): string {
	return template
		.replace(/\{issue\}/g, issue.number)
		.replace(/\{month\}/g, issue.month)
		.replace(/\{year\}/g, issue.year);
}

export async function getHomeData(): Promise<HomeData> {
	const now = new Date();
	const { hasPublicPosts } = await getPublicContentState();
	const issue = resolveIssue(siteConfig.siteStartDate, now);

	// ── 数据按需加载 ─────────────────────────────────────
	// 主稿、数据页脚、随机阅读任一需要时才读文章集合；
	// 动态只被「最近动态」和「数据页脚」使用，两者都关掉就不查。
	// 这样把 featuredPosts.limit / recentDynamicLimit 设为 0、showStats 设为 false
	// 时是真正地不查询，而不只是不渲染。
	const featuredLimit = Math.max(0, homeConfig.featuredPosts.limit);
	const dynamicLimit = Math.max(0, homeConfig.recentDynamicLimit);

	const needPosts =
		featuredLimit > 0 || homeConfig.showStats || homeConfig.showRandomPost;
	const needDynamics =
		siteConfig.pages.dynamic && (dynamicLimit > 0 || homeConfig.showStats);

	const sortedPosts = needPosts
		? (await getSortedPosts()).filter((post) => !post.data.draft)
		: [];
	const sortedPostsList = needPosts
		? (await getSortedPostsList()).filter((post) => !post.data.draft)
		: [];

	// ── 本期主稿 ─────────────────────────────────────────
	const selectedPosts: typeof sortedPosts = [];

	if (featuredLimit > 0) {
		const bySlug = new Map(
			sortedPosts.map((post) => [normalizeSlug(post.id), post]),
		);

		for (const rawSlug of homeConfig.featuredPosts.slugs) {
			const slug = normalizeSlug(rawSlug);
			if (!slug) continue;
			const matched = bySlug.get(slug);
			if (!matched) {
				console.warn(
					`[homeConfig] featuredPosts.slugs 中的「${rawSlug}」未匹配到任何已发布文章，已跳过。` +
						(homeConfig.featuredPosts.fallbackToLatest
							? "将按 fallbackToLatest 回退到最新文章。"
							: ""),
				);
				continue;
			}
			if (!selectedPosts.some((post) => post.id === matched.id)) {
				selectedPosts.push(matched);
			}
			if (selectedPosts.length >= featuredLimit) break;
		}

		// 未配满或全部无效时，按发布时间补齐最新文章
		if (
			selectedPosts.length < featuredLimit &&
			(homeConfig.featuredPosts.fallbackToLatest ||
				homeConfig.featuredPosts.slugs.length === 0)
		) {
			for (const post of sortedPosts) {
				if (selectedPosts.some((item) => item.id === post.id)) continue;
				selectedPosts.push(post);
				if (selectedPosts.length >= featuredLimit) break;
			}
		}
	}

	const toFeaturedPost = (
		post: (typeof sortedPosts)[number],
	): HomeFeaturedPost => ({
		id: post.id,
		title: post.data.title,
		description: post.data.description,
		href: getPostUrlBySlug(post.id),
		image: post.data.image,
		category: post.data.category,
		tags: post.data.tags,
		published: post.data.published,
		minutes: estimateReadingMinutes(post.body),
		pinned: !!post.data.pinned,
		encrypted: !!post.data.password,
	});

	const featuredList = selectedPosts.map(toFeaturedPost);
	const featured = featuredList[0] ?? null;
	const secondary = featuredList.slice(1);

	// ── 此刻 / NOW ───────────────────────────────────────
	const nowItems = homeConfig.now.filter(
		(item) => item.value.trim().length > 0,
	);

	// ── 最近动态 ─────────────────────────────────────────
	const allDynamics = needDynamics
		? sortDynamics(await getCollection("dynamic"))
		: [];
	const dynamics: HomeDynamicItem[] =
		dynamicLimit > 0
			? allDynamics.slice(0, dynamicLimit).map((entry) => ({
					id: entry.id,
					// 统一进入动态列表页，避免依赖单条动态的锚点实现
					href: url("/dynamic/"),
					excerpt: dynamicPlainText(entry).slice(0, 160),
					location: entry.data.location.trim(),
					published: entry.data.published,
					pinned: !!entry.data.pinned,
				}))
			: [];

	// ── 生活索引 ─────────────────────────────────────────
	const pages = siteConfig.pages;
	const portals: HomePortal[] = [];
	for (const key of homeConfig.portalOrder) {
		// 页面关闭时入口自动消失，不显示「即将上线」占位
		if (pages[key as keyof typeof pages] === false) continue;
		const fallback = PORTAL_DEFAULTS[key];
		if (!fallback) continue;
		const override = homeConfig.portals?.[key];
		const title = override?.title || fallback.title;
		const description = override?.description || fallback.description;
		if (!title) continue;
		portals.push({
			key,
			title,
			description,
			icon: override?.icon || fallback.icon,
			href: fallback.href,
		});
	}

	// ── 站点数据 ─────────────────────────────────────────
	let stats: HomeStats | null = null;
	if (homeConfig.showStats) {
		// 用全量动态而不是首页截取的两条，保证「最近更新」反映整站
		const latestDynamicAll = allDynamics.reduce<Date | null>((latest, e) => {
			if (!latest || e.data.published > latest) return e.data.published;
			return latest;
		}, null);

		const latestPost = getLatestActivityDate(sortedPosts);
		const updatedAt =
			latestPost && latestDynamicAll
				? latestPost > latestDynamicAll
					? latestPost
					: latestDynamicAll
				: (latestPost ?? latestDynamicAll);

		stats = {
			posts: sortedPosts.length,
			// 复用上面已取到的全量动态，避免重复查询集合
			dynamics: allDynamics.length,
			words: await getSiteWordCount(sortedPosts),
			cities: siteConfig.pages.places ? await getVisitedCityCount() : 0,
			siteDays: getSiteRunningDays(siteConfig.siteStartDate, now),
			updatedAt,
		};
	}

	// ── 随机阅读 ─────────────────────────────────────────
	// 排除草稿与加密文章；已在本期主稿出现的文章也不再进入候选，
	// 避免「换一篇」把读者送回上方已展示的那篇。
	const featuredIds = new Set(selectedPosts.map((post) => post.id));
	const randomCandidates = sortedPostsList.filter(
		(post) => !post.data.password && !featuredIds.has(post.id),
	);
	const randomPool: HomeRandomCandidate[] | null =
		homeConfig.showRandomPost && randomCandidates.length > 0
			? randomCandidates.map((post) => ({
					title: post.data.title,
					href: getPostUrlBySlug(post.id),
				}))
			: null;

	return {
		hasPublicPosts,
		issue,
		editionLabel: resolveEditionLabel(homeConfig.brand.editionLabel, issue),
		featured,
		secondary,
		now: nowItems,
		dynamics,
		portals,
		stats,
		randomPool,
	};
}
