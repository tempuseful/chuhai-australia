// 地方外贸扶持政策库：读取 /policies/policies.json，按省份、城市、类型、关键词筛选
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TYPES = ['境外参展', '出口信用保险', '跨境电商', '海外仓', '品牌认证', '融资贴息', '物流运费', '外贸新业态', '综合措施'];
  const st = { prov: '', city: '', types: new Set(), q: '', valid: false };
  let all = [];
  const today = new Date().toISOString().slice(0, 10);
  const expired = (p) => p.validUntil && p.validUntil < today;

  function params() {
    const u = new URLSearchParams(location.search);
    st.prov = u.get('p') || ''; st.city = u.get('c') || ''; st.q = u.get('q') || '';
    (u.get('t') || '').split(',').filter(Boolean).forEach((t) => st.types.add(t));
  }
  function sync() {
    const u = new URLSearchParams();
    if (st.prov) u.set('p', st.prov); if (st.city) u.set('c', st.city);
    if (st.types.size) u.set('t', [...st.types].join(',')); if (st.q) u.set('q', st.q);
    history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
  }

  function fillProv() {
    const order = ['全国'];
    const provs = [...new Set(all.map((p) => p.province))].sort((a, b) => (order.indexOf(b) - order.indexOf(a)) || a.localeCompare(b, 'zh'));
    const n = (pv) => all.filter((p) => p.province === pv).length;
    $('pf-prov').innerHTML = '<option value="">全部省份</option>' + provs.map((pv) => `<option value="${esc(pv)}"${pv === st.prov ? ' selected' : ''}>${esc(pv)}（${n(pv)}）</option>`).join('');
    fillCity();
  }
  function fillCity() {
    const cities = [...new Set(all.filter((p) => p.province === st.prov && p.city).map((p) => p.city))].sort((a, b) => a.localeCompare(b, 'zh'));
    const sel = $('pf-city');
    sel.disabled = !st.prov || !cities.length;
    sel.innerHTML = '<option value="">' + (st.prov ? '省级及全部城市' : '先选省份') + '</option>' + cities.map((c) => `<option value="${esc(c)}"${c === st.city ? ' selected' : ''}>${esc(c)}</option>`).join('');
    if (st.city && !cities.includes(st.city)) st.city = '';
  }
  function fillTypes() {
    $('pf-types').innerHTML = TYPES.map((t) => `<button type="button" data-t="${t}" aria-pressed="${st.types.has(t)}">${t} <small>${all.filter((p) => (p.types || []).includes(t)).length}</small></button>`).join('');
  }

  function match(p) {
    if (st.prov && p.province !== st.prov) return false;
    if (st.city && p.city !== st.city && !String(p.city).startsWith(st.city)) return false;
    if (st.types.size && !(p.types || []).some((t) => st.types.has(t))) return false;
    if (st.valid && expired(p)) return false;
    if (st.q) {
      const hay = [p.province, p.city, p.title, p.issuer, p.docNo, (p.highlights || []).join(' '), p.eligibility, p.apply].join(' ').toLowerCase();
      if (!st.q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w))) return false;
    }
    return true;
  }

  function card(p) {
    const where = p.city ? p.city : p.province;
    const tag = expired(p) ? '<span class="pol-exp">已过有效期</span>' : '';
    return `<article class="pol">
  <div class="pol-top"><span class="pol-where">${esc(where)}</span><span class="pol-lv">${esc(p.level)}</span>${(p.types || []).map((t) => `<span class="pol-type">${esc(t)}</span>`).join('')}${tag}<time>${esc(p.date)}</time></div>
  <h3><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a></h3>
  ${(p.highlights || []).length ? `<ul class="pol-hl">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
  <dl class="pol-dl">${p.eligibility ? `<div><dt>谁能申报</dt><dd>${esc(p.eligibility)}</dd></div>` : ''}${p.apply ? `<div><dt>怎么申报</dt><dd>${esc(p.apply)}</dd></div>` : ''}</dl>
  <div class="pol-foot"><span>${esc(p.issuer)}${p.docNo ? ' · ' + esc(p.docNo) : ''}</span><span>${p.validUntil ? '有效期至 ' + esc(p.validUntil) : ''}</span><a href="${esc(p.url)}" target="_blank" rel="noopener">原文 · ${esc(p.source || '链接')} →</a></div>
</article>`;
  }

  function render() {
    const list = all.filter(match);
    $('pf-count').textContent = `${list.length} / ${all.length} 条`;
    $('pol-list').innerHTML = list.length ? list.map(card).join('') : '<p class="pol-empty">没有符合条件的政策，换个筛选条件试试。</p>';
    $('pf-types').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', st.types.has(b.dataset.t)));
    sync();
  }

  function bind() {
    $('pf-prov').onchange = (e) => { st.prov = e.target.value; st.city = ''; fillCity(); render(); };
    $('pf-city').onchange = (e) => { st.city = e.target.value; render(); };
    $('pf-types').onclick = (e) => { const b = e.target.closest('button[data-t]'); if (!b) return; const t = b.dataset.t; st.types.has(t) ? st.types.delete(t) : st.types.add(t); render(); };
    let tm; $('pf-q').value = st.q; $('pf-q').oninput = (e) => { clearTimeout(tm); tm = setTimeout(() => { st.q = e.target.value.trim(); render(); }, 180); };
    $('pf-valid').onchange = (e) => { st.valid = e.target.checked; render(); };
    $('pf-reset').onclick = () => { st.prov = st.city = st.q = ''; st.types.clear(); st.valid = false; $('pf-q').value = ''; $('pf-valid').checked = false; fillProv(); render(); };
  }

  params();
  fetch('/policies/policies.json', { cache: 'no-store' }).then((r) => r.json()).then((d) => {
    all = (d.items || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    $('pf-meta').textContent = `收录 ${all.length} 条 · 覆盖 ${new Set(all.map((p) => p.province)).size} 个省级地区 · 更新于 ${d.updated || ''}`;
    fillProv(); fillTypes(); bind(); render();
  }).catch(() => { $('pol-list').innerHTML = '<p class="pol-empty">政策数据加载失败，请刷新重试。</p>'; });
})();
