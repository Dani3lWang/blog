import { expect, type Page, test } from "@playwright/test";

const hasPosts = process.env.BLOG_TEST_HAS_POSTS === "true";
const query = "下周同样时间";
const resultLink = '#search-panel a[href="/TV-albums/"]';

async function ready(page: Page, route = "/"): Promise<void> {
	await page.goto(route);
	await expect(
		page
			.locator("astro-island")
			.filter({ has: page.locator("#search-input-desktop") }),
	).not.toHaveAttribute("ssr", "");
}

test("公开内容入口与关闭路由", async ({ page, request }) => {
	await ready(page);
	await expect(page.locator('#navbar a[href="/posts/"]')).toHaveCount(
		hasPosts ? 1 : 0,
	);
	await expect(page.locator(".ed-action--solid")).toHaveAttribute(
		"href",
		hasPosts ? "/posts/" : "/about/",
	);
	await expect(page.locator(".ed-home")).not.toContainText("1970");
	await expect(page.locator(".ed-home")).not.toContainText("Firefly Wiki Link");
	for (const icon of await page.locator(".ed-portal__icon svg").all()) {
		await expect(icon.locator("path")).not.toHaveCount(0);
	}
	for (const route of [
		"/books/",
		"/games/",
		"/dynamic/",
		"/moments/",
		"/moments/guestbook/",
		"/guestbook/",
		"/gallery/encrypted-test/",
		"/moments/gallery/firefly-2026/",
		"/life/routines/",
		"/api/dynamic.json",
	]) {
		expect((await request.get(route)).status(), route).toBe(404);
	}
	await page.goto("/posts/");
	if (!hasPosts)
		await expect(page.locator("#swup-container")).toContainText("文章整理中");
	expect((await request.get("/rss.xml")).ok()).toBeTruthy();
	expect((await request.get("/atom.xml")).ok()).toBeTruthy();
});

test("桌面首次查询、无结果和清空", async ({ page }) => {
	await page.route("**/pagefind/pagefind.js*", async (route) => {
		await new Promise((resolve) => setTimeout(resolve, 650));
		await route.continue();
	});
	await ready(page, "/TV-albums/");
	const input = page.locator("#search-input-desktop");
	await input.fill(query);
	await expect(page.locator("#search-panel")).toContainText("正在搜索");
	await expect(page.locator(resultLink)).toBeVisible();
	await input.fill("zxqv948_no_matching_document");
	await expect(page.locator("#search-panel")).toContainText("找不到相关结果");
	await input.fill("");
	await expect(page.locator("#search-panel")).toHaveAttribute(
		"aria-hidden",
		"true",
	);
	await input.fill(query);
	await expect(page.locator(resultLink)).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(input).toBeFocused();
	await expect(page.locator("#search-panel")).toHaveAttribute(
		"aria-hidden",
		"true",
	);
});

test("加载失败后重试仍执行当前关键词", async ({ page }) => {
	await page.route("**/pagefind/pagefind.js*", (route) => route.abort());
	await ready(page, "/TV-albums/");
	await page.locator("#search-input-desktop").fill(query);
	await expect(page.locator("#search-panel")).toContainText("搜索暂时不可用");
	await page.unroute("**/pagefind/pagefind.js*");
	await page
		.locator("#search-panel")
		.getByRole("button", { name: "重试搜索" })
		.click();
	await expect(page.locator(resultLink)).toBeVisible();
});

test("慢查询不能覆盖新查询，关闭后不能重开", async ({ page }) => {
	await ready(page, "/TV-albums/");
	await page.evaluate(() => {
		window.pagefind = {
			search: async (text: string) => {
				await new Promise((resolve) =>
					setTimeout(resolve, text === "slow" ? 900 : 10),
				);
				return {
					results: [
						{
							data: async () => ({
								url: "/about/",
								meta: { title: text },
								excerpt: text,
							}),
						},
					],
				};
			},
		};
	});
	const input = page.locator("#search-input-desktop");
	await input.fill("slow");
	await page.waitForTimeout(400);
	await input.fill("new");
	await expect(page.locator("#search-panel a").first()).toContainText("new");
	await page.waitForTimeout(1000);
	await expect(page.locator("#search-panel a").first()).not.toContainText(
		"slow",
	);
	await input.fill("slow");
	await page.waitForTimeout(400);
	await input.fill("");
	await page.waitForTimeout(1000);
	await expect(page.locator("#search-panel")).toHaveAttribute(
		"aria-hidden",
		"true",
	);
});

test("手机搜索聚焦与父级链接", async ({ page }, testInfo) => {
	await page.setViewportSize({ width: 390, height: 850 });
	await ready(page);
	await expect(page.locator("[data-navbar-search-control]")).toBeHidden();
	await ready(page, "/TV-albums/");
	await page.locator("#search-switch").click();
	await expect(page.locator("#search-input-mobile")).toBeFocused();
	await expect(page.locator("#search-panel")).toContainText("请输入搜索关键词");
	await page.locator("#search-input-mobile").fill(query);
	await expect(page.locator(resultLink)).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(page.locator("#search-switch")).toBeFocused();
	await ready(page);
	await page.locator("#nav-menu-switch").click();
	await expect(page.locator(".mobile-menu-close")).toBeFocused();
	await page.keyboard.press("Shift+Tab");
	await expect(
		page.locator("#nav-menu-panel [data-mobile-dropdown-trigger]").last(),
	).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(page.locator(".mobile-menu-close")).toBeFocused();
	const parent = page.locator(
		`#nav-menu-panel .mobile-menu-parent > a[href="${hasPosts ? "/posts/" : "/TV-albums/"}"]`,
	);
	const row = parent.locator("..");
	await row.locator("button").click();
	await expect(row.locator("button")).toHaveAttribute("aria-expanded", "true");
	await page.screenshot({
		path: testInfo.outputPath("mobile-menu.png"),
		fullPage: true,
	});
	await parent.click();
	await expect(page).toHaveURL(
		new RegExp(`${hasPosts ? "/posts/" : "/TV-albums/"}$`),
	);
	await expect(page.locator("#nav-menu-panel")).toHaveAttribute(
		"aria-hidden",
		"true",
	);
	await expect(page.locator("body")).not.toHaveClass(/menu-open/);
	await page.locator("#nav-menu-switch").click();
	await page.keyboard.press("Escape");
	await expect(page.locator("#nav-menu-switch")).toBeFocused();
	await expect(page.locator("body")).not.toHaveClass(/menu-open/);
});

test("响应式、主题、Swup 往返及唯一播放器", async ({ page }, testInfo) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await ready(page);
	for (const width of [320, 390, 768, 1024, 1440]) {
		await page.setViewportSize({ width, height: 950 });
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
			String(width),
		).toBeTruthy();
		expect(
			await page
				.locator(".ed-portals")
				.evaluate(
					(el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
				),
		).toBe(2);
		for (const selector of [".ed-portal__title", ".ed-portal__desc"]) {
			for (const node of await page.locator(selector).all()) {
				expect(
					await node.evaluate((el) => el.scrollWidth <= el.clientWidth),
					`${width}: ${selector}`,
				).toBe(true);
			}
		}
	}
	await page.screenshot({
		path: testInfo.outputPath("desktop.png"),
		fullPage: true,
	});
	await page.evaluate(() => document.documentElement.classList.add("dark"));
	await page.screenshot({
		path: testInfo.outputPath("dark.png"),
		fullPage: true,
	});
	await page.evaluate(() => document.documentElement.classList.remove("dark"));
	await page.emulateMedia({ reducedMotion: "reduce" });
	await expect(page.locator(".ed-hero__title")).toHaveCSS(
		"animation-name",
		"none",
	);
	await page.evaluate(() =>
		Reflect.set(window, "blogVerificationMarker", true),
	);
	await page.locator(".ed-action--solid").click();
	await expect(page).toHaveURL(
		new RegExp(`${hasPosts ? "/posts/" : "/about/"}$`),
	);
	expect(
		await page.evaluate(() => Reflect.get(window, "blogVerificationMarker")),
	).toBe(true);
	await page.goBack();
	await expect(page.locator(".ed-home")).toBeVisible();
	await expect(page.locator(".ed-portal__icon path").first()).toBeAttached();
	await page.goForward();
	await expect(page.locator(".ed-home")).toHaveCount(0);
	await expect(page.locator("audio")).toHaveCount(1);
	expect(errors).toEqual([]);
	await page.setViewportSize({ width: 390, height: 850 });
	await page.goto("/");
	await page.screenshot({
		path: testInfo.outputPath("mobile.png"),
		fullPage: true,
	});
});

test("本地封面、单一标题与无目录空列", async ({ page }) => {
	await ready(page, "/TV-albums/");
	await expect(page.locator("h1")).toHaveCount(1);
	await expect(page.locator('img[src*="doubanio.com"]')).toHaveCount(0);
	for (const route of ["congmingzhen", "xianzai-bushi-chugui-de-wenti"]) {
		await page.goto(`/bangumi/real/${route}/`);
		await page.locator(".mg-cover-img").scrollIntoViewIfNeeded();
		await expect
			.poll(() =>
				page
					.locator(".mg-cover-img")
					.evaluate(
						(img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
					),
			)
			.toBe(true);
		await expect(page.locator("h1")).toHaveCount(1);
	}
	await page.goto("/bangumi/music/xiazhou-tongyang-shijian/");
	if (
		(await page.locator("#swup-container").getAttribute("data-has-toc")) ===
		"false"
	) {
		await expect(page.locator("#left-sidebar")).toBeHidden();
	}
	if (hasPosts) {
		await page.goto("/posts/__smoke__/acceptance/");
		await expect(page.locator("#sidebar-toc")).toBeVisible();
		await expect(page.locator("#sidebar-toc")).toContainText("验收章节");
	}
});

test("切页取消迟到查询，滚动后搜索可用", async ({ page }) => {
	await ready(page, "/TV-albums/");
	await page.evaluate(() => {
		window.pagefind = {
			search: async () => {
				await new Promise((resolve) => setTimeout(resolve, 900));
				return {
					results: [
						{
							data: async () => ({
								url: "/about/",
								meta: { title: "迟到结果" },
								excerpt: "迟到结果",
							}),
						},
					],
				};
			},
		};
	});
	await page.locator("#search-input-desktop").fill("slow");
	await page.waitForTimeout(400);
	await page.locator('#life-nav-wrapper a[href="/changelog/"]').click();
	await expect(page).toHaveURL(/\/changelog\/$/);
	await page.waitForTimeout(1000);
	await expect(page.locator("#search-panel")).toHaveAttribute(
		"aria-hidden",
		"true",
	);
	await expect(page.locator("audio")).toHaveCount(1);
	await page.setViewportSize({ width: 1440, height: 600 });
	await page.goto("/TV-albums/");
	await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
	await page.waitForTimeout(500);
	await expect(page.locator("#navbar")).toHaveClass(/navbar-compact/);
	await page.mouse.wheel(0, -60);
	await expect(page.locator("#navbar-wrapper")).not.toHaveClass(/navbar-hidden/);
	await page.locator(".navbar-seg--right").hover();
	const input = page.locator("#search-input-desktop");
	await input.click();
	await page.keyboard.type(query);
	await expect(page.locator(resultLink)).toBeVisible();
});

test("文章视图切换保留公共页头、空状态和偏好", async ({ page }) => {
	await ready(page, "/posts/");
	await expect(page.locator("h1")).toHaveCount(1);
	await expect(page.locator(".content-header__title")).toBeVisible();
	await page.locator('[data-post-index-view="visual"]').click();
	await expect(page.locator('[data-post-index-panel="visual"]')).toBeVisible();
	await expect(page.locator('[data-post-index-panel="list"]')).toBeHidden();
	if (hasPosts) await expect(page.locator(".post-index-card").first()).toBeVisible();
	else await expect(page.locator('[data-post-index-panel="visual"]')).toContainText("文章整理中");
	await page.reload();
	await expect(page.locator('[data-post-index-view="visual"]')).toHaveAttribute("aria-pressed", "true");
	await page.locator('[data-post-index-view="list"]').click();
	await expect(page.locator('[data-post-index-panel="list"]')).toBeVisible();
	if (!hasPosts) await expect(page.locator('[data-post-index-panel="list"]')).toContainText("文章整理中");
});

test("搜索入口按页面切换并清理查询", async ({ page }) => {
	await ready(page);
	await expect(page.locator("[data-navbar-search-control]")).toBeHidden();
	await ready(page, "/TV-albums/");
	await expect(page.locator("[data-navbar-search-control]")).toBeVisible();
	await page.locator("#search-input-desktop").fill(query);
	await expect(page.locator(resultLink)).toBeVisible();
	await page.locator('#navbar a[href="/"]').first().click();
	await expect(page.locator(".ed-home")).toBeVisible();
	await expect(page.locator("[data-navbar-search-control]")).toBeHidden();
	await expect(page.locator("#search-panel")).toHaveAttribute("aria-hidden", "true");
	await expect(page.locator("#search-input-desktop")).toHaveValue("");
});

test("内页窄屏、明暗主题和键盘焦点", async ({ page }, testInfo) => {
	test.setTimeout(60000);
	for (const route of [
		"/about/",
		"/booknav/",
		"/TV-albums/",
		"/posts/",
		"/changelog/",
		"/bangumi/real/congmingzhen/",
	]) {
		await ready(page, route);
		await expect(page.locator("h1")).toHaveCount(1);
		for (const width of [320, 390, 768, 1024, 1440]) {
			await page.setViewportSize({ width, height: 950 });
			for (const dark of [false, true]) {
				await page.evaluate(
					(enabled) =>
						document.documentElement.classList.toggle("dark", enabled),
					dark,
				);
				expect(
					await page.evaluate(
						() => document.documentElement.scrollWidth <= innerWidth,
					),
					`${route} ${width} dark=${dark}`,
				).toBe(true);
			}
		}
		await expect(page.locator("audio")).toHaveCount(1);
	}
	await ready(page, "/TV-albums/");
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.screenshot({
		path: testInfo.outputPath("records-desktop.png"),
		fullPage: true,
	});
	await page.setViewportSize({ width: 390, height: 850 });
	await page.screenshot({
		path: testInfo.outputPath("records-mobile.png"),
		fullPage: true,
	});
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto("/TV-albums/");
	for (let step = 0; step < 25; step += 1) {
		await page.keyboard.press("Tab");
		if (
			await page
				.locator("#search-input-desktop")
				.evaluate((el) => el === document.activeElement)
		)
			break;
	}
	await expect(page.locator("#search-input-desktop")).toBeFocused();
	await expect(page.locator("#search-input-desktop")).toHaveCSS(
		"outline-style",
		"solid",
	);
	await expect(page.locator("#search-input-desktop")).toHaveCSS(
		"outline-width",
		"2px",
	);
});
