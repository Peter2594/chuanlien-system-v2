# -*- coding: utf-8 -*-
"""串連系統 v2.2 — 簡報產生器（日經編輯風：米底 + 深藍 + 朱紅）"""
import sys
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from lxml import etree

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ============ 配色（編輯雜誌風）============
CREAM     = RGBColor(0xF5, 0xF0, 0xE5)  # 米色底
NAVY      = RGBColor(0x1B, 0x2A, 0x4E)  # 深藍主色
VERMIL    = RGBColor(0xC1, 0x3C, 0x2E)  # 朱紅
GOLD      = RGBColor(0xB8, 0x92, 0x3C)  # 金色
INK_BLACK = RGBColor(0x1A, 0x1A, 0x1A)  # 內文黑
PAPER     = RGBColor(0xFA, 0xF6, 0xEC)  # 紙白（卡片）
GREY      = RGBColor(0x6B, 0x66, 0x5C)  # 灰色註解
LINE      = RGBColor(0x9C, 0x95, 0x85)  # 細線
SOFT_RED  = RGBColor(0xF2, 0xDC, 0xD3)  # 朱紅淡底
SOFT_GRN  = RGBColor(0xDC, 0xE3, 0xD0)  # 葉綠淡底

# 對外別名（標題原本印在深色底用 WHITE，現在改印 NAVY 於米底）
WHITE  = NAVY      # 原本「印在深色背景的白色標題」 → 改成深藍
DEEP   = NAVY
INK    = NAVY
SUBINK = GREY
HILITE = VERMIL
CORAL  = VERMIL
SUBTITLE_WHITE = GREY  # 副標原本淡白，現在改成灰

CN = "Microsoft JhengHei"  # Windows 內建繁中字型

# ============ 16:9 尺寸 ============
SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

prs = Presentation()
prs.slide_width = SLIDE_W
prs.slide_height = SLIDE_H
blank_layout = prs.slide_layouts[6]


def add_gradient_bg(slide):
    """背景：米色實底 + 上方深藍細線 + 角落金色裝飾"""
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_W, SLIDE_H)
    bg.line.fill.background()
    bg.fill.solid()
    bg.fill.fore_color.rgb = CREAM
    spTree = bg._element.getparent()
    spTree.remove(bg._element)
    spTree.insert(2, bg._element)

    # 頂部細裝飾：深藍色帶 + 朱紅短線
    top = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_W, Inches(0.18))
    top.line.fill.background()
    top.fill.solid()
    top.fill.fore_color.rgb = NAVY

    accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                     Inches(0), 0, Inches(2.0), Inches(0.18))
    accent.line.fill.background()
    accent.fill.solid()
    accent.fill.fore_color.rgb = VERMIL

    return bg


def add_text(slide, x, y, w, h, text, *, size=18, bold=False, color=WHITE,
             font=CN, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, line_spacing=1.2):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = Emu(0)
    tf.margin_top = tf.margin_bottom = Emu(0)
    tf.vertical_anchor = anchor
    lines = text.split("\n") if isinstance(text, str) else text
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = line_spacing
        run = p.add_run()
        run.text = line
        run.font.name = font
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.color.rgb = color
    return tb


def add_asterisk(slide, x, y, size_in=1.1, color=WHITE, alpha=None):
    """裝飾用的雪花星號 (8 角)"""
    s = Inches(size_in)
    shp = slide.shapes.add_shape(MSO_SHAPE.STAR_8_POINT, x, y, s, s)
    shp.line.fill.background()
    shp.fill.solid()
    shp.fill.fore_color.rgb = color
    if alpha is not None:
        # 透明度
        sf = shp.fill.fore_color._xClr
        # 簡單：不設透明
        pass
    return shp


def add_pill(slide, x, y, w, h, text, *, bg_color=WHITE, text_color=DEEP,
             size=20, bold=True, align=PP_ALIGN.CENTER):
    """白色圓角膠囊卡片"""
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    shp.adjustments[0] = 0.4
    shp.line.fill.background()
    if bg_color is None:
        shp.fill.background()
    else:
        shp.fill.solid()
        shp.fill.fore_color.rgb = bg_color
    tf = shp.text_frame
    tf.margin_left = Inches(0.2); tf.margin_right = Inches(0.2)
    tf.margin_top = Emu(0); tf.margin_bottom = Emu(0)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.name = CN
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = text_color
    return shp


def add_card(slide, x, y, w, h, *, bg_color=WHITE, corner=0.08, alpha=False):
    """白色圓角卡片（無文字）"""
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    shp.adjustments[0] = corner
    shp.line.fill.background()
    shp.fill.solid()
    shp.fill.fore_color.rgb = bg_color
    if alpha:
        # 半透明白
        spPr = shp.fill._xPr
        for el in spPr.findall(qn('a:solidFill')):
            spPr.remove(el)
        fill_xml = """<a:solidFill xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:srgbClr val="FFFFFF"><a:alpha val="35000"/></a:srgbClr>
        </a:solidFill>"""
        spPr.insert(0, etree.fromstring(fill_xml))
    return shp


def add_footer(slide, page_num, total=15):
    add_text(slide, Inches(0.5), Inches(7.05), Inches(6), Inches(0.35),
             "串連系統 v2.2 · 資管導論 第 13 組",
             size=10, color=WHITE)
    add_text(slide, Inches(11.5), Inches(7.05), Inches(1.5), Inches(0.35),
             f"{page_num:02d} / {total:02d}",
             size=10, color=WHITE, align=PP_ALIGN.RIGHT)


def add_chevron(slide, x, y, size_in=0.5, color=HILITE):
    """雙箭頭裝飾 >>"""
    s = Inches(size_in)
    shp = slide.shapes.add_shape(MSO_SHAPE.CHEVRON, x, y, s, s)
    shp.line.fill.background()
    shp.fill.solid()
    shp.fill.fore_color.rgb = color
    return shp


# ===========================================================
# Slide 1 — 封面
# ===========================================================
def slide_cover():
    s = prs.slides.add_slide(blank_layout)
    add_gradient_bg(s)

    # 右上 tag
    tag = add_pill(s, Inches(11.0), Inches(0.5), Inches(1.8), Inches(0.45),
                   "資訊管理導論", bg_color=None, text_color=WHITE, size=12, bold=False)
    tag.fill.background()
    tag.line.color.rgb = WHITE
    tag.line.width = Pt(1)

    # 大標題
    add_text(s, Inches(0.8), Inches(2.4), Inches(11), Inches(2.0),
             "串連系統 v2.2",
             size=64, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(3.4), Inches(11), Inches(1.0),
             "管理決策支援平台 · 從訊號到行動",
             size=24, color=WHITE)

    # 副標 italic
    add_text(s, Inches(0.8), Inches(4.6), Inches(11), Inches(0.6),
             "Chuanlien · A Decision Support Platform",
             size=18, color=RGBColor(0xE8, 0xE0, 0xFF))

    # 右側裝飾雪花
    add_asterisk(s, Inches(11.3), Inches(4.2), 1.4, WHITE)

    # 組員
    add_text(s, Inches(0.8), Inches(6.4), Inches(2), Inches(0.4),
             "第 13 組", size=12, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(6.7), Inches(11), Inches(0.4),
             "林聿平　組員 A　組員 B　組員 C　組員 D",
             size=14, bold=True, color=WHITE)


# ===========================================================
# Slide 2 — 大綱
# ===========================================================
def slide_agenda():
    s = prs.slides.add_slide(blank_layout)
    add_gradient_bg(s)
    add_text(s, Inches(0.8), Inches(0.6), Inches(8), Inches(0.8),
             "大綱", size=44, bold=True, color=WHITE)
    add_asterisk(s, Inches(11.6), Inches(0.5), 1.0, WHITE)

    cards = [
        ("01", "問題", ["管理層看不見「正在發生什麼」", "情緒判斷 vs 數據事實"]),
        ("02", "系統", ["三大模組：負載 / 健康度 / 決策", "25+ 演算法支撐"]),
        ("03", "亮點", ["反推校準方法論", "Cohort Adjustment", "What-if 模擬器"]),
    ]
    card_w = Inches(3.6)
    card_h = Inches(4.4)
    gap = Inches(0.4)
    total_w = card_w * 3 + gap * 2
    start_x = (SLIDE_W - total_w) // 2
    y = Inches(1.9)

    for i, (num, title, items) in enumerate(cards):
        x = start_x + (card_w + gap) * i
        add_card(s, x, y, card_w, card_h, bg_color=WHITE, corner=0.08)
        add_text(s, x + Inches(0.4), y + Inches(0.4), card_w - Inches(0.8), Inches(0.6),
                 num, size=36, bold=True, color=HILITE)
        add_text(s, x + Inches(0.4), y + Inches(1.0), card_w - Inches(0.8), Inches(0.6),
                 title, size=28, bold=True, color=DEEP)
        # 線分隔
        ln = s.shapes.add_connector(1, x + Inches(0.4), y + Inches(1.9),
                                    x + Inches(1.5), y + Inches(1.9))
        ln.line.color.rgb = HILITE
        ln.line.width = Pt(2)
        for j, it in enumerate(items):
            add_text(s, x + Inches(0.4), y + Inches(2.15 + j * 0.55),
                     card_w - Inches(0.8), Inches(0.5),
                     "• " + it, size=15, color=SUBINK)

    add_footer(s, 2)


# ===========================================================
# Slide 3 — 痛點
# ===========================================================
def slide_pain():
    s = prs.slides.add_slide(blank_layout)
    add_gradient_bg(s)
    add_text(s, Inches(0.8), Inches(0.6), Inches(8), Inches(0.8),
             "痛點", size=44, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(1.45), Inches(11), Inches(0.6),
             "管理層每天面對的問題其實只有三個",
             size=18, color=RGBColor(0xE8, 0xE0, 0xFF))
    add_asterisk(s, Inches(11.6), Inches(0.5), 1.0, WHITE)

    pains = [
        ("誰快撐不住了？", "員工負載靠主管「感覺」，沒有客觀指標"),
        ("組織哪裡卡住了？", "卡點分散在多個系統，沒人串起來看"),
        ("我這個決策有效嗎？", "事後沒回看，下一次照樣憑直覺"),
    ]
    y0 = Inches(2.4)
    for i, (q, a) in enumerate(pains):
        y = y0 + Inches(i * 1.5)
        add_card(s, Inches(0.8), y, Inches(11.7), Inches(1.25),
                 bg_color=WHITE, corner=0.25)
        # 序號
        add_text(s, Inches(1.1), y + Inches(0.25), Inches(0.8), Inches(0.8),
                 f"0{i+1}", size=36, bold=True, color=HILITE)
        add_text(s, Inches(2.2), y + Inches(0.18), Inches(10), Inches(0.6),
                 q, size=24, bold=True, color=DEEP)
        add_text(s, Inches(2.2), y + Inches(0.72), Inches(10), Inches(0.5),
                 a, size=14, color=SUBINK)

    add_footer(s, 3)


# ===========================================================
# Slide 4 — 解法總覽
# ===========================================================
def slide_overview():
    s = prs.slides.add_slide(blank_layout)
    add_gradient_bg(s)
    add_text(s, Inches(0.8), Inches(0.6), Inches(8), Inches(0.8),
             "解法", size=44, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(1.45), Inches(11), Inches(0.6),
             "把三個問題拆成三個模組，背後用 25+ 演算法支撐",
             size=18, color=RGBColor(0xE8, 0xE0, 0xFF))
    add_asterisk(s, Inches(11.6), Inches(0.5), 1.0, WHITE)

    mods = [
        ("員工負載", "誰快撐不住了", "Empirical Percentile · Time Decay\nGini Coefficient", "P75/P90/P95"),
        ("組織健康度", "哪裡卡住了", "BM25F · Asymmetric Detection\n6D Weighted Scoring", "權重 22/18/15/18/12/15"),
        ("決策影響", "決策有效嗎", "Cohort Adjustment\nLinear Regression Baseline", "v2.2 學術創舉"),
    ]
    card_w = Inches(3.9)
    card_h = Inches(4.6)
    gap = Inches(0.25)
    total_w = card_w * 3 + gap * 2
    start_x = (SLIDE_W - total_w) // 2
    y = Inches(2.2)

    for i, (name, q, algo, tag) in enumerate(mods):
        x = start_x + (card_w + gap) * i
        add_card(s, x, y, card_w, card_h, bg_color=WHITE, corner=0.06)
        # 上方色塊
        top = s.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                  x, y, card_w, Inches(0.5))
        top.line.fill.background()
        top.fill.solid()
        top.fill.fore_color.rgb = HILITE
        # 標題
        add_text(s, x + Inches(0.4), y + Inches(0.75), card_w - Inches(0.8), Inches(0.7),
                 name, size=26, bold=True, color=DEEP)
        # Q
        add_text(s, x + Inches(0.4), y + Inches(1.5), card_w - Inches(0.8), Inches(0.5),
                 f"→ {q}", size=14, color=CORAL)
        # 算法
        add_text(s, x + Inches(0.4), y + Inches(2.2), card_w - Inches(0.8), Inches(0.5),
                 "核心演算法", size=12, bold=True, color=SUBINK)
        add_text(s, x + Inches(0.4), y + Inches(2.55), card_w - Inches(0.8), Inches(1.5),
                 algo, size=13, color=DEEP, line_spacing=1.4)
        # tag pill
        add_pill(s, x + Inches(0.4), y + Inches(3.85),
                 card_w - Inches(0.8), Inches(0.45),
                 tag, bg_color=RGBColor(0xEC, 0xE4, 0xFF), text_color=DEEP, size=12)

    add_footer(s, 4)


# ===========================================================
# Slide 5–7 — 三大模組 (員工負載 / 健康度 / 決策影響)
# ===========================================================
def slide_module(num, title, subtitle, scene, before, after,
                 refs, page):
    """直觀版：場景 → BEFORE / AFTER → 為什麼相信"""
    s = prs.slides.add_slide(blank_layout)
    add_gradient_bg(s)
    add_text(s, Inches(0.8), Inches(0.4), Inches(2), Inches(0.4),
             f"模組 0{num}", size=12, bold=True, color=RGBColor(0xE8, 0xE0, 0xFF))
    add_text(s, Inches(0.8), Inches(0.7), Inches(11), Inches(0.7),
             title, size=32, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(1.32), Inches(11), Inches(0.4),
             subtitle, size=14, color=RGBColor(0xE8, 0xE0, 0xFF))
    add_asterisk(s, Inches(11.6), Inches(0.3), 0.8, WHITE)

    # 左：場景對話框
    add_card(s, Inches(0.6), Inches(1.85), Inches(5.6), Inches(3.0),
             bg_color=WHITE, corner=0.05)
    add_text(s, Inches(0.9), Inches(2.0), Inches(5.0), Inches(0.4),
             "情境：主管在問什麼", size=13, bold=True, color=HILITE)
    add_text(s, Inches(0.9), Inches(2.5), Inches(5.0), Inches(2.3),
             scene, size=14, color=DEEP, line_spacing=1.55)

    # 中：BEFORE
    add_card(s, Inches(6.4), Inches(1.85), Inches(3.3), Inches(3.0),
             bg_color=RGBColor(0xFF, 0xE8, 0xE8), corner=0.05)
    bar1 = s.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                              Inches(6.4), Inches(1.85), Inches(3.3), Inches(0.45))
    bar1.line.fill.background()
    bar1.fill.solid()
    bar1.fill.fore_color.rgb = CORAL
    add_text(s, Inches(6.55), Inches(1.92), Inches(3.0), Inches(0.35),
             "以前怎麼做", size=12, bold=True, color=WHITE)
    add_text(s, Inches(6.6), Inches(2.5), Inches(3.0), Inches(2.3),
             before, size=12, color=DEEP, line_spacing=1.5)

    # 右：AFTER
    add_card(s, Inches(9.85), Inches(1.85), Inches(3.3), Inches(3.0),
             bg_color=RGBColor(0xE6, 0xF9, 0xEF), corner=0.05)
    bar2 = s.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                              Inches(9.85), Inches(1.85), Inches(3.3), Inches(0.45))
    bar2.line.fill.background()
    bar2.fill.solid()
    bar2.fill.fore_color.rgb = RGBColor(0x2E, 0xB8, 0x76)
    add_text(s, Inches(10.0), Inches(1.92), Inches(3.0), Inches(0.35),
             "現在系統怎麼答", size=12, bold=True, color=WHITE)
    add_text(s, Inches(10.05), Inches(2.5), Inches(3.0), Inches(2.3),
             after, size=12, color=DEEP, line_spacing=1.5)

    # 下：為什麼相信
    add_text(s, Inches(0.6), Inches(5.0), Inches(10), Inches(0.4),
             "為什麼相信這個數字？", size=13, bold=True, color=WHITE)

    ref_labels = ["經典管理書這樣寫", "業界這樣做", "我們驗證過"]
    ref_colors = [RGBColor(0x6C, 0x5C, 0xE7),
                  RGBColor(0x4A, 0x90, 0xE2),
                  RGBColor(0xE2, 0x82, 0x4A)]
    cw = Inches(4.18)
    ch = Inches(1.7)
    gap = Inches(0.15)
    for i, ((rt, rb), label, col) in enumerate(zip(refs, ref_labels, ref_colors)):
        x = Inches(0.6) + (cw + gap) * i
        add_card(s, x, Inches(5.45), cw, ch, bg_color=WHITE, corner=0.08)
        bar = s.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                  x, Inches(5.45), cw, Inches(0.32))
        bar.line.fill.background()
        bar.fill.solid()
        bar.fill.fore_color.rgb = col
        add_text(s, x + Inches(0.15), Inches(5.47), cw - Inches(0.3), Inches(0.3),
                 label, size=11, bold=True, color=WHITE)
        add_text(s, x + Inches(0.2), Inches(5.83), cw - Inches(0.4), Inches(0.35),
                 rt, size=11, bold=True, color=DEEP)
        add_text(s, x + Inches(0.2), Inches(6.15), cw - Inches(0.4), Inches(1.0),
                 rb, size=10, color=SUBINK, line_spacing=1.4)

    add_footer(s, page)


def slide_load():
    slide_module(
        1, "誰快撐不住了？", "員工負載 — 一張圖看完所有人的壓力",
        scene=(
            "林經理：\n"
            "「我們組 17 個人，到底誰最操？\n"
            " 我問了一圈，每個人都說自己很忙，\n"
            " 我也不知道是不是真的。」"
        ),
        before=(
            "❌ 主管憑感覺\n\n"
            "30 分鐘問一輪，\n"
            "每個人都說「我很忙」，\n"
            "資深員工不抱怨，\n"
            "新人喊得最大聲。\n\n"
            "→ 結果：林聿平爆掉，\n"
            "    主管才知道。"
        ),
        after=(
            "✅ 系統 3 秒回答\n\n"
            "打開頁面就看到\n"
            "一條彩色長條圖：\n"
            "🟥 林聿平 (high)\n"
            "🟧 蔡明遠 (high)\n"
            "🟨 楊雅雯 (mid)\n"
            "🟩 其他 14 人 (low)"
        ),
        refs=[
            ("半衰期 14 天",
             "Andy Grove《High Output Management》：\n"
             "管理用 2 週為一個檢視週期，\n"
             "兩週前的事影響力剩一半。"),
            ("Atlassian Jira 也這樣",
             "工作量靠「件數 × 權重」算分，\n"
             "我們也用一樣的概念，\n"
             "把卡點、案件、交接加總。"),
            ("17 員工 SEED 測試",
             "第一版：0 人過載（主管期望 2 人）\n"
             "第四版：2 人過載，名單跟主管直覺一致\n"
             "命中率 100%。"),
        ],
        page=5,
    )


def slide_health():
    slide_module(
        2, "組織哪裡卡住了？", "健康度 6 維 — 一張雷達圖看全公司體檢",
        scene=(
            "董事長：\n"
            "「業績下滑了，\n"
            " 我想知道是哪裡出問題，\n"
            " 不是等財報出來才知道。」"
        ),
        before=(
            "❌ 只看業績數字\n\n"
            "業績是「結果」，\n"
            "不是「原因」。\n\n"
            "等財報出來，\n"
            "問題已經發生 3 個月。\n\n"
            "→ 沒辦法事前介入"
        ),
        after=(
            "✅ 像體檢的雷達圖\n\n"
            "六個面向同時看：\n"
            "• 流動性\n"
            "• 成員健康\n"
            "• 卡點密度\n"
            "• 溝通對稱\n"
            "• 決策效率\n"
            "• 負載均衡\n\n"
            "哪一邊凹下去 = 哪邊出事"
        ),
        refs=[
            ("Edmondson 哈佛教授",
             "《The Fearless Organization》：\n"
             "「溝通是否對稱」+「成員心理狀態」\n"
             "是高績效團隊的關鍵。"),
            ("McKinsey OHI 模型",
             "業界公認的 9 維組織健康度量表，\n"
             "我們刪掉製造業專用的 3 維，\n"
             "留下適合一般公司的 6 維。"),
            ("3 部門盲測",
             "找 3 位主管不看分數先排序，\n"
             "我們的系統算完排序一模一樣，\n"
             "差距從原本 3% 變 14%（看得清楚了）。"),
        ],
        page=6,
    )


def slide_impact():
    slide_module(
        3, "決策有效嗎？", "Decision Impact — 不是你做爛，可能是大盤在跌",
        scene=(
            "主管 A：\n"
            "「我做了 5 個決策，\n"
            " 系統說我影響都是負的？\n"
            " 可是這季大盤本來就跌啊！」"
        ),
        before=(
            "❌ 用絕對分數評\n\n"
            "本季大盤 -8%\n"
            "主管 A：-5%\n"
            "主管 B：-7%\n"
            "主管 C：-10%\n\n"
            "→ 全部都是負的，\n"
            "    看起來大家都做爛"
        ),
        after=(
            "✅ 跟同期其他人比\n\n"
            "扣掉大盤的 -8%：\n"
            "主管 A：+3 ✨\n"
            "主管 B：+1\n"
            "主管 C：-2 (真的差)\n\n"
            "→ 誰好誰差，\n"
            "    一目了然"
        ),
        refs=[
            ("經濟學標準做法",
             "Card & Krueger (1994) 用「同期比較」\n"
             "把大環境影響扣掉，\n"
             "只看個別主管的真實貢獻。"),
            ("Google 也這樣做",
             "Google OKR 評分要求「相對 cohort」，\n"
             "因為絕對分數沒意義 —\n"
             "經濟好時誰做都好。"),
            ("12 決策 × 3 主管驗證",
             "舊版：3/3 主管都負分（不合理）\n"
             "新版：2 好 1 差，\n"
             "跟管理層事後排序一致。"),
        ],
        page=7,
    )


# ===========================================================
# Slide 8 — 反推校準方法論
# ===========================================================
def slide_calibration():
    s = prs.slides.add_slide(blank_layout)
    add_gradient_bg(s)
    add_text(s, Inches(0.8), Inches(0.55), Inches(2), Inches(0.5),
             "方法論", size=14, bold=True, color=RGBColor(0xE8, 0xE0, 0xFF))
    add_text(s, Inches(0.8), Inches(0.9), Inches(11), Inches(0.9),
             "反推校準（Reverse Calibration）", size=36, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(1.7), Inches(11), Inches(0.5),
             "為什麼我們的人工參數不是憑空捏的", size=16, color=RGBColor(0xE8, 0xE0, 0xFF))
    add_asterisk(s, Inches(11.6), Inches(0.5), 1.0, WHITE)

    steps = [
        ("1", "先猜一個", "看書、抄業界，\n憑直覺給數字"),
        ("2", "拿資料跑", "用 17 員工模擬資料\n跑出結果"),
        ("3", "對答案", "問主管：「這個結果\n跟你直覺一不一樣？」"),
        ("4", "改數字", "不一樣就回去調，\n直到對得上"),
        ("5", "穩了", "改到主管說\n「對，就是這樣」"),
    ]
    card_w = Inches(2.35)
    card_h = Inches(4.0)
    gap = Inches(0.15)
    total_w = card_w * 5 + gap * 4
    start_x = (SLIDE_W - total_w) // 2
    y = Inches(2.5)

    for i, (n, t, d) in enumerate(steps):
        x = start_x + (card_w + gap) * i
        add_card(s, x, y, card_w, card_h, bg_color=WHITE, corner=0.08)
        # 大號碼
        add_text(s, x, y + Inches(0.4), card_w, Inches(1.0),
                 n, size=60, bold=True, color=HILITE, align=PP_ALIGN.CENTER)
        # 標題
        add_text(s, x, y + Inches(1.7), card_w, Inches(0.6),
                 t, size=20, bold=True, color=DEEP, align=PP_ALIGN.CENTER)
        # 描述
        add_text(s, x + Inches(0.2), y + Inches(2.5), card_w - Inches(0.4), Inches(1.5),
                 d, size=12, color=SUBINK, align=PP_ALIGN.CENTER, line_spacing=1.4)

        # 箭頭
        if i < 4:
            chev = s.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW,
                                       x + card_w + Inches(0.0),
                                       y + Inches(1.85), gap, Inches(0.3))
            chev.line.fill.background()
            chev.fill.solid()
            chev.fill.fore_color.rgb = WHITE

    # 底部口號
    add_pill(s, Inches(2.5), Inches(6.6), Inches(8.3), Inches(0.45),
             "「9 個係數不是 9 個獨立決定，是 1 個學理依據的離散採樣」",
             bg_color=RGBColor(0xEC, 0xE4, 0xFF), text_color=DEEP, size=14)

    add_footer(s, 8)


# ===========================================================
# Slide 9 — BM25F
# ===========================================================
def slide_bm25f():
    s = prs.slides.add_slide(blank_layout)
    add_gradient_bg(s)
    add_text(s, Inches(0.8), Inches(0.55), Inches(2), Inches(0.5),
             "亮點 01", size=14, bold=True, color=RGBColor(0xE8, 0xE0, 0xFF))
    add_text(s, Inches(0.8), Inches(0.9), Inches(11), Inches(0.9),
             "智能搜尋", size=40, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(1.7), Inches(11), Inches(0.5),
             "輸入「太洋」找得到「太洋證券法律意見書」 — Ctrl+F 做不到的事",
             size=16, color=RGBColor(0xE8, 0xE0, 0xFF))
    add_asterisk(s, Inches(11.6), Inches(0.5), 1.0, WHITE)

    # 左：欄位權重圖示
    add_card(s, Inches(0.7), Inches(2.4), Inches(6.0), Inches(4.4),
             bg_color=WHITE, corner=0.05)
    add_text(s, Inches(1.0), Inches(2.65), Inches(5.4), Inches(0.5),
             "搜尋會看哪邊（重要程度）", size=14, bold=True, color=HILITE)
    fields = [
        ("案件標題", 5.0, "最重要"),
        ("摘要", 4.0, "很重要"),
        ("分類標籤", 2.0, "中等"),
        ("負責人名", 1.5, "中等"),
        ("內文",  1.0, "略看"),
        ("留言",  1.0, "略看"),
    ]
    bar_y = Inches(3.2)
    for i, (name, w, lbl) in enumerate(fields):
        y = bar_y + Inches(i * 0.5)
        add_text(s, Inches(1.0), y, Inches(0.9), Inches(0.4),
                 name, size=12, bold=True, color=DEEP)
        # 長條
        bw = Inches(0.6 * w)
        bar = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                  Inches(2.0), y + Inches(0.05),
                                  bw, Inches(0.3))
        bar.adjustments[0] = 0.3
        bar.line.fill.background()
        bar.fill.solid()
        bar.fill.fore_color.rgb = HILITE
        add_text(s, Inches(2.0) + bw + Inches(0.1), y, Inches(0.8), Inches(0.4),
                 lbl, size=12, bold=True, color=DEEP)

    # 右：參數
    add_card(s, Inches(6.9), Inches(2.4), Inches(5.7), Inches(4.4),
             bg_color=WHITE, corner=0.05)
    add_text(s, Inches(7.2), Inches(2.65), Inches(5.1), Inches(0.5),
             "三招讓搜尋變聰明", size=14, bold=True, color=HILITE)
    add_text(s, Inches(7.2), Inches(3.15), Inches(5.1), Inches(3.5),
             ("① 欄位有輕重\n"
              "  關鍵字在「標題」=5 分，\n"
              "  在「留言」只有 1 分。\n"
              "  → 案件名稱才是真正在問什麼\n\n"
              "② 知道你打不完整\n"
              "  搜「太洋」也找得到「太洋證券」\n"
              "  搜「林聿」也找得到「林聿平」\n"
              "  → 中文沒空格的特殊處理\n\n"
              "③ 同義詞自動轉\n"
              "  「客戶」「客人」「使用者」\n"
              "  視為同一個詞\n\n"
              "命中率比一般搜尋提升 93%\n"
              "(0.42 → 0.81)"),
             size=12, color=DEEP, line_spacing=1.4)

    add_footer(s, 9)


# ===========================================================
# Slide 10 — What-if 模擬器
# ===========================================================
def slide_whatif():
    s = prs.slides.add_slide(blank_layout)
    add_gradient_bg(s)
    add_text(s, Inches(0.8), Inches(0.55), Inches(2), Inches(0.5),
             "亮點 02", size=14, bold=True, color=RGBColor(0xE8, 0xE0, 0xFF))
    add_text(s, Inches(0.8), Inches(0.9), Inches(11), Inches(0.9),
             "What-if 模擬器", size=40, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(1.7), Inches(11), Inches(0.5),
             "不用真的改人事，先模擬看看",
             size=16, color=RGBColor(0xE8, 0xE0, 0xFF))
    add_asterisk(s, Inches(11.6), Inches(0.5), 1.0, WHITE)

    # 三步驟
    steps = [
        ("拖員工到別組", "用滑鼠拖一拖就好"),
        ("即時看分佈", "Gini 變了？誰過載？"),
        ("系統給建議", "「把 X 移到 Y 組會更平均」"),
    ]
    y = Inches(2.5)
    for i, (t, d) in enumerate(steps):
        x = Inches(0.8 + i * 4.15)
        add_card(s, x, y, Inches(3.9), Inches(2.4),
                 bg_color=WHITE, corner=0.06)
        add_text(s, x + Inches(0.3), y + Inches(0.3), Inches(3.3), Inches(0.6),
                 f"Step {i+1}", size=14, bold=True, color=HILITE)
        add_text(s, x + Inches(0.3), y + Inches(0.85), Inches(3.3), Inches(0.7),
                 t, size=18, bold=True, color=DEEP, line_spacing=1.3)
        add_text(s, x + Inches(0.3), y + Inches(1.7), Inches(3.3), Inches(0.6),
                 d, size=12, color=SUBINK)

    # 底部數字
    add_card(s, Inches(0.8), Inches(5.3), Inches(11.7), Inches(1.5),
             bg_color=WHITE, corner=0.1)
    add_text(s, Inches(1.0), Inches(5.5), Inches(11.5), Inches(0.5),
             "為什麼這樣設計？",
             size=14, bold=True, color=HILITE)
    add_text(s, Inches(1.0), Inches(5.95), Inches(11.5), Inches(1.0),
             ("• 不用真的改人事 — 在「另一條時間線」試試看，反悔不要錢\n"
              "• 拖到哪算到哪 — 拖曳當下就重算，不用等\n"
              "• 系統會主動建議 — 「把蔡明遠移到投研，整體會更平均」"),
             size=13, color=DEEP, line_spacing=1.5)

    add_footer(s, 10)


# ===========================================================
# Slide 11 — 部門互動網絡
# ===========================================================
def slide_network():
    s = prs.slides.add_slide(blank_layout)
    add_gradient_bg(s)
    add_text(s, Inches(0.8), Inches(0.55), Inches(2), Inches(0.5),
             "亮點 03", size=14, bold=True, color=RGBColor(0xE8, 0xE0, 0xFF))
    add_text(s, Inches(0.8), Inches(0.9), Inches(11), Inches(0.9),
             "誰一直在追誰跑？", size=40, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(1.7), Inches(11), Inches(0.5),
             "業務找設計 9 次，設計只回 1 次 — 這就是「卡」的訊號",
             size=16, color=RGBColor(0xE8, 0xE0, 0xFF))
    add_asterisk(s, Inches(11.6), Inches(0.5), 1.0, WHITE)

    # 左：示意圖
    add_card(s, Inches(0.7), Inches(2.4), Inches(6.0), Inches(4.4),
             bg_color=WHITE, corner=0.05)
    add_text(s, Inches(1.0), Inches(2.65), Inches(5.4), Inches(0.5),
             "看箭頭的粗細不對等", size=14, bold=True, color=HILITE)

    # 三個節點 + 不對稱箭頭
    nodes = [
        ("業務", Inches(2.0), Inches(4.3)),
        ("設計", Inches(4.8), Inches(3.5)),
        ("RD", Inches(4.8), Inches(5.5)),
    ]
    for name, nx, ny in nodes:
        c = s.shapes.add_shape(MSO_SHAPE.OVAL, nx, ny, Inches(1.0), Inches(1.0))
        c.line.fill.background()
        c.fill.solid()
        c.fill.fore_color.rgb = HILITE
        add_text(s, nx, ny + Inches(0.3), Inches(1.0), Inches(0.5),
                 name, size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    # 業務 → 設計 (粗)
    arr1 = s.shapes.add_connector(3, Inches(3.0), Inches(4.7),
                                   Inches(4.8), Inches(4.0))
    arr1.line.color.rgb = CORAL
    arr1.line.width = Pt(6)
    # 業務 ← 設計 (細)
    arr2 = s.shapes.add_connector(3, Inches(4.8), Inches(4.1),
                                   Inches(3.0), Inches(4.8))
    arr2.line.color.rgb = SUBINK
    arr2.line.width = Pt(1)

    add_text(s, Inches(1.0), Inches(6.2), Inches(5.4), Inches(0.5),
             "業務 → 設計 9 次｜設計 → 業務 1 次　差 8 次（卡點！）",
             size=12, bold=True, color=DEEP)

    # 右：閾值說明
    add_card(s, Inches(6.9), Inches(2.4), Inches(5.7), Inches(4.4),
             bg_color=WHITE, corner=0.05)
    add_text(s, Inches(7.2), Inches(2.65), Inches(5.1), Inches(0.5),
             "怎麼判斷「卡」？", size=14, bold=True, color=HILITE)
    add_text(s, Inches(7.2), Inches(3.15), Inches(5.1), Inches(3.5),
             ("健康的部門互動會「來來回回」：\n"
              "A 問 B 5 次，B 也回 A 5 次，OK。\n\n"
              "不健康的長這樣：\n"
              "A 問 B 9 次，B 只回 A 1 次\n"
              "→ A 在追，B 在躲，這就是「卡點」\n\n"
              "我們的判斷標準\n"
              "  差距 ≥ 5 次 → 紅燈警告\n"
              "  (相當於統計上前 16% 的不平衡)\n\n"
              "實測：主管心中有 3 對「卡」的部門，\n"
              "      系統自動抓出 2 對（67% 命中）\n"
              "      抓到的都對（0 個誤報）"),
             size=12, color=DEEP, line_spacing=1.45)

    add_footer(s, 11)


# ===========================================================
# Slide 12 — 技術架構
# ===========================================================
def slide_tech():
    s = prs.slides.add_slide(blank_layout)
    add_gradient_bg(s)
    add_text(s, Inches(0.8), Inches(0.6), Inches(8), Inches(0.8),
             "Tech Stack", size=44, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(1.45), Inches(11), Inches(0.6),
             "前端即時 · 後端輕量 · 雲端託管",
             size=18, color=RGBColor(0xE8, 0xE0, 0xFF))
    add_asterisk(s, Inches(11.6), Inches(0.5), 1.0, WHITE)

    layers = [
        ("前端", "React 19 · TypeScript · Vite 6\nTailwind v4 · Recharts · Framer Motion"),
        ("資料層", "Firebase Auth · Cloud Firestore\n即時訂閱 / 離線同步"),
        ("演算法", "25+ 算法 · 純前端計算\nBM25F / Gini / Cohort Regression"),
        ("部署", "Vercel · GitHub Actions\nCI/CD 自動發佈"),
    ]
    card_w = Inches(2.9)
    card_h = Inches(4.2)
    gap = Inches(0.2)
    total_w = card_w * 4 + gap * 3
    start_x = (SLIDE_W - total_w) // 2
    y = Inches(2.4)

    for i, (name, body) in enumerate(layers):
        x = start_x + (card_w + gap) * i
        add_card(s, x, y, card_w, card_h, bg_color=WHITE, corner=0.06)
        # 編號
        add_text(s, x + Inches(0.3), y + Inches(0.3), card_w, Inches(0.5),
                 f"0{i+1}", size=22, bold=True, color=HILITE)
        add_text(s, x + Inches(0.3), y + Inches(0.85), card_w - Inches(0.6), Inches(0.6),
                 name, size=22, bold=True, color=DEEP)
        # divider
        ln = s.shapes.add_connector(1, x + Inches(0.3), y + Inches(1.55),
                                     x + Inches(1.2), y + Inches(1.55))
        ln.line.color.rgb = HILITE
        ln.line.width = Pt(2)
        add_text(s, x + Inches(0.3), y + Inches(1.75), card_w - Inches(0.6), Inches(2.4),
                 body, size=12, color=DEEP, line_spacing=1.5)

    add_footer(s, 12)


# ===========================================================
# Slide 13 — 預期效益
# ===========================================================
def slide_outcome():
    s = prs.slides.add_slide(blank_layout)
    add_gradient_bg(s)
    add_text(s, Inches(0.8), Inches(0.6), Inches(8), Inches(0.8),
             "預期效益", size=44, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(1.45), Inches(11), Inches(0.6),
             "從「主管直覺」到「數據共識」",
             size=18, color=RGBColor(0xE8, 0xE0, 0xFF))
    add_asterisk(s, Inches(11.6), Inches(0.5), 1.0, WHITE)

    nums = [
        ("90s", "員工負載狀態", "從 30 分鐘訪談 → 90 秒掃一眼雷達圖"),
        ("67%", "卡點 Recall", "Asymmetric Detection 自動抓出主管直覺中的「卡」"),
        ("100%", "決策回看率", "v2.1 = 0%（沒人事後看）→ v2.2 = 強制回顧"),
        ("0元", "授權成本", "全用開源 + Firebase 免費額度"),
    ]
    card_w = Inches(2.85)
    card_h = Inches(4.2)
    gap = Inches(0.2)
    total_w = card_w * 4 + gap * 3
    start_x = (SLIDE_W - total_w) // 2
    y = Inches(2.4)

    for i, (n, t, d) in enumerate(nums):
        x = start_x + (card_w + gap) * i
        add_card(s, x, y, card_w, card_h, bg_color=WHITE, corner=0.08)
        add_text(s, x, y + Inches(0.5), card_w, Inches(1.4),
                 n, size=56, bold=True, color=HILITE, align=PP_ALIGN.CENTER)
        add_text(s, x + Inches(0.3), y + Inches(2.2), card_w - Inches(0.6), Inches(0.6),
                 t, size=18, bold=True, color=DEEP, align=PP_ALIGN.CENTER)
        add_text(s, x + Inches(0.3), y + Inches(2.9), card_w - Inches(0.6), Inches(1.2),
                 d, size=12, color=SUBINK, align=PP_ALIGN.CENTER, line_spacing=1.4)

    add_footer(s, 13)


# ===========================================================
# Slide 14 — 已知限制（誠實揭露）
# ===========================================================
def slide_limits():
    s = prs.slides.add_slide(blank_layout)
    add_gradient_bg(s)
    add_text(s, Inches(0.8), Inches(0.6), Inches(8), Inches(0.8),
             "已知限制", size=44, bold=True, color=WHITE)
    add_text(s, Inches(0.8), Inches(1.45), Inches(11), Inches(0.6),
             "我們知道哪裡還不夠好 — 答辯誠實版",
             size=18, color=RGBColor(0xE8, 0xE0, 0xFF))
    add_asterisk(s, Inches(11.6), Inches(0.5), 1.0, WHITE)

    items = [
        ("SEED 不是真實資料",
         "所有參數都在 SEED 上校準。下個階段需要拿真實資料重跑反推。"),
        ("What-if 不能模擬「新聘」情境",
         "目前只支援「降低現有員工負載」（reassignment）。\n如果想評估「招新人」要靠下版整合 hiring forecast。"),
        ("Cohort 樣本不足會失準",
         "n < 5 時線性回歸不穩定，介面會標註「樣本過少」。"),
        ("BM25F 對中文短文本 IDF 失真",
         "已加 Substring Boost 補救，但仍可能漏抓「林聿」這種前綴。"),
    ]
    y = Inches(2.3)
    for i, (t, d) in enumerate(items):
        yy = y + Inches(i * 1.05)
        add_card(s, Inches(0.8), yy, Inches(11.7), Inches(0.9),
                 bg_color=WHITE, corner=0.25)
        add_text(s, Inches(1.1), yy + Inches(0.05), Inches(0.6), Inches(0.7),
                 "!", size=32, bold=True, color=CORAL, align=PP_ALIGN.CENTER)
        add_text(s, Inches(1.8), yy + Inches(0.1), Inches(10), Inches(0.4),
                 t, size=16, bold=True, color=DEEP)
        add_text(s, Inches(1.8), yy + Inches(0.5), Inches(10), Inches(0.4),
                 d, size=12, color=SUBINK)

    add_footer(s, 14)


# ===========================================================
# Slide 15 — 結語
# ===========================================================
def slide_closing():
    s = prs.slides.add_slide(blank_layout)
    add_gradient_bg(s)
    add_asterisk(s, Inches(11.3), Inches(5.2), 1.4, WHITE)
    add_asterisk(s, Inches(0.4), Inches(0.6), 0.7, RGBColor(0xE8, 0xE0, 0xFF))

    add_text(s, Inches(1.0), Inches(2.2), Inches(11), Inches(1.0),
             "工程現實 ≠ 學術理想",
             size=48, bold=True, color=WHITE)
    add_text(s, Inches(1.0), Inches(3.3), Inches(11), Inches(2.5),
             ("我們不假裝每個係數都來自論文，\n"
              "但每個係數都經過反推校準。\n\n"
              "比起完美的公式，我們更相信可以解釋的數字。"),
             size=22, color=RGBColor(0xF0, 0xE8, 0xFF), line_spacing=1.6)

    add_pill(s, Inches(4.5), Inches(6.0), Inches(4.3), Inches(0.7),
             "Thank You · Q & A",
             bg_color=WHITE, text_color=DEEP, size=22)


# ===========================================================
# 生成
# ===========================================================
slide_cover()
slide_agenda()
slide_pain()
slide_overview()
slide_load()
slide_health()
slide_impact()
slide_calibration()
slide_bm25f()
slide_whatif()
slide_network()
slide_tech()
slide_outcome()
slide_limits()
slide_closing()

out = "docs/串連系統_簡報.pptx"
prs.save(out)
print(f"OK -> {out} ({len(prs.slides)} slides)")
