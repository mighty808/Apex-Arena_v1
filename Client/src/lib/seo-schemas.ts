/**
 * seo-schemas.ts — Structured data (JSON-LD) objects for Google rich results.
 *
 * What is JSON-LD / structured data?
 *   It's a hidden block of machine-readable JSON that you include in a page's
 *   <head>.  Google reads it to understand WHAT the page is about, not just
 *   the text on it.  This unlocks "rich results" in search — things like:
 *     • FAQ dropdowns directly in Google results   (FAQPage schema)
 *     • A sitelinks search box on the home result  (WebSite schema)
 *     • Organisation info in the Knowledge Panel   (Organization schema)
 *     • Event/tournament cards with dates & prices (SportsEvent schema)
 *
 * How to use:
 *   Import the schema you need and pass it to <SEOHead structuredData={...} />.
 *   You can pass an array to include multiple schemas on one page.
 *
 *   Example (landing page):
 *     import { organizationSchema, webSiteSchema } from "@/lib/seo-schemas";
 *     <SEOHead structuredData={[organizationSchema, webSiteSchema]} />
 */

const SITE_URL = "https://apex-arenas.com";

// ─── Organization ─────────────────────────────────────────────────────────────
// Tells Google about Apex Arenas as a company.
// Helps populate the Knowledge Panel and brand searches.
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Apex Arenas",
  url: SITE_URL,
  logo: `${SITE_URL}/apex-logo.png`,
  description:
    "Ghana's premier esports tournament platform for FIFA, CODM, PUBG Mobile, and more.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "GH",
  },
  // Links our support page as the official contact point
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: `${SITE_URL}/support/contact-us`,
  },
};

// ─── WebSite ──────────────────────────────────────────────────────────────────
// Enables the "Sitelinks Searchbox" feature — a search bar that appears
// directly under the Apex Arenas result in Google, letting users search
// the site from Google without visiting it first.
export const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Apex Arenas",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    // {search_term_string} is a placeholder Google fills with the user's query
    target: `${SITE_URL}/tournaments?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

// ─── FAQPage ──────────────────────────────────────────────────────────────────
// Used on /support/help-center.
// Google may display these Q&As as expandable dropdowns directly in search
// results — great for capturing "how do I..." queries without a click.
export const helpCenterFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do payouts work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Prize pools are escrowed before brackets open. Once results are verified, payouts go straight to Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo).",
      },
    },
    {
      "@type": "Question",
      name: "Can I report a no-show?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Submit evidence within 30 minutes of match time to trigger a no-show review from our moderators.",
      },
    },
    {
      "@type": "Question",
      name: "How do I join a tournament?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Create a profile, browse available brackets, and check in before the match lock time. Entry fees are paid via your Apex Arenas wallet.",
      },
    },
    {
      "@type": "Question",
      name: "What if my match disconnects?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Report immediately with screenshots. Moderators review reconnection rules per title.",
      },
    },
    {
      "@type": "Question",
      name: "What games are supported on Apex Arenas?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Apex Arenas supports FIFA/EA FC, Call of Duty Mobile, PUBG Mobile, Mobile Legends, and more. New titles are added regularly.",
      },
    },
  ],
};

// ─── ContactPage ──────────────────────────────────────────────────────────────
// Used on /support/contact-us.
// Signals to Google that this is an official contact page for the organisation.
export const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact Apex Arenas",
  url: `${SITE_URL}/support/contact-us`,
  description: "Get in touch with the Apex Arenas support team.",
};

// ─── BreadcrumbList ────────────────────────────────────────────────────────────
// Generates breadcrumb markup (e.g. Home > Support > Help Center) that Google
// can display in search results instead of the raw URL.
//
// Usage:
//   buildBreadcrumbSchema([
//     { name: "Home", path: "/" },
//     { name: "Support", path: "/support" },
//     { name: "Help Center", path: "/support/help-center" },
//   ])
export function buildBreadcrumbSchema(
  crumbs: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,          // Google requires 1-based position numbers
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}
