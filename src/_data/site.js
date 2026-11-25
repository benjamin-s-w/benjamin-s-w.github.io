/**
 * Single source of truth for site-wide identity, contact, and role data.
 * Changing a value here propagates to every page, all JSON-LD, and the resume.
 */
export default {
  // --- Identity --------------------------------------------------------
  name: "Ben Woodruff",
  // Job title as shown on LinkedIn. Change here to update sitewide + JSON-LD.
  jobTitle: "Search Engine Optimization Specialist",
  // Short positioning label used in the hero and <title> tags.
  tagline: "SEO Strategist",
  summary:
    "Technical SEO, local search, and analytics strategist with 8+ years turning complex multi-location healthcare websites into measurable organic acquisition channels.",

  // --- Canonical location ----------------------------------------------
  // GitHub Pages user site. Requires the repository to be named exactly
  // "benjamin-s-w.github.io" so the site serves from the domain root.
  // To move to a custom domain later: change this value, add a CNAME file
  // to src/static/, and point a DNS CNAME at benjamin-s-w.github.io.
  url: "https://benjamin-s-w.github.io",
  locale: "en_US",
  lang: "en",

  // --- Contact ----------------------------------------------------------
  email: "bwoodruff86@icloud.com",
  // Phone intentionally excluded from indexable pages; resume PDF only.
  phone: "(360) 605-9982",
  location: {
    city: "Greer",
    region: "South Carolina",
    regionCode: "SC",
    country: "United States",
    countryCode: "US",
  },

  // --- Profiles ---------------------------------------------------------
  linkedin: "https://www.linkedin.com/in/ben-woodruff-236b3223a/",
  github: "https://github.com/benjamin-s-w",
  agency: "https://woodruffmultimedia.com",

  // --- Assets -----------------------------------------------------------
  headshot: "/assets/img/ben-woodruff.jpg",
  headshotAvif: "/assets/img/ben-woodruff.avif",
  headshotWebp: "/assets/img/ben-woodruff.webp",
  headshot2x: "/assets/img/ben-woodruff@2x.jpg",
  ogImage: "/assets/img/og-default.jpg",
  resume: "/resume.pdf",

  // --- Build metadata ---------------------------------------------------
  buildYear: new Date().getFullYear(),
};
