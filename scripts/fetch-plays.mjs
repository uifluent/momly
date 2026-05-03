/**
 * Fetches upcoming children's events from sofia.plays.bg for the next N days
 * and prints ready-to-paste UpcomingEvent objects.
 *
 * Usage:  node scripts/fetch-plays.mjs
 *         node scripts/fetch-plays.mjs --days=14
 */

import * as cheerio from "cheerio";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const BASE       = "https://sofia.plays.bg";
const DAYS_AHEAD = parseInt(
  process.argv.find((a) => a.startsWith("--days="))?.split("=")[1] ?? "7",
);
const MAX_PAGES = 5;
const WRITE_MODE = process.argv.includes("--write");
const OUT_FILE   = join(dirname(fileURLToPath(import.meta.url)), "../lib/upcomingEventsData.json");

// ── Date helpers ──────────────────────────────────────────────────────────────

const EN_MONTHS = {
  January:1, February:2, March:3, April:4, May:5, June:6,
  July:7, August:8, September:9, October:10, November:11, December:12,
};
const BG_MONTH_LABELS = ["","яну","фев","мар","апр","май","юни","юли","авг","сеп","окт","ное","дек"];

function pad(n) { return String(n).padStart(2, "0"); }
function iso(d)  { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

function todayDate() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
function cutoffDate() {
  const d = todayDate();
  d.setDate(d.getDate() + DAYS_AHEAD);
  return d;
}

function parseDateFromUrl(url) {
  const m = url.match(/\/events\/view\/(\d+)\/(\d{2})\/(\w+)\/\w+\/(\d{4})/);
  if (!m) return null;
  const month = EN_MONTHS[m[3]];
  if (!month) return null;
  return { eventId: m[1], date: new Date(parseInt(m[4]), month - 1, parseInt(m[2])) };
}

function makeDateLabel(dateIso) {
  const d = new Date(dateIso);
  return `${d.getDate()} ${BG_MONTH_LABELS[d.getMonth()+1]}`;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; momly-fetcher/1.0)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ── Collect unique event IDs → earliest date ──────────────────────────────────

async function collectEvents() {
  const byId = new Map(); // eventId → { url, date }
  const limit = cutoffDate();
  const today = todayDate();

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = page === 1
      ? `${BASE}/events/list-from-to`
      : `${BASE}/events/list-from-to/${page}`;

    process.stderr.write(`  page ${page} …`);
    let html;
    try { html = await fetchHtml(url); }
    catch (e) { process.stderr.write(` error: ${e.message}\n`); break; }

    const $ = cheerio.load(html);
    let newThisPage = 0;

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (!/\/events\/view\/\d+\//.test(href)) return;
      const full    = href.startsWith("http") ? href : BASE + href;
      const parsed  = parseDateFromUrl(full);
      if (!parsed) return;

      const { eventId, date } = parsed;
      if (date < today) return;
      if (date > limit) return;

      // Keep only the earliest date per event
      if (!byId.has(eventId) || date < byId.get(eventId).date) {
        byId.set(eventId, { url: full, date });
        newThisPage++;
      }
    });

    process.stderr.write(` ${byId.size} unique events\n`);
    if (newThisPage === 0 && page > 1) break;
  }

  return byId;
}

// ── Auto-classify energy & duration ──────────────────────────────────────────

const ENERGY_RULES = [
  // high — physically demanding
  { energy: ["high"],          re: /скално\s+катер|скейт|паркур|бойн|борб/i },
  // medium-high — active outdoor, sports, horses, adventure (before medium so geo/конна match here)
  { energy: ["medium","high"], re: /природ|геопарк|гео|конна|кон\b|вело|каране|спорт|активн|приключени|туризъм|планин/i },
  // low — calm, seated, indoor performance
  { energy: ["low"],           re: /балет|концерти?\s+за\s+бебо|кино|филм|книг|изложб|приказ|куклен|пантомим/i },
  // low-medium — theatre, musical (some movement but mostly seated)
  { energy: ["low","medium"],  re: /театър|мюзикъл|представлени|спектакъл/i },
  // medium — workshops, art, walks (fallback before default)
  { energy: ["medium"],        re: /работилниц|ателие|арт|занималн|разходк|срещ|програм|лагер|академи/i },
];

const DURATION_RULES = [
  // short < 1h
  { duration: "short", re: /концерт\s+за\s+бебо|куклен\s+театър|кратк|30\s*мин|45\s*мин/i },
  // long 2h+
  { duration: "long",  re: /лагер|академи|курс|занималн|целод|целоднев|ден\b|седмиц/i },
  // medium default (1-2h) — applied below as fallback
];

function classifyEvent(title, description) {
  const text = `${title} ${description}`;

  // Energy — first matching rule wins
  let energy = ["medium"]; // default
  for (const rule of ENERGY_RULES) {
    if (rule.re.test(text)) { energy = rule.energy; break; }
  }

  // Duration — first matching rule wins, else medium
  let duration = "medium";
  for (const rule of DURATION_RULES) {
    if (rule.re.test(text)) { duration = rule.duration; break; }
  }

  return { energy, duration };
}

// ── Parse detail page ─────────────────────────────────────────────────────────

function parseAgeRange(text) {
  if (!text) return { min: 0, max: 12 };
  if (/всич/i.test(text)) return { min: 0, max: 12 };
  const upTo   = text.match(/до\s*(\d+)/i);
  if (upTo)  return { min: 0, max: parseInt(upTo[1]) };
  const plus   = text.match(/(\d+)\s*\+/);
  if (plus)  return { min: parseInt(plus[1]), max: 12 };
  const range  = text.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return { min: parseInt(range[1]), max: parseInt(range[2]) };
  const single = text.match(/(\d+)/);
  if (single) return { min: parseInt(single[1]), max: 12 };
  return { min: 0, max: 12 };
}

// Returns true if text looks like CSS, JS, or a nav link — not a description
function looksLikeCode(t) {
  return /\{|<script|@media|font-size|background:|\.mc_embed/i.test(t);
}

async function parseDetail(eventId, url, date) {
  let html;
  try { html = await fetchHtml(url); }
  catch (e) { process.stderr.write(`  skip ${url}: ${e.message}\n`); return null; }

  const $ = cheerio.load(html);

  // Title — from <title> tag, strip site suffix
  const pageTitle = $("title").text().trim();
  const title = pageTitle
    .replace(/\s*[\|–\-]\s*(KoalaKids|sofia\.plays\.bg|plays\.bg).*/i, "")
    .replace(/^(София\s+играе\s*:\s*)/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!title || title.length < 3) return null;

  // Description — longest <p> that isn't code/nav
  let description = "";
  $("p").each((_, el) => {
    const t = $(el).text().trim().replace(/\s+/g, " ");
    if (looksLikeCode(t)) return;
    if (t.length > description.length && t.length > 20) description = t;
  });
  if (!description) {
    // fallback: largest non-code div text
    $("div").each((_, el) => {
      if ($(el).children("div, p, ul").length > 0) return;
      const t = $(el).text().trim().replace(/\s+/g, " ");
      if (looksLikeCode(t)) return;
      if (t.length > description.length && t.length > 30) description = t;
    });
  }
  if (description.length > 120) description = description.slice(0, 117) + "…";
  if (!description) description = "Детско събитие в София.";

  // Age — look for patterns like "3+ г", "4-10г", "до 6г", "всички"
  let ageText = "";
  $("*").each((_, el) => {
    if ($(el).children().length > 0) return;
    const t = $(el).text().trim();
    if (/(\d+\s*\+\s*г|\d+\s*[-–]\s*\d+\s*г|до\s*\d+\s*г|всич)/i.test(t) && t.length < 30) {
      ageText = t;
      return false;
    }
  });
  const ageRange = parseAgeRange(ageText);

  // Image — first /img/events/ image
  let image;
  $("img[src]").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    if (/\/img\/events\//.test(src) && !image) {
      image = src.startsWith("http") ? src : BASE + src;
    }
  });

  const dateIso = iso(date);
  const { energy, duration } = classifyEvent(title, description);

  return {
    id: `plays-${eventId}`,
    title,
    description,
    city: "София",
    duration,
    energy,
    ageRange,
    link: url,
    date: dateIso,
    dateLabel: makeDateLabel(dateIso),
    source: "Plays.bg",
    isClear: true,
    easyAccess: true,
    ...(image ? { image } : {}),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  process.stderr.write(`Scanning sofia.plays.bg — next ${DAYS_AHEAD} days\n\n`);

  const byId = await collectEvents();
  process.stderr.write(`\nFetching ${byId.size} unique event pages…\n`);

  const events = [];
  for (const [eventId, { url, date }] of byId) {
    const ev = await parseDetail(eventId, url, date);
    if (ev) events.push(ev);
  }

  // Sort by date
  events.sort((a, b) => a.date.localeCompare(b.date));

  if (WRITE_MODE) {
    writeFileSync(OUT_FILE, JSON.stringify(events, null, 2) + "\n", "utf8");
    process.stderr.write(`\nWrote ${events.length} events to ${OUT_FILE}\n`);
  } else {
    console.log("// ── Paste into UPCOMING_EVENTS in lib/upcomingEvents.ts ──────────\n");
    for (const ev of events) {
      console.log(JSON.stringify(ev, null, 2) + ",");
    }
    process.stderr.write(`\nDone — ${events.length} events.\n`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
