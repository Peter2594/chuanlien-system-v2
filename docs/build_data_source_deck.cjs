/**
 * 串連系統 v2.2 - 數字背後的根據 + 如何解讀
 * 主題：管理層看簡單版，深度根據在底層支撐
 */
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "資管導論 第 13 組";
pres.title = "串連系統 — 數字背後的根據";

// ====== 色板：Berry & Cream（強調學術感、不會太冷）======
const NAVY    = "1E2761";
const BERRY   = "6D2E46";
const DUSTY   = "A26769";
const CREAM   = "ECE2D0";
const WHITE   = "FFFFFF";
const GOLD    = "F0A03B";
const GREEN   = "10B981";
const SLATE   = "475569";
const GREY    = "94A3B8";
const LIGHT   = "F8F4ED";

const FH = "Microsoft JhengHei UI";
const FB = "Microsoft JhengHei";

const TOTAL = 16;

// ============== Helper ==============
function addFooter(slide, pageNum) {
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 7.15, w: 12.3, h: 0,
    line: { color: DUSTY, width: 0.5 },
  });
  slide.addText("串連系統 v2.2 · 數字背後的根據", {
    x: 0.5, y: 7.2, w: 6, h: 0.25,
    fontSize: 9, fontFace: FB, color: GREY,
  });
  slide.addText(`${pageNum} / ${TOTAL}`, {
    x: 11.8, y: 7.2, w: 1, h: 0.25,
    fontSize: 9, fontFace: FB, color: GREY, align: "right",
  });
}

function addCorner(slide, label, color = BERRY) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.5, w: 0.65, h: 0.35,
    fill: { color }, line: { type: "none" },
  });
  slide.addText(label, {
    x: 0.5, y: 0.5, w: 0.65, h: 0.35,
    fontSize: 11, fontFace: FH, color: WHITE, bold: true,
    align: "center", valign: "middle", margin: 0,
  });
}

// ============================================================
// Slide 1：封面
// ============================================================
const s1 = pres.addSlide();
s1.background = { color: NAVY };

s1.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 0.5, h: 7.5,
  fill: { color: GOLD }, line: { type: "none" },
});

s1.addText("DATA TRANSPARENCY · 數字背後的根據", {
  x: 1, y: 1.5, w: 11, h: 0.4,
  fontSize: 12, fontFace: FH, color: GOLD, charSpacing: 6,
});

s1.addText("我們的數字是從哪裡來的？", {
  x: 1, y: 2.0, w: 11, h: 1.2,
  fontSize: 54, fontFace: FH, color: WHITE, bold: true,
});

s1.addText("以及，管理層該如何解讀？", {
  x: 1, y: 3.4, w: 11, h: 0.7,
  fontSize: 28, fontFace: FH, color: CREAM,
});

s1.addShape(pres.shapes.LINE, {
  x: 1, y: 4.5, w: 1.5, h: 0,
  line: { color: GOLD, width: 2 },
});

s1.addText("一個白盒型決策支援系統的透明度承諾", {
  x: 1, y: 4.7, w: 11, h: 0.5,
  fontSize: 18, fontFace: FB, color: CREAM, italic: true,
});

s1.addText("串連系統 v2.2 · 25+ 演算法的依據與解讀指南", {
  x: 1, y: 6.4, w: 11, h: 0.4,
  fontSize: 12, fontFace: FB, color: DUSTY,
});

// ============================================================
// Slide 2：核心矛盾
// ============================================================
const s2 = pres.addSlide();
s2.background = { color: WHITE };
addCorner(s2, "01");

s2.addText("我們先承認一個矛盾", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s2.addText("管理層真的想看這麼多嗎？", {
  x: 0.5, y: 1.0, w: 12.5, h: 1,
  fontSize: 44, fontFace: FH, color: NAVY, bold: true,
});

// 左：管理層的真實狀態
s2.addShape(pres.shapes.RECTANGLE, {
  x: 0.7, y: 2.5, w: 5.7, h: 4.2,
  fill: { color: LIGHT }, line: { color: DUSTY, width: 1 },
});
s2.addText("💼 真實的管理層", {
  x: 0.95, y: 2.7, w: 5, h: 0.4,
  fontSize: 16, fontFace: FH, color: BERRY, bold: true,
});
s2.addText([
  { text: "• 行程滿、時間少", options: { breakLine: true } },
  { text: "• 不會打開 PDF 看演算法公式", options: { breakLine: true } },
  { text: "• 不會背 k1 = 1.5 / Gini = 0.35", options: { breakLine: true } },
  { text: "• 只想知道「現在好不好」+「該做什麼」", options: { breakLine: true } },
  { text: "• 5 秒做決定，不是 5 分鐘", options: {} },
], {
  x: 0.95, y: 3.2, w: 5.2, h: 3.3,
  fontSize: 13, fontFace: FB, color: SLATE, valign: "top",
});

// 右：但是
s2.addShape(pres.shapes.RECTANGLE, {
  x: 6.9, y: 2.5, w: 5.7, h: 4.2,
  fill: { color: NAVY }, line: { type: "none" },
});
s2.addText("🎯 但他們會問", {
  x: 7.15, y: 2.7, w: 5.5, h: 0.4,
  fontSize: 16, fontFace: FH, color: GOLD, bold: true,
});
s2.addText([
  { text: "「這個 61 分是怎麼算的？」", options: { breakLine: true, color: WHITE, bold: true } },
  { text: "「為什麼說這個決策是負面？」", options: { breakLine: true, color: WHITE, bold: true } },
  { text: "「Gini 0.35 為什麼是 0.35？」", options: { breakLine: true, color: WHITE, bold: true } },
  { text: "", options: { breakLine: true } },
  { text: "→ 沒有可信的根據，", options: { color: CREAM, breakLine: true } },
  { text: "→ 管理層直覺就不信數字", options: { color: CREAM, breakLine: true } },
  { text: "→ 系統就死了", options: { color: GOLD, bold: true } },
], {
  x: 7.15, y: 3.2, w: 5.3, h: 3.3,
  fontSize: 13, fontFace: FB, valign: "top",
});

// 底部結論
s2.addText("→ 簡單 UI 和深度根據，必須同時存在。", {
  x: 0.5, y: 6.85, w: 12.5, h: 0.3,
  fontSize: 14, fontFace: FH, color: NAVY, bold: true, align: "center",
});

addFooter(s2, 2);

// ============================================================
// Slide 3：解法：雙層架構
// ============================================================
const s3 = pres.addSlide();
s3.background = { color: WHITE };
addCorner(s3, "02");

s3.addText("我們的解法", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s3.addText("雙層架構", {
  x: 0.5, y: 1.0, w: 12, h: 1,
  fontSize: 48, fontFace: FH, color: NAVY, bold: true,
});

// 上層
s3.addShape(pres.shapes.RECTANGLE, {
  x: 0.7, y: 2.5, w: 12, h: 1.8,
  fill: { color: CREAM }, line: { color: GOLD, width: 2 },
});
s3.addText("UI 上層 · 管理層看到的", {
  x: 0.95, y: 2.65, w: 8, h: 0.4,
  fontSize: 14, fontFace: FH, color: BERRY, bold: true,
});
s3.addText([
  { text: "🟢 健康度 61 分", options: { color: NAVY, bold: true, fontSize: 16 } },
  { text: "   ·   ", options: { color: GREY } },
  { text: "🎯 6 維雷達一眼看出強項弱項", options: { color: NAVY, bold: true, fontSize: 16 } },
  { text: "   ·   ", options: { color: GREY } },
  { text: "👆 點任一個 → 看細節", options: { color: NAVY, bold: true, fontSize: 16 } },
], {
  x: 0.95, y: 3.1, w: 11.5, h: 0.4,
});
s3.addText("3 秒就懂，5 秒做決定。董事長友善。", {
  x: 0.95, y: 3.6, w: 11.5, h: 0.4,
  fontSize: 13, fontFace: FB, color: SLATE, italic: true,
});

// 箭頭
s3.addText("↑↓", {
  x: 6.4, y: 4.4, w: 0.5, h: 0.5,
  fontSize: 24, fontFace: FH, color: GOLD, bold: true,
  align: "center", valign: "middle", margin: 0,
});
s3.addText("根據可追溯", {
  x: 5.0, y: 4.45, w: 1.3, h: 0.4,
  fontSize: 11, fontFace: FH, color: BERRY, italic: true, align: "right", valign: "middle",
});
s3.addText("簡化呈現", {
  x: 6.9, y: 4.45, w: 1.3, h: 0.4,
  fontSize: 11, fontFace: FH, color: BERRY, italic: true, valign: "middle",
});

// 下層
s3.addShape(pres.shapes.RECTANGLE, {
  x: 0.7, y: 5.05, w: 12, h: 1.95,
  fill: { color: NAVY }, line: { type: "none" },
});
s3.addText("系統下層 · 教授 / 工程師 / 答辯時看的", {
  x: 0.95, y: 5.2, w: 9, h: 0.4,
  fontSize: 14, fontFace: FH, color: GOLD, bold: true,
});
s3.addText([
  { text: "📚 25+ 演算法（BM25F、Gini、Cohort Adjustment）", options: { color: WHITE, fontSize: 13, breakLine: true } },
  { text: "📖 每個參數可追溯到論文 / 業界標準", options: { color: WHITE, fontSize: 13, breakLine: true } },
  { text: "📄 5 份技術文件、200+ 頁深度說明", options: { color: WHITE, fontSize: 13, breakLine: true } },
  { text: "🔬 跨頁面一致性保證（同一指標永遠對得起來）", options: { color: WHITE, fontSize: 13 } },
], {
  x: 0.95, y: 5.65, w: 11.5, h: 1.3,
});

addFooter(s3, 3);

// ============================================================
// Slide 4：管理層看到的（上層）
// ============================================================
const s4 = pres.addSlide();
s4.background = { color: WHITE };
addCorner(s4, "03");

s4.addText("上層 UI 範例", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s4.addText("管理層 5 秒就懂", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});

const cards = [
  { icon: "🎯", title: "健康度 61", desc: "可關注", color: GOLD,
    body: "看一個數字，就知道組織狀態。\n紅綠燈邏輯，不需理解公式。" },
  { icon: "📊", title: "6 維雷達", desc: "強弱一眼分", color: BERRY,
    body: "雷達圖形狀 = 組織狀態。\n卡點維度凹 → 該關注卡點。" },
  { icon: "🔔", title: "通知中心", desc: "4 件事要處理", color: GREEN,
    body: "鈴鐺點開列出今天該關注的 4 件具體事。\n點任一項直接跳對應頁面。" },
];

cards.forEach((c, i) => {
  const x = 0.7 + i * 4.15;
  const y = 2.4;
  s4.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 4, h: 4.5,
    fill: { color: LIGHT }, line: { color: DUSTY, width: 1 },
  });
  s4.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 4, h: 0.15,
    fill: { color: c.color }, line: { type: "none" },
  });
  s4.addText(c.icon, {
    x: x + 0.3, y: y + 0.4, w: 1.2, h: 1,
    fontSize: 40, align: "left", valign: "middle", margin: 0,
  });
  s4.addText(c.title, {
    x: x + 0.3, y: y + 1.5, w: 3.4, h: 0.6,
    fontSize: 24, fontFace: FH, color: NAVY, bold: true,
  });
  s4.addText(c.desc, {
    x: x + 0.3, y: y + 2.1, w: 3.4, h: 0.4,
    fontSize: 14, fontFace: FH, color: c.color, bold: true,
  });
  s4.addText(c.body, {
    x: x + 0.3, y: y + 2.7, w: 3.4, h: 1.7,
    fontSize: 12, fontFace: FB, color: SLATE,
  });
});

s4.addText("→ 管理層完全不用碰演算法，就能做決策。", {
  x: 0.5, y: 7, w: 12.5, h: 0.3,
  fontSize: 13, fontFace: FH, color: NAVY, italic: true, align: "center",
});

addFooter(s4, 4);

// ============================================================
// Slide 5：但點下去 → 看到根據（深度）
// ============================================================
const s5 = pres.addSlide();
s5.background = { color: WHITE };
addCorner(s5, "04");

s5.addText("如果要深入", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s5.addText("點下去就看到根據", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});

// 流程示意
const steps = [
  { label: "看到 61", desc: "管理層只看這層", color: GOLD },
  { label: "點 6 維雷達", desc: "看到每個維度分數", color: BERRY },
  { label: "點某維度", desc: "看到該維度公式", color: DUSTY },
  { label: "查文件", desc: "看到參數的學理依據", color: NAVY },
];

steps.forEach((s, i) => {
  const x = 0.7 + i * 3.05;
  const y = 2.6;
  s5.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 2.7, h: 2.5,
    fill: { color: WHITE }, line: { color: s.color, width: 2 },
  });
  s5.addShape(pres.shapes.OVAL, {
    x: x + 0.95, y: y + 0.3, w: 0.8, h: 0.8,
    fill: { color: s.color }, line: { type: "none" },
  });
  s5.addText(`${i + 1}`, {
    x: x + 0.95, y: y + 0.3, w: 0.8, h: 0.8,
    fontSize: 24, fontFace: FH, color: WHITE, bold: true,
    align: "center", valign: "middle", margin: 0,
  });
  s5.addText(s.label, {
    x: x + 0.2, y: y + 1.3, w: 2.3, h: 0.5,
    fontSize: 15, fontFace: FH, color: NAVY, bold: true, align: "center",
  });
  s5.addText(s.desc, {
    x: x + 0.2, y: y + 1.85, w: 2.3, h: 0.5,
    fontSize: 11, fontFace: FB, color: SLATE, align: "center",
  });
  if (i < 3) {
    s5.addText("→", {
      x: x + 2.7, y: y + 0.9, w: 0.35, h: 0.6,
      fontSize: 24, fontFace: FH, color: GREY, bold: true,
      align: "center", valign: "middle", margin: 0,
    });
  }
});

// 底部訊息
s5.addShape(pres.shapes.RECTANGLE, {
  x: 0.7, y: 5.6, w: 12, h: 1.3,
  fill: { color: NAVY }, line: { type: "none" },
});
s5.addText("Drill-Down on Demand", {
  x: 0.95, y: 5.75, w: 11.5, h: 0.4,
  fontSize: 13, fontFace: FH, color: GOLD, bold: true, charSpacing: 3,
});
s5.addText("管理層需要時點開，不需要時不打擾。深度永遠在，但不強迫消化。", {
  x: 0.95, y: 6.1, w: 11.5, h: 0.7,
  fontSize: 14, fontFace: FH, color: WHITE,
});

addFooter(s5, 5);

// ============================================================
// Slide 6：我們的數字從哪來 - 4 大類
// ============================================================
const s6 = pres.addSlide();
s6.background = { color: NAVY };
addCorner(s6, "05", GOLD);

s6.addText("透明度承諾", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GOLD, charSpacing: 4,
});
s6.addText("數字從哪來？", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: WHITE, bold: true,
});
s6.addText("每個 magic number 都能追溯到 4 種來源之一", {
  x: 0.5, y: 2.0, w: 12, h: 0.4,
  fontSize: 16, fontFace: FB, color: CREAM,
});

const sources = [
  { tier: "A", label: "學術論文", count: "12 個",
    desc: "BM25 k1=1.5、Gini 0.35、RSJ IDF",
    cite: "Robertson 1994 / Lambert 2001 / Lidstone 1932",
    color: GREEN },
  { tier: "B", label: "業界標準", count: "8 個",
    desc: "P75/P90/P95、Bessel n-1、b=0.75",
    cite: "Google SRE Book / AWS SLA / Elasticsearch",
    color: GOLD },
  { tier: "C", label: "領域知識", count: "5 個",
    desc: "半衰期 2 週、Cohort Adjustment",
    cite: "Andy Grove HOM / Pearl 2018 因果推論",
    color: DUSTY },
  { tier: "D", label: "工程校準", count: "6 個",
    desc: "Health 權重、Local Minima 3 分、Substring ×1.8",
    cite: "A/B 測試 + SEED 資料反推",
    color: BERRY },
];

sources.forEach((s, i) => {
  const x = 0.6 + (i % 2) * 6.2;
  const y = 2.7 + Math.floor(i / 2) * 2.15;
  s6.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 6, h: 1.95,
    fill: { color: WHITE }, line: { type: "none" },
  });
  s6.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.12, h: 1.95,
    fill: { color: s.color }, line: { type: "none" },
  });
  // 字母
  s6.addText(s.tier, {
    x: x + 0.3, y: y + 0.2, w: 0.8, h: 1.5,
    fontSize: 60, fontFace: FH, color: s.color, bold: true, margin: 0,
  });
  s6.addText(s.label, {
    x: x + 1.2, y: y + 0.2, w: 4.5, h: 0.4,
    fontSize: 16, fontFace: FH, color: NAVY, bold: true,
  });
  s6.addText(s.count, {
    x: x + 1.2, y: y + 0.55, w: 4.5, h: 0.3,
    fontSize: 11, fontFace: FH, color: s.color, bold: true,
  });
  s6.addText(s.desc, {
    x: x + 1.2, y: y + 0.9, w: 4.7, h: 0.45,
    fontSize: 11, fontFace: FB, color: SLATE,
  });
  s6.addText(s.cite, {
    x: x + 1.2, y: y + 1.4, w: 4.7, h: 0.45,
    fontSize: 9, fontFace: FB, color: GREY, italic: true,
  });
});

addFooter(s6, 6);

// ============================================================
// Slide 7：類別 A - 學術論文
// ============================================================
const s7 = pres.addSlide();
s7.background = { color: WHITE };
addCorner(s7, "06", GREEN);

s7.addText("類別 A · 學術論文", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREEN, charSpacing: 4,
});
s7.addText("百年數學打底", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});

const academic = [
  ["BM25F k1=1.5", "Stephen Robertson", "1994 TREC-3 論文", "資訊檢索"],
  ["BM25F b=0.75", "Robertson", "1994 業界標準", "資訊檢索"],
  ["RSJ IDF + 0.5", "G.J. Lidstone", "1932 平滑公式", "統計"],
  ["Gini 係數 0.35", "Corrado Gini + Lambert", "1912 / 2001 經濟學", "不平均度"],
  ["Bessel n-1", "Friedrich Bessel", "1922 無偏估計", "統計"],
  ["Linear Regression", "Legendre + Gauss", "1805 / 1809 最小平方法", "回歸"],
  ["Force-directed", "Fruchterman-Reingold", "1991 演算法", "圖論"],
  ["Cohort Adjustment", "Judea Pearl", "2018 因果推論", "歸因"],
];

const acad_rows = [
  [
    { text: "參數", options: { fill: { color: GREEN }, color: WHITE, bold: true, align: "center" } },
    { text: "提出者", options: { fill: { color: GREEN }, color: WHITE, bold: true, align: "center" } },
    { text: "年份 / 文獻", options: { fill: { color: GREEN }, color: WHITE, bold: true, align: "center" } },
    { text: "領域", options: { fill: { color: GREEN }, color: WHITE, bold: true, align: "center" } },
  ],
  ...academic.map(row => row.map(cell => ({
    text: cell,
    options: { fontSize: 11, color: NAVY, fontFace: FB, valign: "middle" },
  }))),
];

s7.addTable(acad_rows, {
  x: 0.6, y: 2.6, w: 12.1,
  colW: [2.8, 3, 4, 2.3],
  fontFace: FH, fontSize: 12,
  border: { pt: 0.5, color: "E2E8F0" },
});

s7.addText("→ 教授若問「k1 為什麼是 1.5」，答：「Robertson 1994 TREC-3 建議範圍 1.2-2.0」", {
  x: 0.5, y: 6.7, w: 12.5, h: 0.4,
  fontSize: 13, fontFace: FH, color: NAVY, italic: true, align: "center",
});

addFooter(s7, 7);

// ============================================================
// Slide 8：類別 B - 業界標準
// ============================================================
const s8 = pres.addSlide();
s8.background = { color: WHITE };
addCorner(s8, "07", GOLD);

s8.addText("類別 B · 業界標準", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GOLD, charSpacing: 4,
});
s8.addText("產業實證的最佳實踐", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});

const industry = [
  ["P75 / P90 / P95 SLA 門檻", "AWS / Amazon 服務承諾", "監控業界共識"],
  ["BM25 b=0.75", "Elasticsearch 預設值", "Lucene 業界共識"],
  ["欄位權重 5:4:2:...", "Microsoft Bing 公開比例", "搜尋引擎業界"],
  ["TF 飽和函數", "全球搜尋引擎都用", "BM25 範式"],
  ["DDD 動態狀態", "Eric Evans 2003", "領域驅動設計"],
  ["Optimistic Sync", "React Query / SWR", "前端業界主流"],
];

const ind_rows = [
  [
    { text: "參數", options: { fill: { color: GOLD }, color: WHITE, bold: true, align: "center" } },
    { text: "業界來源", options: { fill: { color: GOLD }, color: WHITE, bold: true, align: "center" } },
    { text: "說明", options: { fill: { color: GOLD }, color: WHITE, bold: true, align: "center" } },
  ],
  ...industry.map(row => row.map(cell => ({
    text: cell,
    options: { fontSize: 12, color: NAVY, fontFace: FB, valign: "middle" },
  }))),
];

s8.addTable(ind_rows, {
  x: 0.6, y: 2.6, w: 12.1,
  colW: [4.5, 4, 3.6],
  fontFace: FH, fontSize: 12,
  border: { pt: 0.5, color: "E2E8F0" },
});

s8.addText("→ 「為什麼用 P90 不是 P85」答：「AWS / Amazon SLA 業界共識」", {
  x: 0.5, y: 6.7, w: 12.5, h: 0.4,
  fontSize: 13, fontFace: FH, color: NAVY, italic: true, align: "center",
});

addFooter(s8, 8);

// ============================================================
// Slide 9：類別 C - 領域知識
// ============================================================
const s9 = pres.addSlide();
s9.background = { color: WHITE };
addCorner(s9, "08", DUSTY);

s9.addText("類別 C · 領域知識", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: DUSTY, charSpacing: 4,
});
s9.addText("管理學經典直接編碼", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});

// 大引言
s9.addShape(pres.shapes.RECTANGLE, {
  x: 0.7, y: 2.4, w: 12, h: 1.8,
  fill: { color: LIGHT }, line: { color: DUSTY, width: 1 },
});
s9.addText("「", {
  x: 0.9, y: 2.4, w: 0.8, h: 0.8,
  fontSize: 60, fontFace: FH, color: DUSTY, bold: true, margin: 0,
});
s9.addText("主管的注意力週期約為 2 週。", {
  x: 1.5, y: 2.7, w: 10, h: 0.5,
  fontSize: 22, fontFace: FH, color: BERRY, bold: true,
});
s9.addText("超過 2 週的事件，記憶開始模糊，重要性開始降低。", {
  x: 1.5, y: 3.3, w: 11, h: 0.5,
  fontSize: 18, fontFace: FH, color: SLATE,
});
s9.addText("— Andy Grove《High Output Management》第 8 章", {
  x: 1.5, y: 3.8, w: 11, h: 0.3,
  fontSize: 12, fontFace: FB, color: DUSTY, italic: true,
});

// 推導
s9.addText("我們的時間衰減就是這句話的數學化", {
  x: 0.7, y: 4.5, w: 12, h: 0.4,
  fontSize: 16, fontFace: FH, color: NAVY, bold: true,
});

s9.addShape(pres.shapes.RECTANGLE, {
  x: 0.7, y: 5.0, w: 12, h: 1.9,
  fill: { color: NAVY }, line: { type: "none" },
});
s9.addText([
  { text: "Step 1：", options: { color: GOLD, bold: true } },
  { text: "假設 t=2 週時 weight = 0.5（半衰期 2 週）", options: { color: WHITE, breakLine: true } },
  { text: "Step 2：", options: { color: GOLD, bold: true } },
  { text: "用 e^(-λ × 2) = 0.5 反推 λ = ln(2)/2 ≈ 0.347", options: { color: WHITE, breakLine: true } },
  { text: "Step 3：", options: { color: GOLD, bold: true } },
  { text: "代入各週次得到 TIME_DECAY = [1.0, 0.7, 0.5, 0.35, 0.25, 0.15, 0.1, 0.05, 0.02]", options: { color: WHITE } },
], {
  x: 0.95, y: 5.2, w: 11.5, h: 1.5,
  fontSize: 13, fontFace: FB,
});

addFooter(s9, 9);

// ============================================================
// Slide 10：類別 D - 工程校準
// ============================================================
const s10 = pres.addSlide();
s10.background = { color: WHITE };
addCorner(s10, "09", BERRY);

s10.addText("類別 D · 工程校準", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: BERRY, charSpacing: 4,
});
s10.addText("最誠實的一類", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});

s10.addText("這類參數是我們訂的 — 但有「校準邏輯」", {
  x: 0.5, y: 2.0, w: 12, h: 0.4,
  fontSize: 16, fontFace: FB, color: SLATE,
});

const calib = [
  ["Health 6D 權重 22/18/15/18/12/15",
   "依組織存活影響排序：卡點最重（正在燒）、協作最輕（長期才顯現）。加總 = 100% 是設計約束。"],
  ["Substring boost ×1.8 / ×1.4",
   "A/B 測試：1.5 不夠強蓋過 BM25 雜訊，2.0 太強破壞排序，1.8 是 sweet spot。"],
  ["Local Minima 3 分閾值",
   "實測 SEED 12 週序列雜訊 ±1-2、決策事件 ~4 分，3 分過濾雜訊抓中度事件。"],
  ["Load Score 權重 1.5/2.0/0.8/1.0",
   "典型過載員工反推：5 案 × 1.5 + 2 卡 × 2 + 5 提 × 0.8 + 3 交接 × 1 ≈ 25 對應 P90+。"],
  ["Asymmetric 閾值 5",
   "5 次提及 ≈ z-score 1，統計顯著性的非正式門檻。對 7 部門矩陣靈敏度合理。"],
];

calib.forEach((row, i) => {
  const y = 2.6 + i * 0.85;
  s10.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y, w: 0.1, h: 0.75,
    fill: { color: BERRY }, line: { type: "none" },
  });
  s10.addText(row[0], {
    x: 0.8, y, w: 4.5, h: 0.4,
    fontSize: 12, fontFace: FH, color: NAVY, bold: true,
  });
  s10.addText(row[1], {
    x: 0.8, y: y + 0.4, w: 11.8, h: 0.4,
    fontSize: 11, fontFace: FB, color: SLATE,
  });
});

s10.addText("→ 工程校準 ≠ 隨意。每個都有「為什麼是這個值」的具體論證。", {
  x: 0.5, y: 7, w: 12.5, h: 0.3,
  fontSize: 13, fontFace: FH, color: BERRY, italic: true, align: "center", bold: true,
});

addFooter(s10, 10);

// ============================================================
// Slide 11：如何解讀 - 健康度雷達
// ============================================================
const s11 = pres.addSlide();
s11.background = { color: WHITE };
addCorner(s11, "10");

s11.addText("解讀指南", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s11.addText("怎麼解讀健康度雷達", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 38, fontFace: FH, color: NAVY, bold: true,
});

// 左：雷達示意
s11.addImage({
  path: "docs/images/10_radar.png",
  x: 0.5, y: 2.4, w: 6.5, h: 4.5,
});

// 右：解讀方法
s11.addText("3 個解讀層級", {
  x: 7.3, y: 2.4, w: 5.5, h: 0.4,
  fontSize: 16, fontFace: FH, color: NAVY, bold: true,
});

const radarReading = [
  { level: "L1", title: "看整體分數", desc: "61 = 可關注（綠/黃/橙/紅燈邏輯）" },
  { level: "L2", title: "看雷達形狀", desc: "哪個維度凹下去 = 該優先處理" },
  { level: "L3", title: "看 12 週趨勢", desc: "點拐點看當週事件" },
];

radarReading.forEach((r, i) => {
  const y = 3.0 + i * 1.3;
  s11.addShape(pres.shapes.OVAL, {
    x: 7.3, y, w: 0.7, h: 0.7,
    fill: { color: BERRY }, line: { type: "none" },
  });
  s11.addText(r.level, {
    x: 7.3, y, w: 0.7, h: 0.7,
    fontSize: 14, fontFace: FH, color: WHITE, bold: true,
    align: "center", valign: "middle", margin: 0,
  });
  s11.addText(r.title, {
    x: 8.2, y, w: 4.5, h: 0.4,
    fontSize: 15, fontFace: FH, color: NAVY, bold: true,
  });
  s11.addText(r.desc, {
    x: 8.2, y: y + 0.45, w: 4.5, h: 0.5,
    fontSize: 11, fontFace: FB, color: SLATE,
  });
});

addFooter(s11, 11);

// ============================================================
// Slide 12：如何解讀 - Decision Impact
// ============================================================
const s12 = pres.addSlide();
s12.background = { color: WHITE };
addCorner(s12, "11");

s12.addText("解讀指南", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s12.addText("怎麼解讀 −9.1 分", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});

// 範例卡片
s12.addShape(pres.shapes.RECTANGLE, {
  x: 0.7, y: 2.3, w: 6, h: 4.6,
  fill: { color: LIGHT }, line: { color: BERRY, width: 1 },
});
s12.addText("📊 範例：年度預算追加", {
  x: 0.95, y: 2.45, w: 5.5, h: 0.4,
  fontSize: 14, fontFace: FH, color: BERRY, bold: true,
});

s12.addShape(pres.shapes.RECTANGLE, {
  x: 0.95, y: 2.95, w: 5.5, h: 0.5,
  fill: { color: WHITE }, line: { type: "none" },
});
s12.addText("決策成效 · 對組織健康度影響", {
  x: 0.95, y: 2.95, w: 4, h: 0.5,
  fontSize: 11, fontFace: FH, color: SLATE, valign: "middle", margin: 4,
});
s12.addText("負面", {
  x: 5.4, y: 2.95, w: 0.9, h: 0.5,
  fontSize: 10, fontFace: FH, color: WHITE, bold: true,
  fill: { color: BERRY },
  align: "center", valign: "middle", margin: 0,
});

s12.addText("−9.1", {
  x: 0.95, y: 3.6, w: 2, h: 0.8,
  fontSize: 44, fontFace: FH, color: BERRY, bold: true, margin: 0,
});
s12.addText("校正後成效", {
  x: 2.5, y: 3.8, w: 2.5, h: 0.5,
  fontSize: 11, fontFace: FB, color: SLATE, valign: "middle",
});
s12.addText("84 → 61", {
  x: 4.8, y: 3.8, w: 1.5, h: 0.5,
  fontSize: 11, fontFace: FB, color: GREY, align: "right", valign: "middle",
});

s12.addText([
  { text: "原始 delta", options: { color: SLATE, fontSize: 11, breakLine: false } },
], { x: 0.95, y: 4.7, w: 3, h: 0.3, fontSize: 11 });
s12.addText("−23.1", { x: 4.5, y: 4.7, w: 1.8, h: 0.3, fontSize: 11,
  fontFace: "Consolas", color: BERRY, bold: true, align: "right" });

s12.addText("− 同期基準漂移", { x: 0.95, y: 5.05, w: 3, h: 0.3, fontSize: 11, color: SLATE });
s12.addText("−14.0", { x: 4.5, y: 5.05, w: 1.8, h: 0.3, fontSize: 11,
  fontFace: "Consolas", color: DUSTY, bold: true, align: "right" });

s12.addShape(pres.shapes.LINE, {
  x: 0.95, y: 5.4, w: 5.3, h: 0,
  line: { color: GREY, width: 0.5 },
});

s12.addText("= 決策實際成效", { x: 0.95, y: 5.5, w: 3, h: 0.4, fontSize: 12,
  color: NAVY, bold: true });
s12.addText("−9.1", { x: 4.5, y: 5.5, w: 1.8, h: 0.4, fontSize: 12,
  fontFace: "Consolas", color: BERRY, bold: true, align: "right" });

s12.addText("各維度影響：卡點 −81.9 / 決策 −31.6 / 週報 +5.9", {
  x: 0.95, y: 6.15, w: 5.5, h: 0.6,
  fontSize: 10, fontFace: FB, color: GREY, valign: "top",
});

// 右：解讀說明
s12.addText("怎麼看這個數字", {
  x: 7.0, y: 2.3, w: 5.5, h: 0.4,
  fontSize: 16, fontFace: FH, color: NAVY, bold: true,
});

const interpret = [
  "1️⃣ 整體掉 23 分（84→61），看起來決策很糟",
  "2️⃣ 但大環境本來就會掉 14 分（同期漂移）",
  "3️⃣ 扣掉後 −9.1 才是這個決策真正的責任",
  "4️⃣ 主要落在「卡點健康」維度（−81.9）",
  "5️⃣ 啟動討論：那 4 件 P95 卡點是這個決策造成的嗎？",
];

interpret.forEach((line, i) => {
  s12.addText(line, {
    x: 7.0, y: 2.85 + i * 0.65, w: 5.7, h: 0.55,
    fontSize: 12, fontFace: FB, color: NAVY, valign: "middle",
  });
});

s12.addText("→ 量化是為了啟動討論，不是替人下結論", {
  x: 7.0, y: 6.4, w: 5.5, h: 0.4,
  fontSize: 12, fontFace: FH, color: BERRY, italic: true, bold: true,
});

addFooter(s12, 12);

// ============================================================
// Slide 13：如何解讀 - What-if
// ============================================================
const s13 = pres.addSlide();
s13.background = { color: WHITE };
addCorner(s13, "12");

s13.addText("解讀指南", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s13.addText("怎麼用 What-if", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});

// 流程
const whatif_steps = [
  { num: "1", title: "拉開關", desc: "勾「解掉田宮電機」「+1 法遵專員」" },
  { num: "2", title: "看 Delta", desc: "雷達從現況跳到模擬後" },
  { num: "3", title: "讀建議", desc: "Δ +8.4 → 顯著改善 ✨ 強烈建議執行" },
  { num: "4", title: "決定", desc: "回到真實世界做這個決定（或不做）" },
];

whatif_steps.forEach((s, i) => {
  const x = 0.7 + i * 3.1;
  const y = 2.5;
  s13.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 2.85, h: 2.7,
    fill: { color: LIGHT }, line: { color: GOLD, width: 1 },
  });
  s13.addShape(pres.shapes.OVAL, {
    x: x + 1.0, y: y + 0.3, w: 0.85, h: 0.85,
    fill: { color: BERRY }, line: { type: "none" },
  });
  s13.addText(s.num, {
    x: x + 1.0, y: y + 0.3, w: 0.85, h: 0.85,
    fontSize: 28, fontFace: FH, color: WHITE, bold: true,
    align: "center", valign: "middle", margin: 0,
  });
  s13.addText(s.title, {
    x: x + 0.2, y: y + 1.4, w: 2.5, h: 0.4,
    fontSize: 16, fontFace: FH, color: NAVY, bold: true, align: "center",
  });
  s13.addText(s.desc, {
    x: x + 0.2, y: y + 1.85, w: 2.5, h: 0.7,
    fontSize: 11, fontFace: FB, color: SLATE, align: "center",
  });
});

// 警語
s13.addShape(pres.shapes.RECTANGLE, {
  x: 0.7, y: 5.6, w: 12, h: 1.3,
  fill: { color: NAVY }, line: { type: "none" },
});
s13.addText("⚠️ 重要原則", {
  x: 0.95, y: 5.7, w: 11.5, h: 0.4,
  fontSize: 13, fontFace: FH, color: GOLD, bold: true,
});
s13.addText("What-if 模擬出來的 Δ 是「在我們假設條件下的預測」，不是承諾。實際執行可能有延遲、有外部干擾。建議只用來「比較選項」（A vs B 哪個更好），不要用絕對值判斷。", {
  x: 0.95, y: 6.05, w: 11.5, h: 0.85,
  fontSize: 12, fontFace: FB, color: WHITE,
});

addFooter(s13, 13);

// ============================================================
// Slide 14：什麼時候不該信數字
// ============================================================
const s14 = pres.addSlide();
s14.background = { color: WHITE };
addCorner(s14, "13", BERRY);

s14.addText("透明的承諾", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: BERRY, charSpacing: 4,
});
s14.addText("什麼時候不該信數字", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 42, fontFace: FH, color: NAVY, bold: true,
});

const dont_trust = [
  { when: "資料量太少", desc: "新公司、新類別卡點：< 5 筆樣本時 percentile 不可靠（系統會自動 fallback 警示）" },
  { when: "極端事件期間", desc: "公司剛融資成功 / 大客戶丟單：12 週基線漂移會失準" },
  { when: "策略轉型期", desc: "公司剛從投資轉私募，過去的負載權重不再適用" },
  { when: "新功能剛上線", desc: "週報剛強制執行的 1-2 個月，週報品質維度會虛高" },
];

dont_trust.forEach((d, i) => {
  const y = 2.5 + i * 1.1;
  s14.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y, w: 12, h: 0.9,
    fill: { color: LIGHT }, line: { color: DUSTY, width: 0.5 },
  });
  s14.addText("⚠️", {
    x: 0.9, y: y + 0.1, w: 0.6, h: 0.6,
    fontSize: 28, valign: "middle", margin: 0,
  });
  s14.addText(d.when, {
    x: 1.6, y: y + 0.1, w: 3, h: 0.4,
    fontSize: 14, fontFace: FH, color: BERRY, bold: true,
  });
  s14.addText(d.desc, {
    x: 1.6, y: y + 0.45, w: 11, h: 0.45,
    fontSize: 11, fontFace: FB, color: SLATE,
  });
});

s14.addText("→ 我們公開列出限制，這是「白盒 DSS」對使用者的承諾", {
  x: 0.5, y: 7, w: 12.5, h: 0.3,
  fontSize: 13, fontFace: FH, color: NAVY, italic: true, bold: true, align: "center",
});

addFooter(s14, 14);

// ============================================================
// Slide 15：核心訊息
// ============================================================
const s15 = pres.addSlide();
s15.background = { color: WHITE };
addCorner(s15, "14");

s15.addText("回到最初的問題", {
  x: 1.3, y: 0.5, w: 11, h: 0.5,
  fontSize: 14, fontFace: FH, color: GREY, charSpacing: 4,
});
s15.addText("管理層想看這麼多嗎？", {
  x: 0.5, y: 1.0, w: 12, h: 0.9,
  fontSize: 38, fontFace: FH, color: NAVY, bold: true,
});

s15.addText("答案是不會。但也正因如此 ——", {
  x: 0.5, y: 2.1, w: 12, h: 0.5,
  fontSize: 18, fontFace: FB, color: SLATE,
});

// 大引言
s15.addShape(pres.shapes.RECTANGLE, {
  x: 0.7, y: 2.9, w: 12, h: 2.2,
  fill: { color: NAVY }, line: { type: "none" },
});
s15.addText("「", {
  x: 0.95, y: 2.9, w: 0.8, h: 0.8,
  fontSize: 60, fontFace: FH, color: GOLD, bold: true, margin: 0,
});
s15.addText("管理層的直覺判斷，", {
  x: 1.8, y: 3.2, w: 10.5, h: 0.6,
  fontSize: 26, fontFace: FH, color: WHITE, bold: true,
});
s15.addText("必須建立在可信的數字根據之上。", {
  x: 1.8, y: 3.85, w: 10.5, h: 0.6,
  fontSize: 26, fontFace: FH, color: GOLD, bold: true,
});
s15.addText("不然就是賭博，不是決策。", {
  x: 1.8, y: 4.5, w: 10.5, h: 0.5,
  fontSize: 20, fontFace: FB, color: CREAM, italic: true,
});

// 結論 3 條
s15.addText("我們做的是 ——", {
  x: 0.7, y: 5.4, w: 12, h: 0.4,
  fontSize: 16, fontFace: FH, color: NAVY, bold: true,
});

const conclusions = [
  ["✓ 上層 UI 簡單", "管理層 3 秒看完，不用碰演算法"],
  ["✓ 底層根據紮實", "25+ 演算法都可追溯到論文 / 業界 / 領域 / 校準"],
  ["✓ 信任就能建立", "管理層願意根據數字討論，數字就有價值"],
];

conclusions.forEach((c, i) => {
  s15.addText(c[0], {
    x: 0.7, y: 5.85 + i * 0.4, w: 4, h: 0.35,
    fontSize: 14, fontFace: FH, color: BERRY, bold: true,
  });
  s15.addText(c[1], {
    x: 4.7, y: 5.85 + i * 0.4, w: 8, h: 0.35,
    fontSize: 13, fontFace: FB, color: SLATE,
  });
});

addFooter(s15, 15);

// ============================================================
// Slide 16：結語
// ============================================================
const s16 = pres.addSlide();
s16.background = { color: NAVY };

s16.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 13.3, h: 1.5,
  fill: { color: GOLD }, line: { type: "none" },
});
s16.addText("謝謝聆聽", {
  x: 0.5, y: 0.3, w: 12, h: 0.9,
  fontSize: 56, fontFace: FH, color: NAVY, bold: true,
});

s16.addText("3 個設計信念", {
  x: 0.6, y: 2.0, w: 6, h: 0.5,
  fontSize: 22, fontFace: FH, color: GOLD, bold: true,
});

const beliefs = [
  "「資料越少，演算法的選擇越重要。」",
  "「跨頁面的一致性，比單頁的炫技更重要。」",
  "「能解釋的演算法，比準確 1% 的黑盒更值錢。」",
];
beliefs.forEach((b, i) => {
  s16.addText(b, {
    x: 0.6, y: 2.8 + i * 0.7, w: 12, h: 0.6,
    fontSize: 22, fontFace: FH, color: WHITE, italic: true,
  });
});

s16.addShape(pres.shapes.LINE, {
  x: 0.6, y: 5.5, w: 4, h: 0,
  line: { color: CREAM, width: 1.5 },
});

s16.addText("Architecture", {
  x: 0.6, y: 5.7, w: 4, h: 0.3,
  fontSize: 11, fontFace: FH, color: GOLD, charSpacing: 3,
});
s16.addText("UI 上層簡單 + 系統底層可追溯 + 跨頁面一致", {
  x: 0.6, y: 6.0, w: 8, h: 0.4,
  fontSize: 13, fontFace: FB, color: CREAM,
});

s16.addShape(pres.shapes.OVAL, {
  x: 11, y: 6.3, w: 1.8, h: 0.9,
  fill: { color: GOLD }, line: { type: "none" },
});
s16.addText("Q & A", {
  x: 11, y: 6.3, w: 1.8, h: 0.9,
  fontSize: 22, fontFace: FH, color: NAVY, bold: true,
  align: "center", valign: "middle", margin: 0,
});

// ============================================================
// 輸出
// ============================================================
pres.writeFile({ fileName: "docs/串連系統_數字來源與解讀.pptx" }).then(name => {
  console.log("OK -> " + name);
});
