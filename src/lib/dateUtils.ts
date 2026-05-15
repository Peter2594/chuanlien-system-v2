/**
 * 日期 / 週次工具
 */

export const NOW = new Date();

export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((+d - +yearStart) / 86400000) + 1) / 7);
}

// 回傳某週(weeksAgo=0 為本週)的「週一–週日」日期範圍字串
export function formatWeekLabel(weeksAgoOrDate: number | Date = 0): string {
  const target =
    typeof weeksAgoOrDate === "number"
      ? (() => {
          const d = new Date(NOW);
          d.setDate(d.getDate() - weeksAgoOrDate * 7);
          return d;
        })()
      : new Date(weeksAgoOrDate);
  const day = target.getDay();
  const daysToMon = day === 0 ? 6 : day - 1;
  target.setDate(target.getDate() - daysToMon);
  const start = new Date(target);
  const end = new Date(target);
  end.setDate(end.getDate() + 6);
  const yy = start.getFullYear();
  const fmtMD = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  return `${yy}/${fmtMD(start)} – ${fmtMD(end)}`;
}

export const CURRENT_WEEK_NUM = getISOWeek(NOW);
export const CURRENT_YEAR = NOW.getFullYear();
export const CURRENT_WEEK_LABEL = formatWeekLabel(0);

// 將任何週次字串轉為日期顯示
export function displayWeek(w: string | undefined | null): string {
  if (!w) return "";
  const s = String(w);
  if (/\d{4}[/-]\d{1,2}[/-]\d{1,2}/.test(s)) return s;
  const m = s.match(/(?:(\d{4})\s*)?第\s*(\d+)\s*週/);
  if (m) {
    const year = m[1] ? parseInt(m[1]) : NOW.getFullYear();
    const wk = parseInt(m[2]);
    const d = new Date(year, 0, 1);
    const dayNum = d.getDay() || 7;
    if (dayNum <= 4) d.setDate(d.getDate() - dayNum + 1);
    else d.setDate(d.getDate() + 8 - dayNum);
    d.setDate(d.getDate() + (wk - 1) * 7);
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    const fmt = (x: Date) =>
      `${String(x.getMonth() + 1).padStart(2, "0")}/${String(x.getDate()).padStart(2, "0")}`;
    return `${year}/${fmt(d)} – ${fmt(end)}`;
  }
  return s;
}

// 從週次字串解出可排序整數 (YYYYMMDD)
export function parseWeekKey(w: string | undefined | null): number {
  const m = String(w || "").match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!m) return 0;
  return +m[1] * 10000 + +m[2] * 100 + +m[3];
}

// 從 r.week 抽出開始日 Date
export function parseWeekStart(w: string | undefined | null): Date | null {
  const m = String(w || "").match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}
