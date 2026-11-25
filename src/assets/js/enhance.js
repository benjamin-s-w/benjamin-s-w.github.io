/**
 * Progressive enhancement for htmx-boosted navigation.
 *
 * Design constraints (deliberate, documented on /technical-notes/):
 *  - Every page is a complete static HTML document at a real URL.
 *  - htmx fetches that SAME full document and swaps only <main>.
 *  - No partial/fragment URLs exist, so there is nothing extra to crawl,
 *    canonicalise, or de-duplicate.
 *  - With JavaScript disabled, every link is an ordinary anchor.
 *
 * This file fixes the two things boosted navigation breaks by default:
 *  1. Screen readers are not told the page changed.
 *  2. The document <title> and canonical link go stale.
 */
(function () {
  "use strict";

  if (!("querySelector" in document)) return;

  var announcer = document.getElementById("route-announcer");

  /**
   * After a boosted swap, htmx replaces <main> but leaves <head> alone.
   * Pull the new document's title/description/canonical out of the
   * response text and apply them so the tab, history entry, and any
   * crawler executing JS all see the correct metadata.
   */
  function syncHead(responseText) {
    if (!responseText) return null;

    var parsed;
    try {
      parsed = new DOMParser().parseFromString(responseText, "text/html");
    } catch (err) {
      return null;
    }
    if (!parsed) return null;

    var newTitle = parsed.querySelector("title");
    if (newTitle && newTitle.textContent) {
      document.title = newTitle.textContent;
    }

    var pairs = [
      ['meta[name="description"]', "content"],
      ['link[rel="canonical"]', "href"],
      ['meta[name="robots"]', "content"],
      ['meta[property="og:url"]', "content"],
      ['meta[property="og:title"]', "content"],
    ];

    pairs.forEach(function (pair) {
      var incoming = parsed.querySelector(pair[0]);
      var current = document.head.querySelector(pair[0]);
      if (incoming && current) {
        current.setAttribute(pair[1], incoming.getAttribute(pair[1]) || "");
      }
    });

    return newTitle ? newTitle.textContent : null;
  }

  // Capture the incoming markup before htmx swaps it in.
  var pendingTitle = null;

  document.body.addEventListener("htmx:beforeSwap", function (event) {
    var xhr = event.detail && event.detail.xhr;
    pendingTitle = xhr ? syncHead(xhr.responseText) : null;
  });

  document.body.addEventListener("htmx:afterSwap", function () {
    // Move focus to the new content so keyboard users are not stranded
    // at the bottom of the previous page.
    var main = document.getElementById("main");
    if (main) {
      main.focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);

    // Announce the new page to assistive technology.
    if (announcer) {
      var label = pendingTitle || document.title;
      // Clearing first guarantees the live region fires even if the
      // text happens to be identical.
      announcer.textContent = "";
      window.setTimeout(function () {
        announcer.textContent = label + " — page loaded";
      }, 60);
    }

    // Keep the current-page indicator in the nav accurate.
    updateCurrentNav();
  });

  // If a boosted request fails for any reason, fall back to a real
  // navigation rather than leaving the user on a stale page.
  document.body.addEventListener("htmx:responseError", function (event) {
    var path = event.detail && event.detail.pathInfo && event.detail.pathInfo.requestPath;
    if (path) window.location.href = path;
  });

  document.body.addEventListener("htmx:sendError", function (event) {
    var path = event.detail && event.detail.pathInfo && event.detail.pathInfo.requestPath;
    if (path) window.location.href = path;
  });

  function updateCurrentNav() {
    var here = window.location.pathname;
    var links = document.querySelectorAll(".nav__list a");
    Array.prototype.forEach.call(links, function (link) {
      var href = link.getAttribute("href");
      var isCurrent =
        here === href || (href !== "/" && here.indexOf(href) === 0);
      if (isCurrent) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }
})();
