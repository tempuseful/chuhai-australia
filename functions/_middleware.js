// 按访客地区过滤各国动态：中国大陆 IP 只拿到 cn 为 true 的条目，其他地区拿到全部。
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  if (request.method !== "GET" || !url.pathname.endsWith("/news.json")) return next();
  const asset = await next();
  if (!asset.ok) return asset;
  const country = (request.cf && request.cf.country) || "";
  const mainland = country === "CN";
  let body = await asset.text();
  if (mainland) {
    try {
      const data = JSON.parse(body);
      data.items = (data.items || []).filter((i) => i.cn === true);
      body = JSON.stringify(data);
    } catch (e) { /* 文件异常时原样返回 */ }
  }
  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-feed-region": mainland ? "mainland" : "global",
      "x-visitor-country": country || "unknown",
    },
  });
}
