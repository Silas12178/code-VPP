// 保留空文件用于后续动态功能扩展
console.log("虚拟电网系统终端已加载。");
//======== 时间显示模块 ========//
//======== 时钟：先本地渲染，再异步校准北京时 ========//
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
  renderClock();                 // 立刻显示：避免“空白后突然出现”
  setInterval(renderClock, 1000);
  syncBeijingTime();             // 异步校时（成功后无感切换）
  // 可选：每5分钟再校一次，进一步稳健
  // setInterval(syncBeijingTime, 5 * 60 * 1000);
});
