import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import notifier from "node-notifier";
import "dotenv/config";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are a senior market research analyst and growth strategist.
You have been hired to conduct live market research for SharpenIt (sharpenit.com.au),
an Australian postal knife sharpening service. ABN: 19 245 621 227.
Service: $15/knife flat rate, Australia-wide, prepaid satchel model.
Pre-launch status — taking orders now.
Always search the web before writing. Cite sources with URLs.
Be specific, tactical, and grounded in real data. Australian market focus.`;

const modules = [
  {
    name: "Competitor Analysis",
    prompt: `Search the web RIGHT NOW and find every knife sharpening service currently
operating in Australia in 2026. Find:
1. All postal/mail-in knife sharpening services in Australia — names, URLs, pricing
2. Local knife sharpening services with strong online presence in NSW, VIC, QLD
3. International services shipping to Australia
4. DIY sharpening products dominating Australian retail (Bunnings, Amazon AU, etc)
5. Any businesses that have launched or closed in the past 12 months
6. Pricing across the full market

Deliver a full competitive analysis for SharpenIt including a comparison table,
market gaps, and specific positioning recommendations. Cite all sources with URLs.`,
  },
  {
    name: "Target Audience",
    prompt: `Search the web for current Australian consumer data (2025-2026) to define
SharpenIt's target audience. Find:
1. Australian home cooking trends and statistics
2. Premium kitchen knife ownership and sales data in Australia
3. Australian restaurant and hospitality industry size — current count and revenue
4. Hunting licence and participation data in Australia by state
5. Australian e-commerce postal service adoption rates

Build 4 detailed personas with demographics, psychographics, triggers, and
objections. Ground every claim in data found. Cite all sources.`,
  },
  {
    name: "Marketing Channels & Budget",
    prompt: `Search the web for Australian digital marketing benchmarks RIGHT NOW (2025-2026):
1. Meta ads CPM and CPC benchmarks for home/kitchen in Australia
2. Google Ads search volume for: "knife sharpening", "knife sharpening service australia",
   "knife sharpening sydney", "knife sharpening melbourne" — current data
3. Fastest growing social platforms in Australia right now
4. Australian food and cooking influencer landscape — top accounts, engagement rates
5. SEO competition level for knife sharpening terms in Australia

Recommend a specific channel mix for a $500/month launch budget with exact
allocations per channel. Cite all benchmark sources with URLs.`,
  },
  {
    name: "90-Day Launch Plan",
    prompt: `Search the web for:
1. Australian food and hospitality media — publications, journalists, editors to target for PR
2. Upcoming Australian food, hospitality, or outdoor/hunting trade events in 2026
3. Successful Australian DTC service launch case studies from 2024-2026
4. Current best practices for prepaid postal service launches
5. Australian small business grant or support programs available in 2026

Build a tactical week-by-week 90-day launch plan for SharpenIt.
Include real media contact targets, real events, specific actions per week.
Milestones, success metrics, and contingencies. Cite all sources.`,
  },
  {
    name: "Campaign Strategy",
    prompt: `Search the web for:
1. Top performing food and kitchen content on Australian Instagram and TikTok right now
2. Australian food bloggers and cooking influencers — find real accounts with
   follower counts and engagement rates
3. Australian hunting and outdoors content creators — real accounts
4. Recent successful Australian DTC brand campaigns — what worked
5. Current viral content formats in Australian food/cooking space 2025-2026

Build a complete campaign strategy: brand voice, 3 campaign concepts,
content pillars, 4-week social calendar (platform by platform),
email sequence (5 emails), influencer hit list with real account handles,
seasonal calendar, and 3 distinct ad creative concepts. Cite all sources.`,
  },
  {
    name: "KPIs & Financial Model",
    prompt: `Search the web for:
1. Australian e-commerce conversion rate benchmarks 2025-2026
2. Customer acquisition cost benchmarks for Australian service businesses
3. Email marketing performance benchmarks in Australia
4. Repeat purchase rate data for Australian service businesses
5. Postal/subscription service unit economics examples

Build a complete KPI framework and 12-month financial model for SharpenIt:
- Year 1 target: 2,300 customers, avg 4 knives = $138k sharpening + $44k e-com
- Unit economics dashboard
- CAC targets by channel
- LTV model with repeat frequency assumptions
- Monthly revenue milestones
- Weekly operational KPIs
- Warning signals and pivot triggers
Cite all benchmark sources.`,
  },
];

function printBanner() {
  console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551   SharpenIt Live Research Agent v1.0     \u2551
\u2551   sharpenit.com.au \u00b7 ABN 19 245 621 227  \u2551
\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d
`);
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

async function runModule(index, mod) {
  const label = `[${index + 1}/${modules.length}]`;
  console.log(`${label} \uD83D\uDD0D ${mod.name}`);

  let fullText = "";

  const stream = anthropic.messages.stream({
    model: "claude-opus-4-5",
    max_tokens: 4000,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
      },
    ],
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: mod.prompt }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_start") {
      if (event.content_block.type === "tool_use") {
        process.stdout.write(
          "\n\uD83C\uDF10 Searching: " +
            (event.content_block.input?.query || "...") +
            "\n"
        );
      }
    }
    if (event.type === "content_block_delta") {
      if (event.delta.type === "text_delta") {
        process.stdout.write(event.delta.text);
        fullText += event.delta.text;
      }
      if (
        event.delta.type === "input_json_delta" &&
        event.delta.partial_json
      ) {
        // Tool input streaming — search query may appear here
      }
    }
  }

  const words = countWords(fullText);
  console.log(`\n\u2705 ${mod.name} complete (${words.toLocaleString()} words)\n`);
  return fullText;
}

function buildReport(results, timestamp) {
  const sections = modules.map(
    (mod, i) => `## ${i + 1}. ${mod.name}\n\n${results[i]}`
  );

  // Build executive summary from first few lines of each section
  const summaryParts = results.map((r) => {
    const lines = r.split("\n").filter(Boolean);
    return lines.slice(0, 2).join(" ");
  });

  return `# SharpenIt \u2014 Market Research & Launch Plan
**Generated:** ${timestamp}
**Domain:** sharpenit.com.au
**ABN:** 19 245 621 227

---

## Executive Summary

This report presents comprehensive market research and a tactical launch plan for SharpenIt, an Australian postal knife sharpening service. The research covers the competitive landscape, target audience analysis, marketing channel recommendations, a 90-day launch plan, campaign strategy, and financial projections.

Key findings and recommended immediate actions are detailed across six research modules below, each grounded in live web research with cited sources.

SharpenIt is positioned to capture an underserved segment of the Australian market with its flat-rate postal model and nationwide coverage.

---

${sections.join("\n\n---\n\n")}

---

*Research conducted with live web search via Anthropic API*
*SharpenIt \u00b7 sharpenit.com.au \u00b7 ABN 19 245 621 227*
`;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "Error: ANTHROPIC_API_KEY not set. Copy .env.example to .env and add your key."
    );
    process.exit(1);
  }

  printBanner();

  const results = [];

  for (let i = 0; i < modules.length; i++) {
    const result = await runModule(i, modules[i]);
    results.push(result);
  }

  console.log("\n\u2705 All research complete.");

  const now = new Date();
  const timestamp = now.toISOString().split("T")[0];
  const filename = `sharpenit-launch-plan-${timestamp}.md`;

  const report = buildReport(results, now.toISOString());
  fs.writeFileSync(filename, report, "utf-8");
  console.log(`\uD83D\uDCC4 Report saved: ${filename}`);

  notifier.notify({
    title: "SharpenIt Research Agent",
    message: "SharpenIt Research Complete",
    sound: true,
  });
  console.log("\uD83D\uDD14 Desktop notification sent.");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
