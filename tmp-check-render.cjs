const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on("console", (msg) => console.log("console:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("pageerror:", err.message));
  const res = await page.goto("http://localhost:8083/", { waitUntil: "networkidle" });
  console.log("status:", res ? res.status() : "no-response");
  const html = await page.content();
  console.log("rootHasRenderedContent:", !html.includes('<div id="root"></div>'));
  await page.screenshot({ path: "tmp-page.png", fullPage: true });
  await browser.close();
})();
