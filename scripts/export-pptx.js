#!/usr/bin/env node
/**
 * Export a reveal.js presentation to PPTX with full visual fidelity.
 *
 * Approach:
 *   1. Launch headless browser via Puppeteer
 *   2. Navigate through each slide, capture a screenshot
 *   3. Extract hyperlink positions (bounding boxes + href) from each slide
 *   4. Build PPTX with PptxGenJS: screenshot as background image,
 *      transparent clickable hyperlink regions overlaid on top
 *
 * Usage:
 *   node scripts/export-pptx.js <project-name> [--port 8000]
 */

const puppeteer = require("puppeteer");
const PptxGenJS = require("pptxgenjs");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// -- Config ------------------------------------------------------------------

const SLIDE_WIDTH = 10; // inches (PowerPoint default)
const SLIDE_HEIGHT = 5.625; // inches (16:9)
// Use 2560x1440 viewport — reveal.js scales to 2x (960*2=1920 content area)
// with 320px overflow buffer on each side. No resize needed.
const VIEWPORT_WIDTH = 2560;
const VIEWPORT_HEIGHT = 1440;

// -- Helpers -----------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let project = null;
  let port = 8000;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--port" && args[i + 1]) {
      port = parseInt(args[i + 1], 10);
      i++;
    } else if (!args[i].startsWith("--")) {
      project = args[i];
    }
  }

  if (!project) {
    // Auto-detect: list projects/
    const projectsDir = path.join(__dirname, "..", "projects");
    const dirs = fs
      .readdirSync(projectsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    if (dirs.length === 1) {
      project = dirs[0];
    } else {
      console.error(
        `Usage: node scripts/export-pptx.js <project-name> [--port 8000]`
      );
      console.error(`Available projects: ${dirs.join(", ")}`);
      process.exit(1);
    }
  }

  const indexPath = path.join(
    __dirname,
    "..",
    "projects",
    project,
    "index.html"
  );
  if (!fs.existsSync(indexPath)) {
    console.error(`Error: ${indexPath} not found. Generate slides first.`);
    process.exit(1);
  }

  return { project, port };
}

/**
 * Extract all visible <a> elements with href from the current slide.
 * Returns array of { href, x, y, w, h } where x/y/w/h are fractions of viewport.
 */
async function extractLinks(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const links = [];

    // Get the current slide element
    const currentSlide = document.querySelector(
      ".reveal .slides section.present"
    );
    if (!currentSlide) return links;

    // Also check for vertical slide (nested present)
    const verticalSlide = currentSlide.querySelector("section.present");
    const slideEl = verticalSlide || currentSlide;

    const anchors = slideEl.querySelectorAll("a[href]");
    anchors.forEach((a) => {
      const href = a.getAttribute("href");
      // Skip internal reveal.js navigation links
      if (!href || href.startsWith("#")) return;

      const rect = a.getBoundingClientRect();
      // Skip invisible elements
      if (rect.width === 0 || rect.height === 0) return;

      // Add some padding to make links easier to click
      const pad = 2;
      links.push({
        href,
        x: Math.max(0, (rect.left - pad) / vw),
        y: Math.max(0, (rect.top - pad) / vh),
        w: Math.min(1, (rect.width + pad * 2) / vw),
        h: Math.min(1, (rect.height + pad * 2) / vh),
      });
    });

    return links;
  });
}

// -- Main --------------------------------------------------------------------

async function main() {
  const { project, port } = parseArgs();
  const url = `http://localhost:${port}/projects/${project}/`;
  const outDir = path.join(__dirname, "..", "projects", project);
  const outFile = path.join(outDir, `${project}.pptx`);

  console.log(`Exporting: ${project}`);
  console.log(`URL: ${url}`);

  // Launch browser
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  // Navigate and wait for reveal.js to initialize
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  await page.waitForFunction(
    () => typeof Reveal !== "undefined" && Reveal.isReady(),
    { timeout: 10000 }
  );

  // Hide UI for clean export; keep default margin for overflow room
  await page.evaluate(() => {
    Reveal.configure({ controls: false, progress: false });
  });
  await new Promise((r) => setTimeout(r, 500));

  // Get total slide count
  const slideIndices = await page.evaluate(() => {
    const indices = [];
    const hSlides = Reveal.getHorizontalSlides();
    hSlides.forEach((hSlide) => {
      const vSlides = hSlide.querySelectorAll("section");
      if (vSlides.length > 0) {
        // Vertical stack
        vSlides.forEach((_, v) => {
          indices.push({ h: Array.from(hSlide.parentNode.children).indexOf(hSlide), v });
        });
      } else {
        indices.push({ h: Array.from(hSlide.parentNode.children).indexOf(hSlide), v: 0 });
      }
    });
    return indices;
  });

  // Simpler approach: use Reveal.getTotalSlides() and navigate sequentially
  const totalSlides = await page.evaluate(() => Reveal.getTotalSlides());
  console.log(`Total slides: ${totalSlides}`);

  // Go to first slide
  await page.evaluate(() => Reveal.slide(0, 0));
  await new Promise((r) => setTimeout(r, 500));

  // Create PPTX
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: SLIDE_WIDTH, height: SLIDE_HEIGHT });
  pptx.layout = "WIDE";

  for (let i = 0; i < totalSlides; i++) {
    // Navigate to slide
    if (i > 0) {
      await page.evaluate(() => Reveal.next());
      await new Promise((r) => setTimeout(r, 400));
    }

    const slideNum = i + 1;
    process.stdout.write(`  Slide ${slideNum}/${totalSlides}...`);

    // Full viewport screenshot — save to temp file
    const tmpImg = path.join(outDir, `_tmp_slide${slideNum}.png`);
    await page.screenshot({ path: tmpImg });

    // Extract hyperlinks
    const links = await extractLinks(page);

    // Create PPTX slide
    const slide = pptx.addSlide();

    // Add screenshot as full-bleed image (file path, no base64 limit)
    slide.addImage({
      path: tmpImg,
      x: 0,
      y: 0,
      w: SLIDE_WIDTH,
      h: SLIDE_HEIGHT,
    });

    // Overlay transparent clickable hyperlink regions
    links.forEach((link) => {
      slide.addShape(pptx.ShapeType.rect, {
        x: link.x * SLIDE_WIDTH,
        y: link.y * SLIDE_HEIGHT,
        w: link.w * SLIDE_WIDTH,
        h: link.h * SLIDE_HEIGHT,
        fill: { type: "solid", color: "FFFFFF", transparency: 100 },
        line: { type: "none" },
        hyperlink: { url: link.href, tooltip: link.href },
      });
    });

    console.log(` ${links.length} link(s)`);
  }

  // Write file
  await pptx.writeFile({ fileName: outFile });
  await browser.close();

  // Clean up temp screenshot files
  for (let i = 1; i <= totalSlides; i++) {
    const tmpImg = path.join(outDir, `_tmp_slide${i}.png`);
    if (fs.existsSync(tmpImg)) fs.unlinkSync(tmpImg);
  }

  // Post-process: remove noChangeAspect="1" from slide XMLs
  // This attribute prevents PowerPoint from stretching images to fill the shape
  console.log("Post-processing PPTX...");
  const AdmZip = require("adm-zip");
  const zip = new AdmZip(outFile);
  const entries = zip.getEntries();
  let patched = 0;
  entries.forEach((entry) => {
    if (entry.entryName.match(/^ppt\/slides\/slide\d+\.xml$/)) {
      let xml = entry.getData().toString("utf8");
      if (xml.includes('noChangeAspect="1"')) {
        xml = xml.replace(/noChangeAspect="1"/g, "");
        zip.updateFile(entry.entryName, Buffer.from(xml, "utf8"));
        patched++;
      }
    }
  });
  zip.writeZip(outFile);
  console.log(`  Removed noChangeAspect from ${patched} slides`);

  // Report
  const stats = fs.statSync(outFile);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
  console.log(`\nExported: ${outFile} (${sizeMB} MB)`);
}

main().catch((err) => {
  console.error("Export failed:", err.message);
  process.exit(1);
});
