import { commentConfig } from "../config/commentConfig";
import { dynamicConfig } from "../config/dynamicConfig";
import { siteConfig } from "../config/siteConfig";
import type { SiteConfig } from "../types/siteConfig";

type PageRule = {
	key: keyof SiteConfig["pages"];
	paths: string[];
	children?: boolean;
};

/** Canonical routes and historical aliases share the same page switch. */
export const PAGE_RULES: PageRule[] = [
	{ key: "friends", paths: ["/friends/"] },
	{ key: "guestbook", paths: ["/moments/guestbook/", "/guestbook/"] },
	{
		key: "dynamic",
		paths: ["/dynamic/", "/moments/shuoshuo/", "/api/dynamic.json"],
		children: true,
	},
	{ key: "projects", paths: ["/projects/"], children: true },
	{ key: "gallery", paths: ["/moments/gallery/", "/gallery/"], children: true },
	{ key: "booknav", paths: ["/booknav/"] },
	{ key: "bangumi", paths: ["/bangumi/"] },
	{ key: "vndb", paths: ["/vndb/"] },
	{ key: "moments", paths: ["/moments/", "/life/"] },
	{ key: "books", paths: ["/books/"], children: true },
	{ key: "moviesGames", paths: ["/TV-albums/", "/movies-games/"] },
	{ key: "games", paths: ["/games/"] },
	{ key: "musicPage", paths: ["/music/"] },
	{ key: "changelog", paths: ["/changelog/"] },
	{
		key: "notebooks",
		paths: ["/moments/notebooks/", "/life/notebooks/"],
		children: true,
	},
	{ key: "routines", paths: ["/routines/", "/life/routines/"] },
	{ key: "places", paths: ["/places/", "/life/places/"] },
	{ key: "sponsor", paths: ["/sponsor/"] },
];

export function isPagePathEnabled(
	pathname: string,
	pages: SiteConfig["pages"] = siteConfig.pages,
): boolean {
	const path = pathname.split(/[?#]/)[0].toLowerCase();
	if (
		path === "/dynamic/comments/" &&
		(dynamicConfig.showComment === false || commentConfig.type === "none")
	)
		return false;
	// Book/film/music records reuse these details independently of the Bangumi list.
	if (path.startsWith("/bangumi/") && path !== "/bangumi/") {
		return pages.bangumi || pages.moviesGames;
	}
	return PAGE_RULES.every(
		(rule) =>
			pages[rule.key] ||
			!rule.paths.some((raw) => {
				const route = raw.toLowerCase();
				return (
					path === route ||
					(rule.children && route.endsWith("/") && path.startsWith(route))
				);
			}),
	);
}
