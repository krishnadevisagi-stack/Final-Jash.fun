// app/celebrate/preview/posterRenderer.ts

export type LayoutType = 'LAYOUT_1_COLLAGE' | 'LAYOUT_2_JAYANTI' | 'LAYOUT_3_SINGLE_IMAGE';

// ─────────────────────────────────────────────────────────────────────────────
// Intelligent Text-Balancing Helper
// ─────────────────────────────────────────────────────────────────────────────
const getIntelligentFontSize = (text: string, isTitle: boolean, defaultSize?: number) => {
  if (defaultSize) return defaultSize;
  const count = text?.length || 0;
  if (isTitle) {
    if (count <= 15) return 65;
    if (count <= 35) return 45;
    return 36;
  } else {
    if (count <= 50) return 28;
    if (count <= 120) return 24;
    return 18;
  }
};

const wrapTextToArray = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  if (!text) return [];
  const words = text.split(' ');
  let lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

// ═══════════════════════════════════════════════════════════════════
// FIXED LAYOUT ENGINE v5  —  12 Reference-Based Layouts
// ═══════════════════════════════════════════════════════════════════

const CW5 = 1080;
const clamp5 = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const LAYOUT_DEFS: any[] = [
  null,

  // Layout 1: POLAROID_VERTICAL_STACK_WITH_BG_PHOTO
  {
    frames: [
      {x:248,  y:346,  w:389, h:538, rotation: 0},
      {x:238,  y:902,  w:410, h:538, rotation: 0},
      {x:243,  y:1459, w:378, h:538, rotation: 0},
    ],
    texts: [
      {contentKey:'title',        x:820, y:220,  fontSize:72, align:'center', maxWidth:420},
      {contentKey:'relationName', x:820, y:380,  fontSize:52, align:'center', maxWidth:420},
      {contentKey:'subtitle',     x:820, y:1820, fontSize:28, align:'center', maxWidth:420},
    ]
  },

  // Layout 2: SCATTERED_POLAROIDS_CARD_FAN
  {
    frames: [
      {x:308,  y:384,  w:400, h:576, rotation:-10},
      {x:702,  y:365,  w:432, h:614, rotation:  5},
      {x:227,  y:1094, w:389, h:576, rotation:-15},
      {x:637,  y:1258, w:454, h:672, rotation:  8},
    ],
    texts: [
      {contentKey:'title',        x:540, y:1680, fontSize:76, align:'center', maxWidth:900},
      {contentKey:'relationName', x:540, y:1790, fontSize:48, align:'center', maxWidth:900},
      {contentKey:'subtitle',     x:540, y:1876, fontSize:26, align:'center', maxWidth:900},
    ]
  },

  // Layout 3: CLEAN_GRID_2x2_CENTER_TEXT_BAND
  {
    frames: [
      {x:302,  y:365,  w:454, h:538, rotation:0},
      {x:778,  y:365,  w:454, h:538, rotation:0},
      {x:302,  y:1440, w:454, h:576, rotation:0},
      {x:778,  y:1440, w:454, h:576, rotation:0},
    ],
    texts: [
      {contentKey:'title',        x:540, y:840,  fontSize:88, align:'center', maxWidth:900},
      {contentKey:'relationName', x:540, y:990,  fontSize:56, align:'center', maxWidth:900},
      {contentKey:'subtitle',     x:540, y:1100, fontSize:30, align:'center', maxWidth:860},
    ]
  },

  // Layout 4: ASYMMETRIC_TWO_COLUMN_WITH_HERO
  {
    frames: [
      {x:275,  y:490,  w:378, h:672,  rotation:0},
      {x:761,  y:758,  w:486, h:1056, rotation:0},
      {x:275,  y:1238, w:378, h:634,  rotation:0},
    ],
    texts: [
      {contentKey:'title',        x:540, y:1680, fontSize:76, align:'center', maxWidth:900},
      {contentKey:'relationName', x:540, y:1790, fontSize:52, align:'center', maxWidth:900},
      {contentKey:'subtitle',     x:540, y:1878, fontSize:26, align:'center', maxWidth:900},
    ]
  },

  // Layout 5: ORGANIC_SCATTERED_MULTI_SIZE
  {
    frames: [
      {x:275,  y:634,  w:378, h:422, rotation:0},
      {x:745,  y:442,  w:518, h:576, rotation:0},
      {x:205,  y:1027, w:238, h:288, rotation:0},
      {x:475,  y:1056, w:302, h:346, rotation:2},
      {x:281,  y:1421, w:346, h:422, rotation:0},
      {x:702,  y:1536, w:324, h:384, rotation:0},
    ],
    texts: [
      {contentKey:'title',        x:270, y:120,  fontSize:72, align:'center', maxWidth:500},
      {contentKey:'relationName', x:270, y:240,  fontSize:48, align:'center', maxWidth:500},
      {contentKey:'subtitle',     x:270, y:1820, fontSize:26, align:'center', maxWidth:500},
    ]
  },

  // Layout 6: DARK_MOODBOARD_ASYMMETRIC_OVERLAP
  {
    frames: [
      {x:232,  y:576,  w:356, h:576, rotation:0},
      {x:616,  y:557,  w:324, h:422, rotation:0},
      {x:443,  y:854,  w:346, h:480, rotation:0},
      {x:232,  y:1238, w:292, h:480, rotation:0},
      {x:616,  y:1267, w:410, h:422, rotation:0},
    ],
    texts: [
      {contentKey:'title',        x:810, y:90,   fontSize:82, align:'center', maxWidth:440},
      {contentKey:'relationName', x:810, y:220,  fontSize:52, align:'center', maxWidth:440},
      {contentKey:'subtitle',     x:540, y:1840, fontSize:28, align:'center', maxWidth:900},
    ]
  },

  // Layout 7: STAGGERED_CASCADE_DIAGONAL
  {
    frames: [
      {x:297,  y:442,  w:378, h:576, rotation:0},
      {x:518,  y:797,  w:432, h:634, rotation:0},
      {x:254,  y:1248, w:400, h:576, rotation:0},
      {x:659,  y:1373, w:410, h:634, rotation:0},
    ],
    texts: [
      {contentKey:'title',        x:540, y:100,  fontSize:76, align:'center', maxWidth:900},
      {contentKey:'relationName', x:540, y:220,  fontSize:52, align:'center', maxWidth:900},
      {contentKey:'subtitle',     x:540, y:1870, fontSize:26, align:'center', maxWidth:900},
    ]
  },

  // Layout 8: TILTED_STACK_PLAYFUL
  {
    frames: [
      {x:400,  y:403,  w:626, h:576, rotation:-3},
      {x:513,  y:883,  w:486, h:538, rotation: 5},
      {x:410,  y:1382, w:562, h:538, rotation:-2},
    ],
    texts: [
      {contentKey:'title',        x:900, y:140,  fontSize:72, align:'right', maxWidth:340},
      {contentKey:'relationName', x:900, y:260,  fontSize:48, align:'right', maxWidth:340},
      {contentKey:'subtitle',     x:540, y:1860, fontSize:26, align:'center', maxWidth:900},
    ]
  },

  // Layout 9: CLEAN_MAGAZINE_EDITORIAL_3ROW
  {
    frames: [
      {x:292,  y:365,  w:475, h:576, rotation:0},
      {x:788,  y:365,  w:475, h:576, rotation:0},
      {x:292,  y:979,  w:475, h:538, rotation:0},
      {x:292,  y:1574, w:475, h:538, rotation:0},
      {x:788,  y:1574, w:475, h:538, rotation:0},
    ],
    texts: [
      {contentKey:'title',        x:824, y:880,  fontSize:78, align:'center', maxWidth:440},
      {contentKey:'relationName', x:824, y:1020, fontSize:52, align:'center', maxWidth:440},
      {contentKey:'subtitle',     x:824, y:1140, fontSize:28, align:'center', maxWidth:440},
    ]
  },

  // Layout 10: SCRAPBOOK_MIXED_MEDIA
  {
    frames: [
      {x:302,  y:653,  w:432, h:614, rotation:-2},
      {x:680,  y:499,  w:324, h:422, rotation: 3},
      {x:729,  y:1286, w:378, h:576, rotation: 0},
    ],
    texts: [
      {contentKey:'title',        x:740, y:900,  fontSize:76, align:'center', maxWidth:500},
      {contentKey:'relationName', x:740, y:1040, fontSize:52, align:'center', maxWidth:500},
      {contentKey:'subtitle',     x:270, y:1800, fontSize:28, align:'center', maxWidth:500},
    ]
  },

  // Layout 11: POLAROID_GRID_OVER_FULL_PHOTO
  {
    frames: [
      {x:259,  y:394,  w:346, h:480, rotation:-3},
      {x:734,  y:336,  w:346, h:480, rotation: 4},
      {x:270,  y:1037, w:324, h:461, rotation:-2},
      {x:713,  y:1085, w:346, h:480, rotation: 3},
    ],
    texts: [
      {contentKey:'title',        x:540, y:1580, fontSize:88, align:'center', maxWidth:900},
      {contentKey:'relationName', x:540, y:1730, fontSize:56, align:'center', maxWidth:900},
      {contentKey:'subtitle',     x:540, y:1860, fontSize:28, align:'center', maxWidth:900},
    ]
  },

  // Layout 12: INVERTED_TRIANGLE_FESTIVE
  {
    frames: [
      {x:459,  y:518,  w:594, h:576, rotation: 0},
      {x:275,  y:1046, w:378, h:480, rotation:-5},
      {x:675,  y:1085, w:378, h:480, rotation: 5},
    ],
    texts: [
      {contentKey:'title',        x:540, y:1450, fontSize:92, align:'center', maxWidth:940},
      {contentKey:'relationName', x:540, y:1620, fontSize:60, align:'center', maxWidth:900},
      {contentKey:'subtitle',     x:540, y:1840, fontSize:30, align:'center', maxWidth:860},
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════
// 6 CINEMATIC BLUEPRINTS — STRICTLY for 5-Image 9:16 Posters
// ═══════════════════════════════════════════════════════════════════

const BLUEPRINT_DEFS_5IMG: any[] = [
  null,

  // Blueprint 1: STRAIGHT GRID
  {
    id: 1,
    outerBorder: false,
    centerPaperNote: false,
    frames: [
      { x: 252,  y: 286,  w: 454, h: 510, rotation: 0 },
      { x: 828,  y: 286,  w: 454, h: 510, rotation: 0 },
      { x: 252,  y: 950,  w: 454, h: 510, rotation: 0 },
      { x: 252,  y: 1614, w: 454, h: 510, rotation: 0 },
      { x: 828,  y: 1614, w: 454, h: 510, rotation: 0 },
    ],
    texts: [
      { contentKey: 'title',        x: 828, y: 780,  fontSize: 68, align: 'center', maxWidth: 440 },
      { contentKey: 'relationName', x: 828, y: 940,  fontSize: 46, align: 'center', maxWidth: 440 },
      { contentKey: 'subtitle',     x: 828, y: 1100, fontSize: 26, align: 'center', maxWidth: 440 },
    ],
  },

  // Blueprint 2: SCATTERED POLAROIDS
  {
    id: 2,
    outerBorder: false,
    centerPaperNote: false,
    frames: [
      { x: 540,  y: 200,  w: 270, h: 350, rotation:  0  },
      { x: 238,  y: 638,  w: 390, h: 520, rotation: -13 },
      { x: 790,  y: 598,  w: 360, h: 480, rotation:   9 },
      { x: 208,  y: 1320, w: 370, h: 500, rotation: -10 },
      { x: 812,  y: 1400, w: 380, h: 520, rotation:   7 },
    ],
    texts: [
      { contentKey: 'title',        x: 858, y: 128, fontSize: 64, align: 'right', maxWidth: 360 },
      { contentKey: 'relationName', x: 858, y: 272, fontSize: 42, align: 'right', maxWidth: 360 },
      { contentKey: 'subtitle',     x: 178, y: 1812, fontSize: 26, align: 'left',  maxWidth: 360 },
    ],
  },

  // Blueprint 3: ASYMMETRICAL PREMIUM
  {
    id: 3,
    outerBorder: false,
    centerPaperNote: false,
    frames: [
      { x: 788,  y: 568,  w: 480, h: 680, rotation:  0 },
      { x: 242,  y: 368,  w: 370, h: 490, rotation:  0 },
      { x: 242,  y: 958,  w: 370, h: 490, rotation:  0 },
      { x: 500,  y: 668,  w: 250, h: 330, rotation: -6 },
      { x: 856,  y: 1568, w: 244, h: 560, rotation:  0 },
    ],
    texts: [
      { contentKey: 'title',        x: 540, y: 1320, fontSize: 76, align: 'center', maxWidth: 860 },
      { contentKey: 'relationName', x: 540, y: 1460, fontSize: 48, align: 'center', maxWidth: 860 },
      { contentKey: 'subtitle',     x: 540, y: 1790, fontSize: 26, align: 'center', maxWidth: 860 },
    ],
  },

  // Blueprint 4: MIXED ORIENTATION
  {
    id: 4,
    outerBorder: false,
    centerPaperNote: false,
    frames: [
      { x: 800,  y: 330,  w: 358, h: 498, rotation:  4 },
      { x: 286,  y: 728,  w: 486, h: 326, rotation:  0 },
      { x: 808,  y: 808,  w: 358, h: 358, rotation: -3 },
      { x: 236,  y: 1448, w: 338, h: 490, rotation: -5 },
      { x: 762,  y: 1508, w: 338, h: 490, rotation:  5 },
    ],
    texts: [
      { contentKey: 'title',        x: 178, y: 188,  fontSize: 62, align: 'left', maxWidth: 380 },
      { contentKey: 'relationName', x: 178, y: 332,  fontSize: 42, align: 'left', maxWidth: 380 },
      { contentKey: 'subtitle',     x: 178, y: 1808, fontSize: 24, align: 'left', maxWidth: 380 },
    ],
  },

  // Blueprint 5: SYMMETRICAL 1-2-2 GRID
  {
    id: 5,
    outerBorder: true,
    centerPaperNote: false,
    frames: [
      { x: 540,  y: 450,  w: 700, h: 556, rotation: 0 },
      { x: 248,  y: 978,  w: 380, h: 418, rotation: 0 },
      { x: 832,  y: 978,  w: 380, h: 418, rotation: 0 },
      { x: 248,  y: 1558, w: 380, h: 438, rotation: 0 },
      { x: 832,  y: 1558, w: 380, h: 438, rotation: 0 },
    ],
    texts: [
      { contentKey: 'title',        x: 540, y: 108,  fontSize: 70, align: 'center', maxWidth: 900 },
      { contentKey: 'relationName', x: 540, y: 218,  fontSize: 46, align: 'center', maxWidth: 900 },
      { contentKey: 'subtitle',     x: 540, y: 1870, fontSize: 26, align: 'center', maxWidth: 900 },
    ],
  },

  // Blueprint 6: SCRAPBOOK CENTER-FOCUS
  {
    id: 6,
    outerBorder: false,
    centerPaperNote: true,
    frames: [
      { x: 186,  y: 400,  w: 346, h: 466, rotation: -14 },
      { x: 540,  y: 310,  w: 398, h: 526, rotation:   3 },
      { x: 894,  y: 390,  w: 326, h: 446, rotation:  16 },
      { x: 224,  y: 1490, w: 356, h: 490, rotation: -10 },
      { x: 856,  y: 1478, w: 356, h: 490, rotation:   8 },
    ],
    texts: [
      { contentKey: 'title',        x: 540, y: 868,  fontSize: 60, align: 'center', maxWidth: 480 },
      { contentKey: 'relationName', x: 540, y: 990,  fontSize: 40, align: 'center', maxWidth: 480 },
      { contentKey: 'subtitle',     x: 540, y: 1098, fontSize: 24, align: 'center', maxWidth: 480 },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// JAYANTI LAYOUT
// ═══════════════════════════════════════════════════════════════════
const JAYANTI_LAYOUT_DEF = {
  frames: [
    { x: 540, y: 557, w: 1080, h: 1114, rotation: 0 },
  ],
  texts: [
    { contentKey: 'title',    x: 540, y: 1290, fontSize: 90, align: 'center' as const, maxWidth: 960 },
    { contentKey: 'subtitle', x: 540, y: 1640, fontSize: 36, align: 'center' as const, maxWidth: 900 },
  ],
};

const applyJayantiLayout = (blueprint: any): any => {
  if (!blueprint) return blueprint;
  try {
    const def = JAYANTI_LAYOUT_DEF;
    const aiFrames = blueprint.imageFrames || [];
    const ai0 = aiFrames[0] || {};
    blueprint.imageFrames = [{
      shape:       'rectangle',
      borderColor: 'transparent',
      borderWidth: 0,
      shadow:      false,
      x: def.frames[0].x, y: def.frames[0].y,
      w: def.frames[0].w, h: def.frames[0].h,
      rotation: 0,
    }];

    const aiTexts = blueprint.textBlocks || [];
    blueprint.textBlocks = def.texts
      .map((td: any) => {
        const ai   = aiTexts.find((t: any) => t.contentKey === td.contentKey) || {};
        const text = (ai.text || '').trim();
        if (!text) return null;
        return {
          contentKey: td.contentKey,
          text,
          x:          td.x,
          y:          td.y,
          fontSize:   td.fontSize,
          fontFamily: ai.fontFamily || 'Georgia, serif',
          color:      ai.color      || '#1A1A1A',
          align:      td.align,
          maxWidth:   td.maxWidth,
          isBold:     ai.isBold     || false,
          isItalic:   ai.isItalic   || false,
        };
      })
      .filter(Boolean);

    console.log(`[JASHN-DEBUG] Jayanti layout applied: 1 frame, ${blueprint.textBlocks.length} text blocks`);
  } catch (err) {
    console.warn('[JASHN-DEBUG] applyJayantiLayout error (non-fatal):', err);
  }
  return blueprint;
};

const applyFixedLayout = (blueprint: any, layoutStyleId: number): any => {
  if (!blueprint) return blueprint;

  try {
    const lid = clamp5(layoutStyleId, 1, 12);
    const def = LAYOUT_DEFS[lid];
    if (!def) { console.warn(`⚠️ No layout def for id=${lid}`); return blueprint; }

    console.log(`🧠 Fixed Layout Engine v5: applying layout ${lid}...`);

    const aiFrames = blueprint.imageFrames || [];
    blueprint.imageFrames = def.frames.map((f: any, i: number) => {
      const ai  = aiFrames[i] || aiFrames[0] || {};
      const fw  = f.w > f.h ? f.h : f.w;
      const fh  = f.w > f.h ? f.w : f.h;
      return {
        shape:       'rectangle',
        borderColor: ai.borderColor || '#FFFFFF',
        borderWidth: clamp5(ai.borderWidth || 14, 8, 22),
        shadow:      true,
        x: f.x, y: f.y, w: fw, h: fh, rotation: f.rotation,
      };
    });

    const aiTexts  = blueprint.textBlocks || [];
    const maxWDef  = CW5 - 120;
    blueprint.textBlocks = def.texts
      .map((td: any) => {
        const ai = aiTexts.find((t: any) => t.contentKey === td.contentKey) || {};
        const text = (ai.text || '').trim();
        if (!text) return null;
        return {
          contentKey: td.contentKey,
          text,
          x:          td.x,
          y:          td.y,
          fontSize:   td.fontSize,
          fontFamily: ai.fontFamily || 'sans-serif',
          color:      ai.color      || '#FFFFFF',
          align:      td.align,
          maxWidth:   td.maxWidth   || maxWDef,
          isBold:     ai.isBold     || false,
          isItalic:   ai.isItalic   || false,
        };
      })
      .filter(Boolean);

    console.log(`✅ Layout ${lid} applied: ${def.frames.length} frames, ${blueprint.textBlocks.length} text blocks`);

  } catch (err) {
    console.warn('⚠️ Fixed Layout Engine v5 error (non-fatal):', err);
  }
  return blueprint;
};

// ── Cross-browser rounded rect path helper ────────────────────────────────────
const canvasRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// ── Blueprint 6: Hanging Paper Note Renderer ──────────────────────────────────
const renderBlueprint6PaperNote = (
  ctx: CanvasRenderingContext2D,
  blueprint: any,
  data: any
) => {
  try {
    const cx     = 540;
    const noteW  = 560;
    const noteH  = 340;
    const noteX  = cx - noteW / 2;
    const noteY  = 820;

    ctx.save();
    ctx.strokeStyle = '#7A6652';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(0, noteY - 30);
    ctx.lineTo(1080, noteY - 30);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle   = '#B0A090';
    ctx.strokeStyle = '#888070';
    ctx.lineWidth   = 2;
    canvasRoundRect(ctx, cx - 16, noteY - 48, 32, 22, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#D0C0B0';
    canvasRoundRect(ctx, cx - 10, noteY - 44, 20, 14, 2); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, noteY + noteH / 2);
    ctx.rotate(-0.018);

    ctx.shadowColor   = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur    = 24;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 10;

    const paperBg = blueprint.noteBackground || '#FBF7F0';
    ctx.fillStyle   = paperBg;
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth   = 1.5;
    canvasRoundRect(ctx, -noteW / 2, -noteH / 2, noteW, noteH, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    const torn = 8;
    ctx.moveTo(-noteW / 2, -noteH / 2 + torn);
    for (let xx = -noteW / 2; xx < noteW / 2; xx += 14) {
      ctx.lineTo(xx + 7,  -noteH / 2 + torn - 4);
      ctx.lineTo(xx + 14, -noteH / 2 + torn);
    }
    ctx.stroke();

    ctx.strokeStyle = blueprint.noteAccent || '#C4A882';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(-noteW / 2 + 24, -noteH / 2 + 30);
    ctx.lineTo( noteW / 2 - 24, -noteH / 2 + 30);
    ctx.stroke();

    ctx.restore();

    const def = BLUEPRINT_DEFS_5IMG[6];
    if (!def || !blueprint.textBlocks) return;

    blueprint.textBlocks.forEach((tb: any) => {
      try {
        if (!tb.text || tb.text.trim() === '') return;
        const fontFamily  = tb.fontFamily && tb.fontFamily.trim() ? tb.fontFamily : 'Georgia, serif';
        const fontSize    = tb.fontSize   && tb.fontSize   > 0    ? tb.fontSize   : 30;
        const fontStr     = `${tb.isItalic ? 'italic ' : ''}${tb.isBold ? 'bold ' : 'normal '}${fontSize}px ${fontFamily}`;

        ctx.save();
        ctx.font         = fontStr;
        ctx.textAlign    = (tb.align as CanvasTextAlign) || 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = tb.color && tb.color.trim() ? tb.color : '#2B2B2B';

        const maxW   = tb.maxWidth || 480;
        const lines  = wrapTextToArray(ctx, tb.text, maxW);
        const lineH  = fontSize * 1.4;
        lines.forEach((line: string, idx: number) => {
          ctx.fillText(line, tb.x, tb.y + idx * lineH);
        });
        ctx.restore();
      } catch (_) {}
    });

  } catch (err) {
    console.error('[JASHN-DEBUG] ERROR renderBlueprint6PaperNote:', err);
  }
};

// ── applyBlueprint5Img ────────────────────────────────────────────────────────
const applyBlueprint5Img = (blueprint: any, blueprintId: number): any => {
  if (!blueprint) return blueprint;
  try {
    const bid = clamp5(blueprintId, 1, 6);
    const def = BLUEPRINT_DEFS_5IMG[bid];
    if (!def) {
      console.warn(`[JASHN-DEBUG] No 5-img blueprint def for id=${bid}`);
      return blueprint;
    }

    console.log(`[JASHN-DEBUG] applyBlueprint5Img: applying blueprint ${bid}...`);

    const aiFrames = blueprint.imageFrames || [];
    blueprint.imageFrames = def.frames.map((f: any, i: number) => {
      const ai  = aiFrames[i] || aiFrames[0] || {};
      const fw  = f.w > f.h ? f.h : f.w;
      const fh  = f.w > f.h ? f.w : f.h;
      return {
        shape:       'rectangle',
        borderColor: ai.borderColor || '#FFFFFF',
        borderWidth: clamp5(ai.borderWidth || 14, 8, 24),
        shadow:      true,
        x: f.x, y: f.y, w: fw, h: fh, rotation: f.rotation,
      };
    });

    const aiTexts = blueprint.textBlocks || [];
    blueprint.textBlocks = def.texts
      .map((td: any) => {
        const ai   = aiTexts.find((t: any) => t.contentKey === td.contentKey) || {};
        const text = (ai.text || '').trim();
        if (!text) return null;
        return {
          contentKey: td.contentKey,
          text,
          x:          td.x,
          y:          td.y,
          fontSize:   td.fontSize,
          fontFamily: ai.fontFamily || 'Georgia, serif',
          color:      ai.color      || '#1A1A1A',
          align:      td.align,
          maxWidth:   td.maxWidth,
          isBold:     ai.isBold     || false,
          isItalic:   ai.isItalic   || false,
        };
      })
      .filter(Boolean);

    blueprint._blueprintId    = bid;
    blueprint.outerBorder     = def.outerBorder;
    blueprint.centerPaperNote = def.centerPaperNote;
    blueprint.noteBackground  = blueprint.noteBackground  || '#FBF7F0';
    blueprint.noteAccent      = blueprint.noteAccent      || '#C4A882';

    console.log(`[JASHN-DEBUG] Blueprint ${bid} applied: ${def.frames.length} frames, ${blueprint.textBlocks.length} text blocks`);
  } catch (err) {
    console.warn('[JASHN-DEBUG] applyBlueprint5Img error (non-fatal):', err);
  }
  return blueprint;
};

// ─────────────────────────────────────────────────────────────────────────────
// getTextColorForBackground
// ─────────────────────────────────────────────────────────────────────────────
const getTextColorForBackground = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
): string => {
  try {
    const safeX = Math.max(0, Math.round(x));
    const safeY = Math.max(0, Math.round(y));
    const safeW = Math.max(1, Math.min(Math.round(w), ctx.canvas.width  - safeX));
    const safeH = Math.max(1, Math.min(Math.round(h), ctx.canvas.height - safeY));
    if (safeW <= 0 || safeH <= 0) return '#1a1a1a';
    const data   = ctx.getImageData(safeX, safeY, safeW, safeH).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i+1]; b += data[i+2]; count++; }
    if (count === 0) return '#1a1a1a';
    r /= count; g /= count; b /= count;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 128 ? '#1a1a1a' : '#ffffff';
  } catch (_) {
    return '#1a1a1a';
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// drawSymmetricCrop — object-fit:cover with centered crop
// ─────────────────────────────────────────────────────────────────────────────
const drawSymmetricCrop = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  frameX: number, frameY: number,
  frameWidth: number, frameHeight: number
) => {
  if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
    console.warn('[JASHN-DEBUG] drawSymmetricCrop: invalid image — skipping frame');
    return;
  }
  try {
    const scale   = Math.max(frameWidth / img.naturalWidth, frameHeight / img.naturalHeight);
    const scaledW = img.naturalWidth  * scale;
    const scaledH = img.naturalHeight * scale;
    const offsetX = (scaledW - frameWidth)  / 2;
    const offsetY = (scaledH - frameHeight) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(frameX, frameY, frameWidth, frameHeight);
    ctx.clip();
    ctx.drawImage(img, frameX - offsetX, frameY - offsetY, scaledW, scaledH);
    ctx.restore();
  } catch (err) {
    console.error('[JASHN-DEBUG] ERROR drawSymmetricCrop:', err);
    ctx.restore();
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHYSICS ENGINE v2
// ═══════════════════════════════════════════════════════════════════════════════

function frameAABB(f: { x:number; y:number; w:number; h:number; rotation?:number }) {
  const rot = ((f.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rot));
  const sin = Math.abs(Math.sin(rot));
  const aW  = f.w * cos + f.h * sin;
  const aH  = f.w * sin + f.h * cos;
  return { left: f.x - aW/2, top: f.y - aH/2, right: f.x + aW/2, bottom: f.y + aH/2, aW, aH };
}

function overlapArea(
  a: { left:number; top:number; right:number; bottom:number },
  b: { left:number; top:number; right:number; bottom:number }
): number {
  const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return ox * oy;
}

function frameDist(a: { x:number; y:number }, b: { x:number; y:number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function enforceShapeRestriction(frames: any[]): any[] {
  return frames.map((f, i) => {
    if (!f || !f.w || !f.h) return f;
    if (f.w > f.h) {
      console.warn(`[JASHN-PHYSICS] Frame[${i}] landscape (${f.w}×${f.h}) → portrait (${f.h}×${f.w})`);
      return { ...f, w: f.h, h: f.w };
    }
    return f;
  });
}

const MIN_MARGIN = 8;

function enforceFrameBoundaries(frames: any[], CW: number, CH: number): any[] {
  return frames.map((f, i) => {
    if (!f) return f;
    const bb  = frameAABB(f);
    let { x, y } = f;
    if (bb.left   < MIN_MARGIN)       x += (MIN_MARGIN - bb.left);
    if (bb.right  > CW - MIN_MARGIN)  x -= (bb.right - (CW - MIN_MARGIN));
    if (bb.top    < MIN_MARGIN)       y += (MIN_MARGIN - bb.top);
    if (bb.bottom > CH - MIN_MARGIN)  y -= (bb.bottom - (CH - MIN_MARGIN));

    if (x !== f.x || y !== f.y) {
      console.log(`[JASHN-PHYSICS] Frame[${i}] boundary-clamped → (${Math.round(x)},${Math.round(y)})`);
    }
    return { ...f, x: Math.round(x), y: Math.round(y) };
  });
}

function enforceTextBoundaries(texts: any[], CW: number, CH: number): any[] {
  return texts.map((tb, i) => {
    if (!tb) return tb;
    const fs       = tb.fontSize || 30;
    const maxW     = tb.maxWidth || (CW - 2 * MIN_MARGIN);
    const halfW    = maxW / 2;
    let   { x, y } = tb;

    const align = tb.align || 'center';
    if (align === 'center') {
      if (x - halfW < MIN_MARGIN)       x = MIN_MARGIN + halfW;
      if (x + halfW > CW - MIN_MARGIN)  x = CW - MIN_MARGIN - halfW;
    } else if (align === 'left') {
      if (x < MIN_MARGIN)               x = MIN_MARGIN;
      if (x + maxW > CW - MIN_MARGIN)   x = CW - MIN_MARGIN - maxW;
    } else if (align === 'right') {
      if (x - maxW < MIN_MARGIN)        x = MIN_MARGIN + maxW;
      if (x > CW - MIN_MARGIN)          x = CW - MIN_MARGIN;
    }
    if (y - fs / 2 < MIN_MARGIN)        y = MIN_MARGIN + fs / 2;
    if (y + fs / 2 > CH - MIN_MARGIN)   y = CH - MIN_MARGIN - fs / 2;

    if (x !== tb.x || y !== tb.y) {
      console.log(`[JASHN-PHYSICS] Text[${i}] boundary-clamped → (${Math.round(x)},${Math.round(y)})`);
    }
    return { ...tb, x: Math.round(x), y: Math.round(y) };
  });
}

// ── UPDATED: Overlap Law — less aggressive, only corrects severe violations ──
const OVERLAP_MAX_RATIO = 0.35;  // increased from 0.20 — allow more natural overlap
const MIN_DIST          = 8;     // reduced from 12px — less aggressive nudging
const MAX_ITER          = 6;     // reduced iterations

function enforceOverlapLaw(frames: any[], CW: number, CH: number): any[] {
  if (!frames || frames.length < 2) return frames;
  const result = frames.map(f => ({ ...f }));

  for (let iter = 0; iter < MAX_ITER; iter++) {
    let anyFixed = false;

    for (let a = 0; a < result.length; a++) {
      for (let b = a + 1; b < result.length; b++) {
        const fa = result[a], fb = result[b];
        const bbA   = frameAABB(fa);
        const bbB   = frameAABB(fb);
        const ov    = overlapArea(bbA, bbB);
        const areaA = bbA.aW * bbA.aH;
        const areaB = bbB.aW * bbB.aH;
        const smallerArea = Math.min(areaA, areaB);
        const ovRatio = smallerArea > 0 ? ov / smallerArea : 0;
        const dist    = frameDist(fa, fb);

        if (ov > 0 && ovRatio > OVERLAP_MAX_RATIO) {
          // Only correct truly excessive overlaps
          const excess  = ov - OVERLAP_MAX_RATIO * smallerArea;
          const angle   = Math.atan2(fb.y - fa.y, fb.x - fa.x);
          const pushPx  = Math.min(excess / Math.max(1, (bbA.aW + bbB.aW) / 2) * 40 + 2, 60);
          result[b]     = { ...fb, x: fb.x + Math.cos(angle) * pushPx, y: fb.y + Math.sin(angle) * pushPx };
          anyFixed       = true;
          console.log(`[JASHN-PHYSICS] Overlap[${a},${b}] ${Math.round(ovRatio*100)}% > ${Math.round(OVERLAP_MAX_RATIO*100)}% — pushed ${Math.round(pushPx)}px`);
        } else if (ov === 0 && dist < MIN_DIST) {
          const angle   = Math.atan2(fb.y - fa.y, fb.x - fa.x) || (Math.PI / 4);
          const pushPx  = MIN_DIST - dist + 2;
          result[b]     = { ...fb, x: fb.x + Math.cos(angle) * pushPx, y: fb.y + Math.sin(angle) * pushPx };
          anyFixed       = true;
          console.log(`[JASHN-PHYSICS] Gap[${a},${b}] ${Math.round(dist)}px < ${MIN_DIST}px — nudged ${Math.round(pushPx)}px`);
        }
      }
    }

    enforceFrameBoundaries(result, CW, CH).forEach((f, i) => { result[i] = f; });
    if (!anyFixed) break;
  }
  return result;
}

const MIN_FONT_SIZE = 14;

function smartSizeFonts(texts: any[], CW: number, CH: number): any[] {
  let measCtx: CanvasRenderingContext2D | null = null;
  try {
    const mc = document.createElement('canvas');
    mc.width  = CW;
    mc.height = CH;
    measCtx   = mc.getContext('2d');
  } catch (_) {}

  return texts.map((tb, i) => {
    if (!tb || !tb.text) return tb;
    let fontSize = tb.fontSize || 30;
    const maxW   = tb.maxWidth || (CW - 2 * MIN_MARGIN);
    const font   = `${tb.isItalic ? 'italic ' : ''}${tb.isBold ? 'bold ' : ''}`;

    if (!measCtx) return tb;

    for (let attempt = 0; attempt < 20 && fontSize > MIN_FONT_SIZE; attempt++) {
      measCtx.font = `${font}${fontSize}px ${tb.fontFamily || 'sans-serif'}`;
      const words     = (tb.text || '').split(' ');
      const longestW  = Math.max(...words.map((w: string) => measCtx!.measureText(w).width));
      let   lines     = 1, cur = '';
      for (const w of words) {
        const test = cur ? cur + ' ' + w : w;
        if (measCtx.measureText(test).width > maxW) { lines++; cur = w; } else { cur = test; }
      }
      const blockH    = lines * fontSize * 1.4;
      const startY    = tb.y - fontSize / 2;
      const endY      = startY + blockH;

      if (longestW <= maxW && endY <= CH - MIN_MARGIN) break;
      fontSize = Math.max(MIN_FONT_SIZE, Math.round(fontSize * 0.88));
    }

    if (fontSize !== tb.fontSize) {
      console.log(`[JASHN-PHYSICS] Text[${i}] font scaled ${tb.fontSize}→${fontSize}px`);
    }
    return { ...tb, fontSize };
  });
}

function runPhysicsEngine(blueprint: any, CW: number, CH: number): any {
  if (!blueprint) return blueprint;

  console.log('[JASHN-PHYSICS] Engine start', {
    CW, CH,
    frames: blueprint.imageFrames?.length ?? 0,
    texts:  blueprint.textBlocks?.length  ?? 0,
  });

  const bp = { ...blueprint };

  if (Array.isArray(bp.imageFrames)) {
    bp.imageFrames = enforceShapeRestriction(bp.imageFrames);
  }
  if (Array.isArray(bp.imageFrames)) {
    bp.imageFrames = enforceFrameBoundaries(bp.imageFrames, CW, CH);
  }
  if (Array.isArray(bp.textBlocks)) {
    bp.textBlocks = enforceTextBoundaries(bp.textBlocks, CW, CH);
  }
  if (Array.isArray(bp.imageFrames)) {
    bp.imageFrames = enforceOverlapLaw(bp.imageFrames, CW, CH);
  }
  if (Array.isArray(bp.textBlocks)) {
    bp.textBlocks = smartSizeFonts(bp.textBlocks, CW, CH);
  }

  console.log('[JASHN-PHYSICS] Engine done');
  return bp;
}

// ═══════════════════════════════════════════════════════════════════════════════
// drawCoverFill — FIXED: correct safe-head crop calculation
// object-fit:cover + object-position:50% 5%
// ═══════════════════════════════════════════════════════════════════════════════
function drawCoverFill(
  ctx:         CanvasRenderingContext2D,
  img:         HTMLImageElement,
  frameX:      number,
  frameY:      number,
  frameWidth:  number,
  frameHeight: number
): void {
  if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
    console.warn('[JASHN-PHYSICS] drawCoverFill: invalid image — skipping');
    return;
  }
  try {
    const scale   = Math.max(frameWidth / img.naturalWidth, frameHeight / img.naturalHeight);
    const scaledW = img.naturalWidth  * scale;
    const scaledH = img.naturalHeight * scale;

    // X: center (50%) — equal horizontal crop both sides
    const offsetX = (scaledW - frameWidth) / 2;

    // Y: safe-head crop — anchor at 5% from top of scaled image
    // This ensures face/head area is preserved in portrait photos
    const maxOffsetY = Math.max(0, scaledH - frameHeight);
    // 5% of scaled height, but never more than maxOffsetY
    const offsetY    = clamp5(scaledH * 0.05, 0, maxOffsetY);

    ctx.save();
    ctx.beginPath();
    ctx.rect(frameX, frameY, frameWidth, frameHeight);
    ctx.clip();
    ctx.drawImage(
      img,
      frameX - offsetX,
      frameY - offsetY,
      scaledW,
      scaledH
    );
    ctx.restore();
  } catch (err) {
    console.error('[JASHN-PHYSICS] ERROR drawCoverFill:', err);
    try { ctx.restore(); } catch (_) {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// renderDynamicJSON
// ─────────────────────────────────────────────────────────────────────────────
const renderDynamicJSON = (ctx: CanvasRenderingContext2D, data: any, blueprint: any) => {
  console.log('[JASHN-DEBUG] Canvas draw start', {
    pipeline: 'renderDynamicJSON',
    canvasSize: `${ctx.canvas.width}x${ctx.canvas.height}`,
    blueprintId: blueprint?._blueprintId ?? 'dynamic',
  });

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1.0;
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;

  const CW = ctx.canvas.width;
  const CH = ctx.canvas.height;
  blueprint = runPhysicsEngine(blueprint, CW, CH);

  // 1. Background
  try {
    if (blueprint.background.type === 'gradient' && blueprint.background.color2) {
      const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
      grad.addColorStop(0, blueprint.background.color1 || '#FFFFFF');
      grad.addColorStop(1, blueprint.background.color2 || '#F0F0F0');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = blueprint.background.color1 || '#FFFFFF';
    }
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  } catch (bgErr) {
    console.error('[JASHN-DEBUG] ERROR drawing background:', bgErr);
    ctx.fillStyle = '#F9F5EB';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  // 1b. Outer border (Blueprint 5)
  if (blueprint.outerBorder) {
    try {
      const borderColor = blueprint.outerBorderColor || '#D4AF37';
      const bw          = 8;
      ctx.save();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth   = bw;
      ctx.strokeRect(bw / 2, bw / 2, ctx.canvas.width - bw, ctx.canvas.height - bw);
      ctx.restore();
    } catch (borderErr) {
      console.error('[JASHN-DEBUG] ERROR drawing outer border:', borderErr);
    }
  }

  // 2. Decorative Shapes
  if (blueprint.decorations && Array.isArray(blueprint.decorations)) {
    blueprint.decorations.forEach((dec: any, di: number) => {
      try {
        ctx.save();
        ctx.globalAlpha = dec.alpha || 1.0;
        ctx.fillStyle = dec.color || '#000000';
        ctx.translate(dec.x || 0, dec.y || 0);
        if (dec.rotation) ctx.rotate((dec.rotation * Math.PI) / 180);
        ctx.beginPath();
        if (dec.type === 'circle' && dec.radius) {
          ctx.arc(0, 0, dec.radius, 0, Math.PI * 2);
        } else if (dec.type === 'rect' && dec.w && dec.h) {
          ctx.rect(-dec.w/2, -dec.h/2, dec.w, dec.h);
        }
        ctx.fill();
        ctx.restore();
      } catch (decErr) {
        console.error(`[JASHN-DEBUG] ERROR drawing decoration[${di}]:`, decErr);
        try { ctx.restore(); } catch(_) {}
      }
    });
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  }

  // 3. Images inside Frames
  if (blueprint.imageFrames && Array.isArray(blueprint.imageFrames) && data.photos && data.photos.length > 0) {
    blueprint.imageFrames.forEach((frame: any, i: number) => {
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur  = 0;

      try {
        // ── FIXED: cycle through ALL available photos, not just index 0 ──
        const photoIndex = i % data.photos.length;
        const img = data.photos[photoIndex];

        if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
          console.warn(`[JASHN-DEBUG] Frame[${i}]: image invalid/not loaded — skipping`);
          return;
        }

        const { x, y, w, h, rotation = 0, borderWidth = 0, borderColor = '#FFF', shadow = false } = frame;

        const clampedX = clamp5(x, 0, ctx.canvas.width);
        const clampedY = clamp5(y, 0, ctx.canvas.height);

        ctx.save();
        ctx.translate(clampedX, clampedY);
        ctx.rotate((rotation * Math.PI) / 180);

        if (shadow) {
          ctx.shadowColor   = 'rgba(0,0,0,0.2)';
          ctx.shadowBlur    = 20;
          ctx.shadowOffsetX = 5;
          ctx.shadowOffsetY = 10;
        }

        ctx.fillStyle = borderColor;
        ctx.fillRect(-w/2, -h/2, w, h);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur  = 0;

        const innerW = Math.max(1, w - borderWidth * 2);
        const innerH = Math.max(1, h - borderWidth * 2);

        drawCoverFill(ctx, img, -innerW / 2, -innerH / 2, innerW, innerH);

        ctx.restore();
      } catch (frameErr) {
        console.error(`[JASHN-DEBUG] ERROR drawing frame[${i}]:`, frameErr);
        try { ctx.restore(); } catch(_) {}
      }
    });

    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;
  }

  // 3b. Blueprint 6 paper note
  if (blueprint.centerPaperNote) {
    renderBlueprint6PaperNote(ctx, blueprint, data);
  }

  // 4. Text Blocks
  if (!blueprint.centerPaperNote && blueprint.textBlocks && Array.isArray(blueprint.textBlocks)) {
    blueprint.textBlocks.forEach((tb: any, ti: number) => {
      try {
        if (!tb.text || typeof tb.text !== 'string' || tb.text.trim() === '') return;
        const fontFamily = tb.fontFamily && tb.fontFamily.trim() ? tb.fontFamily : 'sans-serif';
        const fontSize   = tb.fontSize   && tb.fontSize   > 0    ? tb.fontSize   : 30;
        const fontStr    = `${tb.isItalic ? 'italic ' : ''}${tb.isBold ? 'bold ' : 'normal '}${fontSize}px ${fontFamily}`;

        ctx.save();
        ctx.font         = fontStr;
        ctx.textAlign    = (tb.align as CanvasTextAlign) || 'center';
        ctx.textBaseline = 'middle';

        const maxW       = tb.maxWidth || ctx.canvas.width - 100;
        const lines      = wrapTextToArray(ctx, tb.text, maxW);
        const lineHeight = fontSize * 1.4;
        const blockH     = lines.length * lineHeight;

        const textX  = tb.x || ctx.canvas.width / 2;
        const startY = tb.y || 100;
        const regionX = ctx.textAlign === 'center' ? textX - maxW/2 : textX;
        const contrastColor = tb.color && tb.color.trim()
          ? tb.color
          : getTextColorForBackground(ctx, regionX, startY - fontSize, maxW, blockH + fontSize);

        ctx.fillStyle = contrastColor;

        lines.forEach((line: string, index: number) => {
          ctx.fillText(line, textX, startY + index * lineHeight);
        });

        ctx.restore();
      } catch (textErr) {
        console.error(`[JASHN-DEBUG] ERROR drawing textBlock[${ti}]:`, textErr);
        try { ctx.restore(); } catch(_) {}
      }
    });
  }

  console.log('[JASHN-DEBUG] Canvas draw end', {
    pixelsRendered: ctx.canvas.width * ctx.canvas.height,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// drawSmartPolaroid
// ─────────────────────────────────────────────────────────────────────────────
const drawSmartPolaroid = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number,
  w: number, h: number,
  rotateDeg: number
) => {
  if (!img || !img.complete || img.naturalWidth === 0) {
    console.warn('[JASHN-DEBUG] drawSmartPolaroid: invalid image — skipping');
    return;
  }
  try {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rotateDeg * Math.PI / 180);
    ctx.translate(-w / 2, -h / 2);
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    const padding    = 20;
    const bottomChin = 80;
    const frameW     = w - padding * 2;
    const frameH     = h - padding - bottomChin;
    ctx.shadowColor  = 'transparent';

    const scale   = Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight);
    const scaledW = img.naturalWidth  * scale;
    const scaledH = img.naturalHeight * scale;
    const offsetX = (scaledW - frameW) / 2;
    // Safe-head crop: 5% from top
    const maxOffY = Math.max(0, scaledH - frameH);
    const offsetY = clamp5(scaledH * 0.05, 0, maxOffY);

    ctx.beginPath();
    ctx.rect(padding, padding, frameW, frameH);
    ctx.clip();
    ctx.drawImage(img, padding - offsetX, padding - offsetY, scaledW, scaledH);
    ctx.restore();
  } catch (err) {
    console.error('[JASHN-DEBUG] ERROR drawSmartPolaroid:', err);
    try { ctx.restore(); } catch(_) {}
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// renderFallbackLayout1 — FIXED: proper photo cycling, layout matches poster3
// ─────────────────────────────────────────────────────────────────────────────
const renderFallbackLayout1 = async (ctx: CanvasRenderingContext2D, data: any) => {
  ctx.canvas.width  = 1080;
  ctx.canvas.height = 1920;
  ctx.fillStyle = '#F9F5EB';
  ctx.fillRect(0, 0, 1080, 1920);

  // Subtle bg circles
  ctx.fillStyle = '#D4AF37';
  ctx.globalAlpha = 0.10;
  ctx.beginPath(); ctx.arc(150, 200, 280, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(930, 1700, 360, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1.0;

  // ── Paper card — matches poster3 CARD zone exactly ───────────────────────
  // CARD_TOP=700, CARD_BOTTOM=1280, CARD_LEFT=60, CARD_WIDTH=960
  const CARD_TOP    = 700;
  const CARD_LEFT   = 60;
  const CARD_WIDTH  = 960;
  const CARD_HEIGHT = 580;

  ctx.shadowColor   = 'rgba(0,0,0,0.10)';
  ctx.shadowBlur    = 36;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle     = '#FFFFFF';
  ctx.fillRect(CARD_LEFT, CARD_TOP, CARD_WIDTH, CARD_HEIGHT);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;
  ctx.shadowOffsetY = 0;

  // ── Photo layouts — coordinates match poster3 buildPoster3 exactly ────────
  // All photos stay outside CARD_TOP(700)..CARD_BOTTOM(1280) zone
  // Center-coords converted to [left, top, w, h, rot] for drawSmartPolaroid
  const layouts: Record<number, number[][]> = {
    2: [
      // [left, top, w, h, rot] — top-left of polaroid box
      [260 - 230, 310 - 290, 460, 580, -6],   // cx=260, cy=310
      [820 - 230, 1590 - 290, 460, 580,  6],  // cx=820, cy=1590
    ],
    3: [
      [220 - 210, 300 - 260, 420, 520, -8],
      [830 - 210, 280 - 260, 420, 520,  8],
      [540 - 220, 1590 - 270, 440, 540, -2],
    ],
    4: [
      [210 - 195, 300 - 245, 390, 490, -10],
      [840 - 195, 290 - 245, 390, 490,  10],
      [210 - 195, 1580 - 245, 390, 490,   5],
      [870 - 195, 1580 - 245, 390, 490,  -5],
    ],
    5: [
      [180 - 170, 280 - 215, 340, 430, -12],
      [540 - 170, 260 - 215, 340, 430,   0],
      [900 - 170, 280 - 215, 340, 430,  12],
      [270 - 185, 1580 - 235, 370, 470,   8],
      [810 - 185, 1580 - 235, 370, 470,  -8],
    ],
  };

  let images = data.photos || [];
  // Never duplicate — use what's available, cycle if needed
  const imgCount = Math.max(2, Math.min(5, images.length));
  const currentLayout = layouts[imgCount] || layouts[2];

  currentLayout.forEach((coords, i) => {
    const [lx, ly, lw, lh, rot] = coords;
    // Cycle through available photos
    const img = images[i % images.length];
    if (img) {
      drawSmartPolaroid(ctx, img, lx, ly, lw, lh, rot);
    }
  });

  // ── Text inside paper card ────────────────────────────────────────────────
  const centerX  = CARD_LEFT + CARD_WIDTH / 2;
  const cardMidY = CARD_TOP  + CARD_HEIGHT / 2;

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  const titleText    = data.title        || '';
  const nameText     = data.relationName || '';
  const termText     = data.termLine     || '';
  const subtitleText = data.subtitle     || '';

  // Adaptive font sizes
  const tLen = titleText.length;
  const tSize = tLen <= 10 ? 58 : tLen <= 18 ? 48 : tLen <= 26 ? 40 : tLen <= 36 ? 34 : 28;

  const nLen = nameText.length;
  const nSize = nLen <= 10 ? 38 : nLen <= 18 ? 32 : nLen <= 26 ? 26 : 22;

  const sSize = getIntelligentFontSize(subtitleText, false);

  ctx.font = `italic ${sSize}px Georgia, serif`;
  const msgLines = wrapTextToArray(ctx, subtitleText, CARD_WIDTH - 112);

  // Calculate total text block height to vertically center it
  let totalH = tSize;
  if (nameText)     totalH += 16 + nSize;
  if (termText)     totalH += 12 + 24;
  if (msgLines.length > 0) totalH += 36 + (msgLines.length * (sSize * 1.5));

  let currentY = cardMidY - totalH / 2 + tSize / 2;

  // Title
  ctx.fillStyle = '#1A1A1A';
  ctx.font      = `italic bold ${tSize}px Georgia, serif`;
  ctx.fillText(titleText, centerX, currentY);

  // Name
  if (nameText) {
    currentY += 16 + nSize / 2 + tSize / 2;
    ctx.fillStyle = '#1A1A1A';
    ctx.font      = `bold ${nSize}px Arial, sans-serif`;
    ctx.fillText(nameText.toUpperCase(), centerX, currentY);
    currentY += nSize / 2;
  }

  // Term / relation label
  if (termText) {
    currentY += 12 + 12;
    ctx.fillStyle = '#4A4040';
    ctx.font      = `500 24px Georgia, serif`;
    ctx.fillText(termText, centerX, currentY);
    currentY += 12;
  }

  // Divider
  if ((nameText || termText) && msgLines.length > 0) {
    currentY += 18;
    ctx.save();
    ctx.strokeStyle = 'rgba(80,65,50,0.30)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 28, currentY);
    ctx.lineTo(centerX + 28, currentY);
    ctx.stroke();
    ctx.restore();
    currentY += 18;
  }

  // Quote lines
  if (msgLines.length > 0) {
    currentY += sSize * 0.75;
    ctx.fillStyle = '#2E2820';
    ctx.font      = `italic ${sSize}px Georgia, serif`;
    for (const line of msgLines) {
      // Guard: don't draw below card bottom
      if (currentY + sSize / 2 < CARD_TOP + CARD_HEIGHT - 20) {
        ctx.fillText(line, centerX, currentY);
      }
      currentY += sSize * 1.5;
    }
  }

  // Footer
  ctx.fillStyle = 'rgba(168,159,145,0.70)';
  ctx.font      = '600 13px Arial, sans-serif';
  ctx.fillText('CREATED WITH JASHN', centerX, 1880);
};

// ─────────────────────────────────────────────────────────────────────────────
// renderFallbackLayout2 — 1-photo square fallback
// ─────────────────────────────────────────────────────────────────────────────
const renderFallbackLayout2 = async (ctx: CanvasRenderingContext2D, data: any) => {
  ctx.canvas.width  = 1080;
  ctx.canvas.height = 1080;

  ctx.fillStyle = '#F4F1EC';
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = '#7D95A5';
  ctx.beginPath(); ctx.ellipse(0, 0, 450, 350, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#B3A99D';
  ctx.beginPath(); ctx.ellipse(1080, 1080, 400, 350, 0, 0, Math.PI * 2); ctx.fill();

  const mX = 90, mY = 90, mW = 900, mH = 900;
  const imgH = mH * 0.65;

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth   = 16;
  ctx.strokeRect(mX - 8, mY - 8, mW + 16, mH + 16);

  if (data.photos && data.photos[0]) {
    const img = data.photos[0];
    if (img && img.complete && img.naturalWidth > 0) {
      try {
        drawSymmetricCrop(ctx, img, mX, mY, mW, imgH);
      } catch (imgErr) {
        console.error('[JASHN-DEBUG] ERROR renderFallbackLayout2 image:', imgErr);
        ctx.fillStyle = '#E5E5E5';
        ctx.fillRect(mX, mY, mW, imgH);
      }
    } else {
      console.warn('[JASHN-DEBUG] renderFallbackLayout2: photo[0] invalid');
      ctx.fillStyle = '#E5E5E5';
      ctx.fillRect(mX, mY, mW, imgH);
    }
  } else {
    ctx.fillStyle = '#E5E5E5';
    ctx.fillRect(mX, mY, mW, imgH);
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(mX, mY + imgH, mW, mH - imgH);

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  const tSize    = getIntelligentFontSize(data.title, true);
  const sSize    = getIntelligentFontSize(data.subtitle, false);
  ctx.font       = `italic ${sSize}px Georgia, serif`;
  const msgLines = wrapTextToArray(ctx, data.subtitle || '', mW - 100);

  const panelCenterY = mY + imgH + (mH - imgH) / 2;
  const totalH       = tSize + 30 + msgLines.length * (sSize * 1.5);
  let   currentY     = panelCenterY - totalH / 2 + tSize / 2;

  const titleColor = getTextColorForBackground(ctx, mX, mY + imgH, mW, mH - imgH) === '#ffffff'
    ? '#ffffff'
    : '#2B3A4A';
  ctx.fillStyle = titleColor;
  ctx.font      = `bold ${tSize}px sans-serif`;
  if (data.title && data.title.trim()) ctx.fillText(data.title, mX + mW / 2, currentY);

  currentY += 30 + sSize * 0.75;
  const quoteColor = getTextColorForBackground(ctx, mX, currentY - sSize, mW, msgLines.length * sSize * 1.5 + sSize);
  ctx.fillStyle = quoteColor === '#ffffff' ? '#ffffff' : '#4A4A4A';
  ctx.font      = `italic ${sSize}px Georgia, serif`;
  for (const line of msgLines) {
    if (line && line.trim()) ctx.fillText(line, mX + mW / 2, currentY);
    currentY += sSize * 1.5;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT_3_SINGLE_IMAGE — Minimal & Aesthetic Single-Image Poster
// ═══════════════════════════════════════════════════════════════════════════════

const FRAME_MARGIN          = 12;
const FRAME_MIN_BORDER      = 24;
const FRAME_MAX_BORDER      = 64;
const FRAME_POLAROID_BOTTOM = 80;
const TEXT_FRAME_GAP_MIN    = 72;
const TEXT_FRAME_GAP_MAX    = 320;
const TEXT_BLOCK_GAP        = 32;
const MAX_FRAME_H_FRACTION  = 0.70;

const renderSingleImagePoster = (
  ctx:       CanvasRenderingContext2D,
  data:      any,
  blueprint: any,
): void => {
  const CW = ctx.canvas.width;
  const CH = ctx.canvas.height;

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha   = 1.0;
  ctx.shadowColor   = 'transparent';
  ctx.shadowBlur    = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Step 1. Background
  try {
    const bg = blueprint?.background || { type: 'solid', color1: '#F5EFE6', color2: '#F5EFE6' };
    if (bg.type === 'gradient' && bg.color2 && bg.color2 !== bg.color1) {
      const grad = ctx.createLinearGradient(0, 0, 0, CH);
      grad.addColorStop(0, bg.color1 || '#F5EFE6');
      grad.addColorStop(1, bg.color2 || '#E8DDD0');
      ctx.fillStyle = grad;
    } else if (bg.type === 'radial' && bg.color2) {
      const grad = ctx.createRadialGradient(CW / 2, CH * 0.38, 0, CW / 2, CH * 0.5, CW * 0.9);
      grad.addColorStop(0, bg.color1 || '#FFFFFF');
      grad.addColorStop(1, bg.color2 || '#E8DDD0');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = bg.color1 || '#F5EFE6';
    }
    ctx.fillRect(0, 0, CW, CH);
  } catch (bgErr) {
    console.error('[JASHN-SINGLE] ERROR background:', bgErr);
    ctx.fillStyle = '#F5EFE6';
    ctx.fillRect(0, 0, CW, CH);
  }

  // Step 2. Validate & clamp image frame
  let aiFrame = blueprint?.imageFrame ? { ...blueprint.imageFrame } : null;
  if (!aiFrame || !aiFrame.w || !aiFrame.h) {
    aiFrame = { x: CW / 2, y: CH * 0.42, w: 820, h: 1020, rotation: 0, style: 'museum' };
    console.warn('[JASHN-SINGLE] imageFrame missing — using derived default');
  }

  if (aiFrame.w > aiFrame.h) {
    console.warn(`[JASHN-SINGLE] Landscape frame (${aiFrame.w}×${aiFrame.h}) → corrected to portrait`);
    [aiFrame.w, aiFrame.h] = [aiFrame.h, aiFrame.w];
  }

  const maxFW = CW - FRAME_MARGIN * 2;
  const maxFH = CH * MAX_FRAME_H_FRACTION;
  if (aiFrame.w > maxFW) { const r = maxFW / aiFrame.w; aiFrame.w *= r; aiFrame.h *= r; }
  if (aiFrame.h > maxFH) { const r = maxFH / aiFrame.h; aiFrame.w *= r; aiFrame.h *= r; }

  const halfFW = aiFrame.w / 2;
  const halfFH = aiFrame.h / 2;
  aiFrame.x = clamp5(aiFrame.x ?? CW / 2, FRAME_MARGIN + halfFW, CW - FRAME_MARGIN - halfFW);
  aiFrame.y = clamp5(aiFrame.y ?? CH * 0.42, FRAME_MARGIN + halfFH, CH - FRAME_MARGIN - halfFH);

  // Step 3. Frame style & border widths
  const frameStyle   = (aiFrame.style === 'polaroid') ? 'polaroid' : 'museum';
  const aiRawBorder  = typeof aiFrame.borderWidth === 'number' ? aiFrame.borderWidth : 28;
  const borderSide   = clamp5(aiRawBorder, FRAME_MIN_BORDER, FRAME_MAX_BORDER);
  const borderTop    = borderSide;
  const borderLR     = borderSide;
  const borderBottom = frameStyle === 'polaroid'
    ? clamp5(aiRawBorder + FRAME_POLAROID_BOTTOM, borderSide + 40, FRAME_MAX_BORDER + FRAME_POLAROID_BOTTOM)
    : borderSide;

  const frameColor = (aiFrame.borderColor && aiFrame.borderColor !== 'transparent' && aiFrame.borderColor.trim())
    ? aiFrame.borderColor
    : '#FFFFFF';
  const rotation   = clamp5(aiFrame.rotation ?? 0, -8, 8);
  const frameW     = Math.round(aiFrame.w);
  const frameH     = Math.round(aiFrame.h);
  const frameCX    = Math.round(aiFrame.x);
  const frameCY    = Math.round(aiFrame.y);

  // Step 4. Back decorations
  if (Array.isArray(blueprint?.decorations)) {
    blueprint.decorations
      .filter((d: any) => d.layer !== 'front')
      .forEach((dec: any) => {
        try {
          ctx.save();
          ctx.globalAlpha = clamp5(dec.alpha ?? 0.6, 0.05, 0.9);
          ctx.fillStyle   = dec.color || blueprint.accentColor || '#AAAAAA';
          ctx.strokeStyle = dec.color || blueprint.accentColor || '#AAAAAA';
          ctx.lineWidth   = dec.lineWidth || 1.5;
          if (dec.type === 'line') {
            ctx.beginPath();
            ctx.moveTo(clamp5(dec.x,  FRAME_MARGIN, CW - FRAME_MARGIN), clamp5(dec.y,  FRAME_MARGIN, CH - FRAME_MARGIN));
            ctx.lineTo(clamp5(dec.x2 ?? dec.x, FRAME_MARGIN, CW - FRAME_MARGIN), clamp5(dec.y2 ?? dec.y, FRAME_MARGIN, CH - FRAME_MARGIN));
            ctx.stroke();
          } else if (dec.type === 'dot' || dec.type === 'circle') {
            ctx.beginPath();
            ctx.arc(
              clamp5(dec.x, FRAME_MARGIN, CW - FRAME_MARGIN),
              clamp5(dec.y, FRAME_MARGIN, CH - FRAME_MARGIN),
              clamp5(dec.radius || 4, 1, 36), 0, Math.PI * 2
            );
            ctx.fill();
          } else if (dec.type === 'rect') {
            const rw = clamp5(dec.w || 40, 2, CW - FRAME_MARGIN * 2);
            const rh = clamp5(dec.h || 3, 1, CH - FRAME_MARGIN * 2);
            ctx.fillRect(
              clamp5(dec.x - rw / 2, FRAME_MARGIN, CW - FRAME_MARGIN - rw),
              clamp5(dec.y - rh / 2, FRAME_MARGIN, CH - FRAME_MARGIN - rh),
              rw, rh
            );
          }
          ctx.restore();
        } catch (_) { try { ctx.restore(); } catch (__) {} }
      });
    ctx.globalAlpha = 1.0;
  }

  // Step 5. Frame shadow pass
  try {
    ctx.save();
    ctx.translate(frameCX, frameCY);
    if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);

    ctx.save();
    ctx.shadowColor   = 'rgba(0, 0, 0, 0.14)';
    ctx.shadowBlur    = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 16;
    ctx.fillStyle     = frameColor;
    ctx.fillRect(-frameW / 2, -frameH / 2, frameW, frameH);
    ctx.restore();

    ctx.save();
    ctx.shadowColor   = 'rgba(0, 0, 0, 0.22)';
    ctx.shadowBlur    = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle     = frameColor;
    ctx.fillRect(-frameW / 2, -frameH / 2, frameW, frameH);
    ctx.restore();

    ctx.restore();
  } catch (shadowErr) {
    console.error('[JASHN-SINGLE] ERROR frame shadow:', shadowErr);
    try { ctx.restore(); } catch (_) {}
  }

  // Step 6. Frame solid fill
  try {
    ctx.save();
    ctx.translate(frameCX, frameCY);
    if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle   = frameColor;
    ctx.fillRect(-frameW / 2, -frameH / 2, frameW, frameH);
    ctx.restore();
  } catch (fillErr) {
    console.error('[JASHN-SINGLE] ERROR frame fill:', fillErr);
    try { ctx.restore(); } catch (_) {}
  }

  // Step 7. Photo inside frame
  const innerW = Math.max(1, frameW - borderLR * 2);
  const innerH = Math.max(1, frameH - borderTop - borderBottom);

  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;

  try {
    ctx.save();
    ctx.translate(frameCX, frameCY);
    if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);

    const innerL = -frameW / 2 + borderLR;
    const innerT = -frameH / 2 + borderTop;

    const img = data.photos?.[0];
    if (img && img.complete && img.naturalWidth > 0) {
      drawCoverFill(ctx, img, innerL, innerT, innerW, innerH);
    } else {
      ctx.fillStyle = '#D0C8BC';
      ctx.fillRect(innerL, innerT, innerW, innerH);
      console.warn('[JASHN-SINGLE] Photo missing — placeholder shown');
    }
    ctx.restore();
  } catch (imgErr) {
    console.error('[JASHN-SINGLE] ERROR drawing photo:', imgErr);
    try { ctx.restore(); } catch (_) {}
  }

  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;

  // Step 8. Front decorations
  if (Array.isArray(blueprint?.decorations)) {
    blueprint.decorations
      .filter((d: any) => d.layer === 'front')
      .forEach((dec: any) => {
        try {
          ctx.save();
          ctx.globalAlpha = clamp5(dec.alpha ?? 0.6, 0.05, 0.9);
          ctx.fillStyle   = dec.color || blueprint.accentColor || '#AAAAAA';
          if (dec.type === 'dot' || dec.type === 'circle') {
            ctx.beginPath();
            ctx.arc(
              clamp5(dec.x, FRAME_MARGIN, CW - FRAME_MARGIN),
              clamp5(dec.y, FRAME_MARGIN, CH - FRAME_MARGIN),
              clamp5(dec.radius || 4, 1, 18), 0, Math.PI * 2
            );
            ctx.fill();
          }
          ctx.restore();
        } catch (_) { try { ctx.restore(); } catch (__) {} }
      });
    ctx.globalAlpha = 1.0;
  }

  // Step 9. Text zone collision detection — FIXED
  const rotRad = (rotation * Math.PI) / 180;
  const cosR   = Math.abs(Math.cos(rotRad));
  const sinR   = Math.abs(Math.sin(rotRad));
  const aabbW  = frameW * cosR + frameH * sinR;
  const aabbH  = frameW * sinR + frameH * cosR;
  const frameAABBTop    = frameCY - aabbH / 2;
  const frameAABBBottom = frameCY + aabbH / 2;

  // Calculate available space above and below frame
  const spaceBelow = CH - FRAME_MARGIN - frameAABBBottom;
  const spaceAbove = frameAABBTop - FRAME_MARGIN;

  let tz = blueprint?.textZone ? { ...blueprint.textZone } : null;

  if (!tz || !tz.y) {
    // Auto-derive text zone based on available space
    if (spaceBelow >= spaceAbove && spaceBelow >= 80) {
      tz = {
        x:        CW / 2,
        y:        frameAABBBottom + TEXT_FRAME_GAP_MIN,
        align:    'center',
        maxWidth: CW - 120,
      };
    } else {
      tz = {
        x:        CW / 2,
        y:        Math.max(FRAME_MARGIN + 40, frameAABBTop - TEXT_FRAME_GAP_MIN - 40),
        align:    'center',
        maxWidth: CW - 120,
      };
    }
  }

  // Boundary safety on text zone
  tz.x        = clamp5(tz.x,        FRAME_MARGIN + 20, CW - FRAME_MARGIN - 20);
  tz.maxWidth = clamp5(tz.maxWidth || CW - 120, 200, CW - FRAME_MARGIN * 2);

  // FIXED: correct collision detection
  // Text zone y is where FIRST text block starts (top of first line, roughly)
  // Check if this starting point is inside the frame AABB + gap
  const isInsideFrameZone = (y: number) =>
    y > frameAABBTop - TEXT_FRAME_GAP_MIN &&
    y < frameAABBBottom + TEXT_FRAME_GAP_MIN;

  if (isInsideFrameZone(tz.y)) {
    if (spaceBelow >= spaceAbove) {
      tz.y = frameAABBBottom + TEXT_FRAME_GAP_MIN;
    } else {
      tz.y = frameAABBTop - TEXT_FRAME_GAP_MIN;
    }
    console.log(`[JASHN-SINGLE] Text zone collision-corrected → y=${Math.round(tz.y)}`);
  }

  // Max gap enforcement — don't let text float too far from frame
  const distBelow = tz.y - frameAABBBottom;
  const distAbove = frameAABBTop - tz.y;

  if (distBelow > 0 && distBelow > TEXT_FRAME_GAP_MAX) {
    tz.y = frameAABBBottom + TEXT_FRAME_GAP_MAX;
    console.log(`[JASHN-SINGLE] Text zone max-gap (below) clamped → y=${Math.round(tz.y)}`);
  } else if (distAbove > 0 && distAbove > TEXT_FRAME_GAP_MAX) {
    tz.y = frameAABBTop - TEXT_FRAME_GAP_MAX;
    console.log(`[JASHN-SINGLE] Text zone max-gap (above) clamped → y=${Math.round(tz.y)}`);
  }

  // Final boundary clamp
  tz.y = clamp5(tz.y, FRAME_MARGIN + 20, CH - FRAME_MARGIN - 20);

  // Step 10. Smart-size fonts
  let textBlocks: any[] = Array.isArray(blueprint?.textBlocks) ? [...blueprint.textBlocks] : [];
  textBlocks = smartSizeFonts(textBlocks, CW, CH);

  // Step 11. Draw text blocks
  let currentY = tz.y;

  textBlocks.forEach((tb: any, ti: number) => {
    try {
      if (!tb.text || tb.text.trim() === '') return;

      const fontFamily = tb.fontFamily && tb.fontFamily.trim() ? tb.fontFamily : 'Georgia, serif';
      const fontSize   = Math.max(14, tb.fontSize || 38);
      const fontStr    = `${tb.isItalic ? 'italic ' : ''}${tb.isBold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;

      ctx.save();
      ctx.font         = fontStr;
      ctx.textAlign    = (tz!.align || 'center') as CanvasTextAlign;
      ctx.textBaseline = 'middle';

      const maxW   = tz!.maxWidth;
      const lines  = wrapTextToArray(ctx, tb.text, maxW);
      const lineH  = fontSize * 1.48;
      const blockH = lines.length * lineH;

      // Per-block collision: skip past frame if needed
      let safeY = currentY;
      const blockTop    = safeY - fontSize / 2;
      const blockBottom = safeY + blockH + fontSize / 2;
      if (blockTop < frameAABBBottom + TEXT_FRAME_GAP_MIN &&
          blockBottom > frameAABBTop - TEXT_FRAME_GAP_MIN) {
        safeY = frameAABBBottom + TEXT_FRAME_GAP_MIN;
      }

      // Bottom boundary
      if (safeY + blockH > CH - FRAME_MARGIN - 8) {
        safeY = CH - FRAME_MARGIN - blockH - 8;
      }
      safeY = clamp5(safeY, FRAME_MARGIN + fontSize / 2, CH - FRAME_MARGIN - blockH);

      // Contrast-aware color
      const regionX = tz!.align === 'center'
        ? tz!.x - maxW / 2
        : tz!.align === 'right' ? tz!.x - maxW : tz!.x;
      ctx.fillStyle = (tb.color && tb.color.trim())
        ? tb.color
        : getTextColorForBackground(ctx, regionX, safeY - fontSize, maxW, blockH + fontSize);

      // Quote marks for italic subtitle
      const isQuote = tb.contentKey === 'subtitle' && tb.isItalic;
      if (isQuote) {
        const openX = tz!.align === 'center'
          ? tz!.x - maxW / 2
          : (tz!.align === 'right' ? tz!.x - maxW : tz!.x);
        ctx.save();
        ctx.font        = `italic ${Math.round(fontSize * 1.55)}px Georgia, serif`;
        ctx.globalAlpha = 0.50;
        ctx.fillText('\u201C', openX, safeY - lineH * 0.12);
        ctx.restore();
      }

      lines.forEach((line: string, idx: number) => {
        const ly = safeY + idx * lineH;
        if (ly - fontSize / 2 >= FRAME_MARGIN && ly + fontSize / 2 <= CH - FRAME_MARGIN) {
          ctx.fillText(line, tz!.x, ly);
        }
      });

      if (isQuote) {
        const closeX = tz!.align === 'center'
          ? tz!.x + maxW / 2
          : (tz!.align === 'right' ? tz!.x : tz!.x + maxW);
        ctx.save();
        ctx.font        = `italic ${Math.round(fontSize * 1.55)}px Georgia, serif`;
        ctx.globalAlpha = 0.50;
        ctx.fillText('\u201D', closeX, safeY + (lines.length - 1) * lineH + lineH * 0.12);
        ctx.restore();
      }

      ctx.restore();
      currentY = safeY + blockH + TEXT_BLOCK_GAP;

    } catch (textErr) {
      console.error(`[JASHN-SINGLE] ERROR drawing textBlock[${ti}]:`, textErr);
      try { ctx.restore(); } catch (_) {}
    }
  });

  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;

  console.log('[JASHN-SINGLE] Render complete', {
    frame:      `${frameStyle} ${frameW}×${frameH} @ (${frameCX},${frameCY}) rot=${rotation}°`,
    border:     `T${borderTop} R${borderLR} B${borderBottom} L${borderLR}`,
    textZone:   `x=${Math.round(tz.x)} y=${Math.round(tz.y)} align=${tz.align}`,
    textBlocks: textBlocks.length,
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
export const generatePosterCanvas = async (
  canvas:      HTMLCanvasElement,
  layoutType:  LayoutType,
  data:        any,
  styleConfig: any
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('[JASHN-DEBUG] Canvas context failed');

  console.log('[JASHN-DEBUG] Canvas draw start', {
    pipeline:    layoutType,
    canvasSize:  `${canvas.width}x${canvas.height}`,
    photosCount: data?.photos?.length ?? 0,
    isDynamic:   !!(styleConfig?.isDynamic && styleConfig?.blueprint),
  });

  // 1. Try JSON Dynamic Rendering
  if (styleConfig && styleConfig.isDynamic && styleConfig.blueprint) {
    try {
      console.log('[JASHN-DEBUG] Executing hardcoded-geometry + AI-styling architecture...');
      ctx.canvas.width  = 1080;
      ctx.canvas.height = 1920;

      const blueprintId   = styleConfig.blueprintId;
      const is5ImgCase    = data?.photos?.length === 5
                            && layoutType === 'LAYOUT_1_COLLAGE'
                            && blueprintId >= 1
                            && blueprintId <= 6;
      const isJayanti     = layoutType === 'LAYOUT_2_JAYANTI';
      const isSingleImage = layoutType === 'LAYOUT_3_SINGLE_IMAGE';

      if (isSingleImage) {
        renderSingleImagePoster(ctx, data, styleConfig.blueprint);
      } else {
        const layoutId = styleConfig.layoutStyleId || 1;
        const optimizedBlueprint = is5ImgCase
          ? applyBlueprint5Img(styleConfig.blueprint, blueprintId)
          : isJayanti
          ? applyJayantiLayout(styleConfig.blueprint)
          : applyFixedLayout(styleConfig.blueprint, layoutId);
        renderDynamicJSON(ctx, data, optimizedBlueprint);
      }

      // Blank canvas check
      try {
        const sample    = ctx.getImageData(0, 0, Math.min(canvas.width, 20), Math.min(canvas.height, 20));
        const hasPixels = sample.data.some((v, i) => i % 4 !== 3 && v > 0);
        if (!hasPixels) {
          console.error('[JASHN-DEBUG] Dynamic render produced blank canvas — falling through');
          throw new Error('Blank canvas after dynamic render');
        }
      } catch (blankCheck) {
        if ((blankCheck as any)?.message === 'Blank canvas after dynamic render') throw blankCheck;
        console.warn('[JASHN-DEBUG] Could not verify canvas pixels (tainted?):', blankCheck);
      }

      console.log('[JASHN-DEBUG] Canvas draw end', { pixelsRendered: canvas.width * canvas.height });
      return canvas;

    } catch (err) {
      console.error('[JASHN-DEBUG] AI JSON execution failed — engaging fallback:', {
        message: (err as any)?.message,
        stack:   (err as any)?.stack,
      });
    }
  }

  // 2. Fallback
  console.log(`[JASHN-DEBUG] Using Permanent Hardcoded Fallback for ${layoutType}`);
  try {
    if (layoutType === 'LAYOUT_1_COLLAGE') {
      await renderFallbackLayout1(ctx, data);
    } else if (layoutType === 'LAYOUT_2_JAYANTI' || layoutType === 'LAYOUT_3_SINGLE_IMAGE') {
      await renderFallbackLayout2(ctx, data);
    }
    console.log('[JASHN-DEBUG] Canvas draw end', { pixelsRendered: canvas.width * canvas.height });
  } catch (fallbackErr) {
    console.error('[JASHN-DEBUG] Fallback render failed:', {
      message: (fallbackErr as any)?.message,
      stack:   (fallbackErr as any)?.stack,
    });
    try {
      ctx.canvas.width  = 1080;
      ctx.canvas.height = layoutType === 'LAYOUT_1_COLLAGE' ? 1920 : 1080;
      ctx.fillStyle = '#F9F5EB';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle    = '#1A1A1A';
      ctx.font         = 'bold 48px sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.title || 'Jashn', ctx.canvas.width / 2, ctx.canvas.height / 2);
    } catch (_) {}
  }

  return canvas;
};

// sync
