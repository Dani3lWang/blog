if (!process.env.npm_config_user_agent?.startsWith("pnpm/")) {
	console.error(
		"Use the pnpm version declared in package.json to install dependencies.",
	);
	process.exitCode = 1;
}
