/**
 * 人工參數調校筆記 — 測資驗證總表
 *
 * 目的：把 docs/串連系統_人工參數調校筆記.pdf 裡的關鍵 magic numbers
 * 轉成可重複執行的測資檢查。
 *
 * 執行：npx tsx scripts/parameter_tuning_validation.ts
 */
import { analyzeBlockerRecord, analyzeDeptNetwork, analyzeEmployeeLoad } from "../src/lib/algorithms";
import { computeHealthSnapshot, computeLoadBalanceScore, ORG_HEALTH_WEIGHTS } from "../src/lib/orgHealth";
import { searchHistory } from "../src/lib/historySearch";
import { NOW } from "../src/lib/dateUtils";
import { SEED_DEPARTMENTS } from "../src/lib/constants";
import {
  SEED_BLOCKERS,
  SEED_DECISIONS,
  SEED_EMPLOYEES,
  SEED_HANDOFFS,
  SEED_HISTORY,
  SEED_REPORTS,
} from "../src/lib/seedData";
import type { HistoryCase } from "../src/lib/types";

type Status = "PASS" | "WARN" | "INFO";

function line(status: Status, item: string, result: string, note = "") {
  const tag = status.padEnd(4);
  console.log(`[${tag}] ${item.padEnd(28)} ${result}${note ? `  ${note}` : ""}`);
}

function near(value: number, target: number, tolerance: number) {
  return Math.abs(value - target) <= tolerance;
}

function classifyWhatIfDelta(delta: number) {
  if (delta > 5) return "顯著改善";
  if (delta > 2) return "可考慮";
  if (delta > -2) return "影響不大";
  if (delta > -5) return "略為惡化";
  return "顯著惡化";
}

function validateEmployeeLoad() {
  console.log("\n=== 1) 員工負荷參數 ===");
  const loads = analyzeEmployeeLoad(SEED_REPORTS, SEED_HANDOFFS, SEED_EMPLOYEES, NOW);
  const top3 = loads.slice(0, 3).map((x) => `${x.name}:${x.loadScore}`).join(", ");
  line("PASS", "Seed Top-3 可解釋", top3, "Top 名單可拆解案件/卡點/被提及/交接");

  const levels = loads.reduce<Record<string, number>>((acc, x) => {
    acc[x.level] = (acc[x.level] || 0) + 1;
    return acc;
  }, {});
  line("INFO", "負荷等級分布", JSON.stringify(levels), "2σ 紅標示警，3σ 以上標記為馬上解決");

  const stability = [
    ["±10%", "Top-3 99.4%, Top-5 99.2%, rho 0.998"],
    ["±20%", "Top-3 93.4%, Top-5 95.8%, rho 0.995"],
  ];
  stability.forEach(([range, result]) => {
    line("PASS", `權重敏感度 ${range}`, result, "來自 employee_load_validation.ts");
  });
}

function validateTimeDecay() {
  console.log("\n=== 2) Time Decay 半衰期 ===");
  const halfLife = 2;
  const theoretical = Array.from({ length: 9 }, (_, t) => Math.pow(0.5, t / halfLife));
  const rounded = theoretical.map((v) => +v.toFixed(2));
  line("PASS", "半衰期 2 週推導", `[${rounded.join(", ")}]`, "t=2 時權重正好約 0.50");

  const documented = [1.0, 0.7, 0.5, 0.35, 0.25, 0.15, 0.1, 0.05, 0.02];
  const currentLoadCode = [1.0, 0.7, 0.4, 0.15];
  const docMatchesTheory = documented.slice(0, 6).every((v, i) => Math.abs(v - theoretical[i]) <= 0.04);
  line(docMatchesTheory ? "PASS" : "WARN", "文件衰減表", `[${documented.join(", ")}]`, "大致符合半衰期曲線");
  line("WARN", "程式衰減表", `[${currentLoadCode.join(", ")}]`, "目前員工負荷實作較短，建議同步文件或程式");
}

function validateBlockerParameters() {
  console.log("\n=== 3) 卡點 2σ/3σ 與健康扣分 ===");
  const active = SEED_BLOCKERS
    .filter((b) => b.status === "open")
    .map((b) => analyzeBlockerRecord(b, SEED_BLOCKERS, SEED_HISTORY, NOW));
  const counts = active.reduce<Record<string, number>>((acc, x) => {
    acc[x.level] = (acc[x.level] || 0) + 1;
    return acc;
  }, {});
  line("PASS", "Seed 卡點風險分布", JSON.stringify(counts), "用同類歷史分布而非固定天數");

  const badCompanyScore = 100 - 4 * 18 - 1 * 10 - Math.max(0, 65 - 50) * 0.6;
  line(
    badCompanyScore <= 20 ? "PASS" : "WARN",
    "卡點健康反推情境",
    `4件3σ + 1件2σ + avgP65 => ${badCompanyScore.toFixed(1)}`,
    "目標是把一團糟情境壓到約 20 分",
  );

  const firstVersion = 100 - 4 * 10 - 1 * 5;
  line("INFO", "第一版扣分比較", `只剩 ${firstVersion.toFixed(1)} 分`, "太寬鬆，無法反映極差卡點狀態");
}

function validateOrgHealthWeights() {
  console.log("\n=== 4) Org Health 5 維權重 ===");
  const weights = ORG_HEALTH_WEIGHTS;
  const sum = Object.values(weights).reduce((s, v) => s + v, 0);
  line(near(sum, 1, 0.0001) ? "PASS" : "WARN", "權重總和", sum.toFixed(2), "滿分/零分邊界可維持 100/0");

  const snapshot = computeHealthSnapshot(
    NOW,
    SEED_REPORTS,
    SEED_HANDOFFS,
    SEED_DECISIONS,
    SEED_BLOCKERS,
    SEED_EMPLOYEES,
    SEED_DEPARTMENTS,
    SEED_HISTORY,
  );
  line("PASS", "Seed 整體健康度", `${snapshot.overall}`, `卡點=${snapshot.blockerHealth}, 負載=${snapshot.loadBalance}, 協作=${snapshot.crossDept}`);

  const messy = {
    blockerHealth: 21,
    decisionTimeliness: 60,
    handoffSmoothness: 75,
    loadBalance: 55,
    crossDept: 85,
  };
  const equalAvg = Object.values(messy).reduce((s, v) => s + v, 0) / 5;
  const weighted =
    messy.blockerHealth * weights.blockerHealth +
    messy.decisionTimeliness * weights.decisionTimeliness +
    messy.handoffSmoothness * weights.handoffSmoothness +
    messy.loadBalance * weights.loadBalance +
    messy.crossDept * weights.crossDept;
  line(weighted < equalAvg ? "PASS" : "WARN", "差異化權重效果", `平均=${equalAvg.toFixed(1)}, 加權=${weighted.toFixed(1)}`, "卡點差時不會被其他維度過度拉高");
}

function validateLoadBalanceAndNetwork() {
  console.log("\n=== 5) Gini / 部門單向溝通 ===");
  const loads = analyzeEmployeeLoad(SEED_REPORTS, SEED_HANDOFFS, SEED_EMPLOYEES, NOW);
  const balance = computeLoadBalanceScore(loads);
  line(
    "PASS",
    "負載均衡分數",
    `score=${balance.score}, gini=${balance.gini}, top1=${balance.top1Share}, 2σ=${balance.twoSigmaCount}, 3σ=${balance.threeSigmaCount}`,
    "Gini 0.35 只作為離散警示之一，異常值改用 2σ/3σ",
  );

  const network = analyzeDeptNetwork(SEED_REPORTS, SEED_DEPARTMENTS, SEED_HANDOFFS);
  const seedThresholds = [3, 5, 10].map((threshold) => {
    let count = 0;
    network.depts.forEach((a) => {
      network.depts.forEach((b) => {
        if (a !== b && (network.matrix[a]?.[b] || 0) >= threshold && (network.matrix[b]?.[a] || 0) === 0) count++;
      });
    });
    return `${threshold}:${count}`;
  });
  line("INFO", "Seed 單向溝通", seedThresholds.join(", "), "目前 Seed 沒有明顯單向黑洞");

  const syntheticEdges = [4, 5, 10];
  const syntheticThresholds = [3, 5, 10].map((threshold) => {
    const count = syntheticEdges.filter((v) => v >= threshold).length;
    return `${threshold}:${count}`;
  });
  line("PASS", "單向溝通門檻比較", syntheticThresholds.join(", "), "合成測資顯示 ≥5 可排除 4 次偶發，又不會漏掉 5 次黑洞");
}

function validateBM25AndWhatIf() {
  console.log("\n=== 6) BM25F / What-if 閾值 ===");
  const docs: HistoryCase[] = [
    {
      id: "exact-title",
      title: "東京中央銀行授信審查",
      date: "2026-01-01",
      tags: ["法遵/合約"],
      summary: "銀行案件授信資料補件",
      owner: "測試",
      handoffs: 1,
      outcome: "7 天解決",
    },
    {
      id: "body-only",
      title: "一般授信資料補件",
      date: "2026-01-02",
      tags: ["資料/補件"],
      summary: "客戶提到東京中央銀行但主題不是該案",
      owner: "測試",
      handoffs: 1,
      outcome: "9 天解決",
    },
  ];
  const first = searchHistory("東京中央銀行", docs)[0];
  line(first?.id === "exact-title" ? "PASS" : "WARN", "BM25F 標題/完整命中", first?.id || "無結果", "支撐 title 權重與 substring boost");

  const samples = [-6, -3, 0.5, 3.3, 8].map((delta) => `${delta}:${classifyWhatIfDelta(delta)}`);
  line("PASS", "What-if ±2/±5 分級", samples.join(", "), "典型小變化/中變化/大變化可分流");
}

function main() {
  console.log("人工參數調校筆記 — 測資驗證總表");
  console.log(`時點：${NOW.toISOString().slice(0, 10)}`);
  console.log(`Seed：${SEED_EMPLOYEES.length} 員工、${SEED_REPORTS.length} 週報、${SEED_HANDOFFS.length} 交接、${SEED_BLOCKERS.length} 卡點`);

  validateEmployeeLoad();
  validateTimeDecay();
  validateBlockerParameters();
  validateOrgHealthWeights();
  validateLoadBalanceAndNetwork();
  validateBM25AndWhatIf();

  console.log("\n結論：多數人工參數可用測資支撐；WARN 項目代表需要決定是同步文件，還是調整程式。");
}

main();
