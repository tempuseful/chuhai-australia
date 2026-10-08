(async function(){
const SECT={energy:"电力能源",infra:"工程基建",industry:"制造园区",tech:"数字科技",trade:"港口物流",mining:"矿业",finance:"金融"};
const STAGES=["规划招标","中标签约","在建","投产运营","暂缓取消"];
const SC={"规划招标":"var(--muted)","中标签约":"var(--amber)","在建":"var(--blue)","投产运营":"var(--up)","暂缓取消":"var(--down)"};
const VIEW={all:[[28,-42],[158,48]],gcc:[[34,15],[60,33]],asean:[[92,-11],[128,24]],centralasia:[[46,35],[88,56]],oceania:[[110,-45],[156,-9]]};
const $=s=>document.querySelector(s);
const [world,data]=await Promise.all([fetch("/vendor/world.json").then(r=>r.json()),fetch("/projects/data.json",{cache:"no-store"}).then(r=>r.json())]);
const P=data.items; P.forEach((p,i)=>p.id=i);
// 同一坐标的项目错开摆放
const seen={};P.forEach(p=>{const k=p.lat+","+p.lng;const n=seen[k]=(seen[k]||0)+1;if(n>1){const a=n*2.4,r=0.18*Math.sqrt(n);p.lat+=r*Math.sin(a);p.lng+=r*Math.cos(a)}});
$("#upd").textContent=data.updated;
const f={region:"all",country:"",contractor:"",sector:"",stage:""};
const opt=(sel,vals,lab)=>{const el=$(sel);el.innerHTML='<option value="">全部</option>'+vals.map(v=>`<option value="${v}">${lab?lab(v):v}</option>`).join("")};
const cnt=k=>{const m={};P.forEach(p=>String(p[k]).split("、").forEach(v=>m[v]=(m[v]||0)+1));return m};
function fillCountry(){const cs=[...new Set(P.filter(p=>f.region=="all"||p.region==f.region).map(p=>p.country))];opt("#f-country",cs)}
$("#f-region").innerHTML=[["all","全部区域"],...data.regions].map(([k,n])=>`<option value="${k}">${n}</option>`).join("");
fillCountry();
const cc=cnt("contractor");opt("#f-contractor",Object.keys(cc).sort((a,b)=>cc[b]-cc[a]),v=>`${v}（${cc[v]}）`);
opt("#f-sector",Object.keys(SECT).filter(k=>P.some(p=>p.sector==k)),v=>SECT[v]);
opt("#f-stage",STAGES);
// 地图
const svg=d3.select("#map"),W=1000,H=520;svg.attr("viewBox",`0 0 ${W} ${H}`);
const proj=d3.geoEquirectangular(),path=d3.geoPath(proj);
proj.fitExtent([[10,10],[W-10,H-10]],{type:"MultiPoint",coordinates:VIEW.all});
const g=svg.append("g");
{const a=proj([0,62]),b=proj([180,-52]);g.append("image").attr("href","/vendor/earth.jpg").attr("x",a[0]).attr("y",a[1]).attr("width",b[0]-a[0]).attr("height",b[1]-a[1]).attr("preserveAspectRatio","none");g.append("rect").attr("x",a[0]).attr("y",a[1]).attr("width",b[0]-a[0]).attr("height",b[1]-a[1]).attr("class","shade")}
const live=new Set(data.live);
g.append("g").selectAll("path").data(topojson.feature(world,world.objects.countries).features.filter(d=>live.has(d.id))).join("path").attr("d",path).attr("class",d=>"land"+(live.has(d.id)?" live":""));
const dots=g.append("g");
let k=1,sel=null;
const zoom=d3.zoom().scaleExtent([1,60]).translateExtent([[proj([0,62])[0],proj([0,62])[1]],[proj([180,-52])[0],proj([180,-52])[1]]]).on("zoom",e=>{k=e.transform.k;g.attr("transform",e.transform);dots.selectAll("circle").attr("r",d=>(d.id===sel?8:5)/k).attr("stroke-width",1.2/k);g.selectAll(".land").style("stroke-width",d=>(live.has(d.id)?1.3:.6)/k)});
svg.call(zoom);
function flyTo(ext,dur=600){const [[x0,y0],[x1,y1]]=[proj(ext[0]),proj(ext[1])];const bx0=Math.min(x0,x1),bx1=Math.max(x0,x1),by0=Math.min(y0,y1),by1=Math.max(y0,y1);const s=Math.min(60,.9/Math.max((bx1-bx0)/W,(by1-by0)/H));svg.transition().duration(dur).call(zoom.transform,d3.zoomIdentity.translate(W/2,H/2).scale(s).translate(-(bx0+bx1)/2,-(by0+by1)/2))}
const tip=$("#tip");
function showTip(p,ev){tip.hidden=false;tip.innerHTML=`<b>${p.name}</b><span>${p.country} · ${p.city}</span><span>${p.contractor}</span><span style="color:${SC[p.stage]}">${p.stage}</span>${p.amount?`<span>${p.amount}</span>`:""}`;const r=$("#mapbox").getBoundingClientRect();tip.style.left=Math.min(ev.clientX-r.left+12,r.width-230)+"px";tip.style.top=(ev.clientY-r.top+12)+"px"}
function pick(id,scroll){sel=id;dots.selectAll("circle").classed("on",d=>d.id===id).attr("r",d=>(d.id===id?8:5)/k);document.querySelectorAll("#rows tr").forEach(tr=>tr.classList.toggle("on",+tr.dataset.id===id));if(scroll){const tr=document.querySelector(`#rows tr[data-id="${id}"]`);if(tr)tr.scrollIntoView({block:"center",behavior:"smooth"})}}
function render(){
  const L=P.filter(p=>(f.region=="all"||p.region==f.region)&&(!f.country||p.country==f.country)&&(!f.contractor||p.contractor.split("、").includes(f.contractor))&&(!f.sector||p.sector==f.sector)&&(!f.stage||p.stage==f.stage)).sort((a,b)=>b.date.localeCompare(a.date));
  $("#s-n").textContent=L.length;$("#s-c").textContent=new Set(L.map(p=>p.country)).size;
  const usd=L.reduce((s,p)=>s+(p.usd||0),0),nu=L.filter(p=>p.usd).length;
  $("#s-u").textContent=usd?Math.round(usd).toLocaleString():"—";$("#s-un").textContent=`${nu} 个项目披露了金额`;
  $("#s-a").textContent=L.filter(p=>p.stage=="中标签约"||p.stage=="规划招标").length;
  dots.selectAll("circle").data(L,d=>d.id).join("circle").attr("cx",d=>proj([d.lng,d.lat])[0]).attr("cy",d=>proj([d.lng,d.lat])[1]).attr("r",5/k).attr("fill",d=>SC[d.stage]).attr("stroke","#fff").attr("stroke-width",1.2/k)
    .on("mousemove",(e,d)=>showTip(d,e)).on("mouseleave",()=>tip.hidden=true).on("click",(e,d)=>pick(d.id,true));
  $("#rows").innerHTML=L.map(p=>`<tr data-id="${p.id}"><td>${p.country}<small>${p.city}</small></td><td>${p.contractor}</td><td><a href="${p.url}" target="_blank" rel="noopener">${p.name}</a><small>${SECT[p.sector]} · ${p.source}</small></td><td class="r">${p.amount||"—"}</td><td><i class="st" style="background:${SC[p.stage]}"></i>${p.stage}</td><td class="num">${p.date}</td></tr>`).join("")||'<tr><td colspan="6" style="color:var(--muted);padding:24px 10px">没有符合条件的项目，放宽筛选试试。</td></tr>';
  document.querySelectorAll("#rows tr[data-id]").forEach(tr=>tr.addEventListener("click",e=>{if(e.target.closest("a"))return;const p=P[+tr.dataset.id];pick(p.id,false);flyTo([[p.lng-2.5,p.lat-1.6],[p.lng+2.5,p.lat+1.6]]);$("#mapbox").scrollIntoView({block:"nearest",behavior:"smooth"})}));
}
function view(){if(f.country){const L=P.filter(p=>p.country==f.country);const xs=L.map(p=>p.lng),ys=L.map(p=>p.lat);flyTo([[Math.min(...xs)-1.5,Math.min(...ys)-1],[Math.max(...xs)+1.5,Math.max(...ys)+1]])}else flyTo(VIEW[f.region]||VIEW.all)}
[["region","#f-region"],["country","#f-country"],["contractor","#f-contractor"],["sector","#f-sector"],["stage","#f-stage"]].forEach(([key,s])=>$(s).addEventListener("change",e=>{f[key]=e.target.value;if(key=="region"){f.country="";fillCountry()}render();if(key=="region"||key=="country")view()}));
$("#reset").addEventListener("click",()=>{Object.assign(f,{region:"all",country:"",contractor:"",sector:"",stage:""});document.querySelectorAll(".filters select").forEach(s=>s.selectedIndex=0);fillCountry();render();view()});
$("#zin").addEventListener("click",()=>svg.transition().call(zoom.scaleBy,1.8));$("#zout").addEventListener("click",()=>svg.transition().call(zoom.scaleBy,1/1.8));
$("#legend").innerHTML=STAGES.map(s=>`<span><i class="st" style="background:${SC[s]}"></i>${s}</span>`).join("");
render();flyTo(VIEW.all,0);
})();
