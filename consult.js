// 全站浮动“预约咨询”按钮和表单。提交到 /api/consult。
(function () {
  if (window.__consultLoaded) return;
  window.__consultLoaded = true;

  const COUNTRIES = {
    uae: '阿联酋', saudi: '沙特阿拉伯', qatar: '卡塔尔', kuwait: '科威特', oman: '阿曼', bahrain: '巴林',
    singapore: '新加坡', malaysia: '马来西亚', indonesia: '印度尼西亚', thailand: '泰国', vietnam: '越南',
    philippines: '菲律宾', cambodia: '柬埔寨', laos: '老挝', myanmar: '缅甸', brunei: '文莱',
    kazakhstan: '哈萨克斯坦', uzbekistan: '乌兹别克斯坦', kyrgyzstan: '吉尔吉斯斯坦', tajikistan: '塔吉克斯坦',
    turkmenistan: '土库曼斯坦', australia: '澳大利亚', usa: '美国',
  };
  const GROUPS = [
    ['海湾六国', ['阿联酋', '沙特阿拉伯', '卡塔尔', '科威特', '阿曼', '巴林']],
    ['东盟十国', ['新加坡', '马来西亚', '印度尼西亚', '泰国', '越南', '菲律宾', '柬埔寨', '老挝', '缅甸', '文莱']],
    ['中亚五国', ['哈萨克斯坦', '乌兹别克斯坦', '吉尔吉斯斯坦', '塔吉克斯坦', '土库曼斯坦']],
    ['其他', ['澳大利亚', '美国', '其他国家/地区', '还没确定']],
  ];
  const TOPICS = ['市场进入与公司设立', '税务筹划', '法律合规 / ODI 备案', '供应链与物流', '工程项目与投标', 'Business Development（商务拓展）', '其他'];
  const slug = (location.pathname.split('/')[1] || '').toLowerCase();
  const here = COUNTRIES[slug] || '';

  const css = `
.cz-btn{position:fixed;right:20px;bottom:22px;z-index:99990;display:flex;align-items:center;gap:8px;padding:12px 18px;border:0;border-radius:999px;background:#c2410c;color:#fff;font:600 15px/1 "PingFang SC","Microsoft YaHei",system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.28);cursor:pointer;letter-spacing:.04em}
.cz-btn:hover{background:#a8370a}
.cz-btn svg{width:18px;height:18px;flex:none}
.cz-back{position:fixed;inset:0;z-index:99995;background:rgba(8,12,20,.55);display:flex;align-items:flex-end;justify-content:flex-end;padding:20px}
.cz-back[hidden]{display:none}
.cz-card{color-scheme:light;width:420px;max-width:100%;max-height:calc(100vh - 40px);overflow:auto;background:#fff;color:#14202f;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.35);padding:20px 20px 16px;font:14px/1.55 "PingFang SC","Microsoft YaHei",system-ui,sans-serif}
.cz-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.cz-head h3{margin:0;font-size:18px;color:#14202f}
.cz-head p{margin:4px 0 0;color:#5b6879;font-size:12.5px}
.cz-x{border:0;background:none;font-size:24px;line-height:1;color:#7a8696;cursor:pointer;padding:0 4px}
.cz-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.cz-form label{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:600;color:#3a4a5e}
.cz-form label b{color:#c2410c}
.cz-form .full{grid-column:1/-1}
.cz-form input,.cz-form select,.cz-form textarea{width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid #cdd6e2;border-radius:8px;font:inherit;font-weight:400;color:#14202f;background:#fff}
.cz-form input:focus,.cz-form select:focus,.cz-form textarea:focus{outline:2px solid rgba(194,65,12,.35);border-color:#c2410c}
.cz-topics{display:flex;flex-wrap:wrap;gap:6px}
.cz-topics label{flex-direction:row;align-items:center;gap:5px;font-weight:400;padding:5px 9px;border:1px solid #d8dfe8;border-radius:999px;cursor:pointer;font-size:12.5px}
.cz-topics label:has(input:checked){border-color:#c2410c;background:#fff4ed;color:#9a3412}
.cz-topics input{width:auto;margin:0}
.cz-tip{margin:-4px 0 0;font-size:12px;color:#7a8696}
.cz-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.cz-consent{display:flex!important;flex-direction:row!important;gap:7px;align-items:flex-start;font-weight:400!important;color:#5b6879!important;font-size:12px!important;line-height:1.5}
.cz-consent input{width:auto;margin-top:3px}
.cz-send{grid-column:1/-1;padding:11px;border:0;border-radius:9px;background:#c2410c;color:#fff;font:600 15px/1 inherit;cursor:pointer}
.cz-send[disabled]{opacity:.6;cursor:default}
.cz-msg{grid-column:1/-1;margin:0;font-size:13px;color:#5b6879;min-height:1em}
.cz-msg.bad{color:#b4231b}
.cz-ok{text-align:center;padding:26px 6px 10px}
.cz-ok b{display:block;font-size:18px;margin-bottom:6px}
@media (max-width:560px){.cz-btn{right:14px;bottom:16px;padding:11px 15px;font-size:14px}.cz-back{padding:0;align-items:flex-end}.cz-card{width:100%;max-height:92vh;border-radius:14px 14px 0 0}.cz-form{grid-template-columns:1fr}}
@media print{.cz-btn,.cz-back{display:none!important}}`;
  const st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  const opt = (v) => `<option${v === here ? ' selected' : ''}>${v}</option>`;
  const btn = document.createElement('button');
  btn.className = 'cz-btn';
  btn.type = 'button';
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>预约咨询';

  const back = document.createElement('div');
  back.className = 'cz-back';
  back.hidden = true;
  back.innerHTML = `
  <div class="cz-card" role="dialog" aria-modal="true" aria-labelledby="cz-title">
    <div class="cz-head"><div><h3 id="cz-title">预约咨询</h3><p>留下联系方式，顾问会在 1–2 个工作日内与你联系。</p></div><button class="cz-x" type="button" aria-label="关闭">×</button></div>
    <form class="cz-form" novalidate>
      <label><span>称呼 <b>*</b></span><input name="uname" maxlength="60" autocomplete="name" placeholder="如：王先生"></label>
      <label><span>公司名称</span><input name="company" maxlength="120" autocomplete="organization"></label>
      <label><span>手机 <b>*</b></span><input name="phone" maxlength="40" autocomplete="tel" inputmode="tel"></label>
      <label><span>微信 <b>*</b></span><input name="wechat" maxlength="60"></label>
      <p class="cz-tip full">手机和微信至少填写一项</p>
      <label class="full"><span>邮箱（选填）</span><input name="email" maxlength="120" autocomplete="email" inputmode="email"></label>
      <label class="full"><span>目标国家/地区</span><select name="region"><option value="">请选择</option>${GROUPS.map(([g, l]) => `<optgroup label="${g}">${l.map(opt).join('')}</optgroup>`).join('')}</select></label>
      <div class="full"><div style="font-size:12.5px;font-weight:600;color:#3a4a5e;margin-bottom:6px">咨询方向</div><div class="cz-topics">${TOPICS.map((t) => `<label><input type="checkbox" name="topics" value="${t}">${t}</label>`).join('')}</div></div>
      <label class="full"><span>想咨询的问题（选填）</span><textarea name="note" rows="3" maxlength="2000"></textarea></label>
      <input name="website" class="cz-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label class="full cz-consent"><input type="checkbox" name="consent">我同意将以上信息提交给本站运营团队，仅用于联系我提供咨询服务。</label>
      <p class="cz-msg" role="status"></p>
      <button class="cz-send" type="submit">提交预约</button>
    </form>
  </div>`;

  document.body.appendChild(btn);
  document.body.appendChild(back);
  const form = back.querySelector('form');
  const msg = back.querySelector('.cz-msg');
  const say = (t, bad) => { msg.textContent = t; msg.classList.toggle('bad', !!bad); };

  const open = () => { back.hidden = false; btn.style.visibility = 'hidden'; setTimeout(() => form.querySelector('[name=uname]').focus(), 30); };
  const close = () => { back.hidden = true; btn.style.visibility = ''; btn.focus(); };
  btn.onclick = open;
  back.querySelector('.cz-x').onclick = close;
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !back.hidden) close(); });

  const ERR = {
    name_required: '请填写称呼。',
    contact_required: '手机和微信至少填写一项。',
    consent_required: '请勾选同意后再提交。',
    rate_limited: '提交太频繁，请稍后再试。',
    storage_not_configured: '预约功能暂未开通，请稍后再试。',
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const g = (n) => form.querySelector('[name=' + n + ']');
    const data = {
      name: g('uname').value.trim(), company: g('company').value.trim(), phone: g('phone').value.trim(),
      wechat: g('wechat').value.trim(), email: g('email').value.trim(), region: g('region').value,
      topics: [...form.querySelectorAll('input[name=topics]:checked')].map((x) => x.value),
      note: g('note').value.trim(), website: g('website').value, consent: g('consent').checked,
      page: location.pathname, pageTitle: document.title,
    };
    if (!data.name) return say(ERR.name_required, true);
    if (!data.phone && !data.wechat) return say(ERR.contact_required, true);
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return say('邮箱格式不正确。', true);
    if (!data.consent) return say(ERR.consent_required, true);
    const send = form.querySelector('.cz-send');
    send.disabled = true; say('正在提交…');
    try {
      const res = await fetch('/api/consult', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) {
        form.outerHTML = '<div class="cz-ok"><b>已收到你的预约</b>顾问会在 1–2 个工作日内与你联系。</div>';
        return;
      }
      say(ERR[d.error] || '提交失败，请稍后再试。', true);
    } catch (err) {
      say('网络异常，提交失败，请稍后再试。', true);
    }
    send.disabled = false;
  });
})();
