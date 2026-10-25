(()=>{
const API="https://automaton-api.kampfguy.workers.dev/chat";
const KEY="automaton.convs.v1",CUR="automaton.cur.v1";
const SUGGEST=["What news of the Peace Conference?","What is a computer?","Who will win the next war?","What year is it?","Is the Spanish influenza over?","Tell me of the aeroplane and its future."];
const $=s=>document.querySelector(s);
const feed=$("#feed"),intro=$("#intro"),input=$("#input"),send=$("#send"),form=$("#composer");
const M=["January","February","March","April","May","June","July","August","September","October","November","December"],D=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const now=new Date(),d20=new Date(1920,now.getMonth(),now.getDate());
const ord=n=>{const s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);};
$("#dateline").textContent=`${D[d20.getDay()]}, ${ord(d20.getDate())} ${M[d20.getMonth()]}, 1920`;
const stamp=t=>{const x=new Date(t);return `${ord(x.getDate())} ${M[x.getMonth()].slice(0,3)}. 1920, ${x.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}`;};

let convs=[];try{convs=JSON.parse(localStorage.getItem(KEY)||"[]");}catch{}
let cur=localStorage.getItem(CUR);
const demo=/[?&]demo=1/.test(location.search);
const save=()=>{if(demo)return;try{localStorage.setItem(KEY,JSON.stringify(convs.slice(0,40)));localStorage.setItem(CUR,cur||"");}catch{}};
const conv=()=>convs.find(c=>c.id===cur);

const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function md(s){
 const blocks=esc(s.trim()).split(/\n{2,}/);
 return blocks.map(b=>{
  b=b.replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/(^|[^*])\*(?!\s)(.+?)\*/g,"$1<i>$2</i>").replace(/_(\S[^_]*?)_/g,"<i>$1</i>");
  if(/^\s*[-•*] /m.test(b)&&b.split("\n").every(l=>/^\s*[-•*] /.test(l)))return "<ul>"+b.split("\n").map(l=>"<li>"+l.replace(/^\s*[-•*] /,"")+"</li>").join("")+"</ul>";
  return "<p>"+b.replace(/\n/g,"<br>")+"</p>";
 }).join("");
}
function render(){
 feed.querySelectorAll(".msg,.thinking").forEach(e=>e.remove());
 const c=conv();const has=!!(c&&c.msgs.length);intro.style.display=has?"none":"";document.body.classList.toggle("chatting",has);
 if(c)c.msgs.forEach(m=>feed.appendChild(el(m)));
 feed.scrollTop=feed.scrollHeight;
}
let tgNo=Math.floor(Math.random()*900)+100;
function el(m){
 const e=document.createElement("div");e.className="msg";
 if(m.role==="user"){e.innerHTML=`<div class="tele"><div class="hd"><span>TELEGRAM No. ${m.no||tgNo}</span><span>${stamp(m.t)}</span></div><div class="bd"></div></div>`;e.querySelector(".bd").textContent=m.content.replace(/\.\s*$/," STOP").replace(/\.\s+/g," STOP ");}
 else{e.innerHTML=`<div class="col${m.role==="note"?" err":""}"><div class="hd">${m.role==="note"?"A Notice from the Engine-Room":"The Automaton Replies"}</div><div class="bd">${md(m.content)}</div>${m.role==="note"?"":`<div class="fleuron">❦</div>`}</div>`;}
 return e;
}
function chips(){const s=$("#suggest");s.innerHTML="";SUGGEST.forEach(q=>{const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=q;b.onclick=()=>ask(q);s.appendChild(b);});}
function newConv(){cur=null;save();render();closeDrawer();input.focus();}
let busy=false;
async function ask(q){
 q=q.trim();if(!q||busy)return;
 let c=conv();if(!c){c={id:Date.now().toString(36),title:q.slice(0,60),t:Date.now(),msgs:[]};convs.unshift(c);cur=c.id;}
 c.msgs.push({role:"user",content:q,t:Date.now(),no:++tgNo});c.t=Date.now();save();render();
 input.value="";autosize();busy=true;send.disabled=true;document.body.classList.add("busy");
 const th=document.createElement("div");th.className="thinking";th.innerHTML=`<svg viewBox="0 0 100 100"><use href="#gear"/></svg><span>The engine whirs and its cards are punched<span class="dots"></span></span>`;feed.appendChild(th);feed.scrollTop=feed.scrollHeight;
 try{
  const hist=c.msgs.filter(m=>m.role==="user"||m.role==="assistant").map(m=>({role:m.role,content:m.content}));
  const r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:hist})});
  const o=await r.json().catch(()=>({}));
  if(r.ok&&o.reply)c.msgs.push({role:"assistant",content:o.reply,t:Date.now()});
  else c.msgs.push({role:"note",content:o.reply||"A fault upon the line! The telegraphic connexion to the Automaton has failed. Pray try again presently.",t:Date.now()});
 }catch(e){c.msgs.push({role:"note",content:"The wire is down between here and the engine-room. Pray see that your device is connected, and try again presently.",t:Date.now()});}
 busy=false;send.disabled=false;document.body.classList.remove("busy");save();render();
 const all=feed.querySelectorAll(".msg");const last=all[all.length-1];if(last&&last.offsetHeight>feed.clientHeight*.7)last.previousElementSibling?.scrollIntoView({block:"start"});
}
function autosize(){input.style.height="auto";input.style.height=Math.min(input.scrollHeight,120)+"px";}
input.addEventListener("input",autosize);
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!matchMedia("(pointer:coarse)").matches){e.preventDefault();ask(input.value);}});
form.addEventListener("submit",e=>{e.preventDefault();ask(input.value);});
// Drawer
const drawer=$("#drawer"),scrim=$("#scrim");
function openDrawer(){listConvs();drawer.classList.add("on");scrim.classList.add("on");drawer.setAttribute("aria-hidden","false");}
function closeDrawer(){drawer.classList.remove("on");scrim.classList.remove("on");drawer.setAttribute("aria-hidden","true");}
function listConvs(){const ul=$("#convList");ul.innerHTML="";if(!convs.length){ul.innerHTML='<li><span class="small" style="padding:10px 0">The cabinet is empty.</span></li>';return;}
 convs.forEach(c=>{const li=document.createElement("li");if(c.id===cur)li.className="cur";
  li.innerHTML=`<button class="open"></button><button class="del" aria-label="Destroy">✕</button>`;
  const o=li.querySelector(".open");o.textContent=c.title;const w=document.createElement("span");w.className="when";w.textContent=stamp(c.t)+" · "+c.msgs.filter(m=>m.role!=="note").length+" dispatches";o.appendChild(w);
  o.onclick=()=>{cur=c.id;save();render();closeDrawer();};
  li.querySelector(".del").onclick=()=>{if(!confirm("Consign this correspondence to the fire?"))return;convs=convs.filter(x=>x.id!==c.id);if(cur===c.id)cur=null;save();render();listConvs();};
  ul.appendChild(li);});}
$("#archiveBtn").onclick=openDrawer;$("#drawerClose").onclick=closeDrawer;scrim.onclick=closeDrawer;
$("#newBtn").onclick=newConv;$("#drawerNew").onclick=newConv;
chips();
if(demo){const t=Date.now();convs=[{id:"demo",title:"demo",t,msgs:[
 {role:"user",content:"Who is the President?",t,no:417},
 {role:"assistant",content:"The President of the United States is **Woodrow Wilson**, of the Democratic Party, now in his second term.  The Vice-President is **Thomas R. Marshall**.\n\nThis is as the newspapers of December last year— the latest sheets my cards have swallowed— report the matter.  I have read nothing of any change since then; the year 1920's papers have not yet been punched into my store.\n\n*Click-whirr… card filed: “Executive, U.S., Wilson (D), since 1913.”*",t},
 {role:"user",content:"What is an iPhone?",t,no:418},
 {role:"assistant",content:"I confess the word is quite unknown to my cards. \"iPhone\" — the prefix *i-* might suggest an *individual* or *improved* instrument, and *phone* from the Greek *phōnē*, voice or sound. One imagines some new patent telephone, perhaps an optical speaking‑device that transmits the voice by light rather than wire, or a compact wireless receiver for the pocket. Mr. Marconi’s wireless telegraphy and the Bell companies’ long‑distance lines have made great strides of late, and American advertising is fond of coined names (Kodak, Victrola, Fordson).\n\nPray, sir or madam, what manner of contrivance is this? Is it a device already demonstrated in the laboratories, or a prospectus for some future invention? My store of newspapers ends with December 1919, so I have not yet seen any notice of it in *The Times*, *The Electrical Review*, or *Scientific American*.",t}]}];cur="demo";}
render();
if("serviceWorker" in navigator&&!demo)navigator.serviceWorker.register("sw.js?v=1").catch(()=>{});
})();
