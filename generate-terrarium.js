#!/usr/bin/env node
import { graphql } from "@octokit/graphql";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const USERNAME = process.env.GITHUB_USERNAME;
const TOKEN    = process.env.GITHUB_TOKEN;

if (!USERNAME || !TOKEN) {
  console.error("❌  GITHUB_USERNAME and GITHUB_TOKEN environment variables are required.");
  process.exit(1);
}

const SVG_PATH = join(dirname(fileURLToPath(import.meta.url)), "terrarium.svg");

function toISO(date) { return date.toISOString().replace(/\.\d{3}Z$/, "Z"); }
function today() { return new Date(); }
function weeksAgo(n) { const d = today(); d.setDate(d.getDate() - n * 7); return d; }

async function fetchContributions() {
  const from = toISO(weeksAgo(4));
  const to   = toISO(today());

  const { user } = await graphql(
    `query ($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }`,
    { login: USERNAME, from, to, headers: { authorization: `token ${TOKEN}` } }
  );

  return user.contributionsCollection.contributionCalendar.weeks
    .flatMap((w) => w.contributionDays)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function plantType(count) {
  if (count === 0) return "EMPTY";
  if (count <= 3)  return "SPROUT";
  if (count <= 6)  return "FERN";
  return                  "ORCHID";
}

function emptySVG() {
  return `<!-- PLANT:EMPTY -->
      <ellipse cx="0" cy="0" rx="12" ry="4" fill="#4a2e12" opacity="0.6"/>`;
}

function sproutSVG() {
  return `<!-- PLANT:SPROUT -->
      <ellipse cx="0" cy="0" rx="10" ry="3.5" fill="#3d2010" opacity="0.7"/>
      <g filter="url(#softglow)">
        <path d="M 0,0 Q 0,-20 -10,-28" stroke="#4ade80" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path d="M 0,-10 Q -12,-14 -14,-22" stroke="#4ade80" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M 0,-10 Q  10,-12  11,-20" stroke="#86efac" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <ellipse cx="-10" cy="-28" rx="5" ry="3" fill="#22c55e" opacity="0.85" transform="rotate(-25,-10,-28)"/>
      </g>`;
}

function fernSVG() {
  return `<!-- PLANT:FERN -->
      <ellipse cx="0" cy="0" rx="13" ry="4" fill="#3a2010" opacity="0.75"/>
      <g filter="url(#softglow)">
        <path d="M 0,0 Q 4,-50 0,-75" stroke="#16a34a" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 2,-18 Q -16,-25 -18,-38" stroke="#15803d" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M 2,-34 Q -14,-40 -15,-52" stroke="#22c55e" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <path d="M 1,-50 Q -10,-54 -10,-64" stroke="#4ade80" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M 2,-22 Q  18,-28  20,-40" stroke="#16a34a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M 2,-38 Q  15,-44  16,-55" stroke="#22c55e" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <ellipse cx="-17" cy="-38" rx="5" ry="2.5" fill="#4ade80" opacity="0.6" transform="rotate(-40,-17,-38)"/>
        <ellipse cx="19"  cy="-40" rx="5" ry="2.5" fill="#4ade80" opacity="0.6" transform="rotate(40,19,-40)"/>
        <ellipse cx="-9"  cy="-64" rx="4" ry="2"   fill="#86efac" opacity="0.7" transform="rotate(-30,-9,-64)"/>
        <path d="M 0,-75 Q 6,-82 4,-88" stroke="#4ade80" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      </g>`;
}

function orchidSVG() {
  return `<!-- PLANT:ORCHID -->
      <ellipse cx="0" cy="0" rx="14" ry="5" fill="#3a1020" opacity="0.8"/>
      <g filter="url(#glow)">
        <path d="M 0,0 Q 3,-55 0,-82" stroke="#a855f7" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path d="M 1,-45 Q -20,-58 -22,-74" stroke="#9333ea" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M 1,-48 Q  18,-62  20,-78" stroke="#a855f7" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <g transform="translate(0,-92)">
          <ellipse cx="0" cy="-10" rx="5.5" ry="12" fill="#e879f9" opacity="0.85" transform="rotate(-18)"/>
          <ellipse cx="0" cy="-10" rx="5.5" ry="12" fill="#f0abfc" opacity="0.85" transform="rotate(18)"/>
          <ellipse cx="0" cy="-10" rx="5.5" ry="11" fill="#e879f9" opacity="0.85" transform="rotate(90)"/>
          <ellipse cx="0" cy="-10" rx="5.5" ry="11" fill="#f0abfc" opacity="0.85" transform="rotate(-90)"/>
          <ellipse cx="0" cy="-10" rx="5"   ry="12" fill="#d946ef" opacity="0.9"  transform="rotate(0)"/>
          <ellipse cx="0" cy="0"   rx="4"   ry="5"  fill="#fbbf24" opacity="0.9"/>
          <ellipse cx="0" cy="1"   rx="2"   ry="3"  fill="#f59e0b" opacity="0.95"/>
        </g>
        <g transform="translate(-22,-78) rotate(-15)">
          <ellipse cx="0" cy="-8" rx="4.5" ry="10" fill="#c026d3" opacity="0.8"  transform="rotate(-20)"/>
          <ellipse cx="0" cy="-8" rx="4.5" ry="10" fill="#d946ef" opacity="0.8"  transform="rotate(20)"/>
          <ellipse cx="0" cy="-8" rx="4.5" ry="9.5" fill="#c026d3" opacity="0.8" transform="rotate(90)"/>
          <ellipse cx="0" cy="-8" rx="4.5" ry="9.5" fill="#d946ef" opacity="0.8" transform="rotate(-90)"/>
          <ellipse cx="0" cy="-8" rx="4"   ry="10"  fill="#a21caf" opacity="0.85" transform="rotate(0)"/>
          <ellipse cx="0" cy="0"  rx="3"   ry="4"   fill="#fcd34d" opacity="0.9"/>
        </g>
        <g transform="translate(20,-82) rotate(12)">
          <ellipse cx="0" cy="-8" rx="4.5" ry="10"  fill="#e879f9" opacity="0.75" transform="rotate(-20)"/>
          <ellipse cx="0" cy="-8" rx="4.5" ry="10"  fill="#c026d3" opacity="0.75" transform="rotate(20)"/>
          <ellipse cx="0" cy="-8" rx="4.5" ry="9.5" fill="#e879f9" opacity="0.75" transform="rotate(90)"/>
          <ellipse cx="0" cy="-8" rx="4.5" ry="9.5" fill="#c026d3" opacity="0.75" transform="rotate(-90)"/>
          <ellipse cx="0" cy="-8" rx="4"   ry="10"  fill="#d946ef" opacity="0.8"  transform="rotate(0)"/>
          <ellipse cx="0" cy="0"  rx="3"   ry="4"   fill="#fde68a" opacity="0.9"/>
        </g>
        <circle cx="-30" cy="-100" r="2"   fill="#f0abfc" opacity="0.6"/>
        <circle cx=" 28" cy="-108" r="1.5" fill="#e879f9" opacity="0.5"/>
        <circle cx="-12" cy="-115" r="1.8" fill="#d946ef" opacity="0.7"/>
        <circle cx=" 14" cy="-118" r="1.2" fill="#a855f7" opacity="0.5"/>
      </g>`;
}

function buildPlantSVG(type) {
  switch (type) {
    case "SPROUT": return sproutSVG();
    case "FERN":   return fernSVG();
    case "ORCHID": return orchidSVG();
    default:       return emptySVG();
  }
}

function groupByWeek(days) {
  const weeks = [[], [], [], []];
  for (const day of days) {
    const ageInDays = Math.floor((Date.now() - new Date(day.date).getTime()) / 86_400_000);
    const weekIndex = Math.min(Math.floor(ageInDays / 7), 3);
    weeks[weekIndex].push(day);
  }
  return weeks.map((w) => ({ days: w, total: w.reduce((s, d) => s + d.contributionCount, 0) }));
}

function slotCounts(days) {
  const recent = days.slice(0, 20);
  return [0, 1, 2, 3, 4].map((i) => {
    const chunk = recent.slice(i * 4, i * 4 + 4);
    return chunk.reduce((s, d) => s + d.contributionCount, 0);
  });
}

function isDrought(days) {
  const last4 = days.slice(0, 4);
  return last4.length === 4 && last4.every((d) => d.contributionCount === 0);
}

function patchSlot(svg, slotNum, plantSVG) {
  const open = `<g id="slot-${slotNum}"`;
  const start = svg.indexOf(open);
  if (start === -1) throw new Error(`Slot ${slotNum} not found in SVG`);
  const innerStart = svg.indexOf(">", start) + 1;
  let depth = 1, cursor = innerStart;
  while (depth > 0 && cursor < svg.length) {
    const nextOpen  = svg.indexOf("<g",   cursor);
    const nextClose = svg.indexOf("</g>", cursor);
    if (nextClose === -1) throw new Error(`Unmatched <g> in slot ${slotNum}`);
    if (nextOpen !== -1 && nextOpen < nextClose) { depth++; cursor = nextOpen + 2; }
    else {
      depth--;
      if (depth === 0) return svg.slice(0, innerStart) + "\n      " + plantSVG + "\n    " + svg.slice(nextClose);
      cursor = nextClose + 4;
    }
  }
  throw new Error(`Could not patch slot ${slotNum}`);
}

function patchWeather(svg, showWeather) {
  const display = showWeather ? 'display="inline"' : 'display="none"';
  return svg.replace(/(<g id="weather")[^>]*(>)/, `$1 ${display}$2`);
}

function patchStats(svg, weeks) {
  let out = svg;
  weeks.forEach((w, i) => {
    const id  = `stat-w${i + 1}`;
    const bar = "█".repeat(Math.min(Math.round(w.total / 3), 10));
    const label = `W${i + 1}  ${String(w.total).padStart(3)}  ${bar}`;
    out = out.replace(new RegExp(`(<text id="${id}"[^>]*>)[^<]*(</text>)`), `$1${label}$2`);
  });
  return out;
}

function patchTimestamp(svg) {
  const ts = new Date().toUTCString().replace(/:\d{2} GMT$/, " UTC");
  return svg.replace(
    /(<text id="last-updated"[^>]*>)[^<]*(<\/text>)/,
    `$1last updated: ${ts}$2`
  );
}

async function main() {
  console.log(`🌿  Digital Terrarium generator`);
  console.log(`    User : ${USERNAME}`);
  console.log(`    SVG  : ${SVG_PATH}\n`);

  console.log("⏳  Fetching contribution data from GitHub GraphQL API…");
  const days = await fetchContributions();
  console.log(`✅  Got ${days.length} days of data\n`);

  const weeks   = groupByWeek(days);
  const counts  = slotCounts(days);
  const drought = isDrought(days);

  console.log("📊  Weekly totals (W1 = most recent):");
  weeks.forEach((w, i) => console.log(`    W${i + 1}: ${w.total} commits`));
  console.log(`\n🌱  Slot plant types:`);
  counts.forEach((c, i) => console.log(`    Slot ${i + 1}: ${c} commits → ${plantType(c)}`));
  console.log(`\n☁️   Drought detected: ${drought}`);

  let svg = readFileSync(SVG_PATH, "utf8");

  for (let i = 0; i < 5; i++) {
    const type = plantType(counts[i]);
    svg = patchSlot(svg, i + 1, buildPlantSVG(type));
    console.log(`    ✏️  Slot ${i + 1} → ${type}`);
  }

  svg = patchWeather(svg, drought);
  svg = patchStats(svg, weeks);
  svg = patchTimestamp(svg);

  writeFileSync(SVG_PATH, svg, "utf8");
  console.log(`\n✅  terrarium.svg updated successfully.`);
}

main().catch((err) => {
  console.error("❌  Fatal error:", err.message ?? err);
  process.exit(1);
});
