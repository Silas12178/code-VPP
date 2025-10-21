// ===== 星光背景（银白点） =====
document.addEventListener("DOMContentLoaded", () => {
  const cvs = document.getElementById("bg-stars");
  const ctx = cvs.getContext("2d");
  let stars = [];
  const DENSITY = 0.00015;

  function resize() {
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    const count = Math.floor(cvs.width * cvs.height * DENSITY);
    stars = Array.from({length: count}, () => ({
      x: Math.random()*cvs.width,
      y: Math.random()*cvs.height,
      r: Math.random()*1.5 + .5,
      baseR: Math.random()*1.5 + .5,
      a: Math.random(),
      sp: (Math.random()*0.3 + 0.1) * (Math.random()<.5?1:-1),
      vx:(Math.random()-.5)*.15, vy:(Math.random()-.5)*.15
    }));
  }
  function draw(){
    ctx.clearRect(0,0,cvs.width,cvs.height);
    for(const s of stars){
      s.r += s.sp*0.02;
      if(s.r>s.baseR*1.8 || s.r<s.baseR*0.5) s.sp*=-1;
      s.x+=s.vx; s.y+=s.vy;
      if(s.x<0) s.x=cvs.width; if(s.x>cvs.width) s.x=0;
      if(s.y<0) s.y=cvs.height; if(s.y>cvs.height) s.y=0;

      const g = ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*2);
      g.addColorStop(0,`rgba(255,255,255,${0.8*s.a})`);
      g.addColorStop(1,`rgba(255,255,255,0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r*2,0,Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  window.addEventListener("resize", resize);
  resize(); draw();
});

// ===== 工具函数 =====
function nowBJ(){ const off = window.offsetMs || 0; return new Date(Date.now()+off); }
function rand(min,max){return Math.random()*(max-min)+min}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function fmt(n){ return n.toString().padStart(2,'0') }

// ===== 顶部时钟 =====
document.addEventListener("DOMContentLoaded", ()=>{
  const el = document.getElementById("g4-clock");
  const tick = ()=> {
    const t = nowBJ();
    el.textContent = `${t.getFullYear()}/${fmt(t.getMonth()+1)}/${fmt(t.getDate())} ${fmt(t.getHours())}:${fmt(t.getMinutes())}:${fmt(t.getSeconds())}`;
  };
  tick(); setInterval(tick,1000);
});

// ===== 伪数据模型 =====
const MODEL = {
  baseLoad: 9800, baseStorage: 1350, nodes: 148, alerts: 1,
  loadAt(t){
    const w = (2*Math.PI)/360;
    const v = this.baseLoad + Math.sin(w*t/1000)*220 + rand(-60,60);
    return clamp(v, 8800, 11200);
  },
  storageAt(t){
    const w = (2*Math.PI)/(360*4);
    const v = this.baseStorage + Math.sin(w*t/1000)*40 + rand(-6,6);
    return clamp(v, 1200, 1500);
  },
  share(){
    let east=rand(22,30), north=rand(18,25), central=rand(16,22), south=rand(12,18), west=rand(10,16);
    let total = east+north+central+south+west;
    return [east, north, central, south, west].map(v=>v/total*100);
  }
};

// ===== 动态数值动画 =====
function animateNumber(el, to, suffix=""){
  const from = parseFloat((el.dataset.val ?? "0"));
  const dur = 600; const t0 = performance.now();
  function step(t){
    const k = Math.min(1,(t-t0)/dur);
    const val = from + (to - from)*k;
    el.innerHTML = `${val.toLocaleString(undefined,{maximumFractionDigits:0})}${suffix}`;
    if(k<1) requestAnimationFrame(step); else el.dataset.val = to;
  }
  requestAnimationFrame(step);
}

// ===== 主体初始化 =====
let flowChart, sharePie;
document.addEventListener("DOMContentLoaded", ()=>{
  // 折线图
  const ctx1 = document.getElementById("flowChart").getContext("2d");
  const labels = [], data = [];
  const now = nowBJ();
  for(let i=29;i>=0;i--){
    const t = new Date(now - i*2000);
    labels.push(`${fmt(t.getMinutes())}:${fmt(t.getSeconds())}`);
    data.push(MODEL.loadAt(t.getTime()));
  }
  flowChart = new Chart(ctx1,{
    type:"line",
    data:{labels, datasets:[{
      label:"MW", data,
      borderColor:"#00B4D8",
      backgroundColor:"rgba(0,180,255,.18)",
      tension:.35, pointRadius:0, fill:true, borderWidth:2
    }]},
    options:{
      responsive:true, maintainAspectRatio:false, animation:false,
      scales:{
        x:{ticks:{color:"#E0F7FF", maxRotation:0}, grid:{color:"rgba(255,255,255,.08)"}},
        y:{ticks:{color:"#E0F7FF"}, grid:{color:"rgba(255,255,255,.08)"}, suggestedMin:8800, suggestedMax:11200}
      },
      plugins:{legend:{display:false}}
    }
  });

  // 饼图
  const ctx2 = document.getElementById("sharePie").getContext("2d");
  const share = MODEL.share();
  sharePie = new Chart(ctx2,{
    type:"doughnut",
    data:{
      labels:["华东","华北","华中","华南","西部"],
      datasets:[{ data:share.map(v=>v.toFixed(1)),
        backgroundColor:["#00B4D8","#48CAE4","#90E0EF","#ADE8F4","#CAF0F8"], borderWidth:0
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      cutout:"58%",
      plugins:{legend:{display:true, labels:{color:"#E0F7FF"}}}
    }
  });

  // 热度矩阵
  const matrix = document.getElementById("heat-matrix");
  const cells = [];
  for(let i=0;i<60;i++){
    const d = document.createElement("div");
    d.className = "cell";
    matrix.appendChild(d);
    cells.push(d);
  }

  // 实时事件流
  const feed = document.getElementById("event-feed");
  const seedEvents = [
    "华东储能站出力上调 1.8%","西北风场功率波动回落至正常区间",
    "中部联络线延时 12ms（已恢复）","华南备用机组热态待命",
    "华北调频 AGC 参与率 96%","数据中心链路稳定度 99.3%",
    "西南水电日内出力+2.6%","边缘节点回传成功率提升至 99.8%"
  ];
  function pushEvent(){
    const t = nowBJ();
    const li = document.createElement("li");
    li.innerHTML = `<span class="ts">${fmt(t.getHours())}:${fmt(t.getMinutes())}:${fmt(t.getSeconds())}</span>${seedEvents[Math.floor(Math.random()*seedEvents.length)]}`;
    feed.prepend(li);
    requestAnimationFrame(()=> li.classList.add("show"));
    while(feed.children.length>10){ feed.lastChild.remove(); }
  }
  for(let i=0;i<5;i++) pushEvent();

  // KPI初始化
  const t0 = nowBJ().getTime();
  animateNumber(document.getElementById("kpi-load"), MODEL.loadAt(t0));
  animateNumber(document.getElementById("kpi-storage"), MODEL.storageAt(t0));

  // 定时更新
  function tick(){
    const t = nowBJ();
    flowChart.data.labels.push(`${fmt(t.getMinutes())}:${fmt(t.getSeconds())}`);
    if(flowChart.data.labels.length>30) flowChart.data.labels.shift();
    flowChart.data.datasets[0].data.push(MODEL.loadAt(t.getTime()));
    if(flowChart.data.datasets[0].data.length>30) flowChart.data.datasets[0].data.shift();
    flowChart.update();

    sharePie.data.datasets[0].data = MODEL.share().map(v=>v.toFixed(1));
    sharePie.update();

    animateNumber(document.getElementById("kpi-load"), MODEL.loadAt(t.getTime()));
    animateNumber(document.getElementById("kpi-storage"), MODEL.storageAt(t.getTime()));

    for(const c of cells){ c.classList.toggle("on", Math.random()<0.18); }
    if(Math.random()<0.5) pushEvent();
  }

  const ms = now.getMilliseconds();
  setTimeout(()=>{ tick(); setInterval(tick,2000); }, 2000 - (ms%2000));
});

// ===== 全国能量流动态监测卡片 =====
document.addEventListener("DOMContentLoaded", ()=>{
  const cvs = document.getElementById("energyFlow");
  if(!cvs) return;
  const ctx = cvs.getContext("2d");
  let w,h,t=0;

  function resize(){ w=cvs.width=cvs.clientWidth; h=cvs.height=cvs.clientHeight; }
  window.addEventListener("resize",resize); resize();

  function draw(){
    ctx.clearRect(0,0,w,h);
    for(let i=0;i<3;i++){
      const y = h/3 + i*8;
      ctx.beginPath();
      for(let x=0;x<w;x++){
        const y2 = y + Math.sin((x/80)+t+i)*5;
        if(x===0) ctx.moveTo(x,y2); else ctx.lineTo(x,y2);
      }
      const g = ctx.createLinearGradient(0,0,w,0);
      g.addColorStop(0,"rgba(0,180,255,0)");
      g.addColorStop(.25,"rgba(0,220,255,.6)");
      g.addColorStop(.75,"rgba(255,255,255,.35)");
      g.addColorStop(1,"rgba(0,180,255,0)");
      ctx.strokeStyle=g;
      ctx.lineWidth=2.5;
      ctx.stroke();
    }
    t+=0.04;
    requestAnimationFrame(draw);
  }
  draw();

  // 模拟数值波动
  setInterval(()=>{
    const p = 52000 + Math.sin(Date.now()/3000)*300 + Math.random()*50;
    const eff = 98 + Math.sin(Date.now()/5000)*1 + Math.random()*0.2;
    document.getElementById("total-power").textContent = p.toFixed(0);
    document.getElementById("efficiency").textContent = eff.toFixed(1);
  },1000);
});
