const fs = require("fs");
const path = require("path");
const https = require("https");

const PERIODS = ["daily", "weekly", "monthly"];
const DEFAULT_MAX_REPOS = 20;
const OUTPUT_PATH = path.resolve(__dirname, "..", "data", "trending-feed.json");

function request(urlString, options = {}) {
  return new Promise((resolve, reject) => {
    const requestInstance = https.get(
      urlString,
      {
        headers: Object.assign(
          {
            "User-Agent": "wechat-miniprogram-codex-trending-feed"
          },
          options.headers || {}
        )
      },
      (response) => {
        let body = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          const statusCode = response.statusCode || 500;

          if (statusCode < 200 || statusCode >= 300) {
            reject(new Error(`Request failed (${statusCode}): ${urlString}`));
            return;
          }

          resolve(body);
        });
      }
    );

    requestInstance.on("error", reject);
    requestInstance.setTimeout(options.timeoutMs || 15000, () => {
      requestInstance.destroy(new Error(`Request timed out: ${urlString}`));
    });
  });
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(value) {
  return decodeHtml(String(value || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function parseCompactNumber(value) {
  return Number(String(value || "").replace(/,/g, "").trim()) || 0;
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseTrendingArticles(html, since, maxRepos) {
  const articles = String(html || "").match(/<article[\s\S]*?<\/article>/g) || [];

  return articles.slice(0, maxRepos).map((article, index) => {
    const fullNameMatch = article.match(/<h2[\s\S]*?<a[^>]+href="\/([^"]+)"/i);
    const fullName = fullNameMatch ? stripHtml(fullNameMatch[1]) : "";
    const escapedFullName = escapeRegExp(fullName);
    const descriptionMatch = article.match(/<p[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    const languageMatch = article.match(/itemprop="programmingLanguage">([^<]+)</i);
    const starsMatch = article.match(
      new RegExp(`href="/${escapedFullName}/stargazers"[\\s\\S]*?<\\/svg>\\s*([0-9,]+)<`, "i")
    );
    const forksMatch = article.match(
      new RegExp(`href="/${escapedFullName}/forks"[\\s\\S]*?<\\/svg>\\s*([0-9,]+)<`, "i")
    );
    const growthMatch = article.match(/([0-9,]+)\s+stars\s+(today|this week|this month)/i);
    const owner = fullName.split("/")[0] || "";
    const name = fullName.split("/")[1] || "";

    return {
      fullName,
      owner,
      name,
      description: descriptionMatch ? stripHtml(descriptionMatch[1]) : "",
      language: languageMatch ? stripHtml(languageMatch[1]) : "",
      topics: [],
      stars: parseCompactNumber(starsMatch && starsMatch[1]),
      forks: parseCompactNumber(forksMatch && forksMatch[1]),
      openIssues: 0,
      githubUrl: fullName ? `https://github.com/${fullName}` : "",
      pushedAt: "",
      createdAt: "",
      rank: index + 1,
      rankType: since,
      starGrowth: parseCompactNumber(growthMatch && growthMatch[1])
    };
  }).filter((item) => item.fullName);
}

async function fetchTrendingPeriod(period, maxRepos) {
  const html = await request(`https://github.com/trending?since=${encodeURIComponent(period)}`, {
    timeoutMs: 15000
  });
  return parseTrendingArticles(html, period, maxRepos);
}

async function main() {
  const maxRepos = Math.min(Math.max(Number(process.env.MAX_TRENDING_REPOS) || DEFAULT_MAX_REPOS, 1), 25);
  const capturedAt = new Date().toISOString();
  const periods = {};

  for (const period of PERIODS) {
    periods[period] = await fetchTrendingPeriod(period, maxRepos);
  }

  const payload = {
    source: "github-trending-actions",
    capturedAt,
    periods
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  process.stdout.write(`Wrote ${OUTPUT_PATH}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
