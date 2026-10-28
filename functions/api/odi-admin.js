// ODI 提交记录查看接口。需要在 Cloudflare Pages 设置环境变量 ODI_ADMIN_KEY（至少 12 位的密码），
// 查看页 /odi/admin/ 用请求头 x-admin-key 传入。
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

function same(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function authed(request, env) {
  const key = env.ODI_ADMIN_KEY;
  if (!key || key.length < 12) return false;
  return same(request.headers.get("x-admin-key") || "", key);
}

export async function onRequestGet({ request, env }) {
  if (!env.ODI_KV) return json({ ok: false, error: "storage_not_configured" }, 503);
  if (!(await authed(request, env))) return json({ ok: false, error: "unauthorized" }, 401);
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const prefix = url.searchParams.get("type") === "lead" ? "lead:" : "sub:";
  if (id) {
    if (!id.startsWith("sub:") && !id.startsWith("lead:")) return json({ ok: false, error: "bad_id" }, 400);
    const rec = await env.ODI_KV.get(id, "json");
    return rec ? json({ ok: true, record: rec }) : json({ ok: false, error: "not_found" }, 404);
  }
  const items = [];
  let cursor;
  do {
    const page = await env.ODI_KV.list({ prefix, cursor, limit: 1000 });
    for (const k of page.keys) items.push({ id: k.name, ...(k.metadata || {}) });
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor && items.length < 5000);
  items.sort((a, b) => (a.id < b.id ? 1 : -1));
  return json({ ok: true, items });
}

export async function onRequestDelete({ request, env }) {
  if (!env.ODI_KV) return json({ ok: false, error: "storage_not_configured" }, 503);
  if (!(await authed(request, env))) return json({ ok: false, error: "unauthorized" }, 401);
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id.startsWith("sub:") && !id.startsWith("lead:")) return json({ ok: false, error: "bad_id" }, 400);
  await env.ODI_KV.delete(id);
  return json({ ok: true });
}
