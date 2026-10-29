const NAVBAR_SEARCH_PATH_PREFIXES = [
	"/posts",
	"/archive",
	"/categories",
	"/tags",
	"/series",
	"/search",
	"/books",
	"/tv-albums",
	"/music",
] as const;

export const NAVBAR_SEARCH_DISABLE_EVENT = "navbar-search:disable";
export const NAVBAR_SEARCH_VISIBILITY_EVENT = "navbar-search:visibility-change";

function normalizePathname(pathname: string): string {
	const baseUrl = import.meta.env.BASE_URL || "/";
	const baseUrlNoSlash = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
	const relativePath =
		baseUrlNoSlash && pathname.startsWith(baseUrlNoSlash)
			? pathname.slice(baseUrlNoSlash.length)
			: pathname;

	return (relativePath.replace(/\/+$/, "") || "/").toLowerCase();
}

/** 顶部栏搜索只在内容检索相关页面显示。 */
export function isNavbarSearchVisible(pathname: string): boolean {
	const normalizedPath = normalizePathname(pathname);

	return NAVBAR_SEARCH_PATH_PREFIXES.some(
		(prefix) =>
			normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
	);
}

/**
 * 同步持久化顶部栏中的搜索入口，并在隐藏前通知搜索组件清理悬浮面板。
 * 返回值用于调用方判断当前页面是否允许搜索。
 */
export function syncNavbarSearchVisibility(pathname: string): boolean {
	const visible = isNavbarSearchVisible(pathname);
	const control = document.querySelector<HTMLElement>(
		"[data-navbar-search-control]",
	);
	if (!control) return visible;

	const visibilityChanged = control.hidden === visible;
	if (!visible && !control.hidden) {
		document.dispatchEvent(new Event(NAVBAR_SEARCH_DISABLE_EVENT));
	}

	control.hidden = !visible;
	if (visible) control.removeAttribute("aria-hidden");
	else control.setAttribute("aria-hidden", "true");

	if (visibilityChanged) {
		document.dispatchEvent(new Event(NAVBAR_SEARCH_VISIBILITY_EVENT));
	}

	return visible;
}
