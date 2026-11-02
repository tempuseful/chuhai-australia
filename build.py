#!/usr/bin/env python3
"""把 content/ 里的各国内容套进统一外壳，生成 <slug>/index.html 和门户首页。
用法：python3 build.py   （改了 content/ 或 src/ 之后运行，再提交生成的文件）"""
import json, glob, os, html

R = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(R, p), encoding="utf-8").read()
CSS, JS, FEED = rd("src/style.css"), rd("src/app.js"), rd("src/feed.html")
FOOT = "本页为公开信息整理，不构成法律、税务或投资意见。门槛和税率每年调整，具体交易请以官方最新文本和专业顾问意见为准。"

SAILFIN_ICON = '<svg class="sf-ico" viewBox="20 14 22.5 27.5" aria-hidden="true"><path class="sf-g" d="M21.5 27.5H34L41.8 15H35C27 15 21.5 20 21.5 27.5Z"/><path class="sf-o" d="M28.8 29H41.3C41.3 36 35.8 41 28 41H20.7Z"/></svg>'
BRAND = ('<a class="sailfin" href="https://www.sailfinscm.com/" target="_blank" rel="noopener">'
         '<span class="sf-lab">供应链服务</span>' + SAILFIN_ICON +
         '<span class="sf-txt"><b>森帆跨境</b><i>SAILFIN</i></span></a>')

REGIONS = [
    ("gcc", "海湾六国", "GCC", ["阿联酋", "沙特阿拉伯", "卡塔尔", "科威特", "阿曼", "巴林"]),
    ("asean", "东盟十国", "ASEAN", ["新加坡", "马来西亚", "印度尼西亚", "泰国", "越南", "菲律宾", "柬埔寨", "老挝", "缅甸", "文莱"]),
    ("centralasia", "中亚五国", "CENTRAL ASIA", ["哈萨克斯坦", "乌兹别克斯坦", "吉尔吉斯斯坦", "塔吉克斯坦", "土库曼斯坦"]),
    ("oceania", "大洋洲", "OCEANIA", ["澳大利亚"]),
    ("americas", "美洲", "AMERICAS", ["美国"]),
]

FLAG = dict(zip("阿联酋 沙特阿拉伯 卡塔尔 科威特 阿曼 巴林 新加坡 马来西亚 印度尼西亚 泰国 越南 菲律宾 柬埔寨 老挝 缅甸 文莱 哈萨克斯坦 乌兹别克斯坦 吉尔吉斯斯坦 塔吉克斯坦 土库曼斯坦 澳大利亚 美国".split(),
                "ae sa qa kw om bh sg my id th vn ph kh la mm bn kz uz kg tj tm au us".split()))
flag = lambda n: f'<img class="flag" src="/flags/{FLAG[n]}.svg" alt="" width="28" height="21" loading="lazy">' if n in FLAG else ""

def page(title, desc, body, script=""):
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="stylesheet" href="/fonts/fonts.css">
<style>{CSS}</style>
</head>
<body>
{body}
<footer class="wrap">
  {BRAND}
  <p class="disc">{FOOT}</p>
</footer>
{script}
<script src="/consult.js" defer></script>
</body>
</html>
"""

metas = {}
for f in sorted(glob.glob(os.path.join(R, "content", "*.json"))):
    m = json.load(open(f, encoding="utf-8"))
    metas[m["name"]] = m
    nav = "".join(f'<a href="#{a}">{t}</a>' for a, t in m["nav"])
    body = f"""<header class="top"><div class="wrap">
  <div class="brand">{m["brand"]} <b>{m["code"]} DESK</b></div>
  <a class="back" href="/">全部国家</a>
  <nav class="nav" aria-label="栏目">{nav}</nav>
</div></header>
<div class="tape" aria-label="关键指标"><div class="tape-in" id="tape"></div></div>
<main class="wrap">
{rd("content/" + m["slug"] + ".html").replace("{{FEED}}", FEED)}
</main>"""
    js_meta = json.dumps({k: m[k] for k in ("slug", "tape", "bars", "sect", "feed")}, ensure_ascii=False)
    os.makedirs(os.path.join(R, m["slug"]), exist_ok=True)
    open(os.path.join(R, m["slug"], "index.html"), "w", encoding="utf-8").write(
        page(m["brand"], m["desc"], body, f"<script>\nconst META={js_meta};\n{JS}</script>"))

cmps = {}
for f in sorted(glob.glob(os.path.join(R, "compare", "*.json"))):
    c = json.load(open(f, encoding="utf-8"))
    cmps[c["region"]] = c
    th = "".join(f'<th><a href="/{s}/">{n}</a></th>' for n, s in c["cols"])
    rows = ""
    for g, rs in c["groups"]:
        rows += f'<tr class="grp"><td colspan="{len(c["cols"]) + 1}">{g}</td></tr>'
        rows += "".join("<tr><td>" + r[0] + "</td>" + "".join(f'<td class="num">{v}</td>' for v in r[1:]) + "</tr>" for r in rs)
    cbody = f"""<header class="top"><div class="wrap">
  <div class="brand">{c["title"]} <b>{c["code"]} DESK</b></div>
  <a class="back" href="/">全部国家</a>
  <nav class="nav" aria-label="国家">{"".join(f'<a href="/{s}/">{n}</a>' for n, s in c["cols"])}</nav>
</div></header>
<main class="wrap">
<div class="hero">
  <div class="kicker">{c["title"]} · 数据截至 {c.get("asof","2026-10-07")}</div>
  <h1>{c["h1"]}</h1>
  <p class="lead">{c["lead"]}</p>
</div>
<section>
  <div class="tblw"><table class="cmp"><thead><tr><th>指标</th>{th}</tr></thead><tbody>{rows}</tbody></table></div>
  <p class="note">{c["note"]}</p>
</section>
</main>"""
    os.makedirs(os.path.join(R, c["slug"]), exist_ok=True)
    open(os.path.join(R, c["slug"], "index.html"), "w", encoding="utf-8").write(page(c["title"], c["lead"], cbody))

# 地方外贸扶持政策库 /policies/：数据在 policies/policies.json（由 src/policies.js 在浏览器端加载和筛选）
POL_DESC = "各省市鼓励出口和境外参展的扶持政策：境外参展补贴、出口信用保险保费补贴、跨境电商和海外仓、品牌认证、融资贴息，按地区和类型筛选，附原文链接。"
pbody = f"""<header class="top"><div class="wrap">
  <div class="brand">地方外贸政策 <b>POLICY DESK</b></div>
  <a class="back" href="/">全部国家</a>
</div></header>
<main class="wrap">
<div class="hero">
  <div class="kicker" id="pf-meta">地方外贸扶持政策</div>
  <h1>各地鼓励出口和境外参展的扶持政策，一页查清</h1>
  <p class="lead">按省份、城市和政策类型整理各地商务部门的外贸扶持文件：境外参展补贴、出口信用保险保费补贴、跨境电商和海外仓、国际认证、融资贴息等。每条列出补贴比例和上限、申报条件，并附原文链接。</p>
</div>
<section class="pol-filter" aria-label="筛选">
  <div class="pf-row">
    <select id="pf-prov" aria-label="省份"><option value="">全部省份</option></select>
    <select id="pf-city" aria-label="城市" disabled><option value="">先选省份</option></select>
    <input id="pf-q" type="search" placeholder="搜索：展位费、海外仓、保费…" aria-label="关键词">
    <label class="pf-chk"><input type="checkbox" id="pf-valid"> 只看有效期内</label>
    <button type="button" id="pf-reset">重置</button>
    <span id="pf-count" class="pf-count"></span>
  </div>
  <div class="chips" id="pf-types" role="group" aria-label="政策类型"></div>
</section>
<section id="pol-list" class="pol-list"><p class="pol-empty">加载中…</p></section>
<p class="note">金额、比例和申报时间以原文和当年申报指南为准；多数补贴按年度集中申报，申报前可向当地商务部门确认。</p>
</main>"""
os.makedirs(os.path.join(R, "policies"), exist_ok=True)
open(os.path.join(R, "policies", "index.html"), "w", encoding="utf-8").write(
    page("地方外贸扶持政策库｜出海国别简报", POL_DESC, pbody, f"<script>\n{rd('src/policies.js')}</script>"))

# 项目地图 projects/index.html 是独立页面（自带数据、样式和脚本），直接编辑该文件，本脚本不生成它

live = len(metas)
secs = []
for key, cn, en, names in REGIONS:
    ready = [metas[n] for n in names if n in metas]
    soon = [n for n in names if n not in metas]
    h = f'<section class="region" id="{key}"><div class="sh"><span class="tag">{en}</span><h2>{cn}</h2>{f'<a class="cmplink" href="/{cmps[key]["slug"]}/">{"一二三四五六七八九十"[len(cmps[key]["cols"])-1]}国对比表 →</a>' if key in cmps else ""}</div>'
    if ready:
        h += '<div class="cards">' + "".join(
            f'<a class="card" href="/{m["slug"]}/"><div class="cn">{flag(m["name"])}{m["name"]}<small>{m["code"]} DESK</small></div><p>{m["card"]["blurb"]}</p><dl>'
            + "".join(f"<div><dt>{k}</dt><dd>{v}</dd></div>" for k, v in m["card"]["facts"]) + "</dl></a>" for m in ready) + "</div>"
    if soon:
        h += '<div class="cards mini">' + "".join(f'<div class="card soon"><div class="cn">{flag(n)}{n}<small>筹备中</small></div></div>' for n in soon) + "</div>"
    secs.append(h + "</section>")

total = sum(len(r[3]) for r in REGIONS)
body = f"""<header class="top"><div class="wrap">
  <div class="brand">出海国别简报 <b>GLOBAL DESK</b></div>
  <nav class="nav" aria-label="区域">{"".join(f'<a href="#{k}">{c}</a>' for k, c, _, _ in REGIONS)}<a href="https://www.sailfinscm.com/" target="_blank" rel="noopener">供应链解决方案</a></nav>
</div></header>
<main class="wrap">
<div class="hero">
  <div class="kicker">中国企业出海国别简报 · 已上线 {live} / {total} 个国家</div>
  <h1>出海去哪里，先把每个国家的账算清楚</h1>
  <p class="lead">按国家整理的经营决策信息：市场数据、常见痛点、落地步骤、外资准入、税务、用工签证和机会赛道，各国动态持续更新。选一个国家开始。</p>
</div>
{"".join(secs)}
<section class="tools">
  <a class="maplink" href="/projects/"><div><b>中企海外项目地图</b><br><span>覆盖海湾、东盟、中亚、非洲和澳大利亚的中资工程项目，按国家、主体、行业、阶段和优先级筛选</span></div><em>打开地图 →</em></a>
  <a class="maplink" href="/policies/"><div><b>地方外贸扶持政策库</b><br><span>各省市境外参展补贴、出口信用保险保费补贴、跨境电商和海外仓扶持，按地区和类型筛选，附原文链接</span></div><em>查政策 →</em></a>
  <a class="maplink" href="/odi/"><div><b>ODI 合规自查</b><br><span>对外投资备案前先自查：企业画像、主体资格、投资方式、标的项目、安全审查和行业国别，逐题作答后生成自查报告</span></div><em>开始自查 →</em></a>
</section>
</main>"""
open(os.path.join(R, "index.html"), "w", encoding="utf-8").write(
    page("出海国别简报", "面向中国企业的出海国别简报，覆盖海湾、东盟、中亚和大洋洲，按国家提供市场、准入、税务、用工和动态。", body))
print("built", live, "countries")
