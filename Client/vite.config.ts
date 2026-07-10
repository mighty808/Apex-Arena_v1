import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

// ── SEO Prerender Plugin ───────────────────────────────────────────────────────
//
// WHY THIS EXISTS
// ---------------
// This is a CSR (Client-Side Rendered) React SPA. Social crawlers — WhatsApp,
// Twitter, Facebook, LinkedIn — do NOT execute JavaScript. When they visit
// https://apex-arenas.com/tournaments they see a near-empty HTML shell and
// generate a blank link preview. react-helmet-async only works for crawlers
// that DO execute JS (like Googlebot).
//
// HOW IT WORKS
// ------------
// After every `npm run build`, this plugin:
//   1. Reads the freshly built dist/index.html
//   2. Finds the <!-- PRERENDER:START/END --> block (set in index.html source)
//   3. For each indexable public route, replaces that block with
//      route-specific title, description, and OG/Twitter tags
//   4. Writes the result to dist/{route}/index.html
//
// At runtime the hosting server (Netlify/Vercel/Nginx) serves whichever
// index.html matches the requested path. Social crawlers get real meta tags
// without executing any JS. Normal users get the same file; React hydrates
// and react-helmet-async takes over from that point.
//
// IMPORTANT — keep this list in sync with the public routes in App.tsx.
// Private/auth routes are intentionally excluded.

const SITE_URL = 'https://apex-arenas.com'
const OG_IMAGE  = `${SITE_URL}/platform-preview.png`

interface SeoRoute {
  path: string        // e.g. "/tournaments" — becomes dist/tournaments/index.html
  title: string       // full page title including site name
  description: string // 150-160 char sentence for meta description + OG
  keywords: string    // comma-separated keywords
}

const SEO_ROUTES: SeoRoute[] = [
  {
    path: '/tournaments',
    title: 'Browse Tournaments | Apex Arenas',
    description: 'Find and join esports tournaments in Ghana. FIFA, Call of Duty Mobile, PUBG Mobile, and more. Escrow-backed prize pools, instant MoMo payouts.',
    keywords: 'esports tournaments Ghana, join tournament, FIFA tournament online, CODM tournament, PUBG Mobile Ghana',
  },
  {
    path: '/leaderboard',
    title: 'Leaderboard | Apex Arenas',
    description: 'See the top-ranked esports players competing on Apex Arenas in Ghana. Live rankings updated after every tournament.',
    keywords: 'esports leaderboard Ghana, top gamers Ghana, gaming rankings, FIFA ranking',
  },
  {
    path: '/about',
    title: 'About Us | Apex Arenas',
    description: "Learn about Apex Arenas — the team building Ghana's competitive gaming ecosystem and professionalizing esports in West Africa.",
    keywords: 'apex arenas, esports Ghana, gaming company Ghana, West Africa esports',
  },
  {
    path: '/careers',
    title: 'Careers | Apex Arenas',
    description: "Join the Apex Arenas team and help build Ghana's competitive gaming ecosystem. Open roles in engineering, design, and operations.",
    keywords: 'jobs Ghana, tech careers Ghana, esports jobs, gaming company',
  },
  {
    path: '/support',
    title: 'Support | Apex Arenas',
    description: 'Get help with Apex Arenas — browse the Help Center, read tournament rules, learn about dispute resolution, or contact the team.',
    keywords: 'apex arenas support, esports help Ghana, tournament support',
  },
  {
    path: '/support/help-center',
    title: 'Help Center | Apex Arenas',
    description: 'Find answers to common questions about Apex Arenas tournaments, payouts, disputes, and account management.',
    keywords: 'apex arenas help, esports FAQ Ghana, tournament questions, payout help',
  },
  {
    path: '/support/rules',
    title: 'Tournament Rules | Apex Arenas',
    description: 'Read the official Apex Arenas tournament rules — fair play standards, match procedures, and code of conduct for all competitive events.',
    keywords: 'esports tournament rules, apex arenas rules, gaming competition rules Ghana',
  },
  {
    path: '/support/dispute-resolution',
    title: 'Dispute Resolution | Apex Arenas',
    description: 'Learn how Apex Arenas handles match disputes — submit evidence, get a fair review, and protect your results.',
    keywords: 'esports dispute resolution, match dispute Ghana, apex arenas disputes',
  },
  {
    path: '/support/contact-us',
    title: 'Contact Us | Apex Arenas',
    description: "Get in touch with the Apex Arenas support team. We're here to help with tournaments, payments, and account issues.",
    keywords: 'apex arenas contact, esports support Ghana, contact gaming platform',
  },
]

/** Builds the HTML meta block that replaces the PRERENDER section for a given route. */
function buildMetaBlock(route: SeoRoute): string {
  const canonical = `${SITE_URL}${route.path}`
  return [
    `    <!-- Fallback title/meta for bots that don't execute JS.`,
    `         react-helmet-async overrides these once React hydrates. -->`,
    `    <title>${route.title}</title>`,
    `    <meta name="description" content="${route.description}" />`,
    `    <meta name="keywords" content="${route.keywords}" />`,
    `    <meta name="robots" content="index, follow" />`,
    `    <link rel="canonical" href="${canonical}" />`,
    ``,
    `    <!-- Open Graph (Facebook, WhatsApp, LinkedIn) -->`,
    `    <meta property="og:type" content="website" />`,
    `    <meta property="og:site_name" content="Apex Arenas" />`,
    `    <meta property="og:title" content="${route.title}" />`,
    `    <meta property="og:description" content="${route.description}" />`,
    `    <meta property="og:image" content="${OG_IMAGE}" />`,
    `    <meta property="og:image:width" content="1200" />`,
    `    <meta property="og:image:height" content="630" />`,
    `    <meta property="og:url" content="${canonical}" />`,
    `    <meta property="og:locale" content="en_GH" />`,
    ``,
    `    <!-- Twitter / X Card -->`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${route.title}" />`,
    `    <meta name="twitter:description" content="${route.description}" />`,
    `    <meta name="twitter:image" content="${OG_IMAGE}" />`,
  ].join('\n')
}

function seoPrerender(): Plugin {
  return {
    name: 'seo-prerender',

    // 'build' means this plugin only runs during `npm run build`, not `npm run dev`
    apply: 'build',

    // closeBundle fires after Vite has finished writing ALL output files to dist/
    closeBundle() {
      const distDir = path.resolve('dist')
      const indexPath = path.join(distDir, 'index.html')

      if (!fs.existsSync(indexPath)) {
        console.warn('[seo-prerender] dist/index.html not found — skipping')
        return
      }

      const template = fs.readFileSync(indexPath, 'utf-8')

      // Find the replaceable section using the marker comments added in index.html
      const START = '<!-- PRERENDER:START -->'
      const END   = '<!-- PRERENDER:END -->'
      const startIdx = template.indexOf(START)
      const endIdx   = template.indexOf(END)

      if (startIdx === -1 || endIdx === -1) {
        console.warn('[seo-prerender] PRERENDER markers not found in dist/index.html — skipping')
        return
      }

      // Split the template into the parts before and after the marker block
      const before = template.slice(0, startIdx)
      const after  = template.slice(endIdx + END.length)

      let count = 0
      for (const route of SEO_ROUTES) {
        const metaBlock = buildMetaBlock(route)

        // Reassemble: keep everything outside the marker block, inject new meta
        const html = `${before}${START}\n${metaBlock}\n    ${END}${after}`

        // e.g. /tournaments  →  dist/tournaments/index.html
        //      /support/help-center  →  dist/support/help-center/index.html
        const routeDir = path.join(distDir, route.path)
        fs.mkdirSync(routeDir, { recursive: true })
        fs.writeFileSync(path.join(routeDir, 'index.html'), html, 'utf-8')
        count++
      }

      console.log(`\n[seo-prerender] ✓ Generated ${count} pre-rendered HTML files`)
      console.log(`[seo-prerender]   Social crawlers now get real OG meta tags on all public routes.`)
    },
  }
}

// ── Vite Config ───────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    seoPrerender(),
  ],

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**', 'src/utils/**', 'src/components/**'],
      exclude: ['src/test/**'],
    },
  },
})
