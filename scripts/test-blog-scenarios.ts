import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import matter from "gray-matter";
import { resolveSiteRoot } from "./site-root";

const project = process.cwd();
const modules = path.join(project, "node_modules");
const base = path.join(project, ".zcode/blog-verification/scenarios");
await fs.mkdir(base, { recursive: true });
const isolated = await fs.mkdtemp(path.join(base, "run-"));
const node = process.execPath;
const env = {
	...process.env,
	ASTRO_TELEMETRY_DISABLED: "1",
	PATH: path.join(modules, ".bin") + path.delimiter + process.env.PATH,
};

function run(
	args: string[],
	cwd: string,
	additions: Record<string, string> = {},
): void {
	const result = spawnSync(node, args, {
		cwd,
		stdio: "inherit",
		env: { ...env, ...additions },
	});
	if (result.error) throw result.error;
	if (result.status !== 0)
		throw new Error(`Verification failed: ${args.join(" ")}`);
}

const sources = execFileSync(
	"git",
	["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
	{ encoding: "utf8" },
)
	.split("\0")
	.filter(Boolean);
for (const file of new Set(sources)) {
	const target = path.resolve(isolated, file);
	if (!target.startsWith(isolated + path.sep))
		throw new Error("Snapshot path escaped its directory");
	await fs.mkdir(path.dirname(target), { recursive: true });
	await fs.copyFile(path.join(project, file), target);
}
await fs.cp(
	path.join(project, "public/assets/fonts"),
	path.join(isolated, "public/assets/fonts"),
	{ recursive: true },
);
await fs.symlink(
	modules,
	path.join(isolated, "node_modules"),
	process.platform === "win32" ? "junction" : "dir",
);

const posts = await glob("src/content/posts/**/*.{md,mdx}", { cwd: isolated });
let publicPosts = 0;
for (const file of posts) {
	const target = path.join(isolated, file);
	const raw = await fs.readFile(target, "utf8");
	const entry = matter(raw);
	if (!entry.data.draft) publicPosts += 1;
	const draft = /^draft:/m.test(raw)
		? raw.replace(/^draft:.*$/m, "draft: true")
		: raw.replace(/^---\r?\n/, "---\ndraft: true\n");
	await fs.writeFile(target, draft);
}

function build(): void {
	run([path.join(modules, "astro/bin/astro.mjs"), "build"], isolated);
	for (const script of [
		"prune-disabled-pages.ts",
		"prune-pio-assets.ts",
		"subset-fonts.ts",
		"minify-inline-scripts.ts",
		"run-pagefind.ts",
		"verify-build.ts",
	]) {
		run(
			[
				path.join(modules, "tsx/dist/cli.mjs"),
				path.join(isolated, "scripts", script),
			],
			isolated,
		);
	}
}
function browser(root: string, hasPosts: boolean): void {
	run([path.join(modules, "@playwright/test/cli.js"), "test"], project, {
		BLOG_TEST_SITE_ROOT: root,
		BLOG_TEST_HAS_POSTS: String(hasPosts),
		BLOG_TEST_SCENARIO: hasPosts ? "one-post" : "zero-posts",
	});
}

if (publicPosts === 0) browser(path.join(project, resolveSiteRoot()), false);
else {
	build();
	browser(
		path.join(isolated, process.env.CF_WORKERS ? "dist/client" : "dist"),
		false,
	);
}

const fixture = path.join(
	isolated,
	"src/content/posts/__smoke__/acceptance.md",
);
await fs.mkdir(path.dirname(fixture), { recursive: true });
await fs.writeFile(
	fixture,
	"---\ntitle: 浏览器验收测试文章\npublished: 2026-10-23\ndraft: false\ndescription: 仅用于隔离回归，不进入正式内容。\n---\n\n## 验收章节\n\n验证真实文章入口与目录在页面切换后恢复。\n",
);
build();
browser(
	path.join(isolated, process.env.CF_WORKERS ? "dist/client" : "dist"),
	true,
);
console.log(
	`[blog-verification] Zero/one-public-post scenarios passed. Isolated artifacts: ${isolated}`,
);
