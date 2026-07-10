/**
 * SEOHead — drop this into any page to control what search engines and
 * social platforms (WhatsApp, Twitter, Facebook) see when they visit it.
 *
 * How it works:
 *   react-helmet-async intercepts whatever you put inside <Helmet> and
 *   injects it into the real <head> of the document at runtime, overriding
 *   the static fallbacks in index.html.  Every page can therefore have its
 *   own unique title, description, and preview image.
 *
 * Usage:
 *   <SEOHead
 *     title="Browse Tournaments"
 *     description="Find and join esports tournaments in Ghana."
 *     canonicalPath="/tournaments"
 *     keywords="esports tournaments Ghana, FIFA, CODM"
 *   />
 *
 * Props reference:
 *   title        — page-specific title; the site name is appended automatically
 *   description  — 150-160 char sentence shown in Google results
 *   keywords     — comma-separated terms (minor Google signal, still useful for Bing)
 *   canonicalPath — e.g. "/tournaments" — prevents duplicate-content penalties
 *   ogImage      — full URL to a 1200×630 image for link previews
 *   ogType       — "website" for regular pages, "article" for blog posts, etc.
 *   noIndex      — set true on auth/account pages you don't want Google to index
 *   structuredData — JSON-LD object(s) for rich snippets (see seo-schemas.ts)
 */

import { Helmet } from "react-helmet-async";

const SITE_NAME = "Apex Arenas";
const SITE_URL = "https://apex-arenas.com";

// Shown when a page doesn't pass its own ogImage
const DEFAULT_OG_IMAGE = `${SITE_URL}/platform-preview.png`;

// Shown when a page doesn't pass its own description
const DEFAULT_DESCRIPTION =
  "Ghana's premier esports tournament platform. Compete in FIFA, CODM, PUBG Mobile, and more. Escrow-backed prize pools, instant MoMo payouts, and fair bracket systems.";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile";
  noIndex?: boolean;
  structuredData?: object | object[];
}

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  canonicalPath,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  noIndex = false,
  structuredData,
}: SEOHeadProps) {
  // If a title is passed, format it as "Page Title | Apex Arenas".
  // If nothing is passed, fall back to the full default site title.
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — Ghana's Esports Tournament Platform`;

  // Build the absolute canonical URL from a relative path like "/tournaments"
  const canonical = canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined;

  return (
    <Helmet>
      {/* ── Basic meta ─────────────────────────────────────────────────────── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Canonical tells Google the "authoritative" URL for this page,
          preventing duplicate-content penalties (e.g. /tournaments vs /tournaments?page=1) */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* noindex = tell Google not to index this page (used on /login, /auth/*, etc.) */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />

      {/* ── Open Graph (Facebook, WhatsApp, LinkedIn previews) ─────────────── */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_GH" />

      {/* ── Twitter / X Card ───────────────────────────────────────────────── */}
      {/* "summary_large_image" shows a big banner preview instead of a small thumbnail */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* ── Structured Data (JSON-LD) ──────────────────────────────────────── */}
      {/* Google reads this to generate rich results (star ratings, FAQ dropdowns,
          event cards, etc.) in search. The data comes from seo-schemas.ts. */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(structuredData) ? structuredData : [structuredData],
          )}
        </script>
      )}
    </Helmet>
  );
}
