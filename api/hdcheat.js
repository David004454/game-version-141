export const config = { runtime: "edge" };

const TARGET_BASE = (process.env.TARGET_DOMAIN || "").replace(/\/$/, "");

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
];

const REFERRERS = [
  "https://www.google.com/",
  "https://www.bing.com/",
  "https://duckduckgo.com/",
  "",
];

let counter = 0;

export default async function handler(req) {
  if (!TARGET_BASE) {
    return new Response("Error: TARGET_DOMAIN not set", { status: 500 });
  }

  counter++;
  const stealthMode = counter % 50 === 0;
  const useMobile = counter % 30 === 0;

  try {
    const pathStart = req.url.indexOf("/", 8);
    const targetUrl = pathStart === -1 ? TARGET_BASE + "/" : TARGET_BASE + req.url.slice(pathStart);

    const headers = new Headers();
    
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    headers.set("User-Agent", ua);
    headers.set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
    headers.set("Accept-Language", "en-US,en;q=0.9");
    headers.set("Accept-Encoding", "gzip, deflate, br");
    headers.set("Connection", "keep-alive");
    
    if (stealthMode) {
      headers.set("Sec-Ch-Ua", '"Not_A Brand";v="8", "Chromium";v="120"');
      headers.set("Sec-Ch-Ua-Mobile", useMobile ? "?1" : "?0");
      headers.set("Sec-Ch-Ua-Platform", useMobile ? '"iOS"' : '"Windows"');
      headers.set("Sec-Fetch-Dest", "document");
      headers.set("Sec-Fetch-Mode", "navigate");
      headers.set("Sec-Fetch-Site", "cross-site");
    }
    
    const referer = REFERRERS[Math.floor(Math.random() * REFERRERS.length)];
    if (referer) headers.set("Referer", referer);
    
    if (Math.random() < 0.3) {
      headers.set("X-Forwarded-For", `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`);
    }
    
    for (const [k] of req.headers) {
      if (k.toLowerCase().startsWith("x-vercel")) continue;
    }
    
    let method = req.method;
    let hasBody = method !== "GET" && method !== "HEAD";
    
    if (method === "GET" && Math.random() < 0.1) {
      method = "HEAD";
      hasBody = false;
    }
    
    const fetchOptions = {
      method,
      headers,
      redirect: "manual",
      cache: "no-store",
    };
    
    if (hasBody && req.body) {
      fetchOptions.body = req.body;
      fetchOptions.duplex = "half";
    }
    
    const response = await fetch(targetUrl, fetchOptions);
    
    const resHeaders = new Headers();
    resHeaders.set("content-type", response.headers.get("content-type") || "text/plain");
    resHeaders.set("cache-control", "no-cache, no-store");
    
    return new Response(response.body, {
      status: response.status,
      headers: resHeaders,
    });
    
  } catch (err) {
    return new Response("Bad Gateway", { status: 502 });
  }
}