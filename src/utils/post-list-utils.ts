import type { CollectionEntry } from "astro:content";
import type { Page } from "astro";
import { siteConfig } from "@/config";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import { getSortedPosts } from "./content-utils";
import { url } from "./url-utils";

/**
 * 文章列表分页（/posts/、/posts/2/ …）
 *
 * 首页改成个人主页后，完整文章列表搬到 /posts/ 下。
 * 该目录已经有一个 /posts/[...slug]（文章详情），两个 rest 参数路由会互相冲突，
 * 所以列表页拆成 /posts/（第一页）与 /posts/[page]（后续页）两个静态路由，
 * 共用这里的分页计算与页面数据组装。
 */

export type PostListEntry = CollectionEntry<"posts">;

/** 文章列表每页条数 */
export function getPostsPerPage(): number {
	const size = siteConfig.pagination.postsPerPage;
	return Number.isFinite(size) && size > 0 ? Math.floor(size) : 10;
}

/** 1-based 页码 → 该页路径；第 1 页为 /posts/，之后为 /posts/N/ */
export function getPostListPath(pageNumber: number): string {
	return pageNumber <= 1
		? url("/posts/")
		: url(`/posts/${Math.floor(pageNumber)}/`);
}

/** 文章列表总页数（无文章时仍保留 1 页，避免出现空路径） */
export async function getPostListLastPage(): Promise<number> {
	const posts = await getSortedPosts();
	return Math.max(1, Math.ceil(posts.length / getPostsPerPage()));
}

/**
 * 组装文章列表某一页的数据。
 * 返回值结构兼容 Astro 的 `Page<CollectionEntry<'posts'>>`，
 * 可直接传给 PostPage / Pagination，页码越界时自动收敛到有效区间。
 */
export async function getPostListPageData(
	currentPage: number,
): Promise<Page<PostListEntry>> {
	const posts = await getSortedPosts();
	const pageSize = getPostsPerPage();
	const total = posts.length;
	const lastPage = Math.max(1, Math.ceil(total / pageSize));
	const pageNumber = Math.min(
		Math.max(1, Math.floor(currentPage) || 1),
		lastPage,
	);
	const start = (pageNumber - 1) * pageSize;
	const data = posts.slice(start, start + pageSize);

	return {
		data,
		start,
		end: start + data.length,
		size: pageSize,
		total,
		currentPage: pageNumber,
		lastPage,
		url: {
			current: getPostListPath(pageNumber),
			prev: pageNumber > 1 ? getPostListPath(pageNumber - 1) : undefined,
			next: pageNumber < lastPage ? getPostListPath(pageNumber + 1) : undefined,
			first: pageNumber > 1 ? getPostListPath(1) : undefined,
			last: pageNumber < lastPage ? getPostListPath(lastPage) : undefined,
		},
	};
}

/** 文章列表页的隐藏 h1 文案：首页用页面名，后续页补页码 */
export function getPostListHeading(currentPage: number): string {
	const title = i18n(I18nKey.homeAllPosts);
	return currentPage > 1 ? `${title} · ${currentPage}` : title;
}
