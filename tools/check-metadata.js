/**
 * Fails the build when SEO metadata is missing, duplicated, or malformed.
 *
 * This is the gate referenced on /technical-notes/. It is deliberately
 * strict: on a site whose purpose is demonstrating SEO competence, a
 * duplicate title is a defect, not a warning.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");
const MAX_TITLE = 60;
const MAX_DESC = 160;
const MIN_DESC = 70;

const errors = [];
const warnings = [];

function walk(dir) {
  let out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(walk(full));
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

function attr(html, pattern) {
  const m = html.match(pattern);
  return m ? m[1].trim() : null;
}

function decode(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
}

const files = walk(DIST);
const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();

for (const file of files) {
  const rel = "/" + path.relative(DIST, file).replace(/\\/g, "/");
  const html = readFileSync(file, "utf8");
  const isNoindex = /name="robots" content="noindex/.test(html);

  const title = decode(attr(html, /<title>([\s\S]*?)<\/title>/));
  const desc = decode(attr(html, /<meta name="description" content="([\s\S]*?)">/));
  const canonical = attr(html, /<link rel="canonical" href="([\s\S]*?)">/);
  const ogImage = attr(html, /<meta property="og:image" content="([\s\S]*?)">/);
  const h1Count = (html.match(/<h1[\s>]/g) || []).length;
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

  // --- Required fields -------------------------------------------------
  if (!title) errors.push(`${rel}: missing <title>`);
  if (!desc) errors.push(`${rel}: missing meta description`);
  if (!canonical) errors.push(`${rel}: missing canonical`);
  if (!ogImage) errors.push(`${rel}: missing og:image`);

  // --- Exactly one h1 --------------------------------------------------
  if (h1Count !== 1) errors.push(`${rel}: expected exactly 1 <h1>, found ${h1Count}`);

  // --- JSON-LD must parse ----------------------------------------------
  if (!jsonLd) {
    errors.push(`${rel}: missing JSON-LD`);
  } else {
    try {
      JSON.parse(jsonLd[1]);
    } catch (err) {
      errors.push(`${rel}: JSON-LD does not parse — ${err.message}`);
    }
  }

  // --- Length guidance --------------------------------------------------
  if (title && title.length > MAX_TITLE) {
    warnings.push(`${rel}: title ${title.length} chars (>${MAX_TITLE}) — "${title}"`);
  }
  if (desc && desc.length > MAX_DESC) {
    warnings.push(`${rel}: description ${desc.length} chars (>${MAX_DESC})`);
  }
  if (desc && desc.length < MIN_DESC) {
    warnings.push(`${rel}: description only ${desc.length} chars (<${MIN_DESC})`);
  }

  // --- Uniqueness (indexable pages only) --------------------------------
  if (!isNoindex) {
    if (title) {
      if (titles.has(title)) errors.push(`Duplicate title: "${title}" on ${rel} and ${titles.get(title)}`);
      else titles.set(title, rel);
    }
    if (desc) {
      if (descriptions.has(desc)) errors.push(`Duplicate description on ${rel} and ${descriptions.get(desc)}`);
      else descriptions.set(desc, rel);
    }
    if (canonical) {
      if (canonicals.has(canonical)) errors.push(`Duplicate canonical ${canonical} on ${rel} and ${canonicals.get(canonical)}`);
      else canonicals.set(canonical, rel);
    }
  }
}

// --- Sitemap coverage ---------------------------------------------------
try {
  const sitemap = readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  for (const [canonical, rel] of canonicals) {
    if (!sitemap.includes(`<loc>${canonical}</loc>`)) {
      errors.push(`${rel}: canonical ${canonical} is not present in sitemap.xml`);
    }
  }
} catch {
  errors.push("sitemap.xml missing from build output");
}

// --- Report -------------------------------------------------------------
console.log(`Checked ${files.length} HTML files.\n`);

if (warnings.length) {
  console.log("Warnings:");
  warnings.forEach((w) => console.log(`  ! ${w}`));
  console.log("");
}

if (errors.length) {
  console.error("Errors:");
  errors.forEach((e) => console.error(`  x ${e}`));
  console.error(`\nFAILED with ${errors.length} error(s).`);
  process.exit(1);
}

console.log(`PASSED. ${titles.size} unique indexable pages, all metadata present and unique.`);
