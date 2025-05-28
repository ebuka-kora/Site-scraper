const express = require("express");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const cheerio = require("cheerio");
const archiver = require("archiver");
const { downloadAsset } = require("../utils/downloadAssets");
const { cleanFolder } = require("../utils/cleanFolder");

const scrapedDir = path.resolve(__dirname, "../scraped");
const assetsDir = path.resolve(__dirname, "../scraped_assets");

if (!fs.existsSync(scrapedDir)) fs.mkdirSync(scrapedDir);
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

const router = express.Router();

// ✅ Main scrape route
router.post("/api/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required." });

  cleanFolder(scrapedDir);
  cleanFolder(assetsDir);

  let finalUrl = /^https?:\/\//i.test(url) ? url : "https://" + url;
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(finalUrl, { waitUntil: "networkidle2", timeout: 60000 });

    const data = await page.evaluate(() => {
      const assets = [];
      document.querySelectorAll("img").forEach((img) => img.src && assets.push(img.src));
      document.querySelectorAll("link[rel='stylesheet']").forEach((link) => link.href && assets.push(link.href));
      document.querySelectorAll("script[src]").forEach((script) => script.src && assets.push(script.src));

      const structuredData = {
        title: document.title,
        metaDescription: document.querySelector("meta[name='description']")?.content || "",
        headings: [...document.querySelectorAll("h1, h2, h3")].map((h) => ({
          tag: h.tagName,
          text: h.innerText.trim()
        })),
      };

      return {
        structuredData,
        content: document.documentElement.outerHTML,
        assets,
        url: window.location.href,
      };
    });

    for (const assetUrl of data.assets) {
      await downloadAsset(assetUrl, assetsDir);
    }

    // Update HTML paths
    const $ = cheerio.load(data.content);
    $("img").each((_, el) => {
      const src = $(el).attr("src");
      if (src) {
        try {
          const fileName = path.basename(new URL(src, data.url).pathname);
          $(el).attr("src", `/assets/${fileName}`);
        } catch (_) {}
      }
    });

    $("link[rel='stylesheet']").each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        try {
          const fileName = path.basename(new URL(href, data.url).pathname);
          $(el).attr("href", `/assets/${fileName}`);
        } catch (_) {}
      }
    });

    $("script[src]").each((_, el) => {
      const src = $(el).attr("src");
      if (src) {
        try {
          const fileName = path.basename(new URL(src, data.url).pathname);
          $(el).attr("src", `/assets/${fileName}`);
        } catch (_) {}
      }
    });

    const finalHtml = $.html();
    fs.writeFileSync(path.join(scrapedDir, "index.html"), finalHtml, "utf-8");

    res.json({
      title: data.structuredData.title,
      metaDescription: data.structuredData.metaDescription,
      headings: data.structuredData.headings,
      content: finalHtml,
    });
  } catch (err) {
    console.error("Scraping error:", err.message);
    res.status(500).json({ error: "Failed to scrape the URL." });
  } finally {
    if (browser) await browser.close();
  }
});

// ✅ Screenshot route
router.post("/api/screenshot", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required." });

  const filePath = path.join(scrapedDir, "screenshot.png");
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.screenshot({ path: filePath, fullPage: true });

    res.sendFile(filePath);
  } catch (err) {
    console.error("Screenshot error:", err.message);
    res.status(500).json({ error: "Failed to capture screenshot." });
  } finally {
    if (browser) await browser.close();
  }
});

// ✅ Multi-page scraping route
router.post("/api/paginate", async (req, res) => {
  const { url, nextSelector, itemSelector, maxPages = 5 } = req.body;

  if (!url || !nextSelector || !itemSelector) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    let results = [];
    let currentPage = 1;

    while (currentPage <= maxPages) {
      const items = await page.evaluate((sel) => {
        return [...document.querySelectorAll(sel)].map((el) => el.innerText.trim());
      }, itemSelector);

      results.push(...items);

      const nextExists = await page.$(nextSelector);
      if (!nextExists) break;

      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        page.click(nextSelector),
      ]);

      currentPage++;
    }

    res.json({ pagesScraped: currentPage - 1, items: results });
  } catch (err) {
    console.error("Pagination error:", err.message);
    res.status(500).json({ error: "Pagination scraping failed." });
  } finally {
    if (browser) await browser.close();
  }
});

// ✅ Download ZIP route
router.get("/api/download", async (req, res) => {
  const zip = archiver("zip", { zlib: { level: 9 } });
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=scraped_site.zip");

  zip.pipe(res);
  zip.directory(scrapedDir, "html");
  zip.directory(assetsDir, "assets");
  await zip.finalize();
});

module.exports = router;
