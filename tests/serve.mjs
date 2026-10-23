import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const root = path.resolve(
	process.env.BLOG_TEST_SITE_ROOT ||
		(fs.existsSync("dist/client") ? "dist/client" : "dist"),
);
const types = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript",
	".css": "text/css",
	".json": "application/json",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".webp": "image/webp",
	".woff2": "font/woff2",
	".wasm": "application/wasm",
	".xml": "application/xml",
};
http
	.createServer((req, res) => {
		try {
			let file = path.resolve(
				root,
				"." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
			);
			if (file !== root && !file.startsWith(root + path.sep)) {
				res.writeHead(403).end();
				return;
			}
			if (fs.existsSync(file) && fs.statSync(file).isDirectory())
				file = path.join(file, "index.html");
			const exists = fs.existsSync(file) && fs.statSync(file).isFile();
			if (!exists) file = path.join(root, "404.html");
			res.writeHead(exists ? 200 : 404, {
				"Content-Type": types[path.extname(file)] || "application/octet-stream",
			});
			fs.createReadStream(file).pipe(res);
		} catch {
			res.writeHead(400).end();
		}
	})
	.listen(4350, "127.0.0.1");
