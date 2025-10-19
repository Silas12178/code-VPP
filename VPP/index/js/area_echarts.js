/* ====== 功能说明 ======
文件：js/area_echarts.js
作用：在 #chinaMap 容器中渲染中国地图，点击省份后更新右侧卡片内容
依赖：echarts.min.js / china.js
====== */

document.addEventListener("DOMContentLoaded", () => {
  const dom = document.getElementById("chinaMap");
  if (!dom) return;

  // 保底高度
  if (dom.offsetHeight < 100) dom.style.minHeight = "320px";

  // ====== 注册地图（容错） ======
  try {
    if (!echarts.getMap || !echarts.getMap("china")) {
      if (typeof chinaJson !== "undefined") echarts.registerMap("china", chinaJson);
      if (typeof chinaGeoJson !== "undefined") echarts.registerMap("china", chinaGeoJson);
    }
  } catch (e) {
    console.warn("地图注册异常:", e);
  }

  const chart = echarts.init(dom);

  // ====== 构造地图配置 ======
  const option = {
    backgroundColor: "transparent",
    tooltip: { show: false },
    series: [{
      name: "中国",
      type: "map",
      map: "china",
      roam: false,               // 禁止拖动
      zoom: 1.1,
      selectedMode: "single",    // 单选模式
      silent: false,
      triggerEvent: true,
      label: { show: false },    // 禁止文字标签，避免遮挡点击层
      itemStyle: {
        borderColor: "#00B4D8",
        areaColor: "#144272"
      },
      emphasis: {
        itemStyle: { areaColor: "#0096C7" },
        label: { show: true, color: "#fff", fontWeight: "bold" }
      },

      // ====== 显式提供 data，让点击事件能取到省名 ======
      data: [
        { name: "北京", value: 1 }, { name: "天津", value: 1 }, { name: "河北", value: 1 },
        { name: "山西", value: 1 }, { name: "内蒙古", value: 1 }, { name: "辽宁", value: 1 },
        { name: "吉林", value: 1 }, { name: "黑龙江", value: 1 }, { name: "上海", value: 1 },
        { name: "江苏", value: 1 }, { name: "浙江", value: 1 }, { name: "安徽", value: 1 },
        { name: "福建", value: 1 }, { name: "江西", value: 1 }, { name: "山东", value: 1 },
        { name: "河南", value: 1 }, { name: "湖北", value: 1 }, { name: "湖南", value: 1 },
        { name: "广东", value: 1 }, { name: "广西", value: 1 }, { name: "海南", value: 1 },
        { name: "重庆", value: 1 }, { name: "四川", value: 1 }, { name: "贵州", value: 1 },
        { name: "云南", value: 1 }, { name: "西藏", value: 1 }, { name: "陕西", value: 1 },
        { name: "甘肃", value: 1 }, { name: "青海", value: 1 }, { name: "宁夏", value: 1 },
        { name: "新疆", value: 1 }, { name: "台湾", value: 1 }, { name: "香港", value: 1 },
        { name: "澳门", value: 1 },{ name: "南海诸岛", value: 1 },

      ]
    }]
  };

  chart.setOption(option);

  // ====== 点击省份后更新右侧卡片内容 ======
  chart.on("click", function (params) {
    console.log("地图点击事件触发:", params);

    // ECharts 兼容层提取省份名
    let name = "";
    if (params.name) name = params.name;
    else if (params.data && params.data.name) name = params.data.name;
    else if (params.region && params.region.properties && params.region.properties.name)
      name = params.region.properties.name;

    if (!name) {
      console.warn("未获取到省份名称，事件来源：", params.componentType);
      return;
    }

    // 更新右侧卡片
    const card = document.querySelector(".top-card");
    if (!card) return;

    card.textContent = name;
    const len = name.length;
    let size = 26;
    if (len > 4) size = 22;
    if (len > 6) size = 18;
    if (len > 8) size = 16;
    card.style.fontSize = `${size}px`;

    // 选中高亮
    chart.dispatchAction({
      type: "select",
      name: name
    });

    // 淡入动画
    card.style.opacity = 0;
    setTimeout(() => {
      card.style.transition = "opacity 0.3s ease";
      card.style.opacity = 1;
    }, 10);
  });

  // ====== 自适应窗口尺寸 ======
  window.addEventListener("resize", () => chart.resize());
});
