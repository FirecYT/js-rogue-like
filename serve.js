// Простой статический сервер для разработки.
// Пути к ассетам в игре относительные, поэтому отдавать можно с любого маунта:
//   http://localhost:8080/                      — игра
//   http://localhost:8080/?playground           — игра + отладочный полигон
//   http://localhost:8080/js-rogue-like/...     — как на GitHub Pages (для проверки)
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PREFIX = '/js-rogue-like';
const PORT = process.env.PORT || 8080;

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.json': 'application/json',
	'.map': 'application/json',
};

http
	.createServer((req, res) => {
		let url = decodeURIComponent(req.url.split('?')[0]);
		if (url === '/' || url === '') url = '/index.html';
		// Поддержка префикса GitHub Pages
		if (url.startsWith(PREFIX + '/')) url = url.slice(PREFIX.length);

		const filePath = path.join(ROOT, url);
		if (!filePath.startsWith(ROOT)) {
			res.writeHead(403);
			res.end('Forbidden');
			return;
		}
		fs.readFile(filePath, (err, data) => {
			if (err) {
				res.writeHead(404, { 'Content-Type': 'text/plain' });
				res.end('Not found: ' + url);
				return;
			}
			const ext = path.extname(filePath).toLowerCase();
			res.writeHead(200, {
				'Content-Type': MIME[ext] || 'application/octet-stream',
				'Cache-Control': 'no-cache',
			});
			res.end(data);
		});
	})
	.listen(PORT, '0.0.0.0', () => {
		console.log(`Dev server on http://0.0.0.0:${PORT}/ (playground: /?playground)`);
	});
