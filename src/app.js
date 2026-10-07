const t=document.getElementById("tape");
if(t){const h=META.tape.map(([k,v])=>`<span>${k}<i>${v}</i></span>`).join("");t.innerHTML=h+h}
const bars=document.getElementById("bars");
if(bars){const max=META.bars.max;bars.innerHTML=META.bars.data.map(([y,e,m])=>`<div class="yr"><span>${y}</span><div><div class="bar e"><i style="width:${e/max*82}%"></i><b>${e}</b></div><div class="bar m"><i style="width:${m/max*82}%"></i><b>${m}</b></div></div></div>`).join("")}
/* 动态：读取本国 news.json，每日自动更新 */
const SECT=Object.assign({all:"全部"},META.sect),KEY="sect-"+META.slug;
let rows=[],cur="all",shown=16;
try{cur=localStorage.getItem(KEY)||"all"}catch(e){}
if(!SECT[cur])cur="all";
const chips=document.getElementById("chips"),list=document.getElementById("feedlist"),msg=document.getElementById("feedmsg");
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function drawChips(){chips.textContent="";for(const k in SECT){const n=k==="all"?rows.length:rows.filter(r=>r.sector===k).length;const b=el("button",null,SECT[k]+(rows.length?" "+n:""));b.type="button";b.id="chip-"+k;b.setAttribute("aria-pressed",String(k===cur));b.onclick=()=>{cur=k;shown=16;try{localStorage.setItem(KEY,k)}catch(e){}draw()};chips.appendChild(b)}}
function draw(){drawChips();list.textContent="";const show=rows.filter(r=>cur==="all"||r.sector===cur);
  for(const r of show.slice(0,shown)){const li=el("li");li.appendChild(el("time",null,r.date||"—"));const d=el("div");
    const ok=typeof r.url==="string"&&/^https?:\/\//.test(r.url);const a=el(ok?"a":"span","t",r.title||"");if(ok){a.href=r.url;a.target="_blank";a.rel="noopener"}d.appendChild(a);
    const m=el("div","m");const pol=r.kind==="政策";m.appendChild(el("span","k "+(pol?"pol":"news"),pol?"政策":"新闻"));m.appendChild(el("span",null,SECT[r.sector]||""));if(r.source)m.appendChild(el("span",null,r.source));d.appendChild(m);li.appendChild(d);list.appendChild(li)}
  const mb=document.getElementById("more");mb.hidden=show.length<=shown;mb.textContent="显示更多（还有 "+(show.length-shown)+" 条）";
  msg.hidden=show.length>0;if(!show.length)msg.textContent=rows.length?"这个类别暂时没有新动态。":"暂无动态。每日更新后，这里会自动出现新闻与政策。";
  const last=rows.map(r=>r.added||r.date||"").sort().pop();document.getElementById("upd").textContent=last?"最近更新 "+last:""}
if(chips){drawChips();
document.getElementById("more").onclick=()=>{shown+=16;draw()};
fetch(META.feed,{cache:"no-store"}).then(r=>{if(!r.ok)throw 0;return r.json()}).then(j=>{rows=(j.items||[]).slice().sort((x,y)=>String(y.date||"").localeCompare(String(x.date||"")));draw()}).catch(()=>{msg.hidden=false;msg.textContent="动态暂时无法载入，请稍后刷新。"})}
