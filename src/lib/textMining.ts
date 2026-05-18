/**
 * Text mining utilities for the historical case knowledge base.
 *
 * This layer sits on top of BM25F search: it extracts case fingerprints,
 * builds keyword co-occurrence signals, expands queries, and reranks results.
 */
import { searchHistory } from "./historySearch";
import type { HistoryCase } from "./types";

const SYNONYM_GROUPS: string[][] = [
  ["募資", "融資", "募款", "fundraising"],
  ["盡調", "盡職調查", "due diligence", "dd"],
  ["NDA", "保密協議", "保密"],
  ["LOI", "意向書"],
  ["估值", "valuation", "定價"],
  ["退場", "exit", "出場"],
  ["投委會", "投資委員會", "ic"],
  ["董事會", "board"],
  ["法遵", "compliance", "合規"],
  ["稅務", "tax"],
  ["風控", "風險管理", "risk"],
  ["客戶", "client", "customer"],
  ["排程", "時程", "schedule"],
];

const SYNONYM_MAP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  SYNONYM_GROUPS.forEach((group) => {
    const canonical = group[0].toLowerCase();
    group.forEach((term) => { m[term.toLowerCase()] = canonical; });
  });
  return m;
})();

const STOPWORDS = new Set([
  "公司", "案件", "資料", "處理", "進行", "完成", "確認", "目前", "需要", "相關", "問題",
  "已經", "協助", "提供", "取得", "進度", "本案", "客戶", "進一步", "討論", "會議",
  "投資", "管理", "部門", "結果", "背景", "過程", "關鍵", "經驗", "建議",
  "解決", "歷時", "主責", "財務", "法務", "窗口", "研究", "開發", "業務",
  "資研", "究部", "發部", "理部", "投資研", "資研究", "研究部", "務開發", "產管理",
  "投資研究部", "業務開發部", "資產管理部", "快速解決", "正常解決", "較慢解決", "嚴重延誤",
  "流程", "對接流程", "接流程", "流程值", "程值得",
]);

const DOMAIN_PHRASES = [
  "NDA", "保密協議", "條款審閱", "投資契約", "法務意見", "監管風險", "監管風險評估", "法遵", "合約",
  "募資規模", "資金配置", "預算追加", "預算追加評估", "募資", "融資", "資金",
  "財報補件", "盡調資料", "訪談紀錄", "資料格式", "補件", "盡調",
  "對接窗口", "資訊同步", "外部單位", "跨部門", "窗口對接",
  "投資委員會", "投委會", "條件書", "董事會", "追加投資", "簽核", "決策",
  "財務長", "行程安排", "會議排程", "外部窗口", "時程", "排程", "催促",
  "稅務", "退場", "估值", "風控",
];

const DOMAIN_HINTS = [
  "法", "遵", "務", "審", "監", "險", "募", "資", "金", "算", "財", "盡", "調",
  "訪", "補", "格式", "窗", "跨", "外", "投委", "董事", "簽", "決", "核", "排",
  "程", "催", "退", "稅", "估", "控",
];
const DOMAIN_PHRASE_SET = new Set(DOMAIN_PHRASES.map((p) => p.toLowerCase()));

export interface CaseFingerprint {
  caseId: string;
  keywords: { term: string; score: number }[];
}

export interface KnowledgeNode {
  term: string;
  count: number;
  score: number;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  count: number;
  pmi: number;
  strength: number;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface MinedSearchResult extends HistoryCase {
  relevance: number;
  matchedTerms: string[];
  fingerprint: string[];
  expandedTerms: string[];
  scoreBreakdown: {
    bm25: number;
    tags: number;
    keywords: number;
    freshness: number;
  };
}

function normalizeSynonyms(text: string): string {
  let s = String(text || "").toLowerCase();
  Object.keys(SYNONYM_MAP)
    .sort((a, b) => b.length - a.length)
    .forEach((k) => {
      if (k.length >= 2) s = s.split(k).join(` ${SYNONYM_MAP[k]} `);
    });
  return s;
}

function caseText(item: HistoryCase): string {
  return [
    item.title,
    ...(item.tags || []),
    item.summary,
    item.outcome,
    item.detail?.background,
    ...(item.detail?.keyInsights || []),
  ].filter(Boolean).join(" ");
}

export function tokenizeConcepts(text: string): string[] {
  const norm = normalizeSynonyms(text);
  const tokens: string[] = [];
  DOMAIN_PHRASES.forEach((phrase) => {
    const p = phrase.toLowerCase();
    if (norm.includes(p)) tokens.push(p);
  });
  tokens.push(...(norm.match(/[a-z0-9]{2,}/g) || []));

  const cleaned = norm
    .replace(/投資研究部|業務開發部|資產管理部/g, " ")
    .replace(/快速解決|正常解決|較慢解決|嚴重延誤/g, " ");
  const runs = cleaned.match(/[一-龥]{2,}/g) || [];
  runs.forEach((run) => {
    const maxGram = Math.min(4, run.length);
    for (let size = 2; size <= maxGram; size++) {
      for (let i = 0; i <= run.length - size; i++) {
        const term = run.slice(i, i + size);
        const hasDomainHint = DOMAIN_HINTS.some((hint) => term.includes(hint));
        const noisy = term.includes("部")
          || term.includes("公司")
          || term.includes("案件")
          || term.includes("解決")
          || term.includes("時間")
          || term.includes("決時")
          || term.includes("縮短");
        const isExactPhrase = DOMAIN_PHRASE_SET.has(term);
        const isPhraseFragment = DOMAIN_PHRASES.some((phrase) => {
          const p = phrase.toLowerCase();
          return p !== term && p.includes(term);
        });
        if (hasDomainHint && !noisy && !STOPWORDS.has(term) && (isExactPhrase || (term.length >= 3 && !isPhraseFragment))) {
          tokens.push(term);
        }
      }
    }
  });

  return tokens.filter((t) => !STOPWORDS.has(t));
}

function buildDocumentTerms(docs: HistoryCase[]) {
  const docTerms = docs.map((doc) => {
    const tf: Record<string, number> = {};
    tokenizeConcepts(caseText(doc)).forEach((t) => { tf[t] = (tf[t] || 0) + 1; });
    return { doc, tf };
  });

  const df: Record<string, number> = {};
  docTerms.forEach(({ tf }) => {
    Object.keys(tf).forEach((t) => { df[t] = (df[t] || 0) + 1; });
  });

  const n = Math.max(1, docs.length);
  const idf: Record<string, number> = {};
  Object.entries(df).forEach(([term, count]) => {
    idf[term] = Math.log((n + 1) / (count + 0.5)) + 1;
  });

  return { docTerms, df, idf };
}

function buildTermRank(docTerms: ReturnType<typeof buildDocumentTerms>["docTerms"]) {
  const graph = new Map<string, Map<string, number>>();

  docTerms.forEach(({ tf }) => {
    const terms = Object.keys(tf).slice(0, 80);
    terms.forEach((a, i) => {
      if (!graph.has(a)) graph.set(a, new Map());
      for (let j = i + 1; j < terms.length; j++) {
        const b = terms[j];
        if (!graph.has(b)) graph.set(b, new Map());
        const w = Math.min(tf[a], tf[b]);
        graph.get(a)!.set(b, (graph.get(a)!.get(b) || 0) + w);
        graph.get(b)!.set(a, (graph.get(b)!.get(a) || 0) + w);
      }
    });
  });

  let scores: Record<string, number> = {};
  graph.forEach((_, term) => { scores[term] = 1; });

  for (let iter = 0; iter < 18; iter++) {
    const next: Record<string, number> = {};
    graph.forEach((neighbors, term) => {
      let sum = 0;
      neighbors.forEach((weight, other) => {
        const total = Array.from(graph.get(other)?.values() || []).reduce((s, v) => s + v, 0) || 1;
        sum += (weight / total) * (scores[other] || 1);
      });
      next[term] = 0.15 + 0.85 * sum;
    });
    scores = next;
  }

  return scores;
}

export function extractCaseFingerprints(docs: HistoryCase[], limit = 6): CaseFingerprint[] {
  const { docTerms, idf } = buildDocumentTerms(docs);
  const termRank = buildTermRank(docTerms);

  return docTerms.map(({ doc, tf }) => {
    const titleTerms = new Set(tokenizeConcepts(doc.title));
    const tagTerms = new Set(tokenizeConcepts((doc.tags || []).join(" ")));
    const keywords = Object.entries(tf)
      .map(([term, count]) => ({
        term,
        score: (termRank[term] || 1) * (idf[term] || 1) * Math.sqrt(count)
          + (titleTerms.has(term) ? 2.4 : 0)
          + (tagTerms.has(term) ? 1.8 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((k) => ({ ...k, score: +k.score.toFixed(2) }));
    return { caseId: doc.id, keywords };
  });
}

export function buildKnowledgeGraph(docs: HistoryCase[], fingerprintLimit = 8): KnowledgeGraph {
  const fingerprints = extractCaseFingerprints(docs, fingerprintLimit);
  const termCount = new Map<string, number>();
  const pairCount = new Map<string, number>();
  const n = Math.max(1, docs.length);

  fingerprints.forEach((fp) => {
    const terms = Array.from(new Set(fp.keywords.map((k) => k.term)));
    terms.forEach((term) => termCount.set(term, (termCount.get(term) || 0) + 1));
    terms.forEach((a, i) => {
      for (let j = i + 1; j < terms.length; j++) {
        const b = terms[j];
        const key = [a, b].sort().join("\u0000");
        pairCount.set(key, (pairCount.get(key) || 0) + 1);
      }
    });
  });

  const nodes = Array.from(termCount.entries())
    .map(([term, count]) => ({ term, count, score: +(count * Math.log((n + 1) / count)).toFixed(2) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 18);
  const nodeSet = new Set(nodes.map((n2) => n2.term));

  const edges = Array.from(pairCount.entries())
    .map(([key, count]) => {
      const [source, target] = key.split("\u0000");
      const pSource = (termCount.get(source) || 1) / n;
      const pTarget = (termCount.get(target) || 1) / n;
      const pPair = count / n;
      const pmi = Math.log(pPair / (pSource * pTarget));
      return {
        source,
        target,
        count,
        pmi: +pmi.toFixed(2),
        strength: +(count * Math.max(0.1, pmi)).toFixed(2),
      };
    })
    .filter((e) => nodeSet.has(e.source) && nodeSet.has(e.target))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 24);

  return { nodes, edges };
}

export function expandQuery(query: string, docs: HistoryCase[], limit = 4): string[] {
  const qTerms = new Set(tokenizeConcepts(query));
  if (qTerms.size === 0) return [];

  const scores = new Map<string, number>();
  extractCaseFingerprints(docs, 8).forEach((fp) => {
    const terms = fp.keywords.map((k) => k.term);
    const hasQueryTerm = terms.some((term) => qTerms.has(term) || query.includes(term));
    if (!hasQueryTerm) return;
    terms.forEach((term, index) => {
      if (qTerms.has(term) || query.includes(term)) return;
      scores.set(term, (scores.get(term) || 0) + (8 - index));
    });
  });

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term]) => term);
}

function parseDateScore(dateText: string): number {
  const year = Number((dateText.match(/\d{4}/) || [0])[0]);
  if (!year) return 40;
  const currentYear = new Date().getFullYear();
  return Math.max(0, Math.min(100, 100 - Math.max(0, currentYear - year) * 12));
}

export function searchHistoryMined(query: string, docs: HistoryCase[]): MinedSearchResult[] {
  const fingerprints = extractCaseFingerprints(docs, 7);
  const fpMap = new Map(fingerprints.map((fp) => [fp.caseId, fp.keywords.map((k) => k.term)]));
  const expandedTerms = query.trim() ? expandQuery(query, docs, 4) : [];
  const baseResults = searchHistory(query, docs);
  const queryTerms = new Set([...tokenizeConcepts(query), ...expandedTerms]);
  const queryTags = new Set(docs.flatMap((d) => d.tags || []).filter((tag) => query.includes(tag)));

  return baseResults
    .map((result) => {
      const fingerprint = fpMap.get(result.id) || [];
      const keywordHits = fingerprint.filter((term) => queryTerms.has(term) || query.includes(term));
      const tagHits = (result.tags || []).filter((tag) => queryTags.has(tag) || query.includes(tag));
      const bm25 = result.relevance;
      const tags = Math.min(100, tagHits.length * 34);
      const keywords = query.trim() ? Math.min(100, keywordHits.length * 28) : 70;
      const freshness = parseDateScore(result.date);
      const finalScore = query.trim()
        ? bm25 * 0.58 + tags * 0.18 + keywords * 0.14 + freshness * 0.10
        : bm25;

      return {
        ...result,
        relevance: Math.round(finalScore),
        matchedTerms: Array.from(new Set([...result.matchedTerms, ...keywordHits])).slice(0, 6),
        fingerprint,
        expandedTerms,
        scoreBreakdown: {
          bm25: Math.round(bm25),
          tags: Math.round(tags),
          keywords: Math.round(keywords),
          freshness: Math.round(freshness),
        },
      };
    })
    .sort((a, b) => b.relevance - a.relevance);
}
