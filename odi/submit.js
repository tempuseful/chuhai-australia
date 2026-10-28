// 自查报告页的“提交给顾问”表单：把联系方式和当前可见题目的答案发到 /api/odi-submit
(function () {
  const box = document.createElement('section');
  box.id = 'odi-submit';
  box.className = 'submit-box hide';
  box.innerHTML = `
    <h3>提交自查结果，获取顾问一对一解读</h3>
    <p class="muted">答案默认只保存在你的浏览器里。填写联系方式并提交后，本页当前的答题内容会发送给我们，顾问会在 1–2 个工作日内联系你。</p>
    <div class="submit-grid">
      <label><span>联系人 <b>*</b></span><input type="text" id="sf-name" maxlength="60" autocomplete="name"></label>
      <label>公司名称<input type="text" id="sf-company" maxlength="120" autocomplete="organization"></label>
      <label><span>手机 <b>*</b></span><input type="text" id="sf-phone" maxlength="40" autocomplete="tel" inputmode="tel"></label>
      <label><span>微信 <b>*</b></span><input type="text" id="sf-wechat" maxlength="60"></label>
      <p class="sf-tip full">手机和微信至少填写一项</p>
      <label>邮箱（选填）<input type="text" id="sf-email" maxlength="120" autocomplete="email" inputmode="email"></label>
      <label class="full">想咨询的问题（选填）<textarea id="sf-note" rows="3" maxlength="2000"></textarea></label>
      <input type="text" id="sf-website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
    </div>
    <label class="consent"><input type="checkbox" id="sf-consent"> 我同意将以上联系方式和本次自查答案提交给本站运营团队，仅用于联系我提供咨询服务。</label>
    <div class="buttons"><button class="primary" id="sf-send" type="button">提交给顾问</button></div>
    <p id="sf-msg" class="muted" role="status"></p>`;
  const content = document.getElementById('content');
  content.parentNode.insertBefore(box, document.getElementById('actions'));

  const $v = (id) => document.getElementById(id).value.trim();
  const msg = (t, bad) => { const m = document.getElementById('sf-msg'); m.textContent = t; m.style.color = bad ? '#b4321f' : ''; };

  // 只在“自查报告”页显示
  const origRender = window.render;
  window.render = function () {
    const r = origRender.apply(this, arguments);
    try { box.classList.toggle('hide', mode !== 'report'); } catch (e) {}
    return r;
  };
  try { box.classList.toggle('hide', mode !== 'report'); } catch (e) {}

  const ERR = {
    name_required: '请填写联系人。',
    contact_required: '手机和微信至少填写一项。',
    consent_required: '请勾选同意后再提交。',
    rate_limited: '提交太频繁，请稍后再试。',
    storage_not_configured: '提交功能尚未开通，请先点击“导出答案 JSON”保存答案，稍后再试。',
    too_large: '内容过多，请删减后再试。',
  };

  document.getElementById('sf-send').onclick = async function () {
    const contact = { name: $v('sf-name'), company: $v('sf-company'), phone: $v('sf-phone'), wechat: $v('sf-wechat'), email: $v('sf-email'), note: $v('sf-note') };
    if (!contact.name) return msg(ERR.name_required, true);
    if (!contact.phone && !contact.wechat) return msg(ERR.contact_required, true);
    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return msg('邮箱格式不正确。', true);
    if (!document.getElementById('sf-consent').checked) return msg(ERR.consent_required, true);

    let items = [];
    try { items = reviewItems(); } catch (e) {}
    const qa = items.filter((x) => x.answered).map((x) => ({ id: x.id, number: x.number, module: x.module, question: x.title, answer: asText(x.answer) }));
    if (!qa.length) return msg('还没有作答，请先完成部分题目再提交。', true);
    const reportText = [
      '投资方式：' + (typeof investmentType === 'function' ? (investmentType() || '未选择') : ''),
      '适用题目 ' + items.length + '，已答 ' + qa.length + '，待答 ' + (items.length - qa.length),
      '',
      ...qa.map((x) => `【${x.module}】${x.number} ${x.question}\n  答：${x.answer}`),
    ].join('\n');

    const btn = this; btn.disabled = true; msg('正在提交…');
    try {
      const res = await fetch('/api/odi-submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contact, consent: true, website: $v('sf-website'), qa, reportText, answers, mode: lastAssessmentMode, page: location.pathname }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) { msg('已提交，谢谢！顾问会尽快与你联系。'); btn.textContent = '已提交'; return; }
      msg(ERR[d.error] || '提交失败，请稍后再试，或点击“导出答案 JSON”保存后发给我们。', true);
    } catch (e) {
      msg('网络异常，提交失败，请稍后再试。', true);
    }
    btn.disabled = false;
  };
})();
