let all=[],mode='full',lastAssessmentMode='full',moduleIndex=0,step=0,answers={};const KEY='odi-v7-research';const modules=['企业画像','主体资格','投资方式','标的项目','安全审查','行业国别'];try{answers=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{};
const $=id=>document.getElementById(id);function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function save(){if(window.__odiSelfChecking)return;try{localStorage.setItem(KEY,JSON.stringify(answers))}catch(e){if(!window.__odiStorageWarned){window.__odiStorageWarned=true;alert('浏览器未能保存到本机。请及时导出答案 JSON 备份。')}}}function val(id){return answers[id]||''}function asText(v){return Array.isArray(v)?v.join('|'):String(v??'')}

const PROFILE_INDUSTRIES=['A 农、林、牧、渔业','B 采矿业','C 制造业','D 电力、热力、燃气及水生产和供应业','E 建筑业','F 批发和零售业','G 交通运输、仓储和邮政业','H 住宿和餐饮业','I 信息传输、软件和信息技术服务业','J 金融业','K 房地产业','L 租赁和商务服务业','M 科学研究和技术服务业','N 水利、环境和公共设施管理业','O 居民服务、修理和其他服务业','P 教育','Q 卫生和社会工作','R 文化、体育和娱乐业','S 公共管理、社会保障和社会组织','T 国际组织'];
const PROFILE_COUNTRIES=['中国香港','中国澳门','中国台湾','美国','加拿大','澳大利亚','英国','德国','法国','日本','韩国','新加坡','马来西亚','印度尼西亚','泰国','越南','阿联酋','沙特阿拉伯','巴林','卡塔尔','哈萨克斯坦','乌兹别克斯坦','南非','其他国家或地区'];
function profileControl(q){const id=q.id,v=asText(val(id));let opts=null;
 if(id==='ODI-004'||id==='ODI-006')opts=PROFILE_INDUSTRIES;
 if(id==='ODI-005')opts=PROFILE_COUNTRIES;
 if(id==='ODI-008')opts=['直接投资至目的地','经第三地（含港澳台）中转投资'];
 if(id==='ODI-010')opts=['新设类','并购类','变更类'];
 if(id==='ODI-002')opts=q.uiOptions;
 if(id==='ODI-003')opts=q.uiOptions;
 if(id==='ODI-011')opts=q.uiOptions;
 if(id==='ODI-009'){let a=Array.isArray(val(id))?val(id):[];return `<div class="profile-choices">${q.uiOptions.map((o,i)=>`<label class="option"><input type="checkbox" ${a.includes(o)?'checked':''} onchange="pick('${id}',${i},true)">${esc(o)}</label>`).join('')}</div>`}
 if(opts){let other=v&&!opts.includes(v);return `<select onchange="profileSelect('${id}',this.value)"><option value="">请选择</option>${opts.map(o=>`<option value="${esc(o)}" ${v===o?'selected':''}>${esc(o)}</option>`).join('')}${other?`<option value="${esc(v)}" selected>${esc(v)}（历史输入）</option>`:''}</select>${id==='ODI-005'?'<p class="muted">此列表为便捷选择，不代表完整国别数据库；其他目的地可选“其他国家或地区”。</p>':''}`}
 if(id==='ODI-007')return `<input type="text" value="${esc(v)}" placeholder="如：100万美元（金额及币种）" oninput="update('${id}',this.value)">`;
 return `<input type="text" value="${esc(v)}" placeholder="请输入测试信息" oninput="update('${id}',this.value)">`;
}
function profileSelect(id,v){if(id==='ODI-010'&&asText(val(id))!==v){for(const q of all.filter(q=>q.module==='投资方式'))delete answers[q.id];step=Math.min(step,10)}answers[id]=v;save();render()}

function investmentType(){let s=asText(val('ODI-010'));return ['新设类','并购类','变更类'].find(t=>s.includes(t))||''}
function shown(q){
 const id=q.id,t=investmentType();
 if(q.module==='投资方式'){
  if(!t)return false;
  if(/^ODI-0(18|19|20|21|22)$/.test(id)&&t!=='并购类')return false;
  if(/^ODI-0(23|24|25)$/.test(id)&&t!=='新设类')return false;
  if(/^ODI-0(26|27|28|29|30|31)$/.test(id)&&t!=='变更类')return false;
  if(['ODI-027','ODI-028','ODI-030'].includes(id))return asText(val('ODI-026')).includes('B ');
  if(id==='ODI-029')return asText(val('ODI-026')).includes('B ')&&asText(val('ODI-027')).includes('A ');
  if(id==='ODI-035')return !!asText(val('ODI-009'))&&!asText(val('ODI-009')).includes('无');
 }
 if(id==='ODI-036')return t==='并购类';
 if(id==='ODI-037')return asText(val('ODI-009')).includes('VIE');
 let r=q.displayRuleV5;
 if(r&&r.verified&&r.expression)return asText(val(r.expression.field)).includes(r.expression.contains);
 return true;
}
function applicable(){return all.filter(q=>q.module===modules[moduleIndex]&&shown(q)&&inMode(q))}
function inMode(q){
 const m=mode==='report'?lastAssessmentMode:mode;
 if(m==='full')return true;
 if(m!=='quick')return false;
 // 基于四源研究中已记录的快速版省略项；未穷举的隐藏题不推断。
 const excluded=new Set(['ODI-021','ODI-022','ODI-032','ODI-036','ODI-042','ODI-047','ODI-051','ODI-027','ODI-028','ODI-029','ODI-030']);
 if(excluded.has(q.id))return false;
 if(q.id==='ODI-035'||q.id==='ODI-037')return false; // 特殊架构附加题：快速版尚未验证
 return true;
}function setMode(m){if(m!=='report')lastAssessmentMode=m;mode=m;moduleIndex=0;step=0;render()}function selectModule(i){moduleIndex=i;step=0;render()}
function jumpToQuestion(id){let q=all.find(x=>x.id===id);if(!q||!shown(q)||!inMode(q))return;mode=lastAssessmentMode;moduleIndex=modules.indexOf(q.module);step=applicable().findIndex(x=>x.id===id);if(step<0)step=0;render();window.scrollTo(0,0)}
function openMissing(){const missing=reviewItems().filter(x=>!x.answered);if(!missing.length){alert('当前适用字段均已填写。');return}jumpToQuestion(missing[0].id)}function update(id,v){answers[id]=v;save();renderNav()}function pick(id,i,multi){let q=all.find(x=>x.id===id),o=q.uiOptions[i];if(multi){let a=Array.isArray(answers[id])?answers[id]:[];let none=q.uiOptions.find(x=>/以上均未发生|以上均不涉及|均不涉及|均无|均未发生|以上皆无/.test(x));if(none&&o===none){answers[id]=a.includes(o)?[]:[o]}else{a=a.filter(x=>x!==none);answers[id]=a.includes(o)?a.filter(x=>x!==o):[...a,o]}}else {if(id==='ODI-010'&&answers[id]!==o){for(const x of all.filter(q=>q.module==='投资方式'))delete answers[x.id]}answers[id]=o}save();render()}
function renderNav(){let nav=$('nav');nav.innerHTML=modules.map((m,i)=>{let a=all.filter(q=>q.module===m&&shown(q)&&inMode(q));let n=a.filter(q=>{let v=val(q.id);return Array.isArray(v)?v.length:!!String(v).trim()}).length;return `<button class="${i===moduleIndex?'on':''}" onclick="selectModule(${i})">${esc(m)} <small>${n}/${a.length}</small></button>`}).join('');let a=all.filter(q=>shown(q)&&inMode(q));let n=a.filter(q=>{let v=val(q.id);return Array.isArray(v)?v.length:!!String(v).trim()}).length;$('count').textContent=`已填写 ${n}/${a.length} 个当前可见字段`;$('bar').style.width=(a.length?100*n/a.length:0)+'%'}
function render(){['full','quick','report'].forEach(m=>$('tab-'+m).className=mode===m?'on':'');renderNav();renderDiagnostic();if(mode==='report'){renderReport();return}let list=applicable();if(step>=list.length)step=Math.max(0,list.length-1);let q=list[step];$('heading').textContent=modules[moduleIndex];$('sub').textContent=moduleIndex===0?'企业画像 · 基础信息收集':`第 ${list.length?step+1:0} / ${list.length} 项 · 适用题目随答案变化`;$('actions').classList.remove('hide');if(!q){$('content').innerHTML='<p class="help">本模块当前没有适用题目，可继续下一模块。</p>';return}let opts=q.uiOptions||[];let isMulti=q.inputKind==='multi';let current=val(q.id);let ctrl=opts.length?opts.map((o,i)=>`<label class="option"><input type="${isMulti?'checkbox':'radio'}" name="q" ${isMulti?(Array.isArray(current)&&current.includes(o)?'checked':''):(current===o?'checked':'')} onchange="pick('${q.id}',${i},${isMulti})">${esc(o)}</label>`).join(''):`<textarea rows="3" placeholder="请输入测试答案" oninput="update('${q.id}',this.value)">${esc(current)}</textarea>`;let title=q.cleanTitle||q.question;let isProfile=moduleIndex===0;let profileHtml=isProfile?`<div class="profile-grid"><div class="profile-item"><label>${esc(title)}</label>${profileControl(q)}</div></div>`:`<div class="qtitle">${esc(q.number)} · ${esc(title)}</div><div class="help">${esc(q.helpText)}</div>${ctrl}`;$('content').innerHTML=`<section class="q">${profileHtml}<details><summary>查看来源与研究备注</summary><p>原始触发：${esc(q.trigger)}</p><p>法规及研究说明：${esc(q.law_text)}</p><p>选项解析尚待逐题人工核验；来源数：${q.sourceCount||0}</p></details></section>`}
function next(){if(mode==='report')return;let list=applicable();if(step<list.length-1)step++;else if(moduleIndex<modules.length-1){moduleIndex++;step=0}else{lastAssessmentMode=mode;mode='report'}render();window.scrollTo(0,0)}function prev(){if(mode==='report'){mode=lastAssessmentMode;render();return}if(step>0)step--;else if(moduleIndex>0){moduleIndex--;step=Math.max(0,applicable().length-1)}render();window.scrollTo(0,0)}
function answered(q){const v=val(q.id);return Array.isArray(v)?v.length>0:String(v??'').trim().length>0}
function reviewItems(){const eligible=all.filter(q=>inMode(q)&&shown(q));return eligible.map(q=>({id:q.id,number:q.number,module:q.module,title:q.cleanTitle||q.question,answer:val(q.id),answered:answered(q),lawReference:q.law_text&&q.law_text!=='—'?q.law_text:'未提供可核验的条文',lawVerified:false,sourceCount:q.sourceCount||0,optionVerified:!!q.verifiedOptionParsing,reviewStatus:'待律师复核'}))}
function reportData(){const items=reviewItems();return {version:'V15',generatedAt:new Date().toISOString(),mode:lastAssessmentMode,investmentType:investmentType(),disclaimer:'研究性答题及证据复核报告，不构成合规评级、备案核准判断或法律意见',statistics:{applicable:items.length,answered:items.filter(x=>x.answered).length,missing:items.filter(x=>!x.answered).length},modules:modules.map(name=>({name,items:items.filter(x=>x.module===name)})),items,verification:{statutoryRulesVerified:false,materialRequirementsVerified:false,riskScoringEnabled:false}}}
function exportReport(){const blob=new Blob([JSON.stringify(reportData(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ODI_V15_审查证据报告.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function renderReport(){const data=reportData(),items=data.items,missing=items.filter(x=>!x.answered);$('heading').textContent='ODI 审查记录与法规核验清单 · V15';$('sub').textContent='研究性报告 · 法规引用未完成现行有效性复核';$('actions').classList.add('hide');
const modHtml=data.modules.map(m=>{const done=m.items.filter(x=>x.answered);return `<section class="report-section"><h4>${esc(m.name)} · ${done.length}/${m.items.length}</h4>${m.items.map(x=>`<div class="report-item"><strong>${esc(x.number)} ${esc(x.title)}</strong><div>答复：${x.answered?esc(asText(x.answer).replaceAll('|','；')):'<em>未回答</em>'}</div><details><summary>法规来源与证据状态（待核验）</summary><p>${esc(x.lawReference)}</p><p>来源记录数：${x.sourceCount}；选项解析：${x.optionVerified?'标记已核验':'尚未核验'}；法规现行有效性：未核验</p></details></div>`).join('')||'<p class="muted">当前无适用题目</p>'}</section>`}).join('');
$('content').innerHTML=`<div class="report"><h3>境外投资自查 · 研究性审查记录</h3><p><strong>模式：</strong>${lastAssessmentMode==='quick'?'快速自测（未完整验证）':'全量核验研究版'}；<strong>投资方式：</strong>${esc(investmentType()||'未选择')}</p><p><strong>适用字段：</strong>${items.length}；<strong>已答：</strong>${data.statistics.answered}；<strong>待答：</strong>${missing.length}</p><div class="report-warning"><strong>尚不能形成合规结论。</strong> 本版未核验法规现行有效性、未建立法定材料规则和风险评分标准；以下法规文本仅是四源题库的研究记录，不能直接作为法律依据引用。快速模式也尚未穷举原站隐藏条件。</div><h4>一、待完成问题</h4><button class="secondary" onclick="openMissing()">跳转至第一道未答题</button><ul>${missing.map(x=>`<li><button class="text-link" onclick="jumpToQuestion('${x.id}')">${esc(x.module)}｜${esc(x.number)} ${esc(x.title)}（点击跳转）</button></li>`).join('')||'<li>当前适用字段均已填写</li>'}</ul><h4>二、法规与证据复核任务</h4><p>所有题目均标记“法规待核验”；后续需逐条确认规范名称、条款、适用主体、有效版本及材料义务。不能从未答题目直接推定法定材料缺失。</p><h4>三、分模块答题与来源记录</h4>${modHtml}<div class="report-warning">本报告不提供风险等级、敏感项目认定、备案核准路径结论或正式法律意见。</div><div class="buttons"><button class="secondary" onclick="openMissing()">继续填写未答题</button><button class="primary" onclick="window.print()">打印 / 保存为 PDF</button><button class="secondary" onclick="exportReport()">导出结构化报告 JSON</button><button class="secondary" onclick="exportAnswers()">导出答案 JSON</button></div></div>`}
function clearAnswers(){if(confirm('确定清空此浏览器内的测试答案？')){answers={};save();step=0;render()}}function exportAnswers(){let blob=new Blob([JSON.stringify({version:'V15',exportedAt:new Date().toISOString(),mode,assessmentMode:lastAssessmentMode,answers},null,2)],{type:'application/json'});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ODI_V15_测试答案.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
all=window.ODI_QUESTIONS.questions;render();
function importAnswers(input){const f=input.files&&input.files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{try{let obj=JSON.parse(reader.result);if(!obj.answers||typeof obj.answers!=='object'||Array.isArray(obj.answers))throw Error('不是有效的答题记录');let ids=new Set(all.map(q=>q.id)),n=0;for(const [id,v] of Object.entries(obj.answers)){if(ids.has(id)&&(typeof v==='string'||(Array.isArray(v)&&v.every(x=>typeof x==='string')))){answers[id]=v;n++}}save();render();alert('已导入 '+n+' 个已识别字段。旧答案仅供测试，切换投资类型后请重新检查。')}catch(e){alert('导入失败：'+e.message)}};reader.readAsText(f);input.value=''}
function resetBranchAnswers(){let ids=all.filter(q=>q.module==='投资方式').map(q=>q.id);if(!confirm('仅清除投资方式模块的 '+ids.length+' 个候选字段答案？'))return;ids.forEach(id=>delete answers[id]);save();render()}

function renderDiagnostic(){const node=$('diagnostic');if(!node)return;
 const t=investmentType();const qs=all.filter(q=>q.module==='投资方式');const visible=qs.filter(q=>shown(q)&&inMode(q));const hidden=qs.filter(q=>!shown(q)||!inMode(q));
 const code=q=>esc(q.number||q.id);const note=q=>{if(!t)return '未选择投资方式';if(mode==='quick'&&!inMode(q))return '快速版已记录的省略项或未验证附加项';if(/^ODI-0(18|19|20|21|22)$/.test(q.id))return '仅并购类';if(/^ODI-0(23|24|25)$/.test(q.id))return '仅新设类';if(/^ODI-0(26|27|28|29|30|31)$/.test(q.id))return '仅变更类或附加条件';return '条件未满足或研究规则';};
 node.innerHTML=`<details><summary>分支诊断（开发测试） · 当前${esc(t||'未选择')} · 投资方式${visible.length}题</summary><p>模式：${mode==='report'?lastAssessmentMode:mode}。仅反映本地程序当前筛选结果，不代表原站完整分支。</p><strong>显示题目：</strong><p>${visible.map(code).join('、')||'无'}</p><strong>隐藏题目：</strong><ul>${hidden.map(q=>`<li>${code(q)}：${note(q)}</li>`).join('')}</ul></details>`;
}

// V14: 隔离的分支自检。只临时修改内存中的答案，结束后恢复；不保存任何测试答案。
function branchSelfCheck(){
 window.__odiSelfChecking=true;const originalAnswers=answers,originalMode=mode,originalLast=lastAssessmentMode,originalModule=moduleIndex,originalStep=step;
 const results=[];
 const test=(label,condition,detail)=>results.push({label,passed:!!condition,detail:String(detail||'')});
 try{
  for(const kind of ['新设类','并购类','变更类']){
   answers={'ODI-010':kind};mode='full';lastAssessmentMode='full';
   const qs=all.filter(q=>q.module==='投资方式'&&shown(q)&&inMode(q));
   const numbers=qs.map(q=>q.number||q.id);
   const ownPrefix=kind==='新设类'?'A-':kind==='并购类'?'B-':'C-';
   const otherPrefixes=['A-','B-','C-'].filter(x=>x!==ownPrefix);
   test(kind+'专项题出现',numbers.some(n=>n.startsWith(ownPrefix)),numbers.join('、'));
   test(kind+'不混入其他投资类别',!numbers.some(n=>otherPrefixes.some(p=>n.startsWith(p))),numbers.join('、'));
   const ids=new Set(qs.map(q=>q.id));
   answers['ODI-023']='隐藏分支模拟旧答案';
   if(kind!=='新设类')test(kind+'报告排除隐藏旧答案',!reviewItems().some(q=>q.id==='ODI-023'),ids.has('ODI-023')?'当前题适用':'当前题隐藏');
   mode='quick';const quick=new Set(all.filter(q=>q.module==='投资方式'&&shown(q)&&inMode(q)).map(q=>q.id));
   test(kind+'快速模式不额外增加题目',[...quick].every(id=>ids.has(id)),`全量${ids.size}，快速${quick.size}`);
  }
  const c1=all.find(q=>q.number&&q.number.startsWith('C-1'));
  if(c1){
   const none=(c1.uiOptions||[]).find(o=>/以上均未发生|以上均不涉及|均不涉及|均无|均未发生|以上皆无/.test(o));
   if(none){
    answers={'ODI-010':'变更类'};mode='full';const i=c1.uiOptions.indexOf(none),j=c1.uiOptions.findIndex(o=>o!==none);
    pick(c1.id,i,true);pick(c1.id,j,true);
    test('C-1 互斥项不能与变化项共存',!asText(val(c1.id)).includes(none),asText(val(c1.id)));
   }else test('C-1 互斥选项待核验',false,'题库中未识别到“以上均未发生”');
  }
 }catch(e){test('自检运行',false,e.message)}finally{answers=originalAnswers;mode=originalMode;lastAssessmentMode=originalLast;moduleIndex=originalModule;step=originalStep;window.__odiSelfChecking=false;render()}
 const passed=results.filter(x=>x.passed).length;
 const el=$('selfcheck-results');if(el)el.innerHTML=`<div class="report-warning"><strong>分支自动检测：${passed}/${results.length} 项通过</strong><p>仅检测本地程序一致性，不证明与原网站一致。</p><ul>${results.map(x=>`<li>${x.passed?'✓':'✗'} ${esc(x.label)}：${esc(x.detail)}</li>`).join('')}</ul></div>`;
 window.__odiLastCheck={version:'V16',generatedAt:new Date().toISOString(),passed,total:results.length,results};
 return window.__odiLastCheck;
}

// V15: Reproducible diagnostic matrix. Does not modify persisted answers.
function branchMatrix(){
 const oldAnswers=answers,oldMode=mode,oldLast=lastAssessmentMode,oldModule=moduleIndex,oldStep=step;
 const rows=[];window.__odiSelfChecking=true;
 try{
  for(const kind of ['新设类','并购类','变更类']){
   for(const m of ['full','quick']){
    answers={'ODI-010':kind};mode=m;lastAssessmentMode=m;
    const visible=all.filter(q=>shown(q)&&inMode(q));
    const investment=visible.filter(q=>q.module==='投资方式');
    rows.push({investmentType:kind,mode:m,applicableCount:visible.length,investmentCount:investment.length,investmentQuestions:investment.map(q=>({id:q.id,number:q.number,title:q.cleanTitle||q.question}))});
   }
  }
  // Technical cross-border is a documented conditional, but its exact question IDs
  // are not asserted by this matrix without independent evidence.
 }finally{answers=oldAnswers;mode=oldMode;lastAssessmentMode=oldLast;moduleIndex=oldModule;step=oldStep;window.__odiSelfChecking=false;render()}
 window.__odiLastMatrix={version:'V16',generatedAt:new Date().toISOString(),scope:'本地题库分支矩阵，非原网站完整性证明',rows,changePaths:buildChangePaths()};
 const el=$('selfcheck-results');if(el)el.innerHTML=`<div class="report-warning"><strong>分支矩阵已生成（${rows.length}个场景）</strong><p>每种投资方式分别计算全量和快速模式；可导出 JSON 查看题号和标题。快速模式仍是研究映射。</p><ul>${rows.map(r=>`<li>${esc(r.investmentType)} · ${r.mode==='full'?'全量':'快速'}：共${r.applicableCount}字段，投资方式${r.investmentCount}题</li>`).join('')}</ul></div>`;
 return window.__odiLastMatrix;
}
function exportDiagnostics(){
 const data={version:'V16',exportedAt:new Date().toISOString(),test:window.__odiLastCheck||null,matrix:window.__odiLastMatrix||null,notes:['仅用于本地逻辑回归','不代表原政务平台全部分支已覆盖','不包含用户填写答案']};
 if(!data.test&&!data.matrix){alert('请先运行分支自动检测或生成分支矩阵。');return}
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ODI_V16_分支诊断结果.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

// V16: Change-branch path coverage, including triggered and untriggered C-2..C-5.
// This is an internal code-path test, NOT an assertion of government-site equivalence.
function buildChangePaths(){
 const oldAnswers=answers,oldMode=mode,oldLast=lastAssessmentMode,oldModule=moduleIndex,oldStep=step;
 const rows=[];window.__odiSelfChecking=true;
 const c1=all.find(q=>q.id==='ODI-026');
 const options=c1?.uiOptions||[];
 const scenarios=[
  {name:'C-1 未填写',choice:null},
  ...options.map((choice)=>({name:'C-1 '+choice,choice})),
  {name:'C-1 投资人变化 + C-2 新增境内投资人',choice:options.find(o=>o.startsWith('B ')),c2:'A 新增境内投资人'},
  {name:'C-1 投资人变化 + C-2 新增境外投资人',choice:options.find(o=>o.startsWith('B ')),c2:'B 新增境外投资人'}
 ];
 try{
  for(const scenario of scenarios){
   answers={'ODI-010':'变更类'};if(scenario.choice)answers['ODI-026']=[scenario.choice];if(scenario.c2)answers['ODI-027']=scenario.c2;
   mode='full';lastAssessmentMode='full';
   const visible=all.filter(q=>q.module==='投资方式'&&shown(q)&&inMode(q));
   rows.push({scenario:scenario.name,visible:visible.map(q=>q.number||q.id),changeSpecific:visible.filter(q=>/^ODI-0(26|27|28|29|30|31)$/.test(q.id)).map(q=>({id:q.id,number:q.number})),hiddenAnswered:all.filter(q=>q.module==='投资方式'&&!shown(q)&&answered(q)).map(q=>q.id)});
  }
 }finally{answers=oldAnswers;mode=oldMode;lastAssessmentMode=oldLast;moduleIndex=oldModule;step=oldStep;window.__odiSelfChecking=false}
 return {status:'本地条件测试；规则尚待与原网站核验',rows};
}
