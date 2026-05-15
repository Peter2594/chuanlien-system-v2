/**
 * 歷史案件搜尋演算法
 *
 * 採用 BM25F (Okapi BM25 with field weighting) + 多 n-gram + substring boost + 同義詞
 *
 * 為甚麼比原本的 TF-IDF cosine 準：
 *   1. BM25 的 TF 飽和函數比 cosine 的線性 TF 更接近人類認知 (出現 5 次和 50 次差距不大)
 *   2. BM25F 對標題 / 標籤 / 內文分別給權重，標題命中遠比內文命中重要
 *   3. 中文同時切 1-gram + 2-gram + 3-gram，proper noun (東京中央銀行) 被當完整詞抓
 *   4. 文件含 query 原始子字串時直接加 boost — 解決專有名詞被 n-gram 拆碎稀釋的問題
 *   5. 小型同義詞表處理金融/投資領域詞 (募資 ≈ 融資、盡調 ≈ DD、NDA ≈ 保密協議)
 */
import type { HistoryCase } from "./types";

// ===== 同義詞正規化 (查詢端和文件端都跑) =====
const SYNONYM_GROUPS: string[][] = [
  ["募資", "融資", "募款", "fundraising"],
  ["盡調", "盡職調查", "due diligence", "dd"],
  ["NDA", "保密協議", "保密"],
  ["LOI", "意向書"],
  ["估值", "valuation", "定價"],
  ["退場", "exit", "出場"],
  ["投委會", "投資委員會", "ic"],
  ["董事會", "board"],
  ["A 輪", "A輪", "series a"],
  ["Pre-A", "PreA", "pre-a", "種子輪後"],
  ["法遵", "compliance", "合規"],
  ["稅務", "tax"],
  ["風控", "風險管理", "risk"],
  ["客戶", "client", "customer"],
];

const SYNONYM_MAP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  SYNONYM_GROUPS.forEach((group) => {
    const canonical = group[0].toLowerCase();
    group.forEach((term) => { m[term.toLowerCase()] = canonical; });
  });
  return m;
})();

function normalizeSynonyms(text: string): string {
  let s = text.toLowerCase();
  // 從長到短替換以避免子字串覆蓋
  const keys = Object.keys(SYNONYM_MAP).sort((a, b) => b.length - a.length);
  keys.forEach((k) => {
    if (k.length < 2) return;
    s = s.split(k).join(" " + SYNONYM_MAP[k] + " ");
  });
  return s;
}

// ===== Tokenizer：中文 1/2/3-gram + 英數詞 =====
function tokenize(text: string): string[] {
  if (!text) return [];
  const norm = normalizeSynonyms(String(text));
  const tokens: string[] = [];

  // 英數連續詞 (含底線、小數點不切)
  const alnum = norm.match(/[a-z0-9]+/g) || [];
  tokens.push(...alnum);

  // 中文 n-gram
  const chineseChars = norm.replace(/[^一-龥]/g, "");
  // 1-gram (單字)
  for (let i = 0; i < chineseChars.length; i++) {
    tokens.push(chineseChars[i]);
  }
  // 2-gram
  for (let i = 0; i < chineseChars.length - 1; i++) {
    tokens.push(chineseChars.slice(i, i + 2));
  }
  // 3-gram (capture proper nouns)
  for (let i = 0; i < chineseChars.length - 2; i++) {
    tokens.push(chineseChars.slice(i, i + 3));
  }
  return tokens;
}

// ===== BM25 參數 =====
const K1 = 1.5;          // TF 飽和速度 (1.2-2.0 常見)
const B  = 0.75;         // 長度正規化強度 (0=不正規化, 1=完全正規化)

// ===== 欄位權重 (標題遠重要於內文) =====
const FIELD_WEIGHTS = {
  title:    5.0,   // 標題：最重要
  tags:     4.0,   // 標籤
  summary:  2.0,   // 摘要
  outcome:  1.5,   // 結論
  owner:    1.0,
  detail:   1.0,   // 詳細內文
} as const;

type FieldKey = keyof typeof FIELD_WEIGHTS;

function fieldText(item: HistoryCase, field: FieldKey): string {
  switch (field) {
    case "title":   return item.title || "";
    case "tags":    return (item.tags || []).join(" ");
    case "summary": return item.summary || "";
    case "outcome": return item.outcome || "";
    case "owner":   return item.owner || "";
    case "detail":  return [
      item.detail?.background, item.detail?.process,
      item.detail?.valuation,  item.detail?.result,
      item.detail?.lessons, ...(item.detail?.keyInsights || []),
    ].filter(Boolean).join(" ");
  }
}

// ===== BM25F index =====
interface DocIndex {
  item: HistoryCase;
  fields: Record<FieldKey, { tokens: string[]; tf: Record<string, number>; len: number }>;
  rawText: string;        // for substring boost
}

interface SearchResult extends HistoryCase {
  relevance: number;      // 0-100
  matchedTerms: string[];
}

export function buildIndex(docs: HistoryCase[]) {
  const indexed: DocIndex[] = docs.map((item) => {
    const fields: any = {};
    let rawText = "";
    (Object.keys(FIELD_WEIGHTS) as FieldKey[]).forEach((f) => {
      const text = fieldText(item, f);
      rawText += " " + text;
      const tokens = tokenize(text);
      const tf: Record<string, number> = {};
      tokens.forEach((t) => { tf[t] = (tf[t] || 0) + 1; });
      fields[f] = { tokens, tf, len: tokens.length };
    });
    return { item, fields, rawText: rawText.toLowerCase() };
  });

  // 平均欄位長度 (BM25 長度正規化用)
  const avgLen: Record<FieldKey, number> = {} as any;
  (Object.keys(FIELD_WEIGHTS) as FieldKey[]).forEach((f) => {
    const lens = indexed.map((d) => d.fields[f].len);
    avgLen[f] = lens.reduce((a, b) => a + b, 0) / Math.max(1, lens.length);
  });

  // IDF (跨所有欄位合併計算)
  const N = indexed.length || 1;
  const df: Record<string, number> = {};
  indexed.forEach((d) => {
    const seen = new Set<string>();
    (Object.keys(FIELD_WEIGHTS) as FieldKey[]).forEach((f) => {
      Object.keys(d.fields[f].tf).forEach((t) => seen.add(t));
    });
    seen.forEach((t) => { df[t] = (df[t] || 0) + 1; });
  });
  const idf: Record<string, number> = {};
  Object.keys(df).forEach((t) => {
    // BM25 IDF (Robertson-Sparck-Jones)，加 1 避免負值
    idf[t] = Math.log(1 + (N - df[t] + 0.5) / (df[t] + 0.5));
  });

  return { indexed, avgLen, idf };
}

export function searchHistory(query: string, docs: HistoryCase[]): SearchResult[] {
  const { indexed, avgLen, idf } = buildIndex(docs);

  if (!query.trim()) {
    return docs.map((d) => ({ ...d, relevance: 100, matchedTerms: [] }));
  }

  const qLower = query.toLowerCase().trim();
  const queryTokens = Array.from(new Set(tokenize(query)));
  // 過濾掉太短且 idf 為 0 的 1-gram noise (例：「的」「了」)
  const significantTokens = queryTokens.filter((t) => (idf[t] || 0) > 0.3);
  const effectiveTokens = significantTokens.length > 0 ? significantTokens : queryTokens;

  const scored = indexed.map((d) => {
    let score = 0;
    const contribs: { term: string; w: number }[] = [];

    // BM25F: 對每個欄位算 BM25 後加權求和
    effectiveTokens.forEach((t) => {
      const tIdf = idf[t] || 0;
      if (tIdf === 0) return;

      let termFieldScore = 0;
      (Object.keys(FIELD_WEIGHTS) as FieldKey[]).forEach((f) => {
        const tf = d.fields[f].tf[t] || 0;
        if (tf === 0) return;
        const len = d.fields[f].len;
        const norm = 1 - B + B * (len / Math.max(1, avgLen[f]));
        // BM25 TF saturation
        const tfNorm = (tf * (K1 + 1)) / (tf + K1 * norm);
        termFieldScore += FIELD_WEIGHTS[f] * tfNorm;
      });

      const w = tIdf * termFieldScore;
      if (w > 0) contribs.push({ term: t, w });
      score += w;
    });

    // === Substring boost: 文件原文含查詢字串時加分 ===
    // 這對專有名詞 (東京中央銀行) 特別重要
    if (qLower.length >= 2 && d.rawText.includes(qLower)) {
      score *= 1.8;
      contribs.push({ term: query.trim(), w: score * 0.3 });
    }

    // === Title exact substring boost ===
    if (qLower.length >= 2 && (d.item.title || "").toLowerCase().includes(qLower)) {
      score *= 1.4;
    }

    const topTerms = contribs.sort((a, b) => b.w - a.w).slice(0, 4).map((x) => x.term);
    return { item: d.item, score, matchedTerms: topTerms };
  });

  // 把原始分數正規化到 0-100 (相對於本次最高分)
  const maxScore = Math.max(...scored.map((s) => s.score), 0.0001);
  const filtered = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => ({
      ...s.item,
      relevance: Math.round((s.score / maxScore) * 100),
      matchedTerms: s.matchedTerms,
    }));

  return filtered;
}
