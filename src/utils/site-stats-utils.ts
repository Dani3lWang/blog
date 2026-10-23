import { type CollectionEntry, getCollection } from "astro:content";

/**
 * 站点统计基础计算
 *
 * 首页数据页脚、侧栏 SiteStats / LifeStats 组件共用这里的口径，
 * 避免同一份数字在多处各写一遍导致对不上。
 */

/** 是否已发布（生产构建过滤草稿，开发环境保留以便预览） */
function isPublished(data: { draft?: boolean }): boolean {
	return import.meta.env.PROD ? data.draft !== true : true;
}

/** 统计正文有效字数：剔除代码块与行内代码，中文按字、英文按字符计 */
export function countWords(body: string | undefined | null): number {
	if (!body) return 0;

	const text = body
		.replace(/```[\s\S]*?```/g, "") // 移除代码块
		.replace(/`[^`]*`/g, "") // 移除行内代码
		.replace(/\s+/g, " ") // 合并空白
		.trim();

	const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
	const englishChars = text.match(/[a-zA-Z]/g) || [];

	return chineseChars.length + englishChars.length;
}

/** 文章「最后活动」时间：updated 晚于 published 时取 updated */
export function getPostActivityDate(post: {
	data: { published: Date; updated?: Date };
}): Date {
	const { published, updated } = post.data;
	if (updated && updated > published) return updated;
	return published;
}

/** 获取全部已发布文章（未排序，含 body，供字数统计使用） */
export async function getPublishedPosts(): Promise<CollectionEntry<"posts">[]> {
	return await getCollection("posts", ({ data }) => isPublished(data));
}

/** 全站文章总字数 */
export async function getSiteWordCount(
	posts?: CollectionEntry<"posts">[],
): Promise<number> {
	const list = posts ?? (await getPublishedPosts());
	let total = 0;
	for (const post of list) {
		total += countWords(post.body);
	}
	return total;
}

/** 全站最近一次活动时间（取所有文章 published / updated 的最大值） */
export function getLatestActivityDate(
	posts: CollectionEntry<"posts">[],
): Date | null {
	return posts.reduce<Date | null>((latest, post) => {
		const current = getPostActivityDate(post);
		if (!latest || current > latest) return current;
		return latest;
	}, null);
}

/** 去过的不重复城市数量（取 life/places 的 city 字段） */
export async function getVisitedCityCount(): Promise<number> {
	const lifeEntries = await getCollection("life");
	const cities = lifeEntries
		.filter((entry) => entry.id.replace(/\\/g, "/").startsWith("places/"))
		.map((entry) => entry.data.city)
		.filter(Boolean);
	return new Set(cities).size;
}

/** 站点已运行天数（按自然日向下取整，构建时计算，客户端会自行刷新） */
export function getSiteRunningDays(
	startDate: string | undefined,
	now: Date = new Date(),
): number {
	const start = new Date(startDate || "2025-01-01");
	const diff = now.getTime() - start.getTime();
	return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
