export default function (eleventyConfig) {
  // Passthrough static assets
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/static": "." });

  eleventyConfig.addWatchTarget("src/assets/");

  // --- Filters ---------------------------------------------------------

  // Absolute URL from a site-root path
  eleventyConfig.addFilter("absoluteUrl", (path, base) => {
    const cleanBase = String(base || "").replace(/\/+$/, "");
    const cleanPath = String(path || "/");
    return cleanBase + (cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath);
  });

  // ISO-8601 date for schema.org
  eleventyConfig.addFilter("isoDate", (value) => {
    const d = value ? new Date(value) : new Date();
    return d.toISOString().slice(0, 10);
  });

  // Human readable date
  eleventyConfig.addFilter("readableDate", (value) => {
    const d = value ? new Date(value) : new Date();
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  });

  // Escape a string for safe embedding inside a JSON-LD <script> block
  eleventyConfig.addFilter("jsonld", (value) =>
    JSON.stringify(value).replace(/</g, "\\u003c")
  );

  // --- Collections -----------------------------------------------------

  eleventyConfig.addCollection("caseStudies", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("src/case-studies/*.njk")
      .sort((a, b) => (a.data.order || 99) - (b.data.order || 99))
  );

  // Every page that should appear in sitemap.xml
  eleventyConfig.addCollection("sitemapPages", (collectionApi) =>
    collectionApi
      .getAll()
      .filter((item) => item.data.eleventyExcludeFromCollections !== true)
      .filter((item) => item.data.sitemap !== false)
      .filter((item) => typeof item.url === "string" && item.url !== false)
      .sort((a, b) => (a.data.sitemapPriority || 0.5) < (b.data.sitemapPriority || 0.5) ? 1 : -1)
  );

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "_includes",
      layouts: "_includes/layouts",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
}
