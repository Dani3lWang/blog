import { getCollection } from "astro:content";

/** Public entry points must not count development-only draft previews. */
export async function getPublicContentState(): Promise<{
	hasPublicPosts: boolean;
	publicPostCount: number;
}> {
	const posts = await getCollection("posts", ({ data }) => !data.draft);
	return { hasPublicPosts: posts.length > 0, publicPostCount: posts.length };
}
