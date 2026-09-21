// 下载自托管字体源文件
//
// 用途：霞鹜文楷（LXGW WenKai Lite）体积较大（约 14MB TTF），不适合直接提交进仓库，
// 因此与 generate-github-card-data / generate-douban-ratings 等构建脚本一样，在构建时按需下载。
//
// 行为：
//   - 目标文件已存在时直接跳过（幂等，本地重复构建不会重复下载）；
//   - 下载到临时文件后再原子改名，避免中断留下半个损坏字体；
//   - 下载失败只告警并以退出码 0 结束：字体缺失时 Astro 会跳过该字体（见 astro.config.mjs），
//     站点回退到系统字体，不会让整个构建失败。
//
// 手动执行：pnpm fonts

import fs from "node:fs/promises";
import path from "node:path";

type FontSource = {
	/** 相对 public/ 的目标路径（会被 .gitignore 忽略） */
	output: string;
	/** 下载地址（GitHub Release 的 latest 直链） */
	url: string;
};

const FONT_SOURCES: FontSource[] = [
	{
		output: "assets/fonts/LXGWWenKaiLite-Regular.ttf",
		url: "https://github.com/lxgw/LxgwWenKai-Lite/releases/latest/download/LXGWWenKaiLite-Regular.ttf",
	},
];

async function exists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function download(source: FontSource): Promise<void> {
	const target = path.resolve("public", source.output);
	const tmp = `${target}.download`;

	if (await exists(target)) {
		console.log(`   ⏭ ${source.output} 已存在，跳过下载。`);
		return;
	}

	console.log(`   ⏳ 正在下载 ${source.output} …`);

	await fs.mkdir(path.dirname(target), { recursive: true });

	const response = await fetch(source.url, { redirect: "follow" });
	if (!response.ok) {
		throw new Error(`HTTP ${response.status} ${response.statusText}`);
	}

	const buffer = Buffer.from(await response.arrayBuffer());
	// 字体文件不可能小于 100KB，小于该值基本可以判定拿到的是错误页
	if (buffer.length < 100 * 1024) {
		throw new Error(`响应体积异常（${buffer.length} 字节），可能不是字体文件`);
	}

	await fs.writeFile(tmp, buffer);
	await fs.rename(tmp, target);

	console.log(
		`   ✔ ${source.output}（${(buffer.length / 1024 / 1024).toFixed(1)} MB）`,
	);
}

async function main() {
	console.log("🔤 字体资源准备…");

	let failed = 0;
	for (const source of FONT_SOURCES) {
		try {
			await download(source);
		} catch (error) {
			failed++;
			console.warn(
				`   ⚠ ${source.output} 下载失败：${error instanceof Error ? error.message : String(error)}`,
			);
			console.warn(
				"     本次构建将跳过该字体并使用系统字体回退（不影响构建结果）。",
			);
		}
	}

	if (failed > 0) {
		console.warn(`⚠ ${failed} 个字体未能就绪，继续构建。`);
	}

	console.log("✨ 字体资源准备完成！");
}

main().catch((error) => {
	// 字体属于可降级资源，这里不阻断构建
	console.warn("⚠ 字体下载脚本异常：", error);
});
