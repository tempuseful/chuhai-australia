// ODI 自查提交：保存到 Cloudflare KV（绑定名 ODI_KV）。
// 需要在 Cloudflare Pages 项目 Settings → Bindings 里添加 KV 绑定：变量名 ODI_KV。
const MAX_BYTES = 400 * 1024;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const clip = (v, n) => String(v ?? "").trim().slice(0, n);

export async function onRequestPost({ request, env }) {
  if (!env.ODI_KV) return json({ ok: false, error: "storage_not_configured" }, 503);

  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_BYTES) return json({ ok: false, error: "too_large" }, 413);
  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ ok: false, error: "too_large" }, 413);

  let data;
  try { data = JSON.parse(text); } catch { return json({ ok: false, error: "bad_json" }, 400); }

  // 蜜罐字段：真人看不到，机器人会填
  if (data.website) return json({ ok: true, id: "ignored" });

  const c = data.contact || {};
  const contact = {
    name: clip(c.name, 60),
    company: clip(c.company, 120),
    phone: clip(c.phone, 40),
    wechat: clip(c.wechat, 60),
    email: clip(c.email, 120),
    note: clip(c.note, 2000),
  };
  if (!contact.name) return json({ ok: false, error: "name_required" }, 400);
  if (!contact.phone && !contact.wechat) return json({ ok: false, error: "contact_required" }, 400);
  if (data.consent !== true) return json({ ok: false, error: "consent_required" }, 400);

  // 简单限流：同一 IP 每小时最多 10 次
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rlKey = "rl:" + ip;
  const used = Number((await env.ODI_KV.get(rlKey)) || 0);
  if (used >= 10) return json({ ok: false, error: "rate_limited" }, 429);
  await env.ODI_KV.put(rlKey, String(used + 1), { expirationTtl: 3600 });

  const at = new Date().toISOString();
  const id = "sub:" + at + ":" + crypto.randomUUID().slice(0, 8);
  const qa = Array.isArray(data.qa) ? data.qa.slice(0, 300).map((x) => ({
    id: clip(x.id, 20), number: clip(x.number, 20), module: clip(x.module, 30),
    question: clip(x.question, 500), answer: clip(x.answer, 3000),
  })) : [];
  const record = {
    id, at, contact, qa,
    mode: clip(data.mode, 20),
    reportText: clip(data.reportText, 60000),
    answers: data.answers && typeof data.answers === "object" ? data.answers : {},
    meta: {
      country: (request.cf && request.cf.country) || "",
      city: (request.cf && request.cf.city) || "",
      ua: clip(request.headers.get("user-agent"), 300),
      page: clip(data.page, 200),
    },
  };
  await env.ODI_KV.put(id, JSON.stringify(record), {
    metadata: {
      at, name: contact.name, company: contact.company, phone: contact.phone,
      wechat: contact.wechat, email: contact.email, answered: qa.length, country: record.meta.country,
    },
  });
  return json({ ok: true, id });
}

export async function onRequest() {
  return json({ ok: false, error: "method_not_allowed" }, 405);
}
