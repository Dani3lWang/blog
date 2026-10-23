<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { navigateToPage } from "@utils/navigation-utils";
import { onMount, tick } from "svelte";
import Icon from "@/components/common/Icon.svelte";
import type { SearchResult } from "@/global";
import { FLOATING_PANEL_CLOSE_EVENT } from "@/utils/floating-panel-utils";
import { url as formatUrl, getSearchUrl } from "@/utils/url-utils";

type SearchState = "idle" | "loading" | "success" | "empty" | "error";
let keyword = "";
let result: SearchResult[] = [];
let state: SearchState = "idle";
let mounted = false;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let searchRequestId = 0;

const fakeResult: SearchResult[] = [
	{
		url: formatUrl("/"),
		meta: { title: "Pagefind development preview" },
		excerpt: "Run pnpm build and pnpm preview to search the production index.",
	},
];

function setPanelOpen(open: boolean): void {
	document
		.getElementById("search-panel")
		?.classList.toggle("float-panel-closed", !open);
}

function cancelPendingSearch(): void {
	clearTimeout(debounceTimer);
	searchRequestId += 1;
}

function resetSearch(): void {
	cancelPendingSearch();
	keyword = "";
	result = [];
	state = "idle";
}

function closeSearchPanel(): void {
	setPanelOpen(false);
	resetSearch();
}

async function ensurePagefind(): Promise<void> {
	if (import.meta.env.DEV || window.pagefind) return;
	if (!window.__loadPagefind) throw new Error("Pagefind loader is unavailable");
	await window.__loadPagefind();
	if (!window.pagefind) throw new Error("Pagefind is unavailable");
}

function preloadPagefind(): void {
	void ensurePagefind().catch(() => {
		// A query owns its error state; preloading must not overwrite a newer request.
	});
}

async function runSearch(query: string, requestId: number): Promise<void> {
	try {
		await ensurePagefind();
		if (requestId !== searchRequestId) return;
		const response = import.meta.env.DEV
			? null
			: await window.pagefind.search(query);
		const matches = response
			? await Promise.all(response.results.map((item) => item.data()))
			: fakeResult;
		if (requestId !== searchRequestId) return;
		result = matches;
		state = matches.length ? "success" : "empty";
	} catch (error) {
		if (requestId !== searchRequestId) return;
		console.error("Search failed:", error);
		result = [];
		state = "error";
	}
}

function scheduleSearch(value: string): void {
	cancelPendingSearch();
	result = [];
	const query = value.trim();
	if (!query) {
		state = "idle";
		if (window.matchMedia("(min-width: 1024px)").matches) setPanelOpen(false);
		return;
	}
	state = "loading";
	setPanelOpen(true);
	const requestId = searchRequestId;
	debounceTimer = setTimeout(() => void runSearch(query, requestId), 300);
}

function retrySearch(): void {
	// A new module URL also retries a failed dynamic import cached by the browser.
	delete window.pagefind;
	window.__pagefindLoading = undefined;
	scheduleSearch(keyword);
}

async function togglePanel(): Promise<void> {
	const panel = document.getElementById("search-panel");
	if (!panel?.classList.contains("float-panel-closed")) {
		closeSearchPanel();
		return;
	}
	setPanelOpen(true);
	preloadPagefind();
	await tick();
	requestAnimationFrame(() =>
		document.getElementById("search-input-mobile")?.focus(),
	);
}

function handleDesktopFocus(event: FocusEvent): void {
	if (
		(event.currentTarget as HTMLElement).hasAttribute(
			"data-floating-panel-focus-return",
		)
	)
		return;
	setPanelOpen(true);
	preloadPagefind();
	if (keyword.trim()) scheduleSearch(keyword);
}

function handleResultClick(event: MouseEvent, href: string): void {
	if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
	event.preventDefault();
	closeSearchPanel();
	navigateToPage(href);
}

onMount(() => {
	mounted = true;
	const panel = document.getElementById("search-panel");
	let swup: typeof window.swup | undefined;
	const bindNavigation = () => {
		if (!swup && window.swup) {
			swup = window.swup;
			swup.hooks.on("visit:start", closeSearchPanel);
		}
	};
	const onPageLoad = () => {
		closeSearchPanel();
		bindNavigation();
	};
	bindNavigation();
	panel?.addEventListener(FLOATING_PANEL_CLOSE_EVENT, resetSearch);
	document.addEventListener("astro:page-load", onPageLoad);
	document.addEventListener("swup:contentReplaced", onPageLoad);
	window.addEventListener("popstate", closeSearchPanel);
	return () => {
		cancelPendingSearch();
		swup?.hooks.off("visit:start", closeSearchPanel);
		panel?.removeEventListener(FLOATING_PANEL_CLOSE_EVENT, resetSearch);
		document.removeEventListener("astro:page-load", onPageLoad);
		document.removeEventListener("swup:contentReplaced", onPageLoad);
		window.removeEventListener("popstate", closeSearchPanel);
	};
});

$: if (mounted) scheduleSearch(keyword);
</script>

<!-- search bar for desktop view -->
<div id="search-bar" class="hidden lg:flex transition-all items-center h-11 mr-2 rounded-lg
      bg-black/4 hover:bg-black/6 focus-within:bg-black/6
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
">
    <Icon icon="material-symbols:search"
          class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
    <input id="search-input-desktop" placeholder="{i18n(I18nKey.search)}" bind:value={keyword}
           aria-label={i18n(I18nKey.search)} aria-controls="search-panel" data-floating-panel-no-expanded
           on:focus={handleDesktopFocus}
           class="transition-all pl-10 text-sm bg-transparent outline-0
         h-full w-40 active:w-60 focus:w-60 text-black/50 dark:text-white/50"
    >
</div>

<!-- toggle btn for phone/tablet view -->
<button on:click={togglePanel} aria-label={i18n(I18nKey.search)} aria-controls="search-panel" aria-expanded="false" id="search-switch"
		class="btn-plain scale-animation lg:hidden! rounded-lg w-11 h-11 active:scale-90">
    <Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
</button>

<!-- search panel -->
<div id="search-panel" class="float-panel float-panel-closed search-panel absolute md:w-120
top-20 left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-2"
     data-floating-panel data-floating-panel-trigger="search-switch search-input-desktop" inert aria-hidden="true">

    <!-- search bar inside panel for phone/tablet -->
    <div id="search-bar-inside" class="flex relative lg:hidden transition-all items-center h-11 rounded-xl
      bg-black/4 hover:bg-black/6 focus-within:bg-black/6
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
  ">
        <Icon icon="material-symbols:search"
              class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
        <input id="search-input-mobile" aria-label={i18n(I18nKey.search)} placeholder={i18n(I18nKey.search)} bind:value={keyword}
               on:focus={preloadPagefind}
               class="pl-10 absolute inset-0 text-sm bg-transparent outline-0
               focus:w-60 text-black/50 dark:text-white/50"
        >
    </div>

    <!-- search results -->
    {#if state === "idle"}
        <p class="px-3 py-2 text-sm text-50" role="status">{i18n(I18nKey.searchTypeSomething)}</p>
    {:else if state === "error"}
        <div class="px-3 py-2" role="alert">
            <p class="text-sm text-50">{i18n(I18nKey.searchError)}</p>
            <button type="button" class="btn-regular rounded-lg px-3 py-2 mt-2" on:click={retrySearch}>{i18n(I18nKey.searchRetry)}</button>
        </div>
    {:else if state === "loading"}
        <div role="status" class="transition first-of-type:mt-2 lg:first-of-type:mt-0 block rounded-xl text-lg px-3 py-2 text-50">
            {i18n(I18nKey.searchLoading)}
        </div>
    {:else if result.length > 0}
        {#each result.slice(0, 5) as item}
            <a href={item.url}
               on:click={(e) => handleResultClick(e, item.url)}
               class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block
           rounded-xl text-lg px-3 py-2 hover:bg-(--btn-plain-bg-hover) active:bg-(--btn-plain-bg-active)">
                <div class="transition text-90 inline-flex font-bold group-hover:text-(--primary)">
                    {@html item.meta.title}
                    <Icon icon="fa7-solid:chevron-right"
                          class="transition text-[0.75rem] translate-x-1 my-auto text-(--primary)"></Icon>
                </div>
                {#if item.excerpt.includes('<mark>')}
                    <div class="transition text-sm text-50" style="display: flex; align-items: flex-start; margin-top: 0.1rem">
                        <div>
                            {@html item.excerpt}
                        </div>
                    </div>
                {/if}

                {#if item.content && item.content.includes('<mark>')}
                    <div class="transition text-sm text-30" style="display: flex; align-items: flex-start; margin-top: 0.1rem">
                        <span style="display: inline-block; background-color: var(--btn-plain-bg-active); color: var(--primary); padding: 0.1em 0.4em; border-radius: 5px; font-size: 0.75em; font-weight: 600; margin-right: 0.5em; shrink: 0;">
                            {i18n(I18nKey.searchContent)}
                        </span>
                        <div>
                            {@html item.content}
                        </div>
                    </div>
                {/if}
            </a>
        {/each}
        {#if result.length > 5}
            <a href={getSearchUrl(keyword)}
               on:click={(e) => handleResultClick(e, getSearchUrl(keyword))}
               class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block rounded-xl text-lg px-3 py-2 hover:bg-(--btn-plain-bg-hover) active:bg-(--btn-plain-bg-active) text-(--primary) font-bold text-center">
                <span class="inline-flex items-center">
                    {i18n(I18nKey.searchViewMore).replace('{count}', (result.length - 5).toString())}
                    <Icon icon="fa7-solid:arrow-right" class="transition text-[0.75rem] ml-1"></Icon>
                </span>
            </a>
        {/if}
    {:else if state === "empty"}
        <div class="transition first-of-type:mt-2 lg:first-of-type:mt-0 block rounded-xl text-lg px-3 py-2 text-50">
            {i18n(I18nKey.searchNoResults)}
        </div>
    {/if}
</div>

<style>
    input:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: -2px;
        border-radius: 0.5rem;
    }

    .search-panel {
        max-height: calc(100vh - 100px);
        overflow-y: auto;
    }
</style>
