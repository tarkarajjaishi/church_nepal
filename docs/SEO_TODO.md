# SEO / GEO — what's left

Status as of 2026-08-17. Ordered by impact, not by effort.

Done so far: the directory (`/churches`, city / district / province / profile
pages, Nepali `/ne/churches`), 23 topic pages (services, ministries,
denominations, events), 10 redirects closing the rest of the page plan, 140
sitemap URLs, `llms.txt`, and `robots.txt` allowing every AI crawler.

---

## 1. Blockers — nothing below matters until these are done

### 1.1 Verify the site in Google Search Console — **owner action, not code**

The site has no `google-site-verification` token and has never submitted a
sitemap. 140 URLs are sitting uncrawled. This is the single biggest item on
this page.

1. Google Search Console → Add property → **Domain** → `churchnepal.com`
2. It gives a `TXT` record. Add it in Cloudflare DNS (same zone already used
   for the wildcard cert), **DNS-only / grey cloud**.
3. Verify, then Sitemaps → submit `https://churchnepal.com/sitemap.xml`
4. URL Inspection → Request Indexing on `/`, `/churches`, `/denominations`

Do the same in **Bing Webmaster Tools** — it feeds Bing Copilot and, indirectly,
ChatGPT search.

A domain-property TXT record is preferred over the HTML-file method: it covers
every church subdomain too, which the file method would not.

### 1.2 Get real churches into the directory

Five seeded dummy churches (Bethel Butwal, Grace Kathmandu, Hillside Pokhara,
New Life Dharan, Riverside Lalitpur). Every city page outside those five
honestly says "no churches listed yet".

50 real listings will move ranking further than any page in section 2. A
directory that lists nothing cannot rank for "church directory Nepal" no matter
how good the copy is.

---

## 2. Keyword blocks with no dedicated page

Worth building, in this order. None of it helps before section 1.

- [ ] **`/christianity-in-nepal`** — history and present of Christianity in
      Nepal. The largest remaining topical-authority gap and already in the
      owner's cluster list. Covers "Christianity in Nepal", "history of
      Christianity in Nepal", "church history Nepal", "how many churches are in
      Nepal". **Fact-check every date and figure** — this is the page most
      likely to attract a confident wrong number.
- [ ] **`/church-leadership`** — pastors and church leaders in Nepal.
      "Church pastor Nepal", "Christian leader Nepal".
- [ ] **`/christian-organizations`** — Christian NGOs, missions agencies and
      networks. Overlaps `/missions`; only build it if it can say something
      that page does not.
- [ ] **Nepali translations of the topic pages** — `/ne/worship`,
      `/ne/bible-study` etc. The Nepali keyword block is large and currently
      served only by `/ne/churches`. `place-directory.tsx` already shows the
      bilingual pattern (separate URLs + hreflang, not a language switcher).

## 3. Data gaps that unlock better pages

These are backend work, and each turns a content page into a real listing.

- [ ] **`denomination` column on `churches`** — until it exists, the eleven
      `/denominations/*` pages cannot list churches, only explain the tradition.
      See `lib/topics.ts`. Add the column, expose it on the public API, add it
      to the admin wizard, then give those pages a real `ItemList` the way
      `place-directory.tsx` does.
- [ ] **Service times on the church record** — "what time is Sunday service"
      is one of the highest-intent queries in the whole keyword set and the
      directory cannot answer it. Needs a field per church plus
      `openingHoursSpecification` in the `Church` schema.
- [ ] **Events** — `/events` is an honest guide because there is no events
      table. An events model would let it carry real `Event` schema, which is
      eligible for rich results.
- [ ] **Per-church lat/long** — enables `geo` in the `Church` schema and makes
      the "church near me" keyword family answerable.

## 4. Known limitations, deliberate

- `/christian-resources`, `/articles`, `/news` are **308s**, not pages —
  `/resources` and `/blog` already target those queries and two pages chasing
  one keyword splits its ranking. Revisit only if `/blog` diverges from
  Christian-content intent.
- Topic pages are **not church-data-backed** on purpose. An empty filtered
  listing is a doorway page. See `lib/topics.ts`.
- `SITE_DOMAIN` on the church API is one global value, so donation return URLs
  land on the platform domain rather than the donor's own church.

## 5. Measurement — set up once section 1.1 is live

- [ ] Search Console: watch Coverage for pages excluded as "Crawled — currently
      not indexed". At 5 listings, thin city pages are the likely candidates.
- [ ] Track whether ChatGPT / Perplexity / AI Overviews cite the site for
      "what time are church services in Nepal" — the Saturday fact is the
      strongest citation hook the site has and the clearest signal GEO is
      working.
- [ ] Re-run a `site:churchnepal.com` check weekly until pages appear.

---

## Context worth keeping

**Churches in Nepal meet on Saturday, not Sunday** — Saturday is Nepal's weekly
holiday. Nepal moved to a two-day Saturday–Sunday weekend in April 2026, so some
churches added a Sunday service, but Saturday is still the main gathering. Every
competing directory assumes Sunday. This is the site's strongest differentiator
and it is stated in page prose, in `FAQPage` schema and in `llms.txt`. Do not
let a future page quietly revert to the Sunday assumption.

**Deploy lag is ~25 minutes.** Two workflows fire per push: `Release` goes green
in ~15s and is *not* the deploy; `CI Pipeline` is. A new route 404ing right
after a push is almost always the wait.

**CI does not gate the control plane.** `deploy` needs only `backend-check`,
`frontend-build`, `frontend-test`, `frontend-lint` — all four are church-side.
Nothing in CI builds or typechecks `control-plane/nextjs`. Run this before
pushing site changes:

```
cd control-plane/nextjs && npx tsc --noEmit && npx next build
```

To run the built app locally use `node .next/standalone/server.js` — `next
start` dies with exit 127 under `output: "standalone"`. Redirects never appear
in the build's route table, so test them against a running server or a typo
ships as a silent 404.
