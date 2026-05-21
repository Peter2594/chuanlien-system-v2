/**
 * 串連系統 v2.2 - 產品介紹簡報
 * 用 pptxgenjs 從零建立
 *
 * 色板：Midnight Executive
 *   主色 #1E2761 (navy) - 60% 視覺權重
 *   副色 #CADCFC (ice blue) - 30%
 *   輔色 #FFFFFF (white)、#F96167 (coral, 強調)、#FFC857 (gold, 數字)
 */
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";  // 13.3 × 7.5
pres.author = "資管導論 第 13 組";
pres.title  = "串連系統 v2.2 — 投資公司管理層決策輔助";

// ===== 色板 =====
const NAVY    = "1E2761";
const NAVY_2  = "2A3B7C";   // 稍淺
const ICE     = "CADCFC";
const WHITE   = "FFFFFF";
const CORAL   = "F96167";   // 警示 / 痛點
const GOLD    = "FFC857";   // 大數字
const GREEN   = "10B981";
const SLATE   = "475569";
const GREY    = "94A3B8";
const LIGHT   = "F1F5F9";

// 字型（中文用思源黑/微軟正黑都行，但 pptx 預設 fallback 機制比較穩用 Calibri / Arial Black）
const FH = "Microsoft JhengHei UI";   // header
const FB = "Microsoft JhengHei";      // body

// =============================================================
// Helper: 標準頁腳
// =============================================================
function addFooter(slide, pageNum, totalPages) {
  // 底部 line
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 7.15, w: 12.3, h: 0,
    line: { color: ICE, width: 0.75 },
  });
  // 左側 - 系統名
  slide.addText("串連系統 v2.2 · Chuanlien System", {
    x: 0.5, y: 7.2, w: 6, h: 0.25,
    fontSize: 9, fontFace: FB, color: GREY,
  });
  // 右側 - 頁碼
  slide.addText(`${pageNum} / ${totalPages}`, {
    x: 11.8, y: 7.2, w: 1, h: 0.25,
    fontSize: 9, fontFace: FB, color: GREY, align: "right",
  });
}

// 視覺 motif：左上角數字標籤（小色塊 + 編號）
function addCornerLabel(slide, label, color = NAVY) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.5, w: 0.6, h: 0.35,
    fill: { color }, line: { type: "none" },
  });
  slide.addText(label, {
    x: 0.5, y: 0.5, w: 0.6, h: 0.35,
    fontSize: 11, fontFace: FH, color: WHITE, bold: true,
    align: "center", valign: "middle", margin: 0,
  });
}

// =============================================================
// Slide 1: 封面 (Dark, Hero)
// =============================================================
const TOTAL = 14;
const s1 = pres.addSlide();
s1.background = { color: NAVY };

// 左側裝飾豎條
s1.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 0.4, h: 7.5,
  fill: { color: CORAL }, line: { type: "none" },
});

// Logo / 標誌
s1.addText("串", {
  x: 0.9, y: 0.6, w: 0.8, h: 0.8,
  fontSize: 48, fontFace: FH, color: CORAL, bold: true,
  align: "center", valign: "middle", margin: 0,
});

s1.addText("CHUANLIEN SYSTEM · v2.2", {
  x: 0.9, y: 1.5, w: 8, h: 0.4,
  fontSize: 12, fontFace: FH, color: ICE, charSpacing: 6,
});

// 主標
s1.addText("串連系統", {
  x: 0.9, y: 2.0, w: 11, h: 1.3,
  fontSize: 72, fontFace: FH, color: WHITE, bold: true,
});

s1.addText("投資公司管理層決策輔助系統", {
  x: 0.9, y: 3.3, w: 11, h: 0.7,
  fontSize: 28, fontFace: FH, color: ICE,
});

// 分隔線
s1.addShape(pres.shapes.LINE, {
  x: 0.9, y: 4.4, w: 1.5, h: 0,
  line: { color: CORAL, width: 2 },
});

// 副述
s1.addText("用恰當的演算法，解決管理層真正的痛點", {
  x: 0.9, y: 4.6, w: 11, h: 0.6,
  fontSize: 18, fontFace: FB, color: WHITE, italic: true,
});

// 底部資訊條
s1.addText("資管導論 第 13 組  ·  React 19 + TypeScript + Firebase  ·  25 演算法整合",
  { x: 0.9, y: 6.3, w: 11, h: 0.4, fontSize: 12, fontFace: FB, color: ICE });

// 右下角小裝飾
s1.addShape(pres.shapes.RECTANGLE, {
  x: 11.8, y: 6.6, w: 1.2, h: 0.6,
  fill: { color: CORAL }, line: { type: "none" },
});
s1.addText("v2.2", {
  x: 11.8, y: 6.6, w: 1.2, h: 0.6,
  fontSize: 18, fontFace: FH, color: WHITE, bold: true,
  align: "center", valign: "middle", margin: 0,
});

// =============================================================
// Slide 2: 痛點 — 為什麼需要這個系統
// =============================================================
const s2 = pres.addSlide();
s2.background = { color: WHITE };
addCornerLabel(s2, "01", NAVY);

s2.addText("管理層每天面對的問題", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s2.addText("痛點是什麼？", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});

// 4 個痛點卡片
const painPoints = [
  { icon: "⏰", title: "時間少", desc: "董事長 / COO 每天行程滿，沒時間翻 50 頁報表" },
  { icon: "🔀", title: "資料散", desc: "週報、交接、決策、卡點…散在不同地方，沒有整合視角" },
  { icon: "❓", title: "看不清", desc: "卡點到底嚴重嗎？員工負載合理嗎？沒有量化標準" },
  { icon: "🎯", title: "難決策", desc: "做決策前不知道後果，做完後也不知道有沒有改善" },
];

painPoints.forEach((p, i) => {
  const x = 0.6 + (i % 4) * 3.1;
  const y = 2.5;
  // 卡片
  s2.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 2.85, h: 4,
    fill: { color: LIGHT }, line: { color: ICE, width: 1 },
  });
  // 左側色條
  s2.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.08, h: 4,
    fill: { color: CORAL }, line: { type: "none" },
  });
  // Icon
  s2.addText(p.icon, {
    x: x + 0.3, y: y + 0.3, w: 1, h: 1,
    fontSize: 44, align: "left", valign: "middle", margin: 0,
  });
  // Title
  s2.addText(p.title, {
    x: x + 0.3, y: y + 1.5, w: 2.4, h: 0.6,
    fontSize: 26, fontFace: FH, color: NAVY, bold: true,
  });
  // Desc
  s2.addText(p.desc, {
    x: x + 0.3, y: y + 2.2, w: 2.4, h: 1.5,
    fontSize: 13, fontFace: FB, color: SLATE,
  });
});

// 結論句
s2.addText([
  { text: "→ 我們需要一個", options: { color: SLATE } },
  { text: "懂演算法、會自動整合、可以解釋", options: { color: NAVY, bold: true } },
  { text: "的決策輔助平台。", options: { color: SLATE } },
], {
  x: 0.5, y: 6.6, w: 12, h: 0.4,
  fontSize: 14, fontFace: FB, align: "center",
});

addFooter(s2, 2, TOTAL);

// =============================================================
// Slide 3: 解法總覽 — 10 個模組
// =============================================================
const s3 = pres.addSlide();
s3.background = { color: WHITE };
addCornerLabel(s3, "02", NAVY);

s3.addText("解法概觀", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s3.addText("10 個整合模組", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});
s3.addText("從週報到決策，從卡點到雷達，全部聯動。", {
  x: 0.5, y: 2.0, w: 12, h: 0.4,
  fontSize: 16, fontFace: FB, color: SLATE,
});

const modules = [
  { name: "Dashboard",        cn: "管理層摘要",     color: NAVY },
  { name: "WeeklyReport",     cn: "週報填寫",       color: NAVY_2 },
  { name: "Handoff",          cn: "案件交接",       color: NAVY },
  { name: "Decisions",        cn: "決策追蹤",       color: NAVY_2 },
  { name: "EmployeeLoad",     cn: "員工負載",       color: NAVY },
  { name: "History",          cn: "歷史搜尋",       color: NAVY_2 },
  { name: "BlockerAnalytics", cn: "卡點分析",       color: NAVY },
  { name: "OrgAnalytics",     cn: "組織網絡",       color: NAVY_2 },
  { name: "MeetingPrep",      cn: "會議準備",       color: NAVY },
  { name: "WhatIf",           cn: "決策模擬",       color: CORAL },  // 強調新功能
];

modules.forEach((m, i) => {
  const col = i % 5;
  const row = Math.floor(i / 5);
  const x = 0.6 + col * 2.5;
  const y = 2.9 + row * 1.85;

  s3.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 2.3, h: 1.55,
    fill: { color: m.color }, line: { type: "none" },
  });
  s3.addText(m.name, {
    x: x + 0.2, y: y + 0.25, w: 1.9, h: 0.4,
    fontSize: 13, fontFace: FH, color: ICE, bold: true,
  });
  s3.addText(m.cn, {
    x: x + 0.2, y: y + 0.7, w: 1.9, h: 0.6,
    fontSize: 18, fontFace: FH, color: WHITE, bold: true,
  });
});

addFooter(s3, 3, TOTAL);

// =============================================================
// Slide 4: 為什麼不用 LLM
// =============================================================
const s4 = pres.addSlide();
s4.background = { color: WHITE };
addCornerLabel(s4, "03", CORAL);

s4.addText("核心設計哲學", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s4.addText("為什麼不用 LLM？", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});

// 5 個理由（左側列表 + 右側 highlight）
const reasons = [
  ["資料量小",   "53 筆歷史案、200 筆週報。BM25F 比 Embedding 更可靠。"],
  ["可解釋性",   "管理層需要知道「為什麼推薦這筆」，LLM 是黑盒。"],
  ["機密敏感",   "投資資料不能送 cloud API，全部前端 + 自有 Firebase。"],
  ["計算成本",   "O(N) 或 O(N log N)，瀏覽器毫秒級完成。"],
  ["確定性",     "相同輸入永遠回傳相同結果，LLM 有 stochasticity。"],
];

reasons.forEach((r, i) => {
  const y = 2.5 + i * 0.85;
  // 編號圓圈
  s4.addShape(pres.shapes.OVAL, {
    x: 0.6, y, w: 0.55, h: 0.55,
    fill: { color: CORAL }, line: { type: "none" },
  });
  s4.addText(`${i + 1}`, {
    x: 0.6, y, w: 0.55, h: 0.55,
    fontSize: 18, fontFace: FH, color: WHITE, bold: true,
    align: "center", valign: "middle", margin: 0,
  });
  // 標籤
  s4.addText(r[0], {
    x: 1.4, y: y + 0.02, w: 1.8, h: 0.5,
    fontSize: 20, fontFace: FH, color: NAVY, bold: true,
  });
  // 描述
  s4.addText(r[1], {
    x: 3.3, y: y + 0.08, w: 6.3, h: 0.5,
    fontSize: 13, fontFace: FB, color: SLATE,
  });
});

// 右側引言框
s4.addShape(pres.shapes.RECTANGLE, {
  x: 10.0, y: 2.3, w: 2.8, h: 4.5,
  fill: { color: NAVY }, line: { type: "none" },
});
s4.addText("「", {
  x: 10.1, y: 2.3, w: 0.8, h: 0.8,
  fontSize: 60, fontFace: FH, color: CORAL, bold: true, margin: 0,
});
s4.addText("用恰當的演算法，解決恰當規模的問題。", {
  x: 10.2, y: 3.2, w: 2.5, h: 2.5,
  fontSize: 18, fontFace: FH, color: WHITE, italic: true, valign: "top",
});
s4.addText("— 串連系統設計哲學", {
  x: 10.2, y: 6.0, w: 2.5, h: 0.5,
  fontSize: 11, fontFace: FB, color: ICE,
});

addFooter(s4, 4, TOTAL);

// =============================================================
// Slide 5: 亮點 #1 — 組織健康度雷達
// =============================================================
const s5 = pres.addSlide();
s5.background = { color: WHITE };
addCornerLabel(s5, "04", NAVY);

s5.addText("亮點一", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s5.addText("組織健康度雷達", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});
s5.addText("6 維 × 12 週趨勢 × 拐點偵測 × 點擊事件 inline 展開", {
  x: 0.5, y: 2.0, w: 12, h: 0.4,
  fontSize: 16, fontFace: FB, color: SLATE,
});

// 左側：嵌入雷達圖
s5.addImage({
  path: "docs/images/10_radar.png",
  x: 0.6, y: 2.6, w: 6, h: 4.3,
});

// 右側：6 維說明
const dims = [
  ["卡點健康", "22%", "P95+ 卡點越少越健康"],
  ["決策及時", "18%", "逾期決策越少越健康"],
  ["交接流暢", "15%", "待簽收逾時越少越健康"],
  ["負載均衡", "18%", "Gini < 0.35 為健康"],
  ["部門協作", "12%", "雙向溝通對稱為健康"],
  ["週報品質", "15%", "繳交率 + 內容深度"],
];

dims.forEach((d, i) => {
  const y = 2.7 + i * 0.7;
  // 點
  s5.addShape(pres.shapes.OVAL, {
    x: 7.0, y: y + 0.15, w: 0.25, h: 0.25,
    fill: { color: NAVY }, line: { type: "none" },
  });
  // 維度名
  s5.addText(d[0], {
    x: 7.4, y, w: 1.7, h: 0.5,
    fontSize: 16, fontFace: FH, color: NAVY, bold: true,
  });
  // 權重
  s5.addText(d[1], {
    x: 9.1, y, w: 0.8, h: 0.5,
    fontSize: 14, fontFace: FH, color: CORAL, bold: true,
  });
  // 說明
  s5.addText(d[2], {
    x: 7.4, y: y + 0.35, w: 5.4, h: 0.4,
    fontSize: 11, fontFace: FB, color: SLATE,
  });
});

addFooter(s5, 5, TOTAL);

// =============================================================
// Slide 6: 亮點 #2 — BM25F 智能推薦
// =============================================================
const s6 = pres.addSlide();
s6.background = { color: WHITE };
addCornerLabel(s6, "05", NAVY);

s6.addText("亮點二", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s6.addText("BM25F 智能案件推薦", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});
s6.addText("用 Elasticsearch / Lucene 同款演算法，推薦過去 3 筆最相似案件", {
  x: 0.5, y: 2.0, w: 12, h: 0.4,
  fontSize: 16, fontFace: FB, color: SLATE,
});

// 上方：BM25 TF 飽和曲線圖
s6.addImage({
  path: "docs/images/01_bm25_tf.png",
  x: 0.6, y: 2.6, w: 6, h: 3.2,
});

// 右側：4 個技術特色
const features = [
  { title: "TF 飽和函數", desc: "出現 5 次 vs 50 次，相關性差距收斂" },
  { title: "欄位權重",   desc: "標題 ×5、標籤 ×4、內文 ×1" },
  { title: "1+2+3-gram", desc: "中文無詞界，混合切詞精準召回" },
  { title: "同義詞",     desc: "募資 ≈ 融資 ≈ DD ≈ Due Diligence" },
];
features.forEach((f, i) => {
  const y = 2.7 + i * 0.8;
  s6.addShape(pres.shapes.RECTANGLE, {
    x: 7.2, y, w: 0.08, h: 0.7,
    fill: { color: NAVY }, line: { type: "none" },
  });
  s6.addText(f.title, {
    x: 7.4, y, w: 5.4, h: 0.4,
    fontSize: 16, fontFace: FH, color: NAVY, bold: true,
  });
  s6.addText(f.desc, {
    x: 7.4, y: y + 0.35, w: 5.4, h: 0.4,
    fontSize: 12, fontFace: FB, color: SLATE,
  });
});

// 底部結論
s6.addShape(pres.shapes.RECTANGLE, {
  x: 0.6, y: 6.1, w: 12.1, h: 0.8,
  fill: { color: LIGHT }, line: { type: "none" },
});
s6.addText([
  { text: "結果：", options: { fontFace: FH, color: NAVY, bold: true } },
  { text: "卡點 / 交接展開時，自動跑 BM25F 推薦過去 3 筆最相似案件 + 平均解決天數，", options: { fontFace: FB, color: SLATE } },
  { text: "把搜尋從被動工具變成主動決策輔助。", options: { fontFace: FB, color: NAVY, bold: true } },
], {
  x: 0.8, y: 6.1, w: 11.8, h: 0.8,
  fontSize: 13, valign: "middle",
});

addFooter(s6, 6, TOTAL);

// =============================================================
// Slide 7: 亮點 #3 — What-if 模擬器
// =============================================================
const s7 = pres.addSlide();
s7.background = { color: NAVY };
addCornerLabel(s7, "06", CORAL);

s7.addText("亮點三", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: ICE, charSpacing: 4,
});
s7.addText("What-if 決策模擬器", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: WHITE, bold: true,
});
s7.addText("做決策前，先看後果。", {
  x: 0.5, y: 2.0, w: 12, h: 0.4,
  fontSize: 18, fontFace: FB, color: ICE, italic: true,
});

// 流程圖（左）
s7.addImage({
  path: "docs/images/14_whatif.png",
  x: 0.5, y: 2.7, w: 7.5, h: 4.1,
});

// 右側：建議文案規則
s7.addText("Δ-Score 建議", {
  x: 8.4, y: 2.7, w: 4.5, h: 0.5,
  fontSize: 18, fontFace: FH, color: WHITE, bold: true,
});

const suggestions = [
  ["Δ ≥ +5", "顯著改善 ✨", GREEN],
  ["Δ +2~+5", "可考慮執行",   GOLD],
  ["Δ −2~+2", "影響不大",     ICE],
  ["Δ −5~−2", "需評估",       "FFA07A"],
  ["Δ ≤ −5", "⚠️ 不建議",     CORAL],
];
suggestions.forEach((s, i) => {
  const y = 3.4 + i * 0.6;
  s7.addShape(pres.shapes.RECTANGLE, {
    x: 8.4, y, w: 1.5, h: 0.5,
    fill: { color: s[2] }, line: { type: "none" },
  });
  s7.addText(s[0], {
    x: 8.4, y, w: 1.5, h: 0.5,
    fontSize: 12, fontFace: "Consolas", color: NAVY, bold: true,
    align: "center", valign: "middle", margin: 0,
  });
  s7.addText(s[1], {
    x: 10.05, y, w: 2.8, h: 0.5,
    fontSize: 13, fontFace: FB, color: WHITE, valign: "middle",
  });
});

addFooter(s7, 7, TOTAL);

// =============================================================
// Slide 8: 亮點 #4 — Decision Impact + Cohort Adjustment
// =============================================================
const s8 = pres.addSlide();
s8.background = { color: WHITE };
addCornerLabel(s8, "07", CORAL);

s8.addText("亮點四（v2.2 學術創舉）", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s8.addText("Cohort Adjustment", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});
s8.addText("解決「全部決策都被冤枉變負分」的因果歸因問題", {
  x: 0.5, y: 2.0, w: 12, h: 0.4,
  fontSize: 16, fontFace: FB, color: SLATE,
});

// 左：問題說明
s8.addText("⚠️ 問題", {
  x: 0.6, y: 2.7, w: 5.8, h: 0.4,
  fontSize: 16, fontFace: FH, color: CORAL, bold: true,
});
s8.addText("若整體組織趨勢下滑期間，所有決策的 delta 都會被冤枉變成負分。例如：", {
  x: 0.6, y: 3.15, w: 5.8, h: 0.7,
  fontSize: 13, fontFace: FB, color: SLATE,
});

// 計算範例 box（壞）
s8.addShape(pres.shapes.RECTANGLE, {
  x: 0.6, y: 3.95, w: 5.8, h: 1.5,
  fill: { color: "FEE2E2" }, line: { color: CORAL, width: 1 },
});
s8.addText([
  { text: "原本（v2.1）\n", options: { fontFace: FH, color: NAVY, bold: true, breakLine: true } },
  { text: "score = after − before\n", options: { fontFace: "Consolas", color: NAVY, breakLine: true } },
  { text: "       = 54 − 90 = −36 ❌\n", options: { fontFace: "Consolas", color: CORAL, bold: true, breakLine: true } },
  { text: "決策被冤枉：其實整體大環境本來就在惡化", options: { fontFace: FB, color: SLATE, italic: true } },
], {
  x: 0.85, y: 4.05, w: 5.5, h: 1.3,
  fontSize: 13,
});

// 右：解法
s8.addText("✓ 解法", {
  x: 6.9, y: 2.7, w: 5.8, h: 0.4,
  fontSize: 16, fontFace: FH, color: GREEN, bold: true,
});
s8.addText("用 12 週線性回歸算大盤每日漂移率，扣掉「同期基準漂移」：", {
  x: 6.9, y: 3.15, w: 5.8, h: 0.7,
  fontSize: 13, fontFace: FB, color: SLATE,
});

s8.addShape(pres.shapes.RECTANGLE, {
  x: 6.9, y: 3.95, w: 5.8, h: 1.5,
  fill: { color: "D1FAE5" }, line: { color: GREEN, width: 1 },
});
s8.addText([
  { text: "新版（v2.2 Cohort Adjustment）\n", options: { fontFace: FH, color: NAVY, bold: true, breakLine: true } },
  { text: "adjustedDelta = decisionDelta − baselineDrift\n", options: { fontFace: "Consolas", color: NAVY, breakLine: true } },
  { text: "             = −36 − (−42) = +6 ✓\n", options: { fontFace: "Consolas", color: GREEN, bold: true, breakLine: true } },
  { text: "決策實際上比基準好 6 分", options: { fontFace: FB, color: SLATE, italic: true } },
], {
  x: 7.15, y: 4.05, w: 5.5, h: 1.3,
  fontSize: 13,
});

// 底部 — 答辯關鍵字
s8.addShape(pres.shapes.RECTANGLE, {
  x: 0.6, y: 5.7, w: 12.1, h: 1.2,
  fill: { color: NAVY }, line: { type: "none" },
});
s8.addText("🎓 答辯關鍵字", {
  x: 0.85, y: 5.85, w: 4, h: 0.4,
  fontSize: 13, fontFace: FH, color: GOLD, bold: true,
});
s8.addText([
  { text: "大環境在掉、決策幫忙少掉 → 「逆境止血」；", options: { color: WHITE, fontFace: FB } },
  { text: "大環境在漲、決策漲得比大盤慢 → 「順風失職」", options: { color: WHITE, fontFace: FB } },
], {
  x: 0.85, y: 6.2, w: 11.8, h: 0.6,
  fontSize: 14, italic: true,
});

addFooter(s8, 8, TOTAL);

// =============================================================
// Slide 9: 演算法總覽
// =============================================================
const s9 = pres.addSlide();
s9.background = { color: WHITE };
addCornerLabel(s9, "08", NAVY);

s9.addText("技術深度", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s9.addText("25 個演算法分 7 類", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});

const algoCats = [
  { num: 6, name: "資訊檢索",  detail: "BM25F、RSJ IDF、n-gram、Substring、同義詞、Cosine",        color: NAVY },
  { num: 3, name: "統計分析",  detail: "Empirical Percentile、Gini、敘述統計",                       color: NAVY_2 },
  { num: 4, name: "時間序列",  detail: "Exp Decay、asOf Snapshot、Local Minima、Weekly Series",       color: NAVY },
  { num: 5, name: "加權評分",  detail: "Load Score、ORI、Health 6D、Decision Impact、Leader Score",   color: CORAL },
  { num: 3, name: "圖論網絡",  detail: "Adjacency Matrix、Force-directed、Asymmetric Detection",     color: NAVY_2 },
  { num: 2, name: "狀態判定",  detail: "Decision Helpers、Risk/Load/Health Level",                    color: NAVY },
  { num: 2, name: "預測模擬",  detail: "What-if Simulation、Smart Suggestion",                        color: NAVY_2 },
];

algoCats.forEach((c, i) => {
  const y = 2.2 + i * 0.65;
  // 數字 badge
  s9.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y, w: 0.8, h: 0.55,
    fill: { color: c.color }, line: { type: "none" },
  });
  s9.addText(`${c.num}`, {
    x: 0.6, y, w: 0.8, h: 0.55,
    fontSize: 24, fontFace: FH, color: WHITE, bold: true,
    align: "center", valign: "middle", margin: 0,
  });
  // 類別名
  s9.addText(c.name, {
    x: 1.6, y: y + 0.05, w: 2, h: 0.5,
    fontSize: 18, fontFace: FH, color: NAVY, bold: true,
  });
  // 內容
  s9.addText(c.detail, {
    x: 3.8, y: y + 0.1, w: 9, h: 0.5,
    fontSize: 12, fontFace: FB, color: SLATE,
  });
});

addFooter(s9, 9, TOTAL);

// =============================================================
// Slide 10: 視覺亮點之一 — 雷達 + 趨勢
// =============================================================
const s10 = pres.addSlide();
s10.background = { color: WHITE };
addCornerLabel(s10, "09", NAVY);

s10.addText("視覺化", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s10.addText("12 週趨勢 + 拐點偵測", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});
s10.addText("點任一週 → 顯示當週發生的事件 → 點事件 → inline 展開實際清單", {
  x: 0.5, y: 2.0, w: 12, h: 0.4,
  fontSize: 16, fontFace: FB, color: SLATE,
});

// 圖
s10.addImage({
  path: "docs/images/07_local_minima.png",
  x: 0.6, y: 2.6, w: 8, h: 4.3,
});

// 右側 3 個 callout
const callouts = [
  { num: "1", label: "自動偵測 V 型谷底", desc: "雙邊閾值 −3 分過濾雜訊" },
  { num: "2", label: "點擊 pin 住事件", desc: "顯示該週的卡點/決策/負載" },
  { num: "3", label: "Inline 展開清單", desc: "不用跳頁就看到實際項目" },
];
callouts.forEach((c, i) => {
  const y = 2.7 + i * 1.4;
  s10.addShape(pres.shapes.OVAL, {
    x: 9.0, y, w: 0.6, h: 0.6,
    fill: { color: CORAL }, line: { type: "none" },
  });
  s10.addText(c.num, {
    x: 9.0, y, w: 0.6, h: 0.6,
    fontSize: 20, fontFace: FH, color: WHITE, bold: true,
    align: "center", valign: "middle", margin: 0,
  });
  s10.addText(c.label, {
    x: 9.85, y, w: 3.3, h: 0.5,
    fontSize: 15, fontFace: FH, color: NAVY, bold: true,
  });
  s10.addText(c.desc, {
    x: 9.85, y: y + 0.4, w: 3.3, h: 0.7,
    fontSize: 12, fontFace: FB, color: SLATE,
  });
});

addFooter(s10, 10, TOTAL);

// =============================================================
// Slide 11: Plan → Decide → Track → Learn 閉環
// =============================================================
const s11 = pres.addSlide();
s11.background = { color: WHITE };
addCornerLabel(s11, "10", NAVY);

s11.addText("整體框架", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s11.addText("Plan → Decide → Track → Learn", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 38, fontFace: FH, color: NAVY, bold: true,
});
s11.addText("從現況觀察到決策模擬，從執行追蹤到效益回饋，形成完整閉環", {
  x: 0.5, y: 2.0, w: 12, h: 0.4,
  fontSize: 16, fontFace: FB, color: SLATE,
});

// 4 階段流程圖
const stages = [
  { title: "Plan",    cn: "規劃",   desc: "卡點分析 + 員工負載 + 組織健康度 看現狀",          color: NAVY },
  { title: "Decide",  cn: "決策",   desc: "What-if 模擬器 決策前看後果",                       color: CORAL },
  { title: "Track",   cn: "執行",   desc: "決策追蹤 + 案件交接 + 週報填寫",                    color: NAVY_2 },
  { title: "Learn",   cn: "學習",   desc: "Decision Impact 量化效益 + Leader 排行",            color: GREEN },
];

stages.forEach((s, i) => {
  const x = 0.7 + i * 3.1;
  const y = 3.0;
  // 大數字
  s11.addText(`${i + 1}`, {
    x, y, w: 0.8, h: 0.8,
    fontSize: 60, fontFace: FH, color: s.color, bold: true, margin: 0,
  });
  // 標籤
  s11.addText(s.title, {
    x: x + 0.8, y: y + 0.1, w: 2, h: 0.45,
    fontSize: 22, fontFace: FH, color: s.color, bold: true,
  });
  s11.addText(s.cn, {
    x: x + 0.8, y: y + 0.55, w: 2, h: 0.35,
    fontSize: 14, fontFace: FH, color: SLATE,
  });
  // 卡片
  s11.addShape(pres.shapes.RECTANGLE, {
    x, y: y + 1.2, w: 2.8, h: 2.2,
    fill: { color: LIGHT }, line: { color: ICE, width: 1 },
  });
  // 上方色條
  s11.addShape(pres.shapes.RECTANGLE, {
    x, y: y + 1.2, w: 2.8, h: 0.12,
    fill: { color: s.color }, line: { type: "none" },
  });
  // 描述
  s11.addText(s.desc, {
    x: x + 0.2, y: y + 1.5, w: 2.4, h: 1.8,
    fontSize: 13, fontFace: FB, color: SLATE, valign: "top",
  });
  // 箭頭（除最後一個）
  if (i < 3) {
    s11.addText("→", {
      x: x + 2.85, y: y + 1.8, w: 0.4, h: 0.8,
      fontSize: 36, fontFace: FH, color: ICE, bold: true,
      align: "center", valign: "middle", margin: 0,
    });
  }
});

// 底部
s11.addText("下次做決策時 → 系統用過去的 Impact 推薦類似類型 → 自我強化的決策智慧", {
  x: 0.5, y: 6.7, w: 12, h: 0.4,
  fontSize: 14, fontFace: FB, color: NAVY, italic: true, align: "center",
});

addFooter(s11, 11, TOTAL);

// =============================================================
// Slide 12: 工程實踐 — Bug 修復
// =============================================================
const s12 = pres.addSlide();
s12.background = { color: WHITE };
addCornerLabel(s12, "11", NAVY);

s12.addText("工程品質", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s12.addText("12 件 Bug 修復記錄", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});
s12.addText("v2.0 → v2.2，跨頁面數據一致性、邊界保護、設計優化", {
  x: 0.5, y: 2.0, w: 12, h: 0.4,
  fontSize: 16, fontFace: FB, color: SLATE,
});

// 3 個 phase 的大數字
const phases = [
  { num: "9", label: "v2.1 系統性修復", desc: "跨頁面數據一致性",        color: NAVY },
  { num: "3", label: "v2.2 進階修復",   desc: "Cohort + asOf + Deferred", color: CORAL },
  { num: "0", label: "目前剩餘 bug",    desc: "全部解掉 ✓",               color: GREEN },
];
phases.forEach((p, i) => {
  const x = 0.6 + i * 4.15;
  const y = 2.7;

  s12.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 4, h: 2.5,
    fill: { color: LIGHT }, line: { color: ICE, width: 1 },
  });
  s12.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 4, h: 0.12,
    fill: { color: p.color }, line: { type: "none" },
  });

  s12.addText(p.num, {
    x: x + 0.2, y: y + 0.3, w: 2, h: 1.5,
    fontSize: 96, fontFace: FH, color: p.color, bold: true, margin: 0,
  });
  s12.addText(p.label, {
    x: x + 0.2, y: y + 1.8, w: 3.6, h: 0.4,
    fontSize: 14, fontFace: FH, color: NAVY, bold: true,
  });
  s12.addText(p.desc, {
    x: x + 0.2, y: y + 2.15, w: 3.6, h: 0.3,
    fontSize: 11, fontFace: FB, color: SLATE,
  });
});

// 底部關鍵 bug 列表
s12.addText("關鍵修復", {
  x: 0.6, y: 5.5, w: 4, h: 0.4,
  fontSize: 14, fontFace: FH, color: NAVY, bold: true,
});
const keyBugs = [
  "B5 ★ analyzeBlockerRecord 接受 asOf 參數，歷史快照才會準確",
  "B2 ★ 統一逾期判定邏輯，所有頁面用同一個 helper 函式",
  "v2.2 ★ Decision Impact 加 Cohort Adjustment，告別「全部負分」",
];
keyBugs.forEach((b, i) => {
  s12.addText(b, {
    x: 0.6, y: 5.95 + i * 0.35, w: 12.1, h: 0.3,
    fontSize: 12, fontFace: FB, color: SLATE,
  });
});

addFooter(s12, 12, TOTAL);

// =============================================================
// Slide 13: Demo 重點
// =============================================================
const s13 = pres.addSlide();
s13.background = { color: NAVY };
addCornerLabel(s13, "12", CORAL);

s13.addText("Live Demo", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: ICE, charSpacing: 4,
});
s13.addText("5 個 demo 重點", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: WHITE, bold: true,
});
s13.addText("讓教授親自感受演算法的價值", {
  x: 0.5, y: 2.0, w: 12, h: 0.4,
  fontSize: 16, fontFace: FB, color: ICE,
});

const demos = [
  { num: "1", title: "組織健康度雷達",
    desc: "Dashboard → 滾到組織健康度卡片 → 點 12 週趨勢線的拐點 → 看當週事件",
    color: GOLD },
  { num: "2", title: "智能案件推薦",
    desc: "卡點分析 → 點田宮電機 → 滾到底部紫色推薦區 → 點過去類似案",
    color: GOLD },
  { num: "3", title: "What-if 模擬",
    desc: "What-if 決策模擬 → 勾「解掉田宮電機」 → 看右側雷達從現況到模擬後變化",
    color: CORAL },
  { num: "4", title: "歷史搜尋 BM25F",
    desc: "歷史搜尋 → 輸入「東京中央銀行」→ 看到精準排序",
    color: GOLD },
  { num: "5", title: "員工負載週次切換",
    desc: "員工負載 → 切到「5 週前」→ 看過載員工名單會變",
    color: GOLD },
];

demos.forEach((d, i) => {
  const y = 2.7 + i * 0.8;
  // 編號
  s13.addShape(pres.shapes.OVAL, {
    x: 0.7, y, w: 0.7, h: 0.7,
    fill: { color: d.color }, line: { type: "none" },
  });
  s13.addText(d.num, {
    x: 0.7, y, w: 0.7, h: 0.7,
    fontSize: 24, fontFace: FH, color: NAVY, bold: true,
    align: "center", valign: "middle", margin: 0,
  });
  // 標題
  s13.addText(d.title, {
    x: 1.6, y: y + 0.02, w: 3, h: 0.4,
    fontSize: 18, fontFace: FH, color: WHITE, bold: true,
  });
  // 描述
  s13.addText(d.desc, {
    x: 4.8, y: y + 0.1, w: 8, h: 0.6,
    fontSize: 13, fontFace: FB, color: ICE,
  });
});

addFooter(s13, 13, TOTAL);

// =============================================================
// Slide 14: 結語 + Q&A
// =============================================================
const s14 = pres.addSlide();
s14.background = { color: NAVY };

// 大裝飾色塊
s14.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 13.3, h: 1.5,
  fill: { color: CORAL }, line: { type: "none" },
});
s14.addText("謝謝聆聽", {
  x: 0.5, y: 0.3, w: 12, h: 0.9,
  fontSize: 56, fontFace: FH, color: WHITE, bold: true,
});

// 3 條設計哲學
s14.addText("3 條設計哲學", {
  x: 0.6, y: 2.0, w: 6, h: 0.5,
  fontSize: 20, fontFace: FH, color: GOLD, bold: true,
});

const philosophies = [
  "資料越少，演算法的選擇越重要。",
  "跨頁面的一致性，比單頁的炫技更重要。",
  "能解釋的演算法，比準確 1% 的黑盒更值錢。",
];
philosophies.forEach((p, i) => {
  s14.addText(`「${p}」`, {
    x: 0.6, y: 2.7 + i * 0.7, w: 12, h: 0.6,
    fontSize: 22, fontFace: FH, color: WHITE, italic: true,
  });
});

// 底部資訊
s14.addShape(pres.shapes.LINE, {
  x: 0.6, y: 5.4, w: 4, h: 0,
  line: { color: ICE, width: 1.5 },
});

s14.addText("Tech Stack", {
  x: 0.6, y: 5.6, w: 4, h: 0.3,
  fontSize: 11, fontFace: FH, color: GOLD, charSpacing: 3,
});
s14.addText("React 19 · TypeScript · Vite 6 · Tailwind v4 · Recharts · Firebase", {
  x: 0.6, y: 5.9, w: 6, h: 0.4,
  fontSize: 13, fontFace: FB, color: ICE,
});

s14.addText("Algorithms", {
  x: 7.0, y: 5.6, w: 4, h: 0.3,
  fontSize: 11, fontFace: FH, color: GOLD, charSpacing: 3,
});
s14.addText("BM25F · Gini · Empirical Percentile · Cohort Adjustment · 25 項", {
  x: 7.0, y: 5.9, w: 6, h: 0.4,
  fontSize: 13, fontFace: FB, color: ICE,
});

// Q&A 大標
s14.addShape(pres.shapes.OVAL, {
  x: 11, y: 6.3, w: 1.8, h: 0.9,
  fill: { color: GOLD }, line: { type: "none" },
});
s14.addText("Q & A", {
  x: 11, y: 6.3, w: 1.8, h: 0.9,
  fontSize: 22, fontFace: FH, color: NAVY, bold: true,
  align: "center", valign: "middle", margin: 0,
});

s14.addText("資管導論 第 13 組  ·  Chuanlien System v2.2  ·  2026-05", {
  x: 0.5, y: 7.0, w: 9, h: 0.3,
  fontSize: 10, fontFace: FB, color: ICE,
});

// =============================================================
// 輸出
// =============================================================
pres.writeFile({ fileName: "docs/串連系統_產品介紹簡報.pptx" }).then(name => {
  console.log("OK -> " + name);
});
