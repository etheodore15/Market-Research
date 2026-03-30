# SharpenIt Live Research Agent

A Node.js CLI agent that runs live web-searched market research for [SharpenIt](https://sharpenit.com.au) and outputs a full launch plan as a formatted markdown report.

## What It Does

Runs 6 sequential research modules using Claude with web search enabled:

1. **Competitor Analysis** - Australian knife sharpening market landscape
2. **Target Audience** - Consumer data and detailed personas
3. **Marketing Channels** - Digital marketing benchmarks and budget allocation
4. **90-Day Launch Plan** - Week-by-week tactical plan
5. **Campaign Strategy** - Content, influencers, ads, and email sequences
6. **KPIs & Financial Model** - Unit economics and 12-month projections

Each module streams output to the terminal in real time. On completion, the full report is saved as a timestamped markdown file and a desktop notification is sent.

## Setup

```bash
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm start
```

## Requirements

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/) with access to `claude-opus-4-5`

## Output

The agent generates a file named `sharpenit-launch-plan-YYYY-MM-DD.md` in the project directory containing the full research report with cited sources.
