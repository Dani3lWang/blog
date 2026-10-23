import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";
import { siteConfig } from "../config/siteConfig";

/** Local record covers use the existing build optimizer. */
export async function resolveRecordImage(
	image: ImageMetadata | string,
): Promise<string> {
	if (typeof image === "string") return image;
	const result = await getImage({
		src: image,
		width: 400,
		format: "webp",
		quality: siteConfig.imageOptimization?.quality ?? 85,
	});
	return result.src;
}
