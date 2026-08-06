//file path:app/celebrate/premium/page.tsx

'use client';

import type React from 'react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import {
  Gift, ChevronDown, Lock, PauseCircle, Home, Volume2, VolumeX,
  Unlock, Copy, Check, Share2, Image as ImagesIcon, Heart,
  Download, X, ChevronLeft, ChevronRight, Mail, Play, Pause,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { toBlob } from 'html-to-image';

// ─────────────────────────────────────────────────────────────────────────────
// SCOPE NOTE
// ENVELOPE, INTRO and the new VALUE stage are the app's entry "reveal
// ceremony" screens — they stay in the ORIGINAL dark maroon/gold theme
// (INK_DARK). Only the PAGE stage (hero onward, what the visitor scrolls
// through) uses the light editorial theme (CREAM/INK/GOLD).
// ─────────────────────────────────────────────────────────────────────────────
const INK_DARK = '#1a0505';

const CREAM       = '#F6F2E9';
const CREAM_PANEL = '#EFE7D6';
const CARD_BG     = '#FFFFFF';
const INK         = '#241C13';
const INK_SOFT    = '#6B6154';
const GOLD        = '#A9821F';
const GOLD_SOFT   = 'rgba(169,130,31,0.55)';
const HAIRLINE    = 'rgba(36,28,19,0.10)';
const TAPE_ORANGE = '#D98E3F';

// Shared editorial type pair — loaded once at the top of the PAGE stage and
// applied everywhere user-authored text renders (not just inside the Love
// Letter), so the whole page reads as one consistent typographic system
// instead of the letter being the only "designed" text on the page.
// 'Noto Serif Devanagari' is appended as a same-family fallback: Cormorant
// Garamond has no Devanagari glyphs at all, so any Hindi the creator types
// into names/wishes/secret messages/the letter was silently falling back to
// whatever generic serif the OS ships (inconsistent weight/kerning next to
// the English). Per-character font fallback means the browser now picks
// Devanagari glyphs from Noto Serif Devanagari and Latin glyphs from
// Cormorant Garamond within the SAME string, so mixed Hindi+English text
// (e.g. "Aman ने कहा") renders both scripts in a matching serif register.
const SERIF_FONT   = "'Cormorant Garamond', 'Noto Serif Devanagari', Georgia, serif";
const SCRIPT_FONT  = "'Dancing Script', cursive";

const SectionHeader = ({ label, title }: { label: string; title: string }) => (
  <div className="text-center mb-5 md:mb-8">
    <span style={{ color: GOLD_SOFT }} className="text-[10px] md:text-xs tracking-[0.32em] uppercase font-medium">{label}</span>
    <div className="w-7 md:w-12 h-px mx-auto my-2 md:my-3" style={{ background: GOLD_SOFT }} />
    <h2 className="text-xl md:text-3xl lg:text-4xl" style={{ color: INK, fontFamily: SERIF_FONT }}>{title}</h2>
  </div>
);

const GIFT_THEMES: Record<string, { bg: string; accent: string; text: string; label: string }> = {
  FLIPKART: { bg: 'linear-gradient(135deg,#2874F0,#1E5FD0)', accent: '#FFE500', text: '#FFFFFF', label: 'Flipkart' },
  AMAZON:   { bg: 'linear-gradient(135deg,#131921,#232F3E)', accent: '#FF9900', text: '#FFFFFF', label: 'Amazon' },
  MYNTRA:   { bg: 'linear-gradient(135deg,#FF3F6C,#D91A54)', accent: '#FFFFFF', text: '#FFFFFF', label: 'Myntra' },
  SWIGGY:   { bg: 'linear-gradient(135deg,#FC8019,#E06C0C)', accent: '#FFFFFF', text: '#FFFFFF', label: 'Swiggy' },
  ZOMATO:   { bg: 'linear-gradient(135deg,#E23744,#C41E2D)', accent: '#FFFFFF', text: '#FFFFFF', label: 'Zomato' },
  OTHER:    { bg: 'linear-gradient(135deg,#C9A227,#8a6e15)', accent: '#FFFFFF', text: '#FFFFFF', label: 'Gift Card' },
};

// ─────────────────────────────────────────────────────────────────────────────
// GALLERY — "hanging photo" layout (replaces the old bento grid). Photos are
// split round-robin into 3 columns; each column starts at a different top
// offset so the photos sit at uneven heights, like prints of different
// string-length pinned to a wall. Every photo gets a white polaroid-style
// mat and a small tape strip pinned across its top edge.
// ─────────────────────────────────────────────────────────────────────────────
const HANGING_COLUMN_OFFSET = [26, 34, 4]; // px — left / middle / right column start height
const HANGING_TAPE_ROTATE = [-4, 3, -3, 4, -5, 2]; // per-photo-index tape tilt, cycles for >6

const DEFAULT_INTRO_LINES = [
  'Some stories are written in the stars...',
  'Yours is my favorite one.',
  'Every moment with you is magic.',
  'Here is a glimpse of our forever.',
];
const DEFAULT_WISH = 'Every moment with you is a story worth celebrating.';
const NO_SECRET_TEXT = 'No secret message for you.';
const DEFAULT_QUESTION = { text: 'Did you like this? 🤍', revealOn: 'YES' as 'YES' | 'NO' };

const PremiumLoader = ({ progress, message }: { progress?: number; message?: string }) => (
  <div className="fixed inset-0 flex flex-col items-center justify-center z-50 p-4" style={{ background: INK_DARK }}>
    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.6 }}
      className="w-8 h-8 rounded-full border-2 border-[#d4af37]/50 border-t-[#d4af37] mb-3" />
    {message && <p className="text-[#d4af37] text-xs font-serif tracking-widest uppercase mb-1">{message}</p>}
    {progress !== undefined && (
      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-2 border border-[#d4af37]/30">
        <div className="h-full bg-[#d4af37] transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// RIBBON SEAL
// ─────────────────────────────────────────────────────────────────────────────
const RibbonSeal = ({ price }: { price: number }) => (
  // Scaled as one unit from the top-right corner instead of resizing each
  // hand-tuned offset below — the diagonal band can never drift out of
  // alignment or get clipped oddly at smaller viewport widths.
  //
  // The corner "fold" shading is the container's OWN background — a soft
  // radial gradient centered exactly on the true top-right corner — so
  // there's no separately-positioned shape that has to line up pixel-for-
  // pixel with the rotated band above it.
  //
  // GEOMETRY FIX for the visible cut at the lower fold point: a rotated
  // band only ever looks "clean" at an edge where BOTH of its short-end
  // corners land fully outside the clip box — then the box's overflow
  // hides a full edge-to-edge slice of the band, same as the ribbon
  // continuing forever. If even one of those two corners lands INSIDE the
  // box, the band's actual flat end is partially visible — that's the cut
  // corner artifact. The previous band (width 170, top 26, right -34) was
  // long enough that its top exit cleared the box on both corners, but its
  // bottom-right exit did not (one corner landed just inside the 130x130
  // box). Lengthening the band to 260 and re-deriving the offsets pushes
  // BOTH corners of BOTH ends comfortably (30px+) past the box's edges —
  // verified by rotating each end's two corners through the 45deg
  // transform and confirming both share the same outside boundary.
  <div className="absolute top-0 right-0 z-20 pointer-events-none origin-top-right scale-[0.82] md:scale-100 overflow-hidden" style={{
    width: 130, height: 130,
    background: 'radial-gradient(circle at 100% 0%, rgba(20,15,10,0.38) 0%, rgba(20,15,10,0.22) 40%, rgba(20,15,10,0) 66%)',
  }}>
    <div className="absolute flex items-center justify-center overflow-hidden" style={{
      top: 30, right: -80, width: 260, transform: 'rotate(45deg)', willChange: 'transform',
      background: `linear-gradient(135deg, #F0D27E 0%, ${GOLD} 45%, #7a5e12 100%)`,
      padding: '6px 0',
      boxShadow: '0 3px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.35)',
    }}>
      <div className="w-full flex items-center justify-center gap-1.5 border-t border-b border-dashed" style={{ borderColor: 'rgba(255,255,255,0.5)', padding: '3.5px 0' }}>
        <span style={{ fontSize: 8 }} className="text-white/90">✦</span>
        <span className="text-white font-semibold tracking-[0.18em]" style={{ fontSize: 10.5, textShadow: '0 1px 1px rgba(0,0,0,0.25)' }}>₹{price} VALUE</span>
        <span style={{ fontSize: 8 }} className="text-white/90">✦</span>
      </div>
      {/* animated sheen sweep, for a subtle premium shine — range widened to
          match the longer band so the shine still sweeps its full length */}
      <motion.div
        className="absolute inset-y-0 pointer-events-none"
        style={{ width: 26, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)', willChange: 'transform' }}
        initial={{ x: -60 }}
        animate={{ x: 320 }}
        transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' }}
      />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// FIRECRACKER FADE BURST
// ─────────────────────────────────────────────────────────────────────────────
const FirecrackerBurst = () => {
  const particles = useMemo(() => {
    const colors = [GOLD, '#C9A227', '#D98E3F'];
    return Array.from({ length: 16 }, (_, i) => ({
      id: i, angle: (Math.PI * 2 * i) / 16 + Math.random() * 0.3,
      dist: 60 + Math.random() * 90, size: 2 + Math.random() * 3,
      color: colors[i % colors.length], delay: Math.random() * 0.4, dur: 1.2 + Math.random() * 0.6,
    }));
  }, []);
  return (
    <div className="relative w-full h-28 overflow-hidden pointer-events-none" style={{
      WebkitMaskImage: 'radial-gradient(circle at 15% 50%, black 0%, black 30%, transparent 70%)',
      maskImage: 'radial-gradient(circle at 15% 50%, black 0%, black 30%, transparent 70%)',
    }}>
      {particles.map(p => (
        <motion.span key={p.id} className="absolute rounded-full" style={{ left: '15%', top: '50%', width: p.size, height: p.size, background: p.color }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          whileInView={{ x: Math.cos(p.angle) * p.dist, y: Math.sin(p.angle) * p.dist, opacity: [0, 0.85, 0] }}
          viewport={{ once: true }} transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }} />
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CAKE — cylinder/"drum" 3D illusion, SLIDE-TO-CUT gesture (not a plain tap),
// candle fully removed on cut, wider post-cut separation with grounding shadow.
// ─────────────────────────────────────────────────────────────────────────────
const CakeSection = ({ onCut }: { onCut: () => void }) => {
  const [cut, setCut] = useState(false);
  const [dragging, setDragging] = useState(false);
  const swipeX = useMotionValue(0);
  const CUT_THRESHOLD = 58;

  const triggerCut = () => {
    if (cut) return;
    setCut(true);
    confetti({
      particleCount: 90, spread: 75, startVelocity: 42,
      origin: { x: 0.5, y: 0.55 },
      colors: [GOLD, '#D98E3F', '#8a6e15'],
    });
    setTimeout(onCut, 950);
  };

  const tierBody = 'linear-gradient(90deg, #d17e94 0%, #f0bccb 32%, #fceef2 50%, #f0bccb 68%, #d17e94 100%)';
  const tierTop  = 'radial-gradient(ellipse at 38% 28%, #ffffff 0%, #fceef2 32%, #f0bccb 68%, #dd93a6 100%)';
  const sponge   = 'repeating-linear-gradient(0deg, #f7dfa8 0px, #f7dfa8 4px, #ecc885 4px, #ecc885 8px)';

  const Tier = ({ w, bodyH, ellH, top }: { w: number; bodyH: number; ellH: number; top: number }) => (
    <>
      <div className="absolute rounded-full" style={{ left: `calc(50% - ${w / 2}px)`, top: top - ellH / 2, width: w, height: ellH, background: tierTop, boxShadow: 'inset 0 -3px 5px rgba(180,100,120,0.25)' }} />
      <div className="absolute" style={{ left: `calc(50% - ${w / 2}px)`, top, width: w, height: bodyH, background: tierBody, borderRadius: '0 0 3px 3px' }} />
    </>
  );

  return (
    <section className="py-10 md:py-14 px-6 flex flex-col items-center" style={{ background: CREAM, contentVisibility: 'auto', containIntrinsicSize: 'auto 480px' }}>
      <SectionHeader label="A Little Something" title="Cut the Cake" />

      <div className="relative select-none mt-3" style={{ width: 230, height: cut ? 182 : 230 }}>

        {/* ── Candle assembly ── */}
        <motion.div animate={{ opacity: cut ? 0 : 1, y: cut ? -14 : 0 }} transition={{ duration: 0.45 }}>
          <div className="absolute rounded-full z-20" style={{ left: 'calc(50% - 4px)', top: 13, width: 8, height: 5, background: '#fde9b0' }} />
          <div className="absolute z-20" style={{ left: 'calc(50% - 3px)', top: 16, width: 6, height: 26,
            background: 'linear-gradient(90deg,#e8bd5a,#fde9b0 45%,#e8bd5a)', borderRadius: '0 0 1px 1px' }} />
          <motion.div className="absolute rounded-full z-20" style={{ left: 'calc(50% - 6.5px)', top: -6, width: 13, height: 19,
            background: 'radial-gradient(circle at 50% 25%, #fff8d6 0%, #ffc23c 40%, #f2762c 78%, #d9491c 100%)', willChange: cut ? undefined : 'transform' }}
            animate={{ scaleY: cut ? 1 : [1, 1.16, 0.92, 1.1, 1], scaleX: cut ? 1 : [1, 0.9, 1.05, 0.95, 1] }}
            transition={{ duration: 1.1, repeat: cut ? 0 : Infinity, ease: 'easeInOut' }} />
          {!cut && (
            <div className="absolute rounded-full z-10" style={{ left: 'calc(50% - 9px)', top: 2, width: 18, height: 18,
              background: 'radial-gradient(circle, rgba(255,190,70,0.45) 0%, transparent 70%)', filter: 'blur(3px)' }} />
          )}
        </motion.div>

        {/* ── LEFT HALF ── */}
        <motion.div className="absolute inset-0 z-[6]" style={{ clipPath: 'inset(0 50% 0 0)' }}
          animate={cut ? { x: -42, rotate: -7, y: 6 } : { x: 0, rotate: 0, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <Tier w={116} bodyH={42} ellH={18} top={49} />
          <Tier w={176} bodyH={70} ellH={24} top={91} />
          {cut && <div className="absolute z-[7]" style={{ left: 'calc(50% - 3px)', top: 40, width: 6, height: 121, background: sponge }} />}
        </motion.div>

        {/* ── RIGHT HALF ── */}
        <motion.div className="absolute inset-0 z-[6]" style={{ clipPath: 'inset(0 0 0 50%)' }}
          animate={cut ? { x: 42, rotate: 7, y: 6 } : { x: 0, rotate: 0, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <Tier w={116} bodyH={42} ellH={18} top={49} />
          <Tier w={176} bodyH={70} ellH={24} top={91} />
          {cut && <div className="absolute z-[7]" style={{ left: 'calc(50% - 3px)', top: 40, width: 6, height: 121, background: sponge }} />}
        </motion.div>

        {/* Plate shadow — before the cut this is one grounding ellipse under
            the whole cake. On cut it fades out while two half-width shadows
            fade in and slide with the SAME x offset as their cake half, so
            the shadow always stays attached under the piece casting it
            instead of a static ellipse being left stranded in the middle. */}
        <motion.div className="absolute z-[1] rounded-full" style={{ left: 'calc(50% - 115px)', top: 154, width: 230, height: 14,
          background: 'radial-gradient(ellipse at center, rgba(36,28,19,0.18) 0%, rgba(36,28,19,0.05) 60%, transparent 80%)' }}
          animate={{ opacity: cut ? 0 : 1 }} transition={{ duration: 0.25 }} />
        <motion.div className="absolute z-[1] rounded-full" style={{ left: 'calc(50% - 116px)', top: 156, width: 118, height: 12,
          background: 'radial-gradient(ellipse at center, rgba(36,28,19,0.20) 0%, rgba(36,28,19,0.05) 60%, transparent 80%)' }}
          animate={cut ? { opacity: 1, x: -42 } : { opacity: 0, x: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} />
        <motion.div className="absolute z-[1] rounded-full" style={{ left: 'calc(50% - 2px)', top: 156, width: 118, height: 12,
          background: 'radial-gradient(ellipse at center, rgba(36,28,19,0.20) 0%, rgba(36,28,19,0.05) 60%, transparent 80%)' }}
          animate={cut ? { opacity: 1, x: 42 } : { opacity: 0, x: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} />

        {/* ── Swipe-on-cake gesture (replaces the separate knob/track) ──────────
             The drag target now sits directly over the cake itself — the user
             swipes their finger ACROSS the cake to cut it, instead of dragging
             a separate slider control below it.
             touchAction:'pan-y' is the key fix for "easy to scroll": it tells
             the browser to keep handling vertical page-scroll gestures natively
             while framer-motion only intercepts horizontal movement — so this
             gesture never blocks normal scrolling past the section. ────────── */}
        {!cut && (
          <motion.div
            className="absolute z-[25] cursor-grab active:cursor-grabbing rounded-2xl"
            style={{ left: 'calc(50% - 100px)', top: 30, width: 200, height: 145, x: swipeX, touchAction: 'pan-y' }}
            drag="x"
            dragConstraints={{ left: -70, right: 70 }}
            dragElastic={0.15}
            dragMomentum={false}
            dragSnapToOrigin
            onDragStart={() => setDragging(true)}
            onDrag={(_e, info) => { if (Math.abs(info.offset.x) > CUT_THRESHOLD) triggerCut(); }}
            onDragEnd={() => setDragging(false)}
          />
        )}

        {/* live "knife trace" — a dashed cut-line that follows the swipe in real time */}
        {!cut && (
          <motion.div
            className="absolute z-[26] pointer-events-none rounded-full"
            style={{ left: 'calc(50% - 1px)', top: 34, width: 2, height: 137, x: swipeX,
              background: `repeating-linear-gradient(180deg, ${GOLD} 0px, ${GOLD} 5px, transparent 5px, transparent 10px)` }}
            animate={{ opacity: dragging ? 0.85 : 0 }}
            transition={{ duration: 0.15 }}
          />
        )}

        {/* Soft pulsing invitation glow around the cake — hints "interact here" */}
        {!cut && !dragging && (
          <motion.div
            className="absolute z-[2] pointer-events-none rounded-full"
            style={{ left: 'calc(50% - 105px)', top: 25, width: 210, height: 155, background: `radial-gradient(ellipse at center, ${GOLD}12 0%, transparent 70%)`, willChange: 'opacity' }}
            animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2.2, repeat: Infinity }}
          />
        )}

        {!cut && (
          <motion.p className="absolute left-1/2 -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.25em]"
            style={{ top: 200, color: GOLD, willChange: 'opacity' }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }}>
            Swipe the cake to cut
          </motion.p>
        )}
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STATS STRIP — now placed near the END of the page (a closing recap),
// not upfront, so it never precedes the emotional content.
// ─────────────────────────────────────────────────────────────────────────────
const StatsStrip = ({ stats }: { stats: { value: number | string; label: string }[] }) => (
  <section className="w-full py-10 md:py-16" style={{ background: CREAM_PANEL, contentVisibility: 'auto', containIntrinsicSize: 'auto 200px' }}>
    <div className="px-6 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
      <SectionHeader label="This Celebration" title="In Numbers" />
      <div className="flex flex-wrap justify-center gap-x-10 md:gap-x-16 gap-y-6 md:gap-y-8">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.08 }} className="text-center">
            <p className="font-serif text-3xl md:text-5xl" style={{ color: GOLD }}>{s.value}</p>
            <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] mt-1" style={{ color: INK_SOFT }}>{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// SECRET CARD — text messages only, unlimited uniform-height masonry grid.
// (Secret Photo has its own SecretPhotoSection below with a distinct style —
// it must never share this card's look, per explicit instruction.)
// ─────────────────────────────────────────────────────────────────────────────
type SecretItem = { type: 'text'; content: string; index: number };

const SecretCard = ({ item }: { item: SecretItem }) => {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(o => !o)} className="relative cursor-pointer w-full" style={{ height: 148, perspective: 1000 }}>
      <motion.div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }} animate={{ rotateY: open ? 180 : 0 }} transition={{ duration: 0.55 }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl"
          style={{ backfaceVisibility: 'hidden', background: CARD_BG, border: `1px solid ${HAIRLINE}`, boxShadow: '0 1px 3px rgba(36,28,19,0.06)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${GOLD}14` }}>
            <Lock size={13} style={{ color: GOLD }} />
          </div>
          <span style={{ color: INK_SOFT }} className="text-[9px] uppercase tracking-widest">Message {item.index + 1}</span>
        </div>
        <div className="absolute inset-0 rounded-xl overflow-hidden flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: CREAM_PANEL, border: `1px solid ${HAIRLINE}` }}>
          <p className="italic text-xs leading-relaxed text-center p-4" style={{ color: INK, fontFamily: SERIF_FONT }}>{item.content}</p>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECRET PHOTO — its OWN section, its OWN distinct style: a large blurred/
// dimmed preview under a lock, which clears into a sharp framed photo on tap.
// Deliberately NOT a small flip-card like the text messages above.
// ─────────────────────────────────────────────────────────────────────────────
const SecretPhotoSection = ({ src }: { src: string }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <section className="w-full py-10 md:py-16" style={{ background: CREAM, contentVisibility: 'auto', containIntrinsicSize: 'auto 420px' }}>
      <div className="px-6 max-w-xs md:max-w-sm lg:max-w-md mx-auto">
        <SectionHeader label="One More Secret" title="A Hidden Photo" />
        <div
          onClick={() => setRevealed(true)}
          className="w-full mx-auto rounded-2xl overflow-hidden relative cursor-pointer"
          style={{ aspectRatio: '4/5', border: `1px solid ${HAIRLINE}`, boxShadow: '0 8px 24px rgba(36,28,19,0.14)' }}
        >
          <motion.img
            src={src} alt=""
            className="w-full h-full object-cover"
            animate={{ filter: revealed ? 'blur(0px) brightness(1)' : 'blur(18px) brightness(0.6)', scale: revealed ? 1 : 1.08 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          <AnimatePresence>
            {!revealed && (
              <motion.div
                exit={{ opacity: 0, scale: 1.3 }} transition={{ duration: 0.5 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.35)' }}
                >
                  <Lock size={22} color="#fff" />
                </motion.div>
                <span className="text-white text-[11px] uppercase tracking-[0.25em]" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                  Tap to Reveal
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LOVE LETTER — realistic closed/sealed → tap-to-open → unfold interaction.
// Cursive Google Font ('Dancing Script') for the salutation/signature lines
// only — body paragraphs stay in a highly-readable elegant serif italic
// ('Cormorant Garamond') with proper first-line indent and generous spacing,
// exactly how real letter typography mixes script accents with readable body
// text. Safe to load external fonts here: THIS section is never captured via
// html-to-image. (The page as a whole now does use html-to-image narrowly,
// for the "Pass It On" share card only — see handleShare — with its own
// document.fonts.ready wait + base64 QR fix, so that capture's font/CORS
// risk is handled locally and doesn't affect the Love Letter.)
// ─────────────────────────────────────────────────────────────────────────────
const LoveLetterSection = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);
  const paragraphs = text.split('\n').filter(p => p.trim());

  return (
    <section className="w-full py-10 md:py-16" style={{ background: CREAM, contentVisibility: 'auto', containIntrinsicSize: 'auto 420px' }}>
      <div className="px-6 max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
        <SectionHeader label="From The Heart" title="A Little Letter" />

        <div style={{ perspective: 1200 }} className="w-full">
        <AnimatePresence mode="wait">
          {!open ? (
            /* ── CLOSED / SEALED STATE ────────────────────────────────────── */
            <motion.div
              key="closed"
              exit={{ opacity: 0, scale: 0.92, rotateX: -18 }}
              transition={{ duration: 0.5 }}
              onClick={() => setOpen(true)}
              className="mx-auto cursor-pointer relative rounded-sm"
              style={{
                width: '78%', maxWidth: 360, aspectRatio: '5/6',
                background: 'linear-gradient(155deg, #FFFDF7 0%, #F7F1E4 100%)',
                border: `1px solid ${HAIRLINE}`,
                boxShadow: '0 14px 34px rgba(36,28,19,0.16)',
              }}
            >
              {/* fold creases */}
              <div className="absolute left-0 right-0 top-1/2" style={{ height: 1, background: HAIRLINE }} />
              <div className="absolute top-0 bottom-0 left-1/2" style={{ width: 1, background: HAIRLINE }} />
              {/* wax seal, centred */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
                style={{ width: 52, height: 52, background: `radial-gradient(circle at 35% 30%, ${GOLD}, #8a6e15)`, boxShadow: '0 4px 10px rgba(36,28,19,0.35)' }}>
                <Heart size={18} className="text-white" fill="white" />
              </div>
              <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1.5">
                <Mail size={14} style={{ color: GOLD_SOFT }} />
                <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: INK_SOFT }}>Tap to Open</span>
              </div>
            </motion.div>
          ) : (
            /* ── OPEN / UNFOLDED STATE ────────────────────────────────────── */
            <motion.div
              key="open"
              initial={{ opacity: 0, rotateX: 90, scale: 0.95 }}
              animate={{ opacity: 1, rotateX: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="rounded-sm p-7 md:p-12 lg:p-16 relative"
              style={{ background: '#FFFDF7', border: `1px solid ${HAIRLINE}`, boxShadow: '0 10px 30px rgba(36,28,19,0.12)', transformOrigin: 'top center' }}
            >
              <div className="w-10 h-10 rounded-full mx-auto -mt-14 mb-5 flex items-center justify-center relative z-10"
                style={{ background: `radial-gradient(circle at 35% 30%, ${GOLD}, #8a6e15)`, boxShadow: '0 3px 8px rgba(36,28,19,0.3)' }}>
                <Heart size={14} className="text-white" fill="white" />
              </div>

              <p className="text-center text-xl md:text-2xl mb-7" style={{ color: GOLD, fontFamily: SCRIPT_FONT }}>
                With all my heart,
              </p>

              <div className="space-y-6 relative z-10">
                {paragraphs.map((para, i) => (
                  <p key={i} className="text-[17px] md:text-lg lg:text-xl leading-loose" style={{
                    color: INK, fontFamily: SERIF_FONT, fontStyle: 'italic',
                    textIndent: '1.6em',
                  }}>
                    {para}
                  </p>
                ))}
              </div>

              <p className="text-right text-2xl md:text-3xl mt-8" style={{ color: GOLD, fontFamily: SCRIPT_FONT }}>
                — Always
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SKY SHOT FIREWORKS — full-viewport overlay, canvas-based. Each shot fades in
// from the bottom, rises, and cracks into a burst. On mount, a quick opening
// volley of 2-3 shots fires, then the pace tapers off until it stops
// automatically. After that (or any time), double-tapping anywhere on the
// screen launches one more shot that cracks exactly at the tap point. The
// canvas itself is pointer-events:none so it never blocks the page underneath
// — taps are read from the window, not the canvas.
// ─────────────────────────────────────────────────────────────────────────────
const SkyShotFireworks = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', resize);

    const COLORS = ['#FFD966', '#FF6B5B', '#4FD1C5', '#F06292', '#C9A227', '#5FA8FF', '#FFFFFF'];

    type Rocket = { x: number; y0: number; targetY: number; born: number; color: string; trail: { x: number; y: number }[] };
    type Particle = { x: number; y: number; vx: number; vy: number; color: string; life: number; maxLife: number; size: number };
    type Halo = { x: number; y: number; born: number; maxLife: number; radius: number };

    let rockets: Rocket[] = [];
    let particles: Particle[] = [];
    let halos: Halo[] = [];

    const launchRocket = (x: number, targetY: number) => {
      rockets.push({ x, y0: height + 12, targetY, born: performance.now(), color: COLORS[Math.floor(Math.random() * COLORS.length)], trail: [] });
      ensureLoopRunning();
    };

    // A soft dark backdrop patch behind every burst — real fireworks pop
    // against a dark night sky; without something like this, bright dots
    // drawn straight onto a light cream page read as pale and washed out.
    // This fades in fast with the burst and fades out with the particles.
    const explode = (x: number, y: number, color: string) => {
      halos.push({ x, y, born: performance.now(), maxLife: 950, radius: 78 + Math.random() * 24 });
      const count = 42 + Math.floor(Math.random() * 20);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.25;
        const speed = 1.6 + Math.random() * 3.3;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color, life: 0, maxLife: 52 + Math.random() * 32, size: 1.6 + Math.random() * 1.9 });
      }
    };

    // PERFORMANCE — this loop used to call requestAnimationFrame(tick)
    // unconditionally forever, so the canvas kept clearing + iterating
    // every single frame for as long as someone stayed on the page, long
    // after every firework had finished — pure main-thread overhead
    // competing with scroll on every frame, worst of all right at the
    // start when the opening volley overlaps with the visitor's very
    // first scroll. It also re-applied ctx.shadowBlur (one of canvas's
    // most expensive operations) to every trail dot AND every burst
    // particle, every frame — with several overlapping bursts that's
    // 100+ blurred fills per frame. Two fixes below: the loop now stops
    // itself once nothing's left to draw (ensureLoopRunning restarts it
    // on the next launch), and shadowBlur is now used only on the single
    // rocket head dot — particles rely on the existing 'lighter' additive
    // blend for their glow instead, which reads almost identically but is
    // far cheaper to draw at volume.
    let raf = 0;
    let loopActive = false;
    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      // halos — drawn first, underneath everything else
      halos = halos.filter(h => {
        const age = performance.now() - h.born;
        if (age >= h.maxLife) return false;
        const fadeIn = Math.min(1, age / 140);
        const fadeOut = 1 - Math.max(0, (age - h.maxLife * 0.3) / (h.maxLife * 0.7));
        const alpha = Math.min(fadeIn, fadeOut) * 0.36;
        const grad = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.radius);
        grad.addColorStop(0, `rgba(12,10,24,${alpha})`);
        grad.addColorStop(1, 'rgba(12,10,24,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      // rockets — glowing head with a fading trail (shadowBlur reserved
      // for the single head dot only — the trail reads as motion via its
      // own fading alpha and doesn't need its own blur pass per dot)
      rockets = rockets.filter(r => {
        const age = (performance.now() - r.born) / 1000;
        const progress = Math.min(1, age / 1.05);
        const eased = 1 - Math.pow(1 - progress, 2);
        const y = r.y0 + (r.targetY - r.y0) * eased;
        r.trail.push({ x: r.x, y });
        if (r.trail.length > 10) r.trail.shift();

        const fadeIn = Math.min(1, age / 0.25);
        ctx.save();
        for (let i = 0; i < r.trail.length; i++) {
          const t = r.trail[i];
          ctx.globalAlpha = fadeIn * (i / r.trail.length) * 0.7;
          ctx.beginPath();
          ctx.fillStyle = r.color;
          ctx.arc(t.x, t.y, 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = fadeIn;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.fillStyle = '#FFFFFF';
        ctx.arc(r.x, y, 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (progress >= 1) {
          explode(r.x, r.targetY, r.color);
          return false;
        }
        return true;
      });

      // particles — additive glow so the colors stay vivid on any
      // background; 'lighter' compositing alone gives the glow at
      // overlaps, no per-particle shadowBlur needed
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      particles = particles.filter(p => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.045;
        p.vx *= 0.985;
        const t = p.life / p.maxLife;
        if (t >= 1) return false;
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - t * 0.35), 0, Math.PI * 2);
        ctx.fill();
        return true;
      });
      ctx.restore();
      ctx.globalAlpha = 1;

      if (rockets.length || particles.length || halos.length) {
        raf = requestAnimationFrame(tick);
      } else {
        loopActive = false;
      }
    };

    const ensureLoopRunning = () => {
      if (!loopActive) {
        loopActive = true;
        raf = requestAnimationFrame(tick);
      }
    };

    // ── opening volley: 2-3 shots in quick succession, then tapering off, then stop ──
    let autoTimer: ReturnType<typeof setTimeout>;
    let shotCount = 0;
    const MAX_AUTO_SHOTS = 7;
    const scheduleNext = (delay: number) => {
      autoTimer = setTimeout(() => {
        shotCount++;
        const x = width * (0.2 + Math.random() * 0.6);
        const targetY = height * (0.14 + Math.random() * 0.16);
        launchRocket(x, targetY);
        if (shotCount < MAX_AUTO_SHOTS) {
          const nextDelay = shotCount <= 2 ? 550 + Math.random() * 250 : delay * 1.7;
          scheduleNext(nextDelay);
        }
      }, delay);
    };
    scheduleNext(400);

    // ── triple-tap/click anywhere → one manual shot cracking at that point ──
    // Was a double-tap before, but a plain double-tap fires far too easily
    // during normal scrolling (two quick taps that were never meant as a
    // gesture), which was launching unwanted rockets and causing jank while
    // scrolling. Requiring three taps in the window makes it a deliberate
    // gesture, and taps that turn out to be a scroll/swipe (finger actually
    // moved) are discarded entirely rather than counted.
    const TAP_WINDOW = 500;
    const MOVE_TOLERANCE = 10;
    let tapTimes: number[] = [];
    let touchStart: { x: number; y: number } | null = null;
    let touchMoved = false;

    const registerTap = (x: number, y: number) => {
      const now = performance.now();
      tapTimes = tapTimes.filter(t => now - t < TAP_WINDOW);
      tapTimes.push(now);
      if (tapTimes.length >= 3) {
        launchRocket(x, y);
        tapTimes = [];
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) { touchStart = { x: t.clientX, y: t.clientY }; touchMoved = false; }
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t || !touchStart) return;
      if (Math.hypot(t.clientX - touchStart.x, t.clientY - touchStart.y) > MOVE_TOLERANCE) touchMoved = true;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchMoved) return; // this was a scroll/swipe, not a tap
      const t = e.changedTouches[0];
      if (t) registerTap(t.clientX, t.clientY);
    };
    const onClick = (e: MouseEvent) => registerTap(e.clientX, e.clientY);

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('click', onClick, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(autoTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('click', onClick);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[45] pointer-events-none" style={{ transform: 'translateZ(0)', willChange: 'transform' }} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// FAVORITE SONG — a YouTube URL the creator provides is embedded as a
// professional, lag-free player: YouTube's own control bar is hidden
// (controls=0) and the video surface is pointer-events:none, so a visitor can
// never reach YouTube's UI, related videos, or navigate away. All playback
// goes through the small custom control bar underneath, built on the YouTube
// IFrame API. loop=1 + playlist=<sameId> makes the single video repeat
// indefinitely; onStateChange also force-replays on ENDED as a safety net.
// ─────────────────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function parseTimestampSeconds(ts?: string): number {
  if (!ts) return 0;
  const clean = String(ts).trim().toLowerCase().replace('s', '');
  if (clean.includes(':')) {
    const parts = clean.split(':');
    const mins = parseFloat(parts[0]) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return mins * 60 + secs;
  }
  return parseFloat(clean) || 0;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

const FavoriteSongSection = ({ url, startTimestamp, isPageVisible, externalPlayerRef, ytLoadedRef }: { url?: string; startTimestamp?: string; isPageVisible?: boolean; externalPlayerRef?: React.MutableRefObject<any>; ytLoadedRef?: React.MutableRefObject<boolean> }) => {
  const videoId = useMemo(() => extractYouTubeId(url || ''), [url]);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const soughtOnceRef = useRef<boolean>(false);
  const internalYtLoadedRef = useRef<boolean>(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(false);
  const [playerError, setPlayerError] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    setPlayerError(false);
    soughtOnceRef.current = false;
    let cancelled = false;
    let instance: any = null;

    const startSecs = parseTimestampSeconds(startTimestamp);

    const createPlayer = () => {
      if (cancelled || !containerRef.current || !window.YT?.Player) return;
      instance = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1, controls: 1, modestbranding: 1, rel: 0,
          iv_load_policy: 3, disablekb: 0, fs: 1, playsinline: 1,
          enablejsapi: 1, loop: 1, playlist: videoId,
          ...(startSecs > 0 ? { start: Math.floor(startSecs) } : {})
        },
        events: {
          onReady: (e: any) => {
            if (cancelled) { try { e.target.destroy(); } catch {} return; }
            playerRef.current = e.target;
            if (externalPlayerRef) externalPlayerRef.current = e.target;
            try { e.target.setVolume(volume); } catch {}
            setReady(true);
            internalYtLoadedRef.current = true;
            if (ytLoadedRef) ytLoadedRef.current = true;

            // Seek to exact timestamp ONCE if specified
            if (startSecs > 0 && !soughtOnceRef.current) {
              try {
                e.target.seekTo(startSecs, true);
                soughtOnceRef.current = true;
              } catch {}
            }

            // Attempt immediate playback if page is already visible
            if (isPageVisible) {
              try {
                e.target.unMute();
                e.target.setVolume(volume || 70);
                e.target.playVideo();
              } catch (err) {
                console.warn('Unmuted autoplay onReady failed, attempting muted autoplay:', err);
                try {
                  e.target.mute();
                  e.target.playVideo();
                  setMuted(true);
                } catch {}
              }
            } else {
              // Pre-buffer frame at startSecs while waiting for page visibility
              try {
                e.target.mute();
                e.target.playVideo();
                setTimeout(() => {
                  try { e.target.pauseVideo(); } catch {}
                }, 300);
              } catch {}
            }

            // Global one-time listener to ensure sound unmutes on any user interaction
            const unmuteOnUserGesture = () => {
              try {
                if (playerRef.current) {
                  playerRef.current.unMute();
                  playerRef.current.setVolume(volume || 70);
                  setMuted(false);
                }
              } catch {}
              window.removeEventListener('click', unmuteOnUserGesture);
              window.removeEventListener('touchstart', unmuteOnUserGesture);
              window.removeEventListener('scroll', unmuteOnUserGesture);
            };

            window.addEventListener('click', unmuteOnUserGesture, { once: true });
            window.addEventListener('touchstart', unmuteOnUserGesture, { once: true });
            window.addEventListener('scroll', unmuteOnUserGesture, { once: true });
          },
          onStateChange: (e: any) => {
            if (cancelled) return;
            if (e.data === window.YT.PlayerState.PLAYING) setPlaying(true);
            if (e.data === window.YT.PlayerState.PAUSED) setPlaying(false);
            if (e.data === window.YT.PlayerState.ENDED) { try { e.target.playVideo(); } catch {} }
            if (e.data === 1 || e.data === 2 || e.data === 3 || e.data === 5) {
              internalYtLoadedRef.current = true;
              if (ytLoadedRef) ytLoadedRef.current = true;
            }
          },
          onError: () => {
            if (cancelled) return;
            setPlayerError(true);
          },
        },
      });
    };

    // Stall safety net: if neither onReady nor onError has fired within 8s
    // (script blocked by an ad-blocker, flaky network, etc.) surface the
    // same fallback rather than spinning forever with no way out.
    const stallTimer = setTimeout(() => {
      if (!cancelled) setPlayerError(prev => prev || !playerRef.current);
    }, 8000);

    let checkInterval: any = null;

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const existing = document.getElementById('youtube-iframe-api');
      if (!existing) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.onerror = () => { if (!cancelled) setPlayerError(true); };
        document.body.appendChild(tag);
      }
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prevReady?.(); createPlayer(); };
      checkInterval = setInterval(() => {
        if (cancelled) return;
        if (ytLoadedRef.current || (playerRef.current && playerRef.current.getPlayerState?.() !== -1)) {
          ytLoadedRef.current = true;
          if (checkInterval) clearInterval(checkInterval);
          return;
        }
        if (window.YT?.Player) {
          createPlayer();
        }
      }, 150);
    }

    return () => {
      cancelled = true;
      if (checkInterval) clearInterval(checkInterval);
      clearTimeout(stallTimer);
      setReady(false);
      if (playerRef.current === instance) playerRef.current = null;
      try { instance?.destroy?.(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Playback request loop when page becomes visible
  useEffect(() => {
    if (isPageVisible) {
      const startSecs = parseTimestampSeconds(startTimestamp);
      let attempts = 0;
      const retryTimer = setInterval(() => {
        attempts++;
        if (playerRef.current) {
          try {
            const state = playerRef.current.getPlayerState?.();
            // 1 = PLAYING, 3 = BUFFERING. If playing or buffering, DO NOT disrupt playback or seek!
            if (state === 1 || state === 3) {
              setPlaying(true);
              setMuted(false);
              clearInterval(retryTimer);
              return;
            }
            playerRef.current.unMute?.();
            playerRef.current.setVolume?.(volume || 70);
            if (startSecs > 0 && !soughtOnceRef.current) {
              playerRef.current.seekTo(startSecs, true);
              soughtOnceRef.current = true;
            }
            playerRef.current.playVideo();
          } catch (err) {
            console.warn('YouTube retry play error:', err);
          }
        }
        if (attempts >= 15) {
          clearInterval(retryTimer);
        }
      }, 250);

      return () => clearInterval(retryTimer);
    }
  }, [isPageVisible, ready, startTimestamp, volume]);

  // Guarded with `ready` (not just a null-check on playerRef.current) because
  // the YT.Player instance is only assigned once onReady has genuinely
  // fired — tapping the controls before that threw "playVideo is not a
  // function". Each call is additionally wrapped in try/catch as a last
  // line of defense so a stray timing edge case can never surface as a
  // crash overlay — it just silently no-ops.
  const togglePlay = () => {
    if (!ready || !playerRef.current) return;
    try {
      if (playing) playerRef.current.pauseVideo();
      else playerRef.current.playVideo();
    } catch {}
  };

  const toggleMute = () => {
    if (!ready || !playerRef.current) return;
    try {
      if (muted) { playerRef.current.unMute(); playerRef.current.setVolume(volume || 70); setMuted(false); }
      else { playerRef.current.mute(); setMuted(true); }
    } catch {}
  };

  const onVolumeChange = (v: number) => {
    setVolume(v);
    if (!ready || !playerRef.current) return;
    try {
      playerRef.current.setVolume(v);
      if (v === 0) { playerRef.current.mute(); setMuted(true); }
      else if (muted) { playerRef.current.unMute(); setMuted(false); }
    } catch {}
  };

  if (!videoId) return null;

  return (
    <section className="py-10 md:py-16 px-6 flex flex-col items-center" style={{ background: CREAM_PANEL, contentVisibility: 'auto', containIntrinsicSize: 'auto 400px' }}>
      <SectionHeader label="Our Song" title="A Little Music" />
      <div className="w-full max-w-sm md:max-w-md lg:max-w-lg rounded-2xl overflow-hidden relative"
        style={{ border: `1px solid ${HAIRLINE}`, boxShadow: '0 8px 24px rgba(36,28,19,0.12)', background: CARD_BG }}>
        <div className="relative w-full aspect-video overflow-hidden" style={{ pointerEvents: playerError ? 'auto' : 'none' }}>
          <div ref={containerRef} className="absolute inset-0 w-full h-full" />
          {!ready && !playerError && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: INK_DARK }}>
              <div className="w-6 h-6 rounded-full border-2 border-[#d4af37]/50 border-t-[#d4af37] animate-spin" />
            </div>
          )}
          {playerError && (
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6"
              style={{ background: INK_DARK }}>
              <Play size={18} className="text-[#d4af37]" />
              <span className="text-white/80 text-[11px] leading-relaxed">
                This video can't be played here.<br />Tap to open it on YouTube.
              </span>
            </a>
          )}
        </div>
        <div className="flex items-center gap-3 px-4 py-3" style={{ opacity: ready && !playerError ? 1 : 0.45 }}>
          <button onClick={togglePlay} disabled={!ready || playerError} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white disabled:cursor-not-allowed" style={{ background: GOLD }}>
            {playing ? <Pause size={15} fill="white" /> : <Play size={15} fill="white" />}
          </button>
          <button onClick={toggleMute} disabled={!ready || playerError} className="flex-shrink-0 disabled:cursor-not-allowed" style={{ color: INK_SOFT }}>
            {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range" min={0} max={100} value={muted ? 0 : volume}
            onChange={e => onVolumeChange(Number(e.target.value))}
            disabled={!ready || playerError}
            className="flex-1 accent-[#A9821F] disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VALUE STAGE — DIGIT REEL — one odometer-style reel per digit of the price.
// Each reel spins through random digits while unlocked, then locks onto its
// real digit in sequence (left to right, like balls settling in a real
// draw) rather than all snapping into place at once.
// ─────────────────────────────────────────────────────────────────────────────
const DigitReel = ({ digit, locked }: { digit: string; locked: boolean }) => {
  const [display, setDisplay] = useState(digit);

  useEffect(() => {
    if (locked) { setDisplay(digit); return; }
    // Slowed from 90ms so each spinning digit is actually legible mid-draw,
    // instead of blurring into an unreadable flicker.
    const id = setInterval(() => setDisplay(String(Math.floor(Math.random() * 10))), 140);
    return () => clearInterval(id);
  }, [locked, digit]);

  return (
    <motion.div
      className="relative overflow-hidden flex items-center justify-center rounded-md"
      style={{ width: '0.75em', height: '1.2em', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.28)' }}
      animate={locked ? { scale: [1, 1.16, 1] } : {}}
      transition={{ duration: 0.35 }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={display + (locked ? '-locked' : '-spin')}
          initial={{ y: locked ? -16 : 0, opacity: locked ? 0 : 1 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ duration: locked ? 0.3 : 0.05 }}
          className="absolute font-serif text-white"
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
};

export default function PremiumWebPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [stage, setStage] = useState<'ENVELOPE' | 'INTRO' | 'VALUE' | 'PAGE'>('ENVELOPE');
  const [introIndex, setIntroIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytLoadedRef = useRef<boolean>(false);

  const playAudioWithFadeIn = useCallback(() => {
    const songUrl = data?.youtubeMusicUrl || data?.music;
    const videoId = extractYouTubeId(songUrl || '');
    if (videoId) {
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
      }
      return;
    }
    if (!audioRef.current || !data?.music || muted) return;

    const timestampSecs = parseTimestampSeconds(data?.webAudioStartTimestamp || data?.storyAudioStartTimestamp);
    if (timestampSecs > 0 && Math.abs(audioRef.current.currentTime - timestampSecs) > 1 && audioRef.current.paused) {
      try {
        audioRef.current.currentTime = timestampSecs;
      } catch (err) {
        console.warn('Could not set currentTime on audio element:', err);
      }
    }

    const fadeDuration = 2000; // 2-second fade-in effect for Premium page
    const targetVol = 0.7;

    audioRef.current.volume = 0;
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        const startTime = Date.now();
        const fadeInterval = setInterval(() => {
          if (!audioRef.current) {
            clearInterval(fadeInterval);
            return;
          }
          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / fadeDuration);
          const easedProgress = progress * progress;
          audioRef.current.volume = easedProgress * targetVol;
          if (progress >= 1) {
            clearInterval(fadeInterval);
          }
        }, 50);
      }).catch((err) => {
        console.warn('Audio play blocked or waiting for user interaction:', err);
      });
    }
  }, [data, muted]);

  // Automatically start audio with 2-second fade-in when entering INTRO slideshow or PAGE
  useEffect(() => {
    if (!data?.music) return;
    if ((stage === 'INTRO' || stage === 'PAGE') && audioRef.current?.paused) {
      playAudioWithFadeIn();
    }
  }, [stage, data, playAudioWithFadeIn]);

  const [answers, setAnswers] = useState<Record<number, 'YES' | 'NO'>>({});
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // Manual swipe state for the lightbox (replaces framer-motion's `drag`
  // gesture — see handleLightboxTouch* below for why).
  const [lightboxDragX, setLightboxDragX] = useState(0);
  const lightboxTouchStart = useRef<{ x: number; y: number } | null>(null);
  const lightboxIsSwiping = useRef(false);

  // Value stage: lottery-draw digit-reel state
  const [digitsLocked, setDigitsLocked] = useState<boolean[]>([]);
  const [allDigitsLocked, setAllDigitsLocked] = useState(false);

  const wishesRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const lightboxWasOpenRef = useRef(false);
  const hasSavedToLeaderboard = useRef(false);
  const [emailStatus, setEmailStatus] = useState<'IDLE' | 'SUCCESS' | 'FAILED' | 'SENDING'>('IDLE');
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(null);
  const [loadingStory, setLoadingStory] = useState(true);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const [preloadingProgress, setPreloadingProgress] = useState(0);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Share URL + QR source don't depend on `data`, so they're computed here
  // (rather than after the `if (!data)` early return further down) — the
  // base64-conversion effect right below needs qrImageUrl, and hooks can't
  // follow a conditional return.
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareUrl)}&color=241C13&bgcolor=FFFFFF`;

  // Pre-convert the QR to a base64 data URI, same fix already used in the
  // poster generator for the same root cause: html-to-image has to read the
  // <img>'s pixels onto a canvas to capture the invitation card, and
  // qrserver.com doesn't send the CORS headers that would allow that read —
  // so without this, capturing the card in handleShare below throws a
  // tainted-canvas error and the capture silently fails. A data: URI has no
  // cross-origin, so swapping the <img> src to it removes the problem
  // entirely rather than working around it.
  const [qrDataUri, setQrDataUri] = useState<string | null>(null);
  useEffect(() => {
    if (!shareUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(qrImageUrl);
        const blob = await resp.blob();
        const reader = new FileReader();
        reader.onload = () => { if (!cancelled) setQrDataUri(reader.result as string); };
        reader.readAsDataURL(blob);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [qrImageUrl, shareUrl]);

  // Fixes a reported stuck-scroll bug (and the "scroll and swipe feel like
  // they're overlapping" confusion): previously the background page was
  // NEVER actually locked while the lightbox was open, so a vertical swipe
  // that started on the fullscreen photo could still bleed through to the
  // page's own overflow-y-auto container underneath — the two gestures
  // (page scroll vs. photo swipe) were genuinely fighting over the same
  // touch at the same time. Now, the moment the lightbox opens we freeze
  // scrollContainerRef in place (remembering the exact scrollTop) so only
  // the lightbox can respond to touches. On close we restore overflow +
  // scrollTop, then still do the double-rAF toggle/nudge dance as a
  // second-layer safety net for a known WebKit/iOS quirk where a nested
  // touch-drag gesture can leave the ancestor scroll container "frozen"
  // even after being unlocked and the gesture's element has unmounted.
  const scrollLockYRef = useRef(0);
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Pulled into its own function so it can ALSO be called from the
    // pagehide safety net below — covering the case where downloading a
    // photo hands control to the OS's native "save file" UI mid-touch,
    // which can swallow the touchend/pointerup the browser would normally
    // fire, so React is never told the gesture actually finished. Without
    // this, the lock could in theory survive even after the lightbox
    // itself has closed.
    const unlock = () => {
      if (!lightboxWasOpenRef.current) return;
      lightboxWasOpenRef.current = false;
      const y = scrollLockYRef.current;
      el.style.overflowY = '';
      el.style.touchAction = '';
      el.style.overscrollBehavior = '';
      el.scrollTop = y;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollTop = y + 1;
          el.scrollTop = y;
        });
      });
    };

    if (lightboxIndex !== null) {
      lightboxWasOpenRef.current = true;
      scrollLockYRef.current = el.scrollTop;
      el.style.overflowY = 'hidden';
      el.style.touchAction = 'none';
      el.style.overscrollBehavior = 'none';

      window.addEventListener('pagehide', unlock);
      return () => window.removeEventListener('pagehide', unlock);
    }

    unlock();
  }, [lightboxIndex]);

  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined') return;

      const params = new URLSearchParams(window.location.search);
      const urlStoryId = params.get('pageId') || params.get('storyId');
      const localStoryId = localStorage.getItem('premiumStoryId');

      const toDataUri = async (src: string): Promise<string> => {
        if (!src?.startsWith('blob:')) return src;
        try {
          const resp = await fetch(src);
          const blob = await resp.blob();
          return await new Promise<string>(res => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result as string);
            reader.onerror = () => res(src);
            reader.readAsDataURL(blob);
          });
        } catch { return src; }
      };

      const processBlobUrls = async (parsed: any) => {
        if (parsed.heroImage?.startsWith('blob:')) parsed.heroImage = await toDataUri(parsed.heroImage);
        if (parsed.secretImage?.startsWith('blob:')) parsed.secretImage = await toDataUri(parsed.secretImage);
        if (parsed.music?.startsWith('blob:')) parsed.music = await toDataUri(parsed.music);
        if (parsed.creatorPhoto?.startsWith('blob:')) parsed.creatorPhoto = await toDataUri(parsed.creatorPhoto);
        if (Array.isArray(parsed.galleryPhotos) && parsed.galleryPhotos.some((p: string) => p?.startsWith('blob:'))) {
          parsed.galleryPhotos = await Promise.all(parsed.galleryPhotos.map(toDataUri));
        }
        return parsed;
      };

      // If storyId is in the URL:
      if (urlStoryId) {
        try {
          let loadedData: any = null;
          let storyEmail = '';

          // Check if local creator data matches this storyId (to preserve fresh user content)
          let localCreatorData: any = null;
          const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('celebrationData') : null;
          if (savedLocal) {
            try {
              const parsedLocal = JSON.parse(savedLocal);
              const localStoryId = localStorage.getItem('premiumStoryId');
              if (parsedLocal && (parsedLocal.storyId === urlStoryId || localStoryId === urlStoryId)) {
                localCreatorData = parsedLocal;
              }
            } catch (e) {
              console.error('Error parsing local celebrationData:', e);
            }
          }

          // Tier 1: Fetch from leaderboard API (premium users)
          try {
            const res = await fetch(`/api/leaderboard?storyId=${urlStoryId}`);
            const result = await res.json();
            if (result.success && result.celebrationData) {
              const remoteData = result.celebrationData;
              // If local creator data exists and has rich user content, merge remote server refs into local data
              if (localCreatorData) {
                loadedData = { ...remoteData, ...localCreatorData };
              } else {
                loadedData = remoteData;
              }
              if (result.email) storyEmail = result.email;
            }
          } catch (e) {
            console.error('Leaderboard API fetch error:', e);
          }

          // Tier 2: Fetch from free-story API if not found in leaderboard
          if (!loadedData) {
            try {
              const freeRes = await fetch(`/api/free-story?storyId=${urlStoryId}`);
              const freeJson = await freeRes.json();
              if (freeJson.success && freeJson.story?.celebrationData) {
                const freeData = freeJson.story.celebrationData;
                if (localCreatorData) {
                  loadedData = { ...freeData, ...localCreatorData };
                } else {
                  loadedData = freeData;
                }
                if (freeJson.story.email) storyEmail = freeJson.story.email;
              }
            } catch (e) {
              console.error('Free story API fetch error:', e);
            }
          }

          // Tier 3: Local storage fallback for creator view
          if (!loadedData && localCreatorData) {
            loadedData = localCreatorData;
            if (!loadedData.storyId) loadedData.storyId = urlStoryId;
          }

          if (loadedData) {
            let parsed = await processBlobUrls(loadedData);
            if (storyEmail) {
              parsed.premiumEmail = storyEmail;
            }
            setData(parsed);
          } else {
            setAccessError('Celebration page not found');
          }
        } catch (err: any) {
          console.error('Error fetching celebration page:', err);
          setAccessError('Failed to load celebration page.');
        } finally {
          setLoadingStory(false);
        }
      } else {
        // No storyId in URL: fall back to local storage (creator view)
        const saved = localStorage.getItem('celebrationData');
        if (saved) {
          try {
            let parsed = JSON.parse(saved);
            parsed = await processBlobUrls(parsed);
            setData(parsed);
          } catch {
            setAccessError('Failed to load celebration data.');
          }
        } else {
          setAccessError('No celebration found.');
        }
        setLoadingStory(false);
      }
    })();
  }, []);

  useEffect(() => {
    const isPremiumMode = data && (data.mode === 'PREMIUM' || data.isPremium || Boolean(data.premiumEmail));
    if (!isPremiumMode || hasSavedToLeaderboard.current) return;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlStoryId = params.get('pageId') || params.get('storyId');
      const localStoryId = localStorage.getItem('premiumStoryId');

      if (urlStoryId && localStoryId !== urlStoryId) {
        // Visitors should never trigger leaderboard saves or emails!
        return;
      }
    }

    hasSavedToLeaderboard.current = true;
    const displayName = data.creatorName || data.names || data.occasionName || 'Premium User';
    const amount = Number(data.premiumPrice) || 99;
    
    let storyId = data.storyId || localStorage.getItem('premiumStoryId');
    if (!storyId) {
      storyId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      localStorage.setItem('premiumStoryId', storyId);
    } else {
      localStorage.setItem('premiumStoryId', storyId);
    }

    const isPublic = data.premiumPrivacy !== 'PRIVATE';
    const email = data.premiumEmail || '';
    const paymentId = data.paymentId || (typeof window !== 'undefined' ? localStorage.getItem('premium_payment_id') : '') || '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const storyUrl = `${origin}/celebrate/premium?pageId=${storyId}`;

    if (email) {
      setEmailStatus('SENDING');
    }

    fetch('/api/leaderboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: displayName,
        amount: amount,
        storyId: storyId,
        isPublic: isPublic,
        email: email,
        paymentId: paymentId,
        storyUrl: storyUrl,
        celebrationData: data
      })
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          console.log('Successfully saved user to leaderboard:', res.user);
          if (email) {
            if (res.emailSent) {
              setEmailStatus('SUCCESS');
            } else {
              setEmailStatus('FAILED');
              setEmailErrorMessage(res.emailError || 'Failed to deliver confirmation email.');
            }
          }
        } else {
          console.error('Failed to save user to leaderboard:', res.error);
          if (email) {
            setEmailStatus('FAILED');
            setEmailErrorMessage(res.error || 'Failed to register and send email.');
          }
        }
      })
      .catch(err => {
        console.error('Error saving user to leaderboard:', err);
        if (email) {
          setEmailStatus('FAILED');
          setEmailErrorMessage(err.message || 'Network error occurred during registration.');
        }
      });
  }, [data]);

  // Wishes — used both by the INTRO slideshow and the Love Letter section
  const wishes: string[] = useMemo(() => {
    if (!data) return [DEFAULT_WISH];
    const raw: string[] = Array.isArray(data.wishesTexts) ? data.wishesTexts : (data.wishesText ? [data.wishesText] : []);
    const filled = raw.map((w: string) => w?.trim()).filter(Boolean);
    return filled.length > 0 ? filled : [DEFAULT_WISH];
  }, [data]);

  // INTRO slideshow now plays the creator's OWN wishes (falls back to generic
  // lines only if no wishes were written at all)
  const introLines = useMemo(() => {
    if (!data) return DEFAULT_INTRO_LINES;
    const raw: string[] = Array.isArray(data.wishesTexts) ? data.wishesTexts : (data.wishesText ? [data.wishesText] : []);
    const filled = raw.map((w: string) => w?.trim()).filter(Boolean);
    return filled.length > 0 ? filled : DEFAULT_INTRO_LINES;
  }, [data]);

  useEffect(() => {
    if (stage === 'INTRO' && !isPaused) {
      const timer = setTimeout(() => {
        if (introIndex < introLines.length - 1) setIntroIndex(p => p + 1);
        else setStage('VALUE');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [stage, introIndex, isPaused, introLines.length]);

  // VALUE stage: each digit spins like a draw reel, then locks in sequence
  // right-to-left (ones place -> tens place -> hundreds place),
  // creating suspense before auto-advancing to the page once every digit has settled.
  useEffect(() => {
    if (stage !== 'VALUE' || !data) return;
    const target = String(Math.max(1, Number(data.premiumPrice) || 99));
    setDigitsLocked(new Array(target.length).fill(false));
    setAllDigitsLocked(false);

    const timers: ReturnType<typeof setTimeout>[] = [];
    let maxDelay = 0;
    target.split('').forEach((_, i) => {
      // Reveal right-to-left: step 0 is ones place (rightmost index), step 1 is tens, etc.
      const step = target.length - 1 - i;
      const delay = 1000 + step * 900 + Math.random() * 200;
      maxDelay = Math.max(maxDelay, delay);
      timers.push(setTimeout(() => {
        setDigitsLocked(prev => { const next = [...prev]; next[i] = true; return next; });
      }, delay));
    });
    // Extra hold after the last digit locks in — long enough to actually
    // register the final number before the page auto-advances, instead of
    // it flashing by right as it settles.
    timers.push(setTimeout(() => setAllDigitsLocked(true), maxDelay + 550));
    timers.push(setTimeout(() => setStage('PAGE'), maxDelay + 3600));

    return () => timers.forEach(clearTimeout);
  }, [stage, data]);

  useEffect(() => {
    if (!data) return;

    let isMounted = true;
    setImagesPreloaded(false);
    setPreloadingProgress(0);

    const urlsToPreload: string[] = [
      data.heroImage,
      data.creatorPhoto,
      data.secretImage,
      ...(Array.isArray(data.galleryPhotos) ? data.galleryPhotos : []),
      ...(Array.isArray(data.photos) ? data.photos : [])
    ].filter((u): u is string => Boolean(u && typeof u === 'string'));

    if (urlsToPreload.length === 0) {
      setImagesPreloaded(true);
      setPreloadingProgress(100);
      return;
    }

    let loadedCount = 0;
    const total = urlsToPreload.length;

    const checkAndFinishPreloading = () => {
      const songUrl = data?.youtubeMusicUrl;
      const videoId = extractYouTubeId(songUrl || '');
      if (videoId && !ytLoadedRef.current) {
        let waitTime = 0;
        const startSecs = parseTimestampSeconds(data?.webAudioStartTimestamp || data?.storyAudioStartTimestamp);
        const interval = setInterval(() => {
          waitTime += 150;
          if (ytPlayerRef.current && !ytLoadedRef.current) {
            try {
              const state = ytPlayerRef.current.getPlayerState?.();
              if (state === 1 || state === 2 || state === 3 || state === 5) {
                ytLoadedRef.current = true;
              } else {
                ytPlayerRef.current.mute?.();
                ytPlayerRef.current.seekTo?.(startSecs, true);
                ytPlayerRef.current.playVideo?.();
                setTimeout(() => { try { ytPlayerRef.current?.pauseVideo?.(); } catch {} }, 250);
              }
            } catch {}
          }

          if (ytLoadedRef.current || waitTime >= 5000) {
            clearInterval(interval);
            if (isMounted) setImagesPreloaded(true);
          }
        }, 300);
      } else {
        if (isMounted) setImagesPreloaded(true);
      }
    };

    const handleOneDone = () => {
      loadedCount++;
      if (isMounted) {
        const pct = Math.round((loadedCount / total) * 100);
        setPreloadingProgress(pct);
        if (loadedCount >= total) {
          checkAndFinishPreloading();
        }
      }
    };

    urlsToPreload.forEach((url) => {
      const img = new Image();
      img.src = url;

      const decodeAndDone = () => {
        if ('decode' in img && typeof img.decode === 'function') {
          img.decode().then(handleOneDone).catch(handleOneDone);
        } else {
          handleOneDone();
        }
      };

      if (img.complete && img.naturalWidth > 0) {
        decodeAndDone();
      } else {
        img.onload = decodeAndDone;
        img.onerror = handleOneDone;
      }
    });

    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        checkAndFinishPreloading();
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [data]);

  if (loadingStory) {
    return <PremiumLoader message="Loading celebration..." />;
  }

  if (accessError) {
    return (
      <main className="fixed inset-0 flex flex-col items-center justify-center p-6 z-50 text-center" style={{ background: INK_DARK }}>
        <meta name="robots" content="noindex, nofollow" />
        <div className="max-w-md w-full space-y-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
            <Lock size={20} className="text-[#d4af37]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-serif font-bold text-[#d4af37]" style={{ fontFamily: SERIF_FONT }}>
              Access Denied
            </h1>
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
              Privacy Protected
            </p>
          </div>
          <p className="text-white/70 text-sm font-light max-w-sm mx-auto leading-relaxed">
            {accessError === 'This celebration page is private.' 
              ? 'This is a private celebration page. The content is visible only to its creator.' 
              : accessError}
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 rounded-full border border-white/10 bg-white/5 text-white/80 hover:text-[#d4af37] hover:border-[#d4af37]/30 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer w-full sm:w-auto"
            >
              Back to Home
            </button>
            <button
              onClick={() => router.push('/leaderboard')}
              className="px-6 py-2.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37]/20 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer w-full sm:w-auto"
            >
              View Leaderboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return <PremiumLoader />;
  }

  const heroSrc: string | undefined = data.heroImage || data.galleryPhotos?.[0] || data.photos?.[0];
  // .filter(Boolean-ish) matters here: an unfilled upload slot that survives
  // into this array as '' / null / undefined would still count toward
  // gallery.length (so the hanging-photo layout still gets a correctly-sized column)
  // but render an empty <img src="">, which is exactly what "a photo's
  // spot looks empty" in the grid was — a data gap, not a CSS gap.
  const gallery: string[] = (data.galleryPhotos?.length ? data.galleryPhotos : [])
    .filter((p: string) => typeof p === 'string' && p.trim().length > 0)
    .slice(0, 6);
  // Round-robin the gallery into 3 columns for the hanging-photo layout —
  // keeps each photo's original index (for the lightbox + stagger delay)
  // alongside its assigned column.
  const galleryColumns: { img: string; i: number }[][] = [[], [], []];
  gallery.forEach((img, i) => galleryColumns[i % 3].push({ img, i }));
  const filledSecrets: string[] = (data.secretMessages || []).filter((m: string) => m && m.trim());

  // Secret Messages grid is text-only now — Secret Photo has its own
  // separate section (SecretPhotoSection) with its own distinct visual style.
  const secretItems: SecretItem[] = filledSecrets.map((text, i) => ({ type: 'text' as const, content: text, index: i }));
  const displaySecretItems: SecretItem[] = secretItems.length > 0 ? secretItems : [{ type: 'text', content: NO_SECRET_TEXT, index: 0 }];

  const questions: { text: string; revealOn: 'YES' | 'NO' }[] =
    data.questions?.length ? data.questions.slice(0, 2) : [DEFAULT_QUESTION];

  const hasGift = Boolean(data.giftCardCompany);
  const giftTheme = GIFT_THEMES[data.giftCardCompany] || GIFT_THEMES.OTHER;
  const giftRevealed = hasGift && answers[0] === (questions[0]?.revealOn ?? 'YES');
  const maskedCode = '•'.repeat(Math.max(8, (data.giftCardCode || '').length || 8));

  const photosCount = gallery.length + (data.heroImage ? 1 : 0) + (data.secretImage ? 1 : 0);
  const stats = [
    data.count ? { value: data.count, label: 'Years Together' } : null,
    photosCount > 0 ? { value: photosCount, label: 'Photos Captured' } : null,
    filledSecrets.length > 0 ? { value: filledSecrets.length, label: 'Secret Messages' } : null,
    wishes.length > 1 ? { value: wishes.length, label: 'Wishes Shared' } : null,
  ].filter(Boolean) as { value: number | string; label: string }[];

  const handleAnswer = (qIndex: number, val: 'YES' | 'NO') => {
    setAnswers(prev => ({ ...prev, [qIndex]: val }));
    if (qIndex === 0 && hasGift && val === (questions[0]?.revealOn ?? 'YES')) {
      confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 }, colors: [GOLD, '#D98E3F', '#8a6e15'] });
    }
  };

  const copyGiftCode = async () => {
    try { await navigator.clipboard.writeText(data.giftCardCode || ''); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1800); } catch {}
  };

  // ── Gallery lightbox: download the currently-viewed photo ─────────────────
  // Works for both data: URIs (base64, already local) and http(s) URLs
  // (fetches first, then downloads as a blob — avoids the browser just
  // navigating to the image instead of saving it).
  const downloadImage = async (src: string, index: number) => {
    try {
      const filename = `memory-${index + 1}.jpg`;
      if (src.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = src;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const resp = await fetch(src);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
    } catch {}
  };

  // ── Gallery lightbox: swipe left/right to change photo ────────────────────
  // Previously this used framer-motion's `drag="x"` on the image. That gave
  // a nice feel, but it also registers its own window-level pointer
  // listeners — and if the touch sequence gets interrupted (which is exactly
  // what happens when the Download button hands control to the OS's native
  // "save file" sheet mid-touch), those listeners can be left waiting for a
  // pointerup/pointercancel that never arrives. That's the most likely cause
  // of "scroll stops working after swiping or downloading": some part of the
  // page was left thinking a gesture was still in progress. Plain touch
  // handlers scoped to just this element, with state that's unconditionally
  // reset in BOTH touchend and touchcancel, can't leak that way.
  const LIGHTBOX_SWIPE_THRESHOLD = 60;
  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    lightboxTouchStart.current = { x: t.clientX, y: t.clientY };
    lightboxIsSwiping.current = false;
  };
  const handleLightboxTouchMove = (e: React.TouchEvent) => {
    if (!lightboxTouchStart.current || gallery.length <= 1) return;
    const t = e.touches[0];
    const dx = t.clientX - lightboxTouchStart.current.x;
    const dy = t.clientY - lightboxTouchStart.current.y;
    if (!lightboxIsSwiping.current) {
      // Wait for clear horizontal intent before committing to a swipe, so a
      // finger that lands on the photo but is actually trying to scroll
      // (moving mostly vertically) is never hijacked.
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      lightboxIsSwiping.current = Math.abs(dx) > Math.abs(dy);
      if (!lightboxIsSwiping.current) return;
    }
    setLightboxDragX(dx);
  };
  const handleLightboxTouchEnd = () => {
    if (lightboxIsSwiping.current && gallery.length > 1) {
      if (lightboxDragX < -LIGHTBOX_SWIPE_THRESHOLD) setLightboxIndex(i => (i! + 1) % gallery.length);
      else if (lightboxDragX > LIGHTBOX_SWIPE_THRESHOLD) setLightboxIndex(i => (i! - 1 + gallery.length) % gallery.length);
    }
    lightboxTouchStart.current = null;
    lightboxIsSwiping.current = false;
    setLightboxDragX(0);
  };

  // Shares the actual "Pass It On" invitation card (name + QR + framing —
  // the whole card in shareCardRef) as an image, instead of the bare QR
  // code. Previously handleShare fetched qrImageUrl directly, which is why
  // only the plain QR square showed up in WhatsApp with none of the card
  // design around it. Captured via html-to-image's toBlob() reading the
  // already-rendered DOM node, using the base64 qrDataUri (see the effect
  // above) so the capture never touches the cross-origin qrserver.com URL
  // and can't get canvas-tainted.
  const handleShare = async () => {
    try {
      let files: File[] | undefined;
      if (shareCardRef.current) {
        try {
          if (document.fonts?.ready) await document.fonts.ready;
          // skipFonts: true alone turned out not to be enough — the "Failed
          // to read the cssRules property from CSSStyleSheet" SecurityError
          // was still firing (shows up in the dev overlay even though it was
          // already being caught below, because html-to-image logs it via
          // console.error internally before the throw). The real fix is
          // fontEmbedCSS: '' — passing an already-computed (empty) value for
          // the font CSS means html-to-image never runs the step that walks
          // document.styleSheets in the first place, so it can't hit a
          // cross-origin stylesheet (an injected browser extension's, most
          // likely — a translator, ad-blocker, or dark-mode tool with no
          // CORS headers) and throw on it at all. We've already awaited
          // document.fonts.ready above, so the browser paints with the
          // correct fonts regardless; we just stop asking the library to
          // re-embed them. The console.error patch below is a second-layer
          // safety net so that even if some other internal step logs a
          // warning, it can never surface as a red error overlay in dev.
          // pixelRatio bumped 3 → 4 and an explicit white backgroundColor
          // added so the exported PNG is sharper and never shows a
          // transparent/black edge when opened in WhatsApp or other apps —
          // this is the "make the invitation card higher quality" fix.
          const originalConsoleError = console.error;
          console.error = () => {};
          let blob: Blob | null = null;
          try {
            blob = await toBlob(shareCardRef.current, {
              pixelRatio: 4,
              cacheBust: true,
              skipFonts: true,
              fontEmbedCSS: '',
              backgroundColor: CARD_BG,
            });
          } finally {
            console.error = originalConsoleError;
          }
          if (blob) {
            const safeName = (data.names || data.occasionName || 'celebration')
              .replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'celebration';
            const file = new File([blob], `${safeName}-invite.png`, { type: 'image/png' });
            if (!navigator.canShare || navigator.canShare({ files: [file] })) files = [file];
          }
        } catch {}
      }

      // A friendly caption instead of repeating the raw link — passing the
      // same URL in both `text` and `url` (the previous bug) is why apps
      // like WhatsApp printed the link twice in one message.
      const shareText = data.names
        ? `You're invited to celebrate with ${data.names}! 🤍`
        : `You're invited to a special celebration! 🤍`;

      if (navigator.share) {
        await navigator.share({
          title: data.names ? `${data.names} — A Special Celebration` : 'A Special Celebration',
          text: shareText, url: shareUrl, ...(files ? { files } : {}),
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch {}
  };

  return (
    <>
      {!imagesPreloaded && (
        <PremiumLoader progress={preloadingProgress} message={`Optimizing & preloading photos (${preloadingProgress}%)...`} />
      )}
      <div ref={scrollContainerRef} className="fixed inset-0 w-full h-[100dvh] overflow-y-auto overflow-x-hidden select-none"
        style={{ WebkitOverflowScrolling: 'touch', background: stage === 'PAGE' ? CREAM : INK_DARK }}>
        <meta name="robots" content="noindex, nofollow" />

        {/* Editorial type pair, loaded once up-front (not just inside the Love
            Letter) so every piece of creator-written text — names, wishes,
            secret messages, the intro slideshow — shares the same premium
            typography instead of only the letter looking "designed". */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Added Noto Serif Devanagari (Hindi fallback, see SERIF_FONT above) and
            Cormorant Garamond's upright weights — only its italic weights were
            being loaded before, so non-italic text set in SERIF_FONT (section
            titles, the couple's names, the share card) was quietly rendering in
            the Georgia fallback the whole time, not Cormorant Garamond. */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Noto+Serif+Devanagari:wght@400;500;600;700&display=swap" />

      {/* ── ENVELOPE — original dark theme ── */}
      {stage === 'ENVELOPE' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer" style={{ background: INK_DARK }}
          onClick={() => {
            setStage('INTRO');
            playAudioWithFadeIn();
            if (ytPlayerRef.current) {
              try {
                const startSecs = parseTimestampSeconds(data?.webAudioStartTimestamp || data?.storyAudioStartTimestamp);
                if (startSecs > 0) {
                  ytPlayerRef.current.seekTo(startSecs, true);
                }
                ytPlayerRef.current.unMute();
                ytPlayerRef.current.setVolume(70);
                ytPlayerRef.current.playVideo();
              } catch (err) {
                console.warn('Immediate YouTube play on tap failed:', err);
              }
            }
          }}>
          <Gift size={64} className="text-[#d4af37]" strokeWidth={1.3} />
          <p className="mt-4 text-[#d4af37] text-[11px] uppercase tracking-[0.3em]">A Special Gift For You</p>
        </div>
      )}

      {/* ── INTRO — original dark theme, now plays the creator's own wishes ── */}
      {stage === 'INTRO' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-10 text-center cursor-pointer touch-none" style={{ background: INK_DARK }}
          onPointerDown={() => setIsPaused(true)} onPointerUp={() => setIsPaused(false)}
          onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
          <AnimatePresence mode="wait">
            <motion.p key={introIndex} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.7 }} className="text-white text-2xl md:text-4xl leading-relaxed relative z-10" style={{ fontFamily: SERIF_FONT }}>
              {introLines[introIndex]}
            </motion.p>
          </AnimatePresence>
          <p className="absolute bottom-12 text-white/30 text-[10px] uppercase tracking-[0.25em] z-10">Hold to pause</p>
          <AnimatePresence>
            {isPaused && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute top-12 flex items-center gap-2 text-[#d4af37] text-[11px] uppercase tracking-widest">
                <PauseCircle size={15} /> Paused
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── VALUE — lottery-draw digit reels settling left to right, dark theme ── */}
      {stage === 'VALUE' && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center" style={{ background: INK_DARK }}>
          <p className="text-[#d4af37] text-[11px] uppercase tracking-[0.3em] mb-6">Drawing Your Value</p>
          <div className="flex items-center gap-1.5 font-serif text-white" style={{ fontSize: 64 }}>
            <span>₹</span>
            {String(Math.max(1, Number(data.premiumPrice) || 99)).split('').map((d, i) => (
              <DigitReel key={i} digit={d} locked={!!digitsLocked[i]} />
            ))}
          </div>
          <AnimatePresence>
            {allDigitsLocked && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-7 text-[#d4af37] text-[10px] uppercase tracking-[0.35em]"
              >
                Value Confirmed
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── PAGE — the actual landing page (light theme lives only here) ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} className={stage === 'PAGE' ? 'block' : 'fixed -top-[9999px] -left-[9999px] opacity-0 pointer-events-none w-1 h-1 overflow-hidden'} aria-hidden={stage !== 'PAGE'}>

          <SkyShotFireworks />

          {/* HERO — always cover (fixes the desktop letterboxing bug), fades into CREAM */}
          <section className="relative w-full h-[50vh] md:h-[65vh] lg:h-[72vh] lg:max-h-[800px] overflow-hidden">
            {heroSrc ? (
              <img src={heroSrc} className="w-full h-full object-cover object-center md:object-[center_20%]" alt="" />
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(160deg, ${CREAM_PANEL}, ${CREAM})` }} />
            )}
            {/* bottom fade — blends photo edge into the cream section, hides any harsh cut */}
            <div className="absolute inset-x-0 bottom-0 h-24 md:h-32" style={{ background: `linear-gradient(to bottom, transparent, ${CREAM})` }} />
            <RibbonSeal price={data.premiumPrice || 99} />
          </section>

          {/* TITLE ZONE */}
          <section className="w-full py-8 md:py-14" style={{ background: CREAM }}>
            <div className="px-6 md:px-12 text-center max-w-3xl md:max-w-4xl mx-auto">
              <div className="w-7 md:w-12 h-px mx-auto mb-3" style={{ background: GOLD_SOFT }} />
              <h1 className="text-3xl md:text-5xl lg:text-6xl leading-tight" style={{ color: INK, fontFamily: SERIF_FONT }}>
                {data.names || data.occasionName || 'Celebration'}
              </h1>
              {data.count && (
                <p className="mt-2 text-[11px] md:text-xs tracking-[0.28em] uppercase" style={{ color: INK_SOFT }}>{data.count} Years Together</p>
              )}
              <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="mt-4 md:mt-6 flex justify-center" style={{ color: `${INK_SOFT}80`, willChange: 'transform' }}>
                <ChevronDown size={16} strokeWidth={1.3} />
              </motion.div>
            </div>
          </section>

          {data.cakeEnabled !== false && (
            <CakeSection onCut={() => wishesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          )}

          {/* WISHES / SHAYARI — professional editorial redesign: alternating
              alignment, roman-numeral markers, large watermark quotation
              mark, accent-bordered "pull-quote" treatment instead of plain
              uniform cards. Still shows every wish, fully and statically. */}
          <section ref={wishesRef} className="w-full py-10 md:py-16" style={{ background: CREAM_PANEL, contentVisibility: 'auto', containIntrinsicSize: 'auto 600px' }}>
            <div className="px-6 md:px-12 max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto">
              <SectionHeader label="With Love" title="Wishes & Shayari" />
              <div className="space-y-6 md:space-y-8">
                {wishes.map((w, i) => {
                  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][i] || String(i + 1);
                  const alignRight = i % 2 === 1;
                  return (
                    <div key={i} className={`relative flex ${alignRight ? 'justify-end' : 'justify-start'}`}>
                      <div className="relative max-w-[86%] md:max-w-[78%] py-1 md:py-2" style={{
                        borderLeft: alignRight ? 'none' : `2px solid ${GOLD}`,
                        borderRight: alignRight ? `2px solid ${GOLD}` : 'none',
                        paddingLeft: alignRight ? 0 : 24,
                        paddingRight: alignRight ? 24 : 0,
                      }}>
                        <span className="font-serif select-none absolute pointer-events-none" style={{
                          fontSize: 64, lineHeight: 1, color: `${GOLD}14`,
                          top: -18, [alignRight ? 'right' : 'left']: alignRight ? -6 : 8,
                        }}>"</span>
                        <span className="block text-[10px] md:text-xs tracking-[0.2em]" style={{ color: GOLD_SOFT }}>{roman}</span>
                        <p className={`italic text-[16px] md:text-lg lg:text-xl leading-relaxed md:leading-loose mt-1 relative z-10 ${alignRight ? 'text-right' : 'text-left'}`} style={{ color: INK, fontFamily: SERIF_FONT }}>
                          {w}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* LOVE LETTER — a genuinely SEPARATE feature with its OWN field
              (data.loveLetterText). Realistic interaction: starts CLOSED/
              SEALED, opens on tap with an unfold animation. Uses a cursive
              Google Font for the salutation/signature (safe here — THIS
              section is never captured via html-to-image; the page's one
              capture target is the share card lower down, handled
              separately in handleShare). */}
          {data.loveLetterText?.trim() && <LoveLetterSection text={data.loveLetterText} />}

          {/* SECRET MESSAGES — text only now (Secret Photo moved to its own
              section below, with its own distinct visual treatment). */}
          <section className="w-full py-10 md:py-16" style={{ background: CREAM_PANEL, contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}>
            <div className="px-6 max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
              <SectionHeader label="Just For You" title="Secret Messages" />
              <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-5">
                {displaySecretItems.map((item, i) => (
                  <div key={i} className="mb-3 md:mb-5 break-inside-avoid">
                    <SecretCard item={item} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECRET PHOTO — a genuinely SEPARATE section with a DISTINCT
              visual treatment: a locked, blurred preview that clears on tap,
              not a small flip-card matching the text messages above. */}
          {data.secretImage && <SecretPhotoSection src={data.secretImage} />}

          {/* GALLERY — "hanging photo" layout: 3 columns, each starting at a
              different top offset (HANGING_COLUMN_OFFSET) so photos sit at
              uneven heights like prints pinned up with different string
              lengths. Each photo is a white polaroid-style mat with a small
              orange tape strip pinned across its top edge; click to view
              fullscreen. */}
          <section className="w-full py-10 md:py-16" style={{ background: CREAM_PANEL, contentVisibility: 'auto', containIntrinsicSize: 'auto 600px' }}>
            <div className="px-6 max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
              <SectionHeader label="Memories" title="Our Moments" />
              {gallery.length > 0 ? (
                <div className="grid grid-cols-3 gap-x-3 md:gap-x-8 lg:gap-x-12">
                  {galleryColumns.map((col, colIdx) => (
                    <div key={colIdx} className="flex flex-col gap-7 md:gap-10 lg:gap-12" style={{ marginTop: HANGING_COLUMN_OFFSET[colIdx] }}>
                      {col.map(({ img, i }) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '80px' }} transition={{ delay: i * 0.08 }}
                          onClick={() => setLightboxIndex(i)} className="relative cursor-pointer">
                          {/* orange sticky tape, pinned across the top edge */}
                          <div className="absolute left-1/2 -top-2 w-9 h-4 md:w-12 md:h-6 z-10"
                            style={{ background: `linear-gradient(180deg, ${TAPE_ORANGE}E6, ${TAPE_ORANGE}CC)`,
                              transform: `translateX(-50%) rotate(${HANGING_TAPE_ROTATE[i % HANGING_TAPE_ROTATE.length]}deg)`,
                              boxShadow: '0 1px 3px rgba(36,28,19,0.25)' }} />
                          {/* white polaroid mat, black/photo area fills the inner window */}
                          <div className="bg-white p-[5px] md:p-[8px] rounded-[2px]" style={{ boxShadow: '0 6px 14px rgba(36,28,19,0.18)' }}>
                            <img src={img} className="w-full aspect-square object-cover block bg-[#1a0505]" alt="" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-w-[180px] mx-auto aspect-square flex flex-col items-center justify-center gap-2 rounded-lg"
                  style={{ border: `1px dashed ${HAIRLINE}`, color: `${INK_SOFT}99` }}>
                  <ImagesIcon size={22} strokeWidth={1.3} />
                  <span className="text-[10px] uppercase tracking-widest">No Image</span>
                </div>
              )}
            </div>
          </section>

          {/* ── GALLERY LIGHTBOX — fullscreen view + download + prev/next ── */}
          <AnimatePresence>
            {lightboxIndex !== null && gallery[lightboxIndex] && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                style={{ background: 'rgba(20,15,10,0.92)' }}
                onClick={() => setLightboxIndex(null)}
              >
                <button onClick={() => setLightboxIndex(null)} className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                  <X size={18} />
                </button>

                {gallery.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i! - 1 + gallery.length) % gallery.length); }}
                    className="absolute left-3 md:left-6 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  ><ChevronLeft size={20} /></button>
                )}

                <motion.img
                  key={lightboxIndex}
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}
                  src={gallery[lightboxIndex]} onClick={e => e.stopPropagation()}
                  className="max-w-[90vw] max-h-[74vh] object-contain rounded-lg"
                  style={{ touchAction: 'none', x: lightboxDragX }}
                  onTouchStart={handleLightboxTouchStart}
                  onTouchMove={handleLightboxTouchMove}
                  onTouchEnd={handleLightboxTouchEnd}
                  onTouchCancel={handleLightboxTouchEnd}
                />

                {gallery.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i! + 1) % gallery.length); }}
                    className="absolute right-3 md:right-6 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  ><ChevronRight size={20} /></button>
                )}

                <button
                  onClick={e => { e.stopPropagation(); downloadImage(gallery[lightboxIndex!], lightboxIndex!); }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white"
                  style={{ background: GOLD }}
                >
                  <Download size={15} /> Download
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FAVORITE SONG — placed after the photo memories and right
              before the quick question, instead of right at the top (felt
              premature) or at the very end (felt like an afterthought). This
              slot lands it at a natural, reflective beat in the sequence:
              memories just settled in, then a song, then the next prompt.
              Renders only if the creator provided a YouTube URL. */}
          <FavoriteSongSection url={data.youtubeMusicUrl} startTimestamp={data?.webAudioStartTimestamp || data?.storyAudioStartTimestamp} isPageVisible={stage !== 'ENVELOPE'} externalPlayerRef={ytPlayerRef} ytLoadedRef={ytLoadedRef} />

          {/* QUESTIONS */}
          <section className="w-full py-10 md:py-16" style={{ background: CREAM, contentVisibility: 'auto', containIntrinsicSize: 'auto 300px' }}>
            <div className="px-6 max-w-sm md:max-w-md lg:max-w-lg mx-auto space-y-3 md:space-y-4">
              <SectionHeader label="One More Thing" title="Quick Question" />
              {questions.map((q, i) => (
                <div key={i} className="rounded-xl p-5 text-center" style={{ background: CARD_BG, border: `1px solid ${HAIRLINE}`, boxShadow: '0 1px 3px rgba(36,28,19,0.06)' }}>
                  <p className="text-base md:text-lg mb-4" style={{ color: INK, fontFamily: SERIF_FONT }}>{q.text}</p>
                  {answers[i] ? (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium" style={{ color: GOLD }}>
                      {answers[i] === 'YES' ? 'Yay! 🤍' : 'Noted 🙂'}
                    </motion.p>
                  ) : (
                    <div className="flex justify-center gap-3">
                      <button onClick={() => handleAnswer(i, 'YES')} className="px-6 py-2 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity" style={{ background: GOLD }}>Yes</button>
                      <button onClick={() => handleAnswer(i, 'NO')} className="px-6 py-2 rounded-full text-sm font-medium" style={{ border: `1px solid ${HAIRLINE}`, color: INK_SOFT }}>No</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* GIFT CARD — full template ALWAYS visible; only the code is masked until revealed */}
          {hasGift && (
            <section className="w-full py-10 md:py-16" style={{ background: CREAM_PANEL, contentVisibility: 'auto', containIntrinsicSize: 'auto 380px' }}>
              <div className="px-6 flex justify-center w-full max-w-xs md:max-w-sm lg:max-w-md mx-auto">
                <div className="w-full">
                  <SectionHeader label="A Little Extra" title="Your Gift" />
                  <div className="rounded-xl p-6 md:p-8 relative overflow-hidden" style={{ background: giftTheme.bg, boxShadow: '0 6px 20px rgba(36,28,19,0.15)' }}>
                    <div className="flex items-center gap-2 mb-5">
                      <Gift size={17} style={{ color: giftTheme.accent }} />
                      <span className="font-medium tracking-wide text-xs uppercase" style={{ color: giftTheme.text }}>{giftTheme.label}</span>
                    </div>

                    <div className="bg-black/20 rounded-lg px-4 py-3 flex items-center justify-between mb-3">
                      <span className="font-mono tracking-widest text-sm" style={{ color: giftTheme.text }}>
                        {giftRevealed ? (data.giftCardCode || '——————') : maskedCode}
                      </span>
                      {giftRevealed && (
                        <button onClick={copyGiftCode} className="ml-3 flex-shrink-0" style={{ color: giftTheme.accent }}>
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 opacity-85">
                      {giftRevealed ? <Unlock size={13} style={{ color: giftTheme.accent }} /> : <Lock size={13} style={{ color: giftTheme.text }} />}
                      <span className="text-[10px] uppercase tracking-widest" style={{ color: giftTheme.text }}>
                        {giftRevealed ? 'Unlocked' : 'Answer above to reveal'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <FirecrackerBurst />

          {/* STATS — moved here (closing recap), no longer shown upfront */}
          {stats.length >= 2 && <StatsStrip stats={stats} />}

          {/* SHARE — the QR now sits inside its own small "invitation card"
              (name + tagline + framed code) instead of a bare code in a
              plain box, so it feels like a keepsake worth handing over.
              The card itself carries no gendered styling and no hardcoded
              name — it pulls data.names/occasionName, so the exact same
              design works for any person, pair, or occasion. */}
          <section className="w-full pt-8 md:pt-14 pb-8" style={{ background: CREAM }}>
            <div className="px-6 max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
              <SectionHeader label="Share" title="Pass It On" />
            <div className="max-w-[240px] md:max-w-[280px] mx-auto">
              <div ref={shareCardRef} className="relative rounded-2xl px-6 md:px-8 pt-7 md:pt-8 pb-6 md:pb-8 flex flex-col items-center gap-4"
                style={{ background: CARD_BG, border: `1px solid ${HAIRLINE}`, boxShadow: '0 10px 28px rgba(36,28,19,0.10)' }}>
                <span className="absolute top-3 left-3 w-4 h-4 border-t border-l" style={{ borderColor: GOLD_SOFT }} />
                <span className="absolute top-3 right-3 w-4 h-4 border-t border-r" style={{ borderColor: GOLD_SOFT }} />
                <span className="absolute bottom-3 left-3 w-4 h-4 border-b border-l" style={{ borderColor: GOLD_SOFT }} />
                <span className="absolute bottom-3 right-3 w-4 h-4 border-b border-r" style={{ borderColor: GOLD_SOFT }} />

                <div className="flex flex-col items-center gap-2 w-full">
                  <p className="leading-snug px-2 w-full text-center" style={{
                    color: INK, fontFamily: SERIF_FONT,
                    fontSize: (() => {
                      const len = (data.names || data.occasionName || '').length;
                      if (len > 26) return 13;
                      if (len > 18) return 14.5;
                      return 16;
                    })(),
                  }}>
                    {data.names || data.occasionName || 'This Celebration'}
                  </p>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-[0.28em]" style={{ color: GOLD_SOFT }}>Scan to Open</p>
                </div>

                <div className="relative rounded-lg p-2.5" style={{ width: 128, height: 128, background: CARD_BG, border: `1px solid ${HAIRLINE}` }}>
                  {qrLoading && <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ background: CARD_BG }}>
                    <div className="w-4 h-4 border rounded-full animate-spin" style={{ borderColor: `${INK}30`, borderTopColor: INK }} /></div>}
                  <img src={qrDataUri || qrImageUrl} className="w-full h-full object-contain" onLoad={() => setQrLoading(false)} alt="QR Code" />
                </div>

                <p className="text-[10px] md:text-xs text-center leading-relaxed" style={{ color: `${INK_SOFT}cc` }}>
                  Point a camera at the code to<br />revisit this celebration anytime
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 mt-4">
                <button onClick={copyLink} className="w-full flex items-center gap-2 rounded-full px-4 py-2.5" style={{ background: CARD_BG, border: `1px solid ${HAIRLINE}` }}>
                  <span className="flex-1 text-[11px] truncate text-left" style={{ color: `${INK_SOFT}cc` }}>{shareUrl.replace(/^https?:\/\//, '')}</span>
                  {linkCopied ? <Check size={13} style={{ color: GOLD }} className="flex-shrink-0" /> : <Copy size={13} style={{ color: `${INK_SOFT}99` }} className="flex-shrink-0" />}
                </button>
                <button onClick={handleShare} className="w-full py-3 rounded-full text-sm font-medium text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity" style={{ background: GOLD }}>
                  <Share2 size={15} /> Share
                </button>
              </div>
            </div>
          </div>
        </section>

          <div className="pb-6 px-6 flex items-center justify-center gap-6 text-[11px]" style={{ background: CREAM, color: `${INK_SOFT}90` }}>
            <button onClick={() => router.push('/')} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"><Home size={12} /> Home</button>
            <span className="w-px h-3" style={{ background: HAIRLINE }} />
            <button onClick={() => { setMuted(!muted); if (audioRef.current) audioRef.current.muted = !muted; }} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
              {muted ? <VolumeX size={12} /> : <Volume2 size={12} />} Sound
            </button>
          </div>
          <p className="pb-6 text-center text-[9px] tracking-[0.35em] uppercase" style={{ background: CREAM, color: `${INK_SOFT}55` }}>jashn.fun</p>
        </motion.div>

      <audio ref={audioRef} loop src={!extractYouTubeId(data?.youtubeMusicUrl || data?.music) ? (data?.music || undefined) : undefined} />
    </div>
  </>
);
}

// sync
