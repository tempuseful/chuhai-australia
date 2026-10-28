// 全站浮动“预约咨询”表单的提交接口。保存到 KV（绑定名 ODI_KV），键前缀 lead:
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
const clip = (v, n) => String(v ?? "").trim().slice(0, n);

export async function onRequestPost({ request, env }) {
  if (!env.ODI_KV) return json({ ok: false, error: "storage_not_configured" }, 503);
  const text = await request.text();
  if (text.length > 20000) return json({ ok: false, error: "too_large" }, 413);
  let d;
  try { d = JSON.parse(text); } catch { return json({ ok: false, error: "bad_json" }, 400); }
  if (d.website) return json({ ok: true, id: "ignored" }); // 蜜罐

  const lead = {
    name: clip(d.name, 60),
    company: clip(d.company, 120),
    phone: clip(d.phone, 40),
    wechat: clip(d.wechat, 60),
    email: clip(d.email, 120),
    region: clip(d.region, 60),
    topics: Array.isArray(d.topics) ? d.topics.slice(0, 10).map((t) => clip(t, 30)) : [],
    note: clip(d.note, 2000),
    page: clip(d.page, 300),
    pageTitle: clip(d.pageTitle, 200),
  };
  if (!lead.name) return json({ ok: false, error: "name_required" }, 400);
  if (!lead.phone && !lead.wechat && !lead.email) return json({ ok: false, error: "contact_required" }, 400);
  if (d.consent !== true) return json({ ok: false, error: "consent_required" }, 400);

  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rlKey = "rl:lead:" + ip;
  const used = Number((await env.ODI_KV.get(rlKey)) || 0);
  if (used >= 10) return json({ ok: false, error: "rate_limited" }, 429);
  await env.ODI_KV.put(rlKey, String(used + 1), { expirationTtl: 3600 });

  const at = new Date().toISOString();
  const id = "lead:" + at + ":" + crypto.randomUUID().slice(0, 8);
  const meta = {
    country: (request.cf && request.cf.country) || "",
    city: (request.cf && request.cf.city) || "",
    ua: clip(request.headers.get("user-agent"), 300),
  };
  await env.ODI_KV.put(id, JSON.stringify({ id, at, type: "lead", lead, meta }), {
    metadata: {
      at, name: lead.name, company: lead.company, phone: lead.phone, wechat: lead.wechat,
      email: lead.email, region: lead.region, topics: lead.topics.join("、"), country: meta.country,
    },
  });
  return json({ ok: true, id });
}

export async function onRequest() {
  return json({ ok: false, error: "method_not_allowed" }, 405);
}
