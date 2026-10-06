// Cloudflare Pages Function：按访客所在地区返回动态列表。
// 中国大陆访客只拿到 cn 为 true 的条目（国内可访问来源），其他地区拿到全部。
export async function onRequestGet({ request, env }) {
  const asset = await env.ASSETS.fetch(request);
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
