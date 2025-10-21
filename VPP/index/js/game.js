document.addEventListener("DOMContentLoaded", () => {
  const ctx = document.getElementById("priceChart").getContext("2d");
  const dataPoints = [];
  const labels = [];

  // ===== 电价模型参数 =====
  const BASE_PRICE = 100;     // 平均电价
  const MAX_PRICE = 120;
  const MIN_PRICE = 80;
  const AMPLITUDE = 10;       // 正弦波幅度 ±10
  const RANDOM_NOISE = 2;     // 随机扰动范围
  const INTERVAL = 2000;      // 每两秒刷新一次
  const WINDOW_SIZE = 30;     // 显示 30 个点（1 分钟）

  let phase = Math.random() * Math.PI * 2; // 初始相位随机化

  // ===== 创建图表 =====
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "电价走势",
        data: dataPoints,
        borderColor: "#00B4D8",
        borderWidth: 2,
        fill: true,
        backgroundColor: "rgba(0,180,255,0.2)",
        pointRadius: 0,
        tension: 0.3
      }]
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,  // 保持比例避免被拉伸
      scales: {
        x: {
          ticks: { color: "#E0F7FF" },
          title: { display: true, text: "时间（秒）", color: "#E0F7FF" }
        },
        y: {
          ticks: { color: "#E0F7FF" },
          title: { display: true, text: "电价（元 / 百亿千瓦时）", color: "#E0F7FF" },
          min: MIN_PRICE - 5,
          max: MAX_PRICE + 5
        }
      },
      plugins: { legend: { display: false } }
    }
  });

  // ===== 从 main.js 获取北京时间偏移量 =====
  const getBeijingTime = () => {
    const offsetMs = window.offsetMs || 0;
    return new Date(Date.now() + offsetMs);
  };

  // ===== 平滑电价函数 =====
  function generatePrice(timeMs) {
    const t = timeMs / 1000; // 秒
    const omega = (2 * Math.PI) / 360; // 6分钟一个周期
    let price = BASE_PRICE + AMPLITUDE * Math.sin(omega * t + phase);
    price += (Math.random() - 0.5) * RANDOM_NOISE * 2; // 小扰动
    return Math.max(MIN_PRICE, Math.min(MAX_PRICE, price));
  }

  // ===== 初始化：生成过去29个数据点 =====
  const now = getBeijingTime();
  const currentSec = now.getSeconds();
  for (let i = -(WINDOW_SIZE - 1); i <= 0; i++) {
    const t = new Date(now.getTime() + i * INTERVAL);
    const p = generatePrice(t.getTime());
    dataPoints.push(p.toFixed(1));
    const secLabel = ((currentSec + i * 2 + 60) % 60).toString().padStart(2, "0");
    labels.push(secLabel);
  }

  // ===== 实时更新逻辑 =====
  function updatePrice() {
    const now = getBeijingTime();
    const price = generatePrice(now.getTime());
    const secLabel = (now.getSeconds()).toString().padStart(2, "0");

    dataPoints.push(price.toFixed(1));
    labels.push(secLabel);

    if (dataPoints.length > WINDOW_SIZE) {
      dataPoints.shift();
      labels.shift();
    }

    chart.update();

    // 更新卡片
    const priceCard = document.getElementById("priceCard");
    priceCard.textContent = `当前电价：${price.toFixed(1)} 元/百亿千瓦时`;
    priceCard.style.color = price > BASE_PRICE ? "#FF7070" : "#70FF70";
  }

  // 对齐北京时间的偶数秒启动
  const alignToNextTick = () => {
    const ms = now.getMilliseconds();
    const wait = INTERVAL - (ms % INTERVAL);
    setTimeout(() => {
      updatePrice();
      setInterval(updatePrice, INTERVAL);
    }, wait);
  };
  alignToNextTick();

  // ===== 滑动条与输入框联动 =====
  const slider = document.getElementById("tradeSlider");
  const input = document.getElementById("tradeInput");
  slider.addEventListener("input", () => input.value = slider.value);
  input.addEventListener("input", () => slider.value = input.value);

  // ===== 简易交易逻辑 =====
  let funds = 0; // 初始能量币
  let storage = 300;
  const profitCard = document.getElementById("profitCard");
  const capacityCard = document.getElementById("capacityCard");

  function refreshCards() {
    profitCard.textContent = `当前收益：${funds.toFixed(1)} 亿能量币`;
    capacityCard.textContent = `可交易电量：${storage.toFixed(1)} 百亿千瓦时`;
  }

  document.getElementById("buyBtn").addEventListener("click", () => {
    const amount = parseFloat(input.value);
    const currentPrice = parseFloat(dataPoints[dataPoints.length - 1]);
    if (funds < currentPrice * amount / 100) {
      alert("资金不足！");
      return;
    }
    funds -= currentPrice * amount / 100;
    storage += amount;
    refreshCards();
  });

  document.getElementById("sellBtn").addEventListener("click", () => {
    const amount = parseFloat(input.value);
    const currentPrice = parseFloat(dataPoints[dataPoints.length - 1]);
    if (storage < amount) {
      alert("电量不足！");
      return;
    }
    funds += currentPrice * amount / 100;
    storage -= amount;
    refreshCards();
  });

  refreshCards();

  // ===== 垂直滚动新闻 =====
  const newsEl = document.getElementById("newsText");
  const newsSamples = [
    "华东电网负荷创新高，调度中心启动应急预案",
    "西南水电出力上升，跨区交易量增长15%",
    "北方新能源装机加速，风光发电占比再创新高",
    "中部电力现货市场波动，交易活跃度上升",
    "储能技术突破，电站运行效率提升显著",
    "国家能源局发布新规，推动虚拟电厂试点扩围",
    "夜间低谷电价走低，大型储能场持续充电",
    "数据中心用电需求猛增，局部电价上扬"
  ];

  newsEl.innerHTML = newsSamples.map(n => `<div class="news-item">${n}</div>`).join("");
  let currentIndex = 0;

  setInterval(() => {
    const items = document.querySelectorAll(".news-item");
    currentIndex = (currentIndex + 1) % items.length;
    items.forEach((item, idx) => {
      const offset = (idx - currentIndex + items.length) % items.length;
      item.style.transform = `translateY(${offset * 120}px)`;
      item.style.opacity = offset === 0 ? 1 : 0;
    });
  }, 4000);

  // ===== 窗口大小变化时自动刷新图表 =====
  window.addEventListener("resize", () => {
    chart.resize();
    chart.update();
  });
});
