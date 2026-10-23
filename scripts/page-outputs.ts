import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import { isPagePathEnabled } from "../src/utils/page-registry";
import { resolveSiteRoot } from "./site-root";

export function outputPathToRoute(file: string): string {
	const normalized = file.replace(/\\/g, "/");
	return `/${normalized.replace(/(^|\/)index\.html$/, "$1").replace(/\.html$/, "/")}`;
}

export async function pruneDisabledPageOutputs(): Promise<void> {
	const root = path.resolve(resolveSiteRoot());
	const files = await glob(["**/*.html", "api/dynamic.json"], { cwd: root });
	let removed = 0;
	for (const file of files) {
		if (isPagePathEnabled(outputPathToRoute(file))) continue;
		const target = path.resolve(root, file);
		if (!target.startsWith(root + path.sep))
			throw new Error("Output escaped the build directory");
		await fs.unlink(target);
		removed += 1;
	}
	console.log(`[pages] Removed ${removed} disabled page outputs`);
}
