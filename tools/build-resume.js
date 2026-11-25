/**
 * Renders tools/resume.html to src/static/resume.pdf using headless Chrome.
 * The PDF is committed, so this only needs running when the resume changes.
 *
 * Usage: node tools/build-resume.js
 */
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const chrome = CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error("No Chrome/Edge binary found. Set CHROME_PATH and retry.");
  process.exit(1);
}

const source = path.resolve("tools/resume.html");
const output = path.resolve("src/static/resume.pdf");

execFileSync(chrome, [
  "--headless",
  "--disable-gpu",
  "--no-pdf-header-footer",
  `--print-to-pdf=${output}`,
  `file:///${source.replace(/\\/g, "/")}`,
], { stdio: "ignore" });

if (!existsSync(output)) {
  console.error("PDF was not produced.");
  process.exit(1);
}

const kb = (statSync(output).size / 1024).toFixed(1);
console.log(`Wrote src/static/resume.pdf (${kb} KB) using ${path.basename(chrome)}.`);
