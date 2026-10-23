import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = defineConfig({
	testDir: "./tests/blog",
	fullyParallel: false,
	workers: 1,
	retries: process.env.CI ? 1 : 0,
	timeout: 30000,
	reporter: "list",
	outputDir: `.zcode/blog-verification/test-results/${process.env.BLOG_TEST_SCENARIO || "current"}`,
	use: {
		baseURL: "http://127.0.0.1:4350",
		viewport: { width: 1440, height: 1000 },
		colorScheme: "light",
		trace: "retain-on-failure",
		launchOptions: {
			executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
		},
	},
	webServer: {
		command: "node tests/serve.mjs",
		url: "http://127.0.0.1:4350",
		reuseExistingServer: false,
		timeout: 30000,
	},
});

export default config;
