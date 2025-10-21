// 保留空文件用于后续动态功能扩展
console.log("虚拟电网系统终端已加载。");
//======== 时间显示模块 ========
//======== 时钟：先本地渲染，再异步校准北京时 ========
let offsetMs = 0;  // 联网成功后 = 北京时间 - 本地时间（毫秒）

function format(dt) {
  const pad = n => String(n).padStart(2, '0');
  const y = dt.getFullYear();
  const m = pad(dt.getMonth() + 1);
  const d = pad(dt.getDate());
  const h = pad(dt.getHours());
  const mi = pad(dt.getMinutes());
  const s = pad(dt.getSeconds());
  return `${y}/${m}/${d} ${h}:${mi}:${s}`;
}

function renderClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const now = new Date(Date.now() + offsetMs);
  el.textContent = format(now);
}

async function syncBeijingTime() {
  try {
    const r = await fetch("https://worldtimeapi.org/api/timezone/Asia/Shanghai", { cache: "no-store" });
    if (!r.ok) throw new Error("network");
    const data = await r.json();
    const serverTs = new Date(data.datetime).getTime();
    offsetMs = serverTs - Date.now();   // 只更新偏移，不阻塞渲染
  } catch (e) {
    // 断网则维持本地时间，无需处理
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderClock();                 // 立刻显示：避免"空白后突然出现"
  setInterval(renderClock, 1000);
  syncBeijingTime();             // 异步校时（成功后无感切换）
  // 可选：每5分钟再校一次，进一步稳健
  // setInterval(syncBeijingTime, 5 * 60 * 1000);
});

// ====== 关闭终端弹窗逻辑 ======
document.addEventListener("DOMContentLoaded", () => {
    const exitCard = document.querySelector(".exit-card");
    const modal = document.getElementById("exit-modal");
    const confirmExit = document.getElementById("confirm-exit");
    const cancelExit = document.getElementById("cancel-exit");

    exitCard.addEventListener("click", () => {
        modal.style.display = "flex";
    });

    cancelExit.addEventListener("click", () => {
        modal.style.display = "none";
    });

    confirmExit.addEventListener("click", () => {
        // ====== 页面关闭替代效果 ======
        document.body.innerHTML = `
            <div style="
                height:100vh;
                display:flex;
                justify-content:center;
                align-items:center;
                background:linear-gradient(135deg, #001F3F, #003F88);
                color:#E0F7FF;
                font-size:clamp(20px, 3vw, 50px);
                font-weight:bold;
                text-shadow:0 0 20px #33BBFF;
            ">
                终端已关闭
            </div>
        `;
    });
});
// ====== 字幕滚动条逻辑 ======
document.addEventListener("DOMContentLoaded", () => {
  const textEl = document.getElementById("subtitle-text");
  if (!textEl) return;

  const text = "////全国虚拟电厂控制系统将于每月15日北京时间凌晨三点整进行维护，预计维护时间两个小时，届时系统将无法使用，请各调度组设定好自主运行方案      ////     全国虚拟电厂系统只能于内网使用，严禁链接公网或泄露源码，如有此类情况发生，涉事者将依法受到刑事追责";

  // 复制两次，保证无缝衔接
  textEl.textContent = text + "     " + text;

  textEl.style.whiteSpace = "nowrap";
  textEl.style.display = "inline-block";
  textEl.style.willChange = "transform";

  let x = 0;
  function scroll() {
    x -= 0.5; // 滚动速度（可调）
    if (Math.abs(x) >= textEl.scrollWidth / 2) {
      // 当第一个文本完全滚出后，不是重置，而是继续无缝平移
      x = 0;
    }
    textEl.style.transform = `translateX(${x}px)`;
    requestAnimationFrame(scroll);
  }

  scroll();
});

// ====== "点此申请更高权限" 跳转功能 ======
document.addEventListener("DOMContentLoaded", () => {
  const githubCard = document.getElementById("github-link");
  if (githubCard) {
    githubCard.addEventListener("click", () => {
      window.open("https://github.com/Silas12178/code-VPP", "_blank");
    });
  }
});

// ====== 背景星光层逻辑（改进版：自适应窗口） ======
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("bg-stars");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let stars = [];
  const DENSITY = 0.00015; // 星点密度（越大越多）

  // 生成星点
  function createStars() {
    const count = Math.floor(window.innerWidth * window.innerHeight * DENSITY);
    const newStars = [];
    for (let i = 0; i < count; i++) {
      newStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        baseR: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        speed: (Math.random() * 0.3 + 0.1) * (Math.random() < 0.5 ? 1 : -1),
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15
      });
    }
    stars = newStars;
  }

  // 调整尺寸时重建星空
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createStars();
  }

  window.addEventListener("resize", resize);
  resize();

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let s of stars) {
      s.r += s.speed * 0.02;
      if (s.r > s.baseR * 1.8 || s.r < s.baseR * 0.5) s.speed *= -1;

      s.x += s.vx;
      s.y += s.vy;
      if (s.x < 0) s.x = canvas.width;
      if (s.x > canvas.width) s.x = 0;
      if (s.y < 0) s.y = canvas.height;
      if (s.y > canvas.height) s.y = 0;

      const gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2);
      gradient.addColorStop(0, `rgba(255,255,255,${0.8 * s.alpha})`);
      gradient.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
});

// ====== “进入对应地区终端” 按钮加载动画（含禁区判断 + 跳转page2） ======
document.addEventListener("DOMContentLoaded", () => {
  const enterBtn = document.querySelector(".middle-card");
  const overlay = document.getElementById("loading-overlay");
  const text = document.querySelector(".loading-text");
  const topCard = document.querySelector(".top-card");

  if (!enterBtn || !overlay || !text || !topCard) return;

  enterBtn.addEventListener("click", () => {
    const province = topCard.textContent.trim();

    // ① 未选择行政区
    if (province === "等待选择行政区" || province === "") {
      alert("⚠️ 请选择对应行政区后再进入终端。");
      return;
    }

    // ② 禁止访问行政区列表
    const restricted = ["澳门", "北京", "天津", "重庆", "台湾" ,"南海诸岛"];
    if (restricted.includes(province)) {
      window.location.href = `page1.html?region=${encodeURIComponent(province)}`;
      return;
    }

    // ③ 普通行政区 → 播放加载动画并跳转 page2
    overlay.style.display = "flex";

    // === 星光背景逻辑 ===
    const canvas = document.getElementById("loading-stars");
    const ctx = canvas.getContext("2d");
    const DENSITY = 0.0001;
    let stars = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.floor(canvas.width * canvas.height * DENSITY);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2);
        gradient.addColorStop(0, `rgba(255,255,255,${0.8 * s.alpha})`);
        gradient.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);

    // === 从左至右扫光渐显动画逻辑 ===
const phrase = "人民电业为人民";
text.innerHTML = ""; // 清空旧内容
const chars = phrase.split("");

chars.forEach((char, i) => {
  const span = document.createElement("span");
  span.textContent = char;
  span.style.display = "inline-block";
  span.style.opacity = "0";
  span.style.transform = "translateX(-30px)";
  span.style.animation = "slideIn 0.8s ease forwards";
  span.style.animationDelay = `${i * 0.3}s`; // 每个字依次延迟
  text.appendChild(span);
});

// 定义动画样式
const style = document.createElement("style");
style.textContent = `
@keyframes slideIn {
  0% {
    opacity: 0;
    transform: translateX(-30px);
    filter: brightness(2);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
    filter: brightness(1);
  }
}`;
document.head.appendChild(style);
    // 5 秒后跳转 page2.html
    setTimeout(() => {
      window.location.href = `page2.html?region=${encodeURIComponent(province)}`;
    }, 5000);
  });
});
