// Renders og-image.png (the link preview) from the page itself, settled.
//   npm run og
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { chromium } from "playwright";

const root = new URL("..", import.meta.url).pathname;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };
const server = createServer(async (req, res) => {
  const p = new URL(req.url, "http://x").pathname;
  const path = join(root, decodeURIComponent(p === "/" ? "/index.html" : p));
  try { res.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream" }); res.end(await readFile(path)); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`http://localhost:${server.address().port}/`, { waitUntil: "networkidle" });
await page.addStyleTag({ content: ".foot { display: none !important; }" });
await page.waitForTimeout(6500);
await page.screenshot({ path: join(root, "og-image.png") });
await browser.close();
server.close();
console.log("Wrote og-image.png");
