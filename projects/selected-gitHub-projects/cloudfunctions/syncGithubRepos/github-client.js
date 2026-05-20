const https = require("https");

function requestJson(pathname, token) {
  const options = {
    hostname: "api.github.com",
    path: pathname,
    method: "GET",
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "wechat-miniprogram-codex-sync"
    }
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let body = "";

      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        const statusCode = response.statusCode || 500;

        if (statusCode < 200 || statusCode >= 300) {
          reject(
            new Error(`GitHub API request failed (${statusCode}): ${body || pathname}`)
          );
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`Failed to parse GitHub API response: ${error.message}`));
        }
      });
    });

    request.on("error", reject);
    request.end();
  });
}

async function searchRepositories({ token, query, perPage }) {
  const encodedQuery = encodeURIComponent(query);
  const pathname = `/search/repositories?q=${encodedQuery}&sort=stars&order=desc&per_page=${perPage}`;
  const result = await requestJson(pathname, token);
  return Array.isArray(result.items) ? result.items : [];
}

module.exports = {
  searchRepositories
};
