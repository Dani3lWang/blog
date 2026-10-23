import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import matter from "gray-matter";
import type { Root, RootContent } from "hast";
import { fromHtml } from "hast-util-from-html";
import { siteConfig } from "../src/config/siteConfig";
import { isPagePathEnabled } from "../src/utils/page-registry";
import { outputPathToRoute } from "./page-outputs";
import { resolveSiteRoot } from "./site-root";

const root = path.resolve(resolveSiteRoot());
const origin = new URL(siteConfig.site_url).origin;
const sourcePosts = await glob("**/*.{md,mdx}", { cwd: "src/content/posts" });
const drafts: string[] = [];
let publicPosts = 0;
for (const file of sourcePosts) {
	const { data } = matter(
		await fs.readFile(path.join("src/content/posts", file), "utf8"),
	);
	if (data.draft) drafts.push(file.replace(/\.(md|mdx)$/, ""));
	else publicPosts += 1;
}
const required = [
	"index.html",
	"about/index.html",
	"TV-albums/index.html",
	"booknav/index.html",
	"changelog/index.html",
	"404.html",
	"pagefind/pagefind.js",
	"rss.xml",
	"atom.xml",
	"sitemap-index.xml",
	"robots.txt",
];
for (const file of required) {
	if (isPagePathEnabled(outputPathToRoute(file)))
		await fs.access(path.join(root, file));
}
for (const slug of drafts) {
	for (const file of [`posts/${slug}/index.html`, `og/${slug}.png`]) {
		assert.equal(
			await fs.access(path.join(root, file)).then(
				() => true,
				() => false,
			),
			false,
			`Draft output remains: ${file}`,
		);
	}
}

let pages = 0;
for (const file of await glob("**/*.html", { cwd: root })) {
	const route = outputPathToRoute(file);
	assert(isPagePathEnabled(route), `Disabled output remains: ${route}`);
	const html = await fs.readFile(path.join(root, file), "utf8");
	const tree = fromHtml(html);
	let headings = 0;
	let redirect = false;
	let canonical = "";
	const ids = new Set<string>();
	const links: string[] = [];
	function visit(node: Root | RootContent): void {
		if (node.type === "element") {
			if (node.tagName === "a" && node.properties.href)
				links.push(String(node.properties.href));
			if (node.tagName === "h1") headings += 1;
			if (node.properties.id) ids.add(String(node.properties.id));
			if (
				node.tagName === "meta" &&
				String(node.properties.httpEquiv).toLowerCase() === "refresh"
			)
				redirect = true;
			if (
				node.tagName === "link" &&
				String(node.properties.rel).includes("canonical")
			)
				canonical = String(node.properties.href);
		}
		if ("children" in node) for (const child of node.children) visit(child);
	}
	visit(tree);
	if (redirect) continue;
	for (const href of links) {
		const target = new URL(href, origin);
		if (target.origin === origin)
			assert(
				isPagePathEnabled(target.pathname),
				`${route}: disabled link ${href}`,
			);
	}
	assert.equal(headings, 1, `${route}: expected one h1, found ${headings}`);
	assert.equal(
		new URL(canonical).origin,
		origin,
		`${route}: incorrect canonical origin`,
	);
	for (const id of [
		"swup-container",
		"category-bar-wrapper",
		"left-sidebar-dynamic",
		"right-sidebar-dynamic",
		"floating-toc-wrapper",
	]) {
		assert(ids.has(id), `${route}: missing Swup container ${id}`);
	}
	pages += 1;
}

for (const file of await glob("sitemap*.xml", { cwd: root })) {
	const xml = await fs.readFile(path.join(root, file), "utf8");
	for (const [, href] of xml.matchAll(/<loc>(.*?)<\/loc>/g)) {
		const target = new URL(href);
		assert.equal(target.origin, origin, `Sitemap origin: ${href}`);
		assert(
			isPagePathEnabled(target.pathname),
			`Disabled sitemap entry: ${href}`,
		);
	}
}
const rss = await fs.readFile(path.join(root, "rss.xml"), "utf8");
const atom = await fs.readFile(path.join(root, "atom.xml"), "utf8");
assert(
	rss.includes("<rss") && rss.includes("<channel>"),
	"RSS structure missing",
);
assert(
	atom.includes("<feed") && atom.includes("http://www.w3.org/2005/Atom"),
	"Atom structure missing",
);
assert(rss.includes(origin) && atom.includes(origin), "Feed site URL missing");
assert.equal(
	(rss.match(/<item>/g) || []).length,
	publicPosts,
	"RSS public article count",
);
assert.equal(
	(atom.match(/<entry>/g) || []).length,
	publicPosts,
	"Atom public article count",
);
for (const draft of drafts) {
	assert(
		!rss.includes(`/posts/${draft}/`) && !atom.includes(`/posts/${draft}/`),
		`Draft leaked into feeds: ${draft}`,
	);
}
assert(
	!(await fs.access(path.join(root, "api/dynamic.json")).then(
		() => true,
		() => false,
	)) || isPagePathEnabled("/api/dynamic.json"),
	"Disabled dynamic API remains",
);
console.log(
	`[verify-build] ${pages} pages: headings, Swup containers, routes, canonical, feeds, sitemap and search index passed`,
);
