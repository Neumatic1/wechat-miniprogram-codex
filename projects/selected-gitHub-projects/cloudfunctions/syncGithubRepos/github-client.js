const https = require("https");
const { URL } = require("url");

function request(pathname, token, options = {}) {
  const requestOptions = {
    hostname: options.hostname || "api.github.com",
    path: pathname,
    method: "GET",
    headers: Object.assign(
      {
        Accept: options.accept || "application/vnd.github+json",
        "User-Agent": "wechat-miniprogram-codex-sync"
      },
      options.headers || {}
    )
  };

  if (token) {
    requestOptions.headers.Authorization = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    const requestInstance = https.request(requestOptions, (response) => {
      let body = "";

      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        const statusCode = response.statusCode || 500;

        if (statusCode < 200 || statusCode >= 300) {
          reject(
            new Error(`GitHub request failed (${statusCode}): ${body || pathname}`)
          );
          return;
        }

        resolve(body);
      });
    });

    requestInstance.on("error", reject);
    requestInstance.setTimeout(options.timeoutMs || 15000, () => {
      requestInstance.destroy(new Error(`GitHub request timed out: ${pathname}`));
    });
    requestInstance.end();
  });
}

function requestAbsoluteUrl(urlString, options = {}) {
  const parsedUrl = new URL(urlString);

  return request(
    `${parsedUrl.pathname}${parsedUrl.search || ""}`,
    "",
    {
      hostname: parsedUrl.hostname,
      accept: options.accept,
      headers: options.headers,
      timeoutMs: options.timeoutMs
    }
  );
}

async function requestJson(pathname, token, options) {
  const body = await request(pathname, token, options);

  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(`Failed to parse GitHub API response: ${error.message}`);
  }
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
      repoId: "",
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
      updatedAt: "",
      lastSyncedAt: "",
      rank: index + 1,
      rankType: since,
      starGrowth: parseCompactNumber(growthMatch && growthMatch[1]),
      trendingSince: since
    };
  }).filter((item) => item.fullName);
}

async function fetchTrendingRepositories({ since, maxRepos }) {
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const html = await request(`/trending?since=${encodeURIComponent(since)}`, "", {
        hostname: "github.com",
        accept: "text/html",
        timeoutMs: 8000
      });

      return parseTrendingArticles(html, since, maxRepos);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`Failed to fetch trending repositories: ${since}`);
}

async function getRepositoryByFullName({ token, fullName }) {
  const encodedFullName = fullName
    .split("/")
    .map((item) => encodeURIComponent(item))
    .join("/");
  return requestJson(`/repos/${encodedFullName}`, token, { timeoutMs: 10000 });
}

async function fetchTrendingFeed({ feedUrl }) {
  const body = await requestAbsoluteUrl(feedUrl, {
    accept: "application/json",
    timeoutMs: 10000
  });

  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(`Failed to parse trending feed JSON: ${error.message}`);
  }
}

module.exports = {
  fetchTrendingFeed,
  fetchTrendingRepositories,
  getRepositoryByFullName
};
