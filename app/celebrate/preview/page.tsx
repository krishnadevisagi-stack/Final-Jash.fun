'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Volume2, VolumeX, Gift, Home, MessageCircle, QrCode, X, Send, User, Loader2, Info, RefreshCw, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { generatePosterCanvas } from './posterRenderer';
// html-to-image is lazy-imported inside useEffect to avoid Turbopack SSR bundling issues
// (top-level import causes "r is not defined" ReferenceError at module evaluation time)

const MOBILE_REF = { width: 430, height: 932 };
const MOBILE_DIAGONAL = Math.sqrt(MOBILE_REF.width ** 2 + MOBILE_REF.height ** 2);

const BASE = {
  envelopeIconSize: 80,
  envelopeTextSize: 14,
  envelopeTextMarginTop: 16,
  countdownFontSize: 160,
  topPadding: 24,
  topGap: 12,
  topButtonSize: 40,
  topIconSize: 18,
  creatorPillPadX: 16,
  creatorPillPadY: 4,
  creatorPillGap: 8,
  creatorAvatarSize: 32,
  creatorBySize: 8,
  creatorByMargin: 2,
  creatorNameSize: 12,
  creatorNameMaxWidth: 80,
  overlayHeightPercent: 40,
  contentPadX: 24,
  contentPadBottom: 144,
  titleSize: 12,
  titleMarginBottom: 4,
  titlePadBottom: 4,
  nameSize: 36,
  nameMarginBottom: 8,
  subtitleSize: 10,
  subtitlePadX: 12,
  subtitlePadY: 4,
  subtitleMarginBottom: 12,
  subtitleRadius: 9999,
  messageSize: 14,
  messageMaxWidth: 320,
  slideshowBottom: 96,
  slideshowPadX: 24,
  slideshowBubblePadX: 16,
  slideshowBubblePadY: 6,
  slideshowFontSize: 12,
  slideshowMaxWidth: 280,
  slideshowRadius: 9999,
  slideshowAnimOffset: 10,
  actionBottom: 24,
  actionGap: 32,
  actionIconSize: 24,
  actionLabelSize: 10,
  actionItemGap: 4,
  balloonWidth: 55,
  balloonHeight: 70,
  balloonKnotSize: 10,
  balloonKnotOffset: 8,
  balloonSwayX: 12,
  balloonSwayY: 6,
  balloonSpawnY: 100,
  balloonHeightVariations: [0.156, 0.216, 0.125, 0.260, 0.161, 0.244, 0.205, 0.122],
  balloonsPerSideMobile: 2,
  balloonShadowInset1: 8,
  balloonShadowInset2: 10,
  balloonShadowInset3: 20,
  balloonShadowInset4: 5,
  balloonShadowInset5: 15,
  balloonShadowOuter1: 8,
  balloonShadowOuter2: 25,
  balloonShadowGlow: 15,
  balloonHighlight1Blur: 1.5,
  balloonHighlight2Blur: 2,
  balloonHighlight3Blur: 1,
  stringWidth: 1.5,
  stringOriginY: 80,
  stringSway: 20,
  glitterCount: 45,
  glitterCountSmall: 20,
  glitterGravity: 0.08,
  modalPad: 24,
  modalTitleSize: 20,
  modalTitleMargin: 24,
  qrContainerSize: 220,
  qrContainerPad: 8,
  qrContainerMargin: 24,
  qrLoaderSize: 40,
  modalBtnPad: 12,
  modalBtnSize: 14,
  modalBtnIconSize: 18,
  modalBtnGap: 8,
  modalCloseMargin: 16,
  modalCloseSize: 14,
  namePromptPad: 40,
  namePromptGap: 32,
  namePromptAvatarSize: 80,
  namePromptIconSize: 40,
  namePromptTitleSize: 24,
  namePromptSubSize: 14,
  namePromptInputPad: 16,
  namePromptInputSize: 18,
  namePromptBtnPad: 16,
  namePromptBtnSize: 18,
  commentsHeaderPad: 16,
  commentsHeaderSize: 18,
  commentsHeaderIconSize: 20,
  commentsHeaderGap: 8,
  commentsHeaderClosePad: 8,
  commentsHeaderCloseSize: 20,
  commentsListPad: 16,
  commentsListGap: 16,
  commentsEmptyIconSize: 48,
  commentsEmptyGap: 8,
  commentsEmptySize: 14,
  commentAvatarSize: 40,
  commentAvatarFontSize: 14,
  commentItemGap: 12,
  commentBubblePad: 12,
  commentNameSize: 14,
  commentTimeSize: 10,
  commentMsgSize: 14,
  commentInputAreaPad: 16,
  commentInputGap: 12,
  commentInputPadX: 20,
  commentInputPadY: 12,
  commentInputSize: 14,
  commentSendSize: 48,
  commentSendIconSize: 20,
};

const ACHIEVEMENT_MILESTONES = [
  { level: 1, required: 100, name: "Beginner", color: "#CD7F32" },
  { level: 2, required: 300, name: "Enthusiast", color: "#C0C0C0" },
  { level: 3, required: 600, name: "Expert", color: "#FFD700" },
  { level: 4, required: 4600, name: "Champion", color: "#E5E4E2" },
  { level: 5, required: 9600, name: "Master", color: "#B9F2FF" },
  { level: 6, required: 15600, name: "Legend", color: "#9966CC" },
  { level: 7, required: 85600, name: "Titan", color: "#FF6347" },
  { level: 8, required: 165600, name: "Mythic", color: "#FF1493" },
  { level: 9, required: 255600, name: "Ultimate", color: "#00CED1" },
  { level: 10, required: 255601, name: "Limitless", color: "#d4af37", special: true },
];

const BIRTHDAY_SELF_LINES = [
  "It's my birthday", "My birthday today", "Birthday day today", "Birthday time", "My special day", "Birthday vibes", "Birthday mood", "Feeling birthday", "Born today", "My big day",
];

let birthdayLineIndex = 0;

const useProportionalScale = () => {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () => {
      const d = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
      setScale(Math.max(1, Math.min(d / MOBILE_DIAGONAL, 2.5)));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);
  return scale;
};

const useScaled = (scale: number) => {
  return useMemo(() => {
    const s: any = { ...BASE };
    for (const key in BASE) {
      if (key === 'balloonHeightVariations') continue;
      s[key] = (BASE as any)[key] * scale;
    }
    return s as typeof BASE;
  }, [scale]);
};

type ImageFitMode = 'cover' | 'contain';

const determineImageFit = (img: HTMLImageElement): ImageFitMode => {
  const W = window.innerWidth;
  const H = window.innerHeight;
  if (W < 768) return 'cover';
  const screenRatio = W / H;
  const imgRatio = img.naturalWidth / img.naturalHeight;
  if (imgRatio < 0.75 && screenRatio > 1.2) return 'contain';
  if (imgRatio > 1.33 && screenRatio < 0.8) return 'contain';
  if (imgRatio > 0.8 && imgRatio < 1.2 && screenRatio > 1.5) return 'contain';
  const wouldCropVertical = imgRatio > screenRatio;
  const cropRatio = wouldCropVertical ? screenRatio / imgRatio : imgRatio / screenRatio;
  return cropRatio >= 0.55 ? 'cover' : 'contain';
};

interface Comment { id: string; name: string; message: string; timestamp: string; storyId?: string; }

const formatTime = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
};

const getOrdinal = (n: string) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = parseInt(n) || 0;
  return n + (s[(v % 100 - 20) % 10] || s[v % 100] || s[0]);
};

const BALLOON_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA', '#FF9F43', '#7BED9F', '#70A1FF', '#5352ED'];
const getRandomColor = (exclude?: string) => {
  let c;
  do { c = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)]; } while (c === exclude);
  return c;
};
const darken = (hex: string, pct: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const a = Math.round(2.55 * pct);
  return `#${((1 << 24) | (Math.max(0, (n >> 16) - a) << 16) | (Math.max(0, ((n >> 8) & 0xFF) - a) << 8) | Math.max(0, (n & 0xFF) - a)).toString(16).slice(1)}`;
};
const lighten = (hex: string, pct: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const a = Math.round(2.55 * pct);
  return `#${((1 << 24) | (Math.min(255, (n >> 16) + a) << 16) | (Math.min(255, ((n >> 8) & 0xFF) + a) << 8) | Math.min(255, (n & 0xFF) + a)).toString(16).slice(1)}`;
};

let sharedAudioCtx: AudioContext | null = null;
let sharedNoiseBuffer: AudioBuffer | null = null;

const getSharedAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      sharedAudioCtx = new AudioCtxClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

const playBalloonPopSound = () => {
  try {
    const audioCtx = getSharedAudioContext();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    const popOsc = audioCtx.createOscillator();
    const popGain = audioCtx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(180, now);
    popOsc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
    popGain.gain.setValueAtTime(0.7, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    if (!sharedNoiseBuffer) {
      const bufferSize = audioCtx.sampleRate * 0.05;
      sharedNoiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const noiseData = sharedNoiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }
    }

    const noiseSrc = audioCtx.createBufferSource();
    noiseSrc.buffer = sharedNoiseBuffer;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1800;
    noiseFilter.Q.value = 0.5;

    popOsc.connect(popGain);
    popGain.connect(audioCtx.destination);

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);

    popOsc.start(now);
    noiseSrc.start(now);
    popOsc.stop(now + 0.14);
    noiseSrc.stop(now + 0.10);
  } catch (e) {
    console.warn('Pop sound error:', e);
  }
};

const PremiumLoader = ({ scale, message }: { scale: number; message?: string }) => (
  <div className="fixed inset-0 flex flex-col items-center justify-center z-[100] bg-black gap-4">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
      style={{ width: 48 * scale, height: 48 * scale, borderWidth: 4 * scale }}
      className="rounded-full border-[#d4af37] border-t-transparent"
    />
    {message && (
      <p className="text-white/70 font-sans text-sm animate-pulse text-center px-4">{message}</p>
    )}
  </div>
);

const triggerProfessionalConfetti = () => {
  if (typeof window === 'undefined') return;
  const isMobile = window.innerWidth < 768;

  const colors = [
    '#FFD700', '#FF6B8A', '#B388FF', '#FF8A80',
    '#FFAB91', '#82B1FF', '#FF4444', '#FFB347',
    '#FF69B4', '#00CED1', '#7FFF00', '#FF6347'
  ];

  const crackerDefaults = {
    particleCount: isMobile ? 45 : 70,
    spread: 70,
    startVelocity: 50,
    decay: 0.93,
    gravity: 0.9,
    ticks: 200,
    colors,
    disableForReducedMotion: true
  };

  requestAnimationFrame(() => {
    confetti({
      ...crackerDefaults,
      angle: 60,
      origin: { x: 0, y: 1 }
    });

    confetti({
      ...crackerDefaults,
      angle: 120,
      origin: { x: 1, y: 1 }
    });

    setTimeout(() => {
      confetti({
        ...crackerDefaults,
        particleCount: isMobile ? 30 : 45,
        angle: 55,
        spread: 60,
        origin: { x: 0.05, y: 0.95 }
      });
      confetti({
        ...crackerDefaults,
        particleCount: isMobile ? 30 : 45,
        angle: 125,
        spread: 60,
        origin: { x: 0.95, y: 0.95 }
      });
    }, 200);
  });
};

let confettiHasFired = false;

const PopCounter = ({ count, show }: { count: number; show: boolean }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ zIndex: 100 }}
        >
          <span
            className="font-bold text-white"
            style={{
              fontSize: 72,
              textShadow: '0 2px 20px rgba(0,0,0,0.7), 0 4px 40px rgba(0,0,0,0.4)'
            }}
          >
            {count}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const getCurrentAchievement = (count: number) => {
  for (let i = ACHIEVEMENT_MILESTONES.length - 1; i >= 0; i--) {
    if (count >= ACHIEVEMENT_MILESTONES[i].required) {
      return ACHIEVEMENT_MILESTONES[i];
    }
  }
  return null;
};

const TrophySVG = ({ color, size = 20, glow = false }: { color: string; size?: number; glow?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={glow ? { filter: `drop-shadow(0 0 6px ${color})` } : {}}>
    <path d="M6 2H18V14C18 17.3137 15.3137 20 12 20C8.68629 20 6 17.3137 6 14V2Z" fill={color} fillOpacity="0.9"/>
    <path d="M6 6H3C3 9.31371 4.34315 11 6 11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M18 6H21C21 9.31371 19.6569 11 18 11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 20V22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 22H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 13L10.5 14.5L15 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LockedBadgeSVG = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14 5H18L15.5 7.5L16.5 11L12 9L7.5 11L8.5 7.5L6 5H10L12 2Z"
      stroke="#888" strokeWidth="1.2" strokeDasharray="2 1.5" fill="rgba(100,100,100,0.12)"
      strokeLinejoin="round"/>
    <rect x="9.5" y="12" width="5" height="4" rx="1" fill="#666" fillOpacity="0.8"/>
    <path d="M10.5 12V10.5C10.5 9.4 11.4 8.5 12 8.5C12.6 8.5 13.5 9.4 13.5 10.5V12"
      stroke="#666" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    <circle cx="12" cy="14" r="0.6" fill="#333"/>
    <path d="M12 14.6V15.5" stroke="#333" strokeWidth="0.8" strokeLinecap="round"/>
  </svg>
);

const AchievementBadge = ({
  globalCount,
  onClick,
  S
}: {
  globalCount: number;
  onClick: () => void;
  S: typeof BASE;
}) => {
  const achievement = getCurrentAchievement(globalCount);

  if (!achievement) {
    return (
      <motion.button
        onClick={onClick}
        className="flex items-center justify-center rounded-full backdrop-blur-md border-2 transition-all relative overflow-hidden"
        style={{
          width: S.topButtonSize,
          height: S.topButtonSize,
          backgroundColor: 'rgba(212, 175, 55, 0.15)',
          borderColor: 'rgba(212, 175, 55, 0.4)',
          boxShadow: '0 0 15px rgba(212, 175, 55, 0.3), 0 0 25px rgba(212, 175, 55, 0.1)',
        }}
        animate={{
          boxShadow: [
            '0 0 15px rgba(212, 175, 55, 0.3), 0 0 25px rgba(212, 175, 55, 0.1)',
            '0 0 20px rgba(212, 175, 55, 0.5), 0 0 35px rgba(212, 175, 55, 0.2)',
            '0 0 15px rgba(212, 175, 55, 0.3), 0 0 25px rgba(212, 175, 55, 0.1)',
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
          }}
          animate={{
            x: ['-100%', '200%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 1
          }}
        />
        <svg width={S.topIconSize} height={S.topIconSize} viewBox="0 0 24 24" fill="none">
          <path d="M12 2L14.5 7L20 8L16 12L17 18L12 15L7 18L8 12L4 8L9.5 7L12 2Z"
            fill="rgba(212, 175, 55, 0.6)"
            stroke="#d4af37"
            strokeWidth="1.5"/>
          <circle cx="12" cy="11" r="4" fill="rgba(0,0,0,0.6)"/>
          <text x="12" y="14" textAnchor="middle" fill="#d4af37" fontSize="8" fontWeight="bold">?</text>
        </svg>
      </motion.button>
    );
  }

  const isSpecial = (achievement as any).special;

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center rounded-full backdrop-blur-md border transition-all"
      style={{
        width: S.topButtonSize,
        height: S.topButtonSize,
        backgroundColor: `${achievement.color}25`,
        borderColor: `${achievement.color}60`,
        boxShadow: `0 0 12px ${achievement.color}50`,
      }}
    >
      <TrophySVG
        color={achievement.color}
        size={S.topIconSize}
        glow={isSpecial}
      />
    </button>
  );
};

const AchievementModal = ({
  show,
  onClose,
  globalCount
}: {
  show: boolean;
  onClose: () => void;
  globalCount: number;
}) => {
  const [showInfoFor, setShowInfoFor] = useState<number | null>(null);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{ padding: 16 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1a0505] border border-[#d4af37]/30 rounded-2xl overflow-hidden"
        style={{ width: 340, maxWidth: '100%', maxHeight: '80vh', padding: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-[#d4af37] font-bold text-center font-serif" style={{ fontSize: 20, marginBottom: 8 }}>
          Achievements
        </h3>
        <p className="text-white/60 text-center" style={{ fontSize: 14, marginBottom: 16 }}>
          Global Pops: {globalCount.toLocaleString()}
        </p>
        <div className="overflow-y-auto" style={{ maxHeight: 400, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ACHIEVEMENT_MILESTONES.map((milestone) => {
            const unlocked = globalCount >= milestone.required;
            const isSpecial = (milestone as any).special;
            return (
              <div
                key={milestone.level}
                className={`flex items-center rounded-xl border ${unlocked ? 'bg-black/40' : 'bg-black/20'}`}
                style={{
                  padding: 12,
                  gap: 12,
                  borderColor: unlocked ? `${milestone.color}50` : 'rgba(255,255,255,0.15)',
                  boxShadow: unlocked
                    ? `0 0 10px ${milestone.color}30`
                    : '0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: unlocked ? `${milestone.color}30` : 'rgba(60,60,60,0.6)',
                    boxShadow: unlocked && isSpecial
                      ? `0 0 15px ${milestone.color}50`
                      : unlocked
                        ? 'none'
                        : '0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  {unlocked ? (
                    <TrophySVG
                      color={milestone.color}
                      size={22}
                      glow={isSpecial}
                    />
                  ) : (
                    <LockedBadgeSVG size={22} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold truncate"
                    style={{
                      fontSize: 14,
                      color: unlocked ? milestone.color : '#888',
                    }}
                  >
                    {milestone.name}
                  </p>

                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInfoFor(showInfoFor === milestone.level ? null : milestone.level);
                      }}
                      className="text-white/40 hover:text-[#d4af37] transition-colors"
                    >
                      <Info size={12} />
                    </button>
                    <p className="text-white/50" style={{ fontSize: 11 }}>
                      {isSpecial
                        ? 'Beyond All Limits'
                        : milestone.required.toLocaleString()}
                    </p>
                  </div>

                  {showInfoFor === milestone.level && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 p-2 bg-black/60 rounded-lg border border-[#d4af37]/20"
                    >
                      <p className="text-white/70 text-xs">
                        {isSpecial
                          ? 'Ultimate achievement - no limit!'
                          : `This achievement unlocks at ${milestone.required.toLocaleString()} pops`}
                      </p>
                    </motion.div>
                  )}
                </div>
                {unlocked ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="#4ade80" fillOpacity="0.2" stroke="#4ade80" strokeWidth="1.5"/>
                    <path d="M4.5 8L7 10.5L11.5 6" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="3" y="6.5" width="8" height="5.5" rx="1.5" fill="#555" fillOpacity="0.8"/>
                    <path d="M4.5 6.5V5C4.5 3.6 5.6 2.5 7 2.5C8.4 2.5 9.5 3.6 9.5 5V6.5"
                      stroke="#555" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                    <circle cx="7" cy="9.5" r="0.8" fill="#888"/>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="w-full text-white/40 hover:text-white transition-colors"
          style={{ marginTop: 16, fontSize: 13, padding: 8 }}
        >
          Close
        </button>
      </motion.div>
    </div>
  );
};

interface BalloonData { id: number; side: 'left' | 'right'; xPct: number; color: string; visible: boolean; progress: number; heightLimit: number; }
interface Glitter { x: number; y: number; vx: number; vy: number; size: number; color: string; life: number; rot: number; rotSpeed: number; glow: number; }

const BalloonSystem = ({ scale, S, onPop }: { scale: number; S: typeof BASE; onPop: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glitterRef = useRef<Glitter[]>([]);
  const timeRef = useRef(0);
  const rafRef = useRef<number>();
  const [balloons, setBalloons] = useState<BalloonData[]>([]);
  const balloonsRef = useRef<BalloonData[]>([]);
  const [mounted, setMounted] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    balloonsRef.current = balloons;
  }, [balloons]);

  const perSide = useMemo(() => {
    if (scale >= 1.5) return 4;
    if (scale >= 1.2) return 3;
    return BASE.balloonsPerSideMobile;
  }, [scale]);

  useEffect(() => {
    const arr: BalloonData[] = [];
    let id = 1;
    const variations = BASE.balloonHeightVariations;
    for (let i = 0; i < perSide; i++) {
      arr.push({ id: id++, side: 'left', xPct: 8 + i * 6, color: getRandomColor(), visible: true, progress: 1, heightLimit: variations[id % variations.length] });
      arr.push({ id: id++, side: 'right', xPct: 92 - i * 6, color: getRandomColor(), visible: true, progress: 1, heightLimit: variations[(id + 3) % variations.length] });
    }
    setBalloons(arr);
    balloonsRef.current = arr;
    setMounted(true);
  }, [perSide]);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      timeRef.current += 0.016;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const contentBottom = S.contentPadBottom + S.actionBottom;
      const availableH = H - contentBottom;
      const leftX = W * 0.05, rightX = W * 0.95, originY = H + S.stringOriginY;

      for (const b of balloonsRef.current) {
        if (!b.visible) continue;
        const originX = b.side === 'left' ? leftX : rightX;
        const swayX = Math.sin(timeRef.current * 1.2 + b.id * 1.5) * S.balloonSwayX;
        const swayY = Math.sin(timeRef.current * 1.8 + b.id * 0.9) * S.balloonSwayY;
        const maxRise = availableH * b.heightLimit;
        const finalY = H - contentBottom - maxRise + S.balloonHeight / 2;
        const startY = H + S.balloonSpawnY;
        const currY = startY - b.progress * (startY - finalY);
        const bx = W * b.xPct / 100 + swayX;
        const by = currY + swayY;
        const bottomY = by + S.balloonHeight / 2;

        // Draw String
        const strSway = Math.sin(timeRef.current + b.id * 1.2) * S.stringSway;
        const midX = (originX + bx) / 2;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.bezierCurveTo(originX + (midX - originX) * 0.5 + strSway * 0.4, originY - H * 0.12, bx + (midX - bx) * 0.3 + strSway * 0.8, bottomY + (originY - bottomY) * 0.5, bx, bottomY);
        ctx.strokeStyle = 'rgba(160,140,120,0.75)';
        ctx.lineWidth = S.stringWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      glitterRef.current = glitterRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += BASE.glitterGravity * scale;
        p.vx *= 0.985; p.life -= 0.012;
        p.rot += p.rotSpeed; p.glow = Math.max(0, p.glow - 0.008);
        if (p.life <= 0) return false;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const alpha = p.life * p.glow * 0.6;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 3);
        grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
        grad.addColorStop(0.3, p.color + Math.floor(Math.min(1, alpha) * 255).toString(16).padStart(2, '0'));
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = Math.min(1, p.life * 1.8);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = Math.PI / 2 * i - Math.PI / 4;
          ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
          ctx.lineTo(Math.cos(a + Math.PI / 4) * p.size * 0.25, Math.sin(a + Math.PI / 4) * p.size * 0.25);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        return true;
      });

      tick(n => n + 1);
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [mounted, S, scale]);

  const pop = (id: number, x: number, y: number, color: string) => {
    playBalloonPopSound();
    onPop();

    const colors = ['#FFD700', '#FFFACD', '#FFF8DC', '#FFFFFF', lighten(color, 30), color, lighten(color, 50)];
    const cnt = Math.round(S.glitterCount);
    for (let i = 0; i < cnt; i++) {
      const a = (Math.PI * 2 / cnt) * i + (Math.random() - 0.5) * 0.6;
      const spd = (3 + Math.random() * 7) * scale;
      glitterRef.current.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 4 * scale, size: (4 + Math.random() * 6) * scale, color: colors[Math.floor(Math.random() * colors.length)], life: 1, rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.3, glow: 1 });
    }
    for (let i = 0; i < Math.round(S.glitterCountSmall); i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = (1.5 + Math.random() * 3) * scale;
      glitterRef.current.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 2 * scale, size: (2 + Math.random() * 3) * scale, color: '#FFFFFF', life: 0.8, rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.4, glow: 1.2 });
    }

    const popped = balloonsRef.current.find(b => b.id === id);
    setBalloons(prev => prev.map(b => b.id === id ? { ...b, visible: false } : b));

    setTimeout(() => {
      const newColor = getRandomColor(popped?.color);
      const newHeight = BASE.balloonHeightVariations[Math.floor(Math.random() * BASE.balloonHeightVariations.length)];
      setBalloons(prev => prev.map(b => b.id === id ? { ...b, visible: true, progress: 0, color: newColor, heightLimit: newHeight } : b));
      const start = Date.now(), dur = 2200;
      const respawn = () => {
        const p = Math.min(1, (Date.now() - start) / dur);
        const e = 1 - Math.pow(1 - p, 4);
        setBalloons(prev => prev.map(b => b.id === id ? { ...b, progress: e } : b));
        if (p < 1) requestAnimationFrame(respawn);
      };
      requestAnimationFrame(respawn);
    }, 2800);
  };

  const getPos = (b: BalloonData) => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    const W = window.innerWidth, H = window.innerHeight;
    const contentBottom = S.contentPadBottom + S.actionBottom;
    const availableH = H - contentBottom;
    const swayX = Math.sin(timeRef.current * 1.2 + b.id * 1.5) * S.balloonSwayX;
    const swayY = Math.sin(timeRef.current * 1.8 + b.id * 0.9) * S.balloonSwayY;
    const maxRise = availableH * b.heightLimit;
    const finalY = H - contentBottom - maxRise + S.balloonHeight / 2;
    const startY = H + S.balloonSpawnY;
    const currY = startY - b.progress * (startY - finalY);
    return { x: W * b.xPct / 100 + swayX, y: currY + swayY };
  };

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 5 }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {balloons.filter(b => b.visible).map(b => {
        const pos = getPos(b);
        return (
          <div key={b.id} onClick={e => { e.stopPropagation(); pop(b.id, pos.x, pos.y, b.color); }} className="absolute pointer-events-auto cursor-pointer touch-manipulation" style={{ left: pos.x, top: pos.y, transform: 'translate(-50%,-50%)' }}>
            <div style={{ width: S.balloonWidth, height: S.balloonHeight, background: `radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 12%, ${lighten(b.color, 15)} 35%, ${b.color} 55%, ${darken(b.color, 25)} 100%)`, borderRadius: '50% 50% 50% 50% / 55% 55% 45% 45%', boxShadow: `inset -${S.balloonShadowInset1}px -${S.balloonShadowInset2}px ${S.balloonShadowInset3}px rgba(0,0,0,0.15), inset ${S.balloonShadowInset4}px ${S.balloonShadowInset4}px ${S.balloonShadowInset5}px rgba(255,255,255,0.4), 0 ${S.balloonShadowOuter1}px ${S.balloonShadowOuter2}px rgba(0,0,0,0.3), 0 0 ${S.balloonShadowGlow}px ${b.color}40`, position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10%', left: '15%', width: '32%', height: '38%', background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.3) 100%)', borderRadius: '50%', filter: `blur(${S.balloonHighlight1Blur}px)` }} />
              <div style={{ position: 'absolute', top: '25%', left: '55%', width: '18%', height: '22%', background: 'rgba(255,255,255,0.4)', borderRadius: '50%', filter: `blur(${S.balloonHighlight2Blur}px)` }} />
              <div style={{ position: 'absolute', bottom: '20%', right: '12%', width: '10%', height: '12%', background: 'rgba(255,255,255,0.25)', borderRadius: '50%', filter: `blur(${S.balloonHighlight3Blur}px)` }} />
            </div>
            <div style={{ position: 'absolute', bottom: -S.balloonKnotOffset, left: '50%', transform: 'translateX(-50%)', width: S.balloonKnotSize, height: S.balloonKnotSize, background: `linear-gradient(180deg, ${darken(b.color, 15)} 0%, ${darken(b.color, 35)} 100%)`, clipPath: 'polygon(50% 0%, 10% 100%, 90% 100%)' }} />
          </div>
        );
      })}
    </div>
  );
};

const CommentSlideshow = ({ comments, S }: { comments: Comment[]; S: typeof BASE }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (comments.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % comments.length), 4000);
    return () => clearInterval(t);
  }, [comments.length]);
  if (!comments.length) return null;
  return (
    <div className="absolute w-full flex justify-center pointer-events-none" style={{ bottom: S.slideshowBottom, paddingLeft: S.slideshowPadX, paddingRight: S.slideshowPadX, zIndex: 20 }}>
      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: S.slideshowAnimOffset }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -S.slideshowAnimOffset }} transition={{ duration: 0.4 }} className="bg-black/60 backdrop-blur-md border border-white/10 text-white/90 shadow-md text-center truncate" style={{ paddingLeft: S.slideshowBubblePadX, paddingRight: S.slideshowBubblePadX, paddingTop: S.slideshowBubblePadY, paddingBottom: S.slideshowBubblePadY, fontSize: S.slideshowFontSize, maxWidth: S.slideshowMaxWidth, borderRadius: S.slideshowRadius }}>
          <span className="text-[#d4af37] font-bold mr-2">{comments[idx].name}:</span>
          {comments[idx].message}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// SVG icons for volume indicator
const VolumeHighSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="white" fillOpacity="0.9"/>
    <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7"/>
  </svg>
);

const VolumeMidSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="white" fillOpacity="0.9"/>
    <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const VolumeLowSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="white" fillOpacity="0.9"/>
  </svg>
);

const VolumeMuteSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="white" fillOpacity="0.5"/>
    <path d="M22 9L17 14M17 9L22 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

function extractYouTubeId(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
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

export default function FreeStoryMode() {
  const router = useRouter();
  const scale = useProportionalScale();
  const S = useScaled(scale);

  const [data, setData] = useState<any>(null);
  const [storyNotFound, setStoryNotFound] = useState(false);
  const [isSavingStory, setIsSavingStory] = useState(false);
  const [creatorEmail, setCreatorEmail] = useState('');
  const [emotionalTerm, setEmotionalTerm] = useState('');
  const [babyTerm, setBabyTerm] = useState('');
  const [coupleTerm, setCoupleTerm] = useState('');
  const [stage, setStage] = useState('ENVELOPE');
  const [countdown, setCountdown] = useState(3);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [visitorName, setVisitorName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytSoughtOnceRef = useRef(false);
  const ytLoadedRef = useRef(false);
  const userHasInteracted = useRef(false);
  const [ytReady, setYtReady] = useState(false);
  const [imgFit, setImgFit] = useState<ImageFitMode>('cover');
  const [currentImgSrc, setCurrentImgSrc] = useState<string>('');

  const [globalPopCount, setGlobalPopCount] = useState(0);
  const [showPopNumber, setShowPopNumber] = useState(false);
  
  const hasPreloadedRef = useRef(false);
  const hasAudioStartedRef = useRef(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [qrDataUri, setQrDataUri] = useState<string | null>(null);

  const [hasDownloaded, setHasDownloaded] = useState(false);
  // DOM-to-image pipeline state
  const [geminiHtml, setGeminiHtml]     = useState<string | null>(null);
  const [pendingCapture, setPendingCapture] = useState(false);
  const posterRenderRef = useRef<HTMLDivElement>(null);

  // Sequential poster template loop: 0→1→2→0→1→2…
  // Increments each time a poster is successfully generated.
  // Sent as poster_index to route; route selects template = poster_index % 3.
  //
  // ── ROOT CAUSE FIX (persisted via localStorage) ───────────────────────────
  // Plain useState(0) reset to 0 on every remount of this preview page
  // (this app reloads celebrationData from localStorage on mount — see below
  // — confirming this page DOES remount between "Redesign" clicks in some
  // flows). That reset meant poster_index was ALWAYS 0 → route.ts ALWAYS
  // picked Template 0 → same poster every single time, regardless of
  // regenerate clicks.
  //
  // Fix: read the last index from localStorage on init, and persist every
  // increment back to localStorage — exactly the pattern already used by
  // celebrationData / jashnVisitorName / jashnGlobalBalloonPopCount below.
  // This guarantees the 0→1→2→0→1→2 loop survives remounts.
  const POSTER_INDEX_KEY = 'jashnPosterIndex';
  const [posterIndex, setPosterIndexState] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const saved = parseInt(localStorage.getItem(POSTER_INDEX_KEY) || '0', 10);
    return Number.isFinite(saved) ? ((saved % 3) + 3) % 3 : 0;
  });
  const setPosterIndex = (updater: number | ((prev: number) => number)) => {
    setPosterIndexState(prev => {
      const next = typeof updater === 'function' ? (updater as (p: number) => number)(prev) : updater;
      const normalized = ((next % 3) + 3) % 3;
      try { localStorage.setItem(POSTER_INDEX_KEY, String(normalized)); } catch {}
      return normalized;
    });
  };

  const [birthdaySelfLine, setBirthdaySelfLine] = useState('');
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const [preloadingProgress, setPreloadingProgress] = useState(0);

  const volumeLevel = useRef(70);
  const [volDisplay, setVolDisplay] = useState({ show: false, level: 70 });
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchStartVol = useRef(70);
  const isVolGesture = useRef(false);
  const gestureDecided = useRef(false);
  const isOverlayOpen = useRef(false);
  const volHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleImageLoad = (img: HTMLImageElement) => {
    const fit = determineImageFit(img);
    setImgFit(fit);
    setCurrentImgSrc(img.src);
  };

  useEffect(() => {
    (async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const storyIdParam = searchParams.get('storyId') || searchParams.get('pageId') || searchParams.get('id');

      // 1. Fetch real-time balloon pops count for this specific story
      try {
        const url = storyIdParam ? `/api/balloon-pop?storyId=${storyIdParam}` : '/api/balloon-pop';
        const popRes = await fetch(url);
        const popJson = await popRes.json();
        if (popJson.success && typeof popJson.count === 'number') {
          setGlobalPopCount(popJson.count);
          localStorage.setItem(`jashnBalloonPopCount_${storyIdParam || 'global'}`, popJson.count.toString());
        }
      } catch (popErr) {
        console.error('Failed to fetch real global pop count, falling back to local storage', popErr);
        const savedGlobalPopCount = localStorage.getItem(`jashnBalloonPopCount_${storyIdParam || 'global'}`);
        if (savedGlobalPopCount) {
          setGlobalPopCount(parseInt(savedGlobalPopCount) || 0);
        } else {
          setGlobalPopCount(0);
        }
      }

      // 2. Load story (either from URL storyId param or from localStorage draft)
      let loadedData: any = null;
      let databaseComments: any[] = [];
      let shouldAutoSave = false;

      if (storyIdParam) {
        try {
          const storyRes = await fetch(`/api/free-story?storyId=${storyIdParam}`);
          const storyJson = await storyRes.json();
          if (storyJson.success && storyJson.story) {
            let rawData = storyJson.story.celebrationData || storyJson.story;
            if (typeof rawData === 'string') {
              try { rawData = JSON.parse(rawData); } catch {}
            }
            loadedData = rawData;
            databaseComments = storyJson.story.comments || [];
            if (storyJson.story.email) {
              setCreatorEmail(storyJson.story.email);
            } else if (loadedData?.premiumEmail) {
              setCreatorEmail(loadedData.premiumEmail);
            }
            
            // Sync with local terms if present in stored object
            if (loadedData?.emotionalTerm) setEmotionalTerm(loadedData.emotionalTerm);
            if (loadedData?.babyTerm) setBabyTerm(loadedData.babyTerm);
            if (loadedData?.coupleTerm) setCoupleTerm(loadedData.coupleTerm);
          }
        } catch (storyErr) {
          console.error('Error fetching story from backend:', storyErr);
        }
      }

      // Safe fallback to local draft if backend fetch fails or story was newly created in client
      if (!loadedData) {
        const saved = localStorage.getItem('celebrationData');
        if (saved) {
          try {
            const localData = JSON.parse(saved);
            // Only use local draft if storyIdParam matches or if no storyIdParam is specified
            if (!storyIdParam || localData.storyId === storyIdParam) {
              loadedData = localData;
              if (storyIdParam) {
                loadedData.storyId = storyIdParam;
              } else if (!loadedData.storyId) {
                loadedData.storyId = `story-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
              }
              if (loadedData.premiumEmail) {
                setCreatorEmail(loadedData.premiumEmail);
              }
              localStorage.setItem('celebrationData', JSON.stringify(loadedData));
              shouldAutoSave = true;
            }
          } catch (e) {
            console.error('Error parsing local celebrationData:', e);
          }
        }
      }

      // Retry fetch loop if still no loadedData and storyIdParam exists (in case background Firestore save was slightly delayed)
      if (!loadedData && storyIdParam) {
        const retryDelays = [800, 1500, 2500];
        for (const delay of retryDelays) {
          await new Promise(res => setTimeout(res, delay));
          try {
            const retryRes = await fetch(`/api/free-story?storyId=${storyIdParam}`);
            const retryJson = await retryRes.json();
            if (retryJson.success && retryJson.story) {
              let rawData = retryJson.story.celebrationData || retryJson.story;
              if (typeof rawData === 'string') {
                try { rawData = JSON.parse(rawData); } catch {}
              }
              loadedData = rawData;
              databaseComments = retryJson.story.comments || [];
              if (retryJson.story.email) {
                setCreatorEmail(retryJson.story.email);
              } else if (loadedData?.premiumEmail) {
                setCreatorEmail(loadedData.premiumEmail);
              }
              break;
            }
          } catch (_) {}
        }
      }

      if (!loadedData) {
        setStoryNotFound(true);
      }

      // Process loadedData if we found it (either from DB or matching local storage draft)
      if (loadedData) {
        // Convert any blob URLs in loadedData (heroImage, secretImage, creatorPhoto, music, galleryPhotos, photos) to base64 Data URLs
        const convertBlobToDataUrl = async (src: string) => {
          if (!src || typeof src !== 'string' || !src.startsWith('blob:')) return src;
          try {
            const resp = await fetch(src);
            const blob = await resp.blob();
            return await new Promise<string>((res) => {
              const reader = new FileReader();
              reader.onload = () => res(reader.result as string);
              reader.onerror = () => res(src);
              reader.readAsDataURL(blob);
            });
          } catch { return src; }
        };

        if (loadedData.heroImage?.startsWith('blob:')) {
          loadedData.heroImage = await convertBlobToDataUrl(loadedData.heroImage);
        }
        if (loadedData.secretImage?.startsWith('blob:')) {
          loadedData.secretImage = await convertBlobToDataUrl(loadedData.secretImage);
        }
        if (loadedData.creatorPhoto?.startsWith('blob:')) {
          loadedData.creatorPhoto = await convertBlobToDataUrl(loadedData.creatorPhoto);
        }
        if (loadedData.music?.startsWith('blob:')) {
          loadedData.music = await convertBlobToDataUrl(loadedData.music);
        }
        if (Array.isArray(loadedData.galleryPhotos) && loadedData.galleryPhotos.some((p: string) => p?.startsWith('blob:'))) {
          loadedData.galleryPhotos = await Promise.all(loadedData.galleryPhotos.map(convertBlobToDataUrl));
        }
        if (Array.isArray(loadedData.photos) && loadedData.photos.some((p: string) => p?.startsWith('blob:'))) {
          loadedData.photos = await Promise.all(loadedData.photos.map(convertBlobToDataUrl));
        }
        try { localStorage.setItem('celebrationData', JSON.stringify(loadedData)); } catch {}

        // Auto-save Story Mode draft to backend Firestore & GCS
        if (shouldAutoSave && loadedData?.mode !== 'PREMIUM' && !loadedData?.storyId?.startsWith('page-')) {
          setIsSavingStory(true);
          try {
            const res = await fetch('/api/free-story', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                storyId: loadedData.storyId,
                email: loadedData.email || loadedData.premiumEmail || creatorEmail || '',
                celebrationData: loadedData
              })
            });
            const json = await res.json();
            if (json.success) {
              console.log('Free story auto-saved successfully:', json.storyId);
              // Load updated celebrationData with GCS URLs
              const storyRes = await fetch(`/api/free-story?storyId=${json.storyId}`);
              const storyJson = await storyRes.json();
              if (storyJson.success && storyJson.story) {
                loadedData = storyJson.story.celebrationData;
                if (storyJson.story.email) {
                  setCreatorEmail(storyJson.story.email);
                }
                localStorage.setItem('celebrationData', JSON.stringify(loadedData));
              }
              const newUrl = `${window.location.pathname}?storyId=${loadedData.storyId}`;
              window.history.replaceState({ ...window.history.state, url: newUrl }, '', newUrl);
            } else {
              console.error('Failed to auto-save free story:', json.error);
            }
          } catch (err) {
            console.error('Error auto-saving free story:', err);
          } finally {
            setIsSavingStory(false);
          }
        }
      }

      if (loadedData) {
        // Ensure loadedData.photos is non-empty and contains all available photos
        const photosList = Array.isArray(loadedData.photos) && loadedData.photos.length > 0 ? [...loadedData.photos] : [];
        if (photosList.length === 0) {
          if (loadedData.heroImage) photosList.push(loadedData.heroImage);
          if (Array.isArray(loadedData.galleryPhotos)) {
            loadedData.galleryPhotos.forEach((p: string) => { if (p && !photosList.includes(p)) photosList.push(p); });
          }
          if (loadedData.secretImage && !photosList.includes(loadedData.secretImage)) photosList.push(loadedData.secretImage);
        }
        loadedData.photos = photosList;

        setData(loadedData);

        // Load comments (prefer database comments if available, else local storage)
        if (storyIdParam && databaseComments.length > 0) {
          setComments(databaseComments);
        } else {
          const allCommentsStr = localStorage.getItem('storyCommentsV3');
          if (allCommentsStr) {
            const allComments = JSON.parse(allCommentsStr);
            const storyComments = allComments.filter((c: any) => c.storyId === loadedData.storyId);
            setComments(storyComments);
          }
        }

        const n = localStorage.getItem('jashnVisitorName');
        if (n) { setVisitorName(n); setIsNameSet(true); }

        const savedTerm = localStorage.getItem('emotionalTerm');
        if (savedTerm) setEmotionalTerm(savedTerm);

        const savedBabyTerm = localStorage.getItem('babyTerm');
        if (savedBabyTerm) setBabyTerm(savedBabyTerm);

        const savedCoupleTerm = localStorage.getItem('coupleTerm');
        if (savedCoupleTerm) setCoupleTerm(savedCoupleTerm);

        if (loadedData.category === 'BIRTHDAY' && loadedData.isForSelf) {
          const line = BIRTHDAY_SELF_LINES[birthdayLineIndex % BIRTHDAY_SELF_LINES.length];
          birthdayLineIndex++;
          setBirthdaySelfLine(line);
        }
      }
    })();
  }, []);

  // Industrial-grade image preloading & GPU decoding effect before revealing story
  useEffect(() => {
    if (!data || hasPreloadedRef.current) return;

    let isMounted = true;
    setImagesPreloaded(false);
    setPreloadingProgress(0);

    const rawUrlsToPreload: string[] = [
      ...(Array.isArray(data.photos) ? data.photos : []),
      data.heroImage,
      data.creatorPhoto,
      data.secretImage,
      ...(Array.isArray(data.galleryPhotos) ? data.galleryPhotos : [])
    ].filter((u): u is string => Boolean(u && typeof u === 'string'));

    const urlsToPreload = Array.from(new Set(rawUrlsToPreload));

    if (urlsToPreload.length === 0) {
      hasPreloadedRef.current = true;
      setImagesPreloaded(true);
      setPreloadingProgress(100);
      return;
    }

    let loadedCount = 0;
    const total = urlsToPreload.length;

    const checkAndFinishPreloading = () => {
      hasPreloadedRef.current = true;
      const songUrl = data?.youtubeMusicUrl || data?.music;
      const videoId = extractYouTubeId(songUrl);
      if (videoId && !ytLoadedRef.current) {
        let waitTime = 0;
        const startSecs = parseTimestampSeconds(data?.storyAudioStartTimestamp || data?.webAudioStartTimestamp);
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
    }, 12000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [data]);

  // Realtime comments and story document syncing using Firestore
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const storyIdParam = searchParams.get('storyId');
    if (!storyIdParam) return;

    let unsubscribeComments: (() => void) | null = null;
    let unsubscribeStory: (() => void) | null = null;

    const setupRealtimeSync = async () => {
      try {
        console.log(`[Realtime Sync] Fetching Firebase Config from /api/firebase-config...`);
        const res = await fetch('/api/firebase-config');
        const json = await res.json();
        if (json.success && json.config) {
          const { initializeApp, getApps } = await import('firebase/app');
          const { getFirestore, collection, doc, onSnapshot } = await import('firebase/firestore');

          const clientApp = getApps().length === 0 
            ? initializeApp(json.config)
            : getApps()[0];

          const clientDb = json.config.firestoreDatabaseId 
            ? getFirestore(clientApp, json.config.firestoreDatabaseId)
            : getFirestore(clientApp);

          // 1. Subscribe to Comments Subcollection
          console.log(`[Realtime Sync] Subscribing to comments subcollection for story: ${storyIdParam}`);
          const commentsColRef = collection(clientDb, 'free_stories', storyIdParam, 'comments');

          unsubscribeComments = onSnapshot(commentsColRef, (snapshot) => {
            const realtimeComments: Comment[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              realtimeComments.push({
                id: data.id || docSnap.id,
                name: data.name || 'Guest',
                message: data.message || '',
                timestamp: data.timestamp || new Date().toISOString(),
                storyId: data.storyId || storyIdParam
              });
            });

            // Sort comments chronologically ascending
            realtimeComments.sort((a, b) => {
              return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            });

            console.log(`[Realtime Sync] Received update. ${realtimeComments.length} comments loaded in real-time.`);
            setComments(realtimeComments);
          }, (err) => {
            console.error('[Realtime Sync] Comments listener error:', err);
          });

          // 2. Subscribe to Story Document to get real-time pop counter & achievements
          console.log(`[Realtime Sync] Subscribing to story document for story: ${storyIdParam}`);
          const storyDocRef = doc(clientDb, 'free_stories', storyIdParam);

          unsubscribeStory = onSnapshot(storyDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const storyData = docSnap.data();
              const count = storyData.popCount !== undefined 
                ? storyData.popCount 
                : (storyData.balloonPops !== undefined ? storyData.balloonPops : 0);
              
              console.log(`[Realtime Sync] Story doc updated in real-time. popCount = ${count}`);
              setGlobalPopCount(count);
              localStorage.setItem(`jashnBalloonPopCount_${storyIdParam}`, count.toString());
            } else {
              console.warn(`[Realtime Sync] Story document does not exist yet.`);
            }
          }, (err) => {
            console.error('[Realtime Sync] Story document listener error:', err);
          });

        } else {
          console.error('[Realtime Sync] Failed to load firebase config:', json.error);
        }
      } catch (err) {
        console.error('[Realtime Sync] Setup error:', err);
      }
    };

    setupRealtimeSync();

    return () => {
      if (unsubscribeComments) {
        console.log(`[Realtime Sync] Cleaning up comments subscription for ${storyIdParam}`);
        unsubscribeComments();
      }
      if (unsubscribeStory) {
        console.log(`[Realtime Sync] Cleaning up story document subscription for ${storyIdParam}`);
        unsubscribeStory();
      }
    };
  }, []);

  useEffect(() => {
    isOverlayOpen.current = showQR || showComments || showAchievements;
  }, [showQR, showComments, showAchievements]);

  const handleBalloonPop = () => {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const storyIdParam = searchParams?.get('storyId');
    const targetStoryId = data?.storyId || storyIdParam;

    setGlobalPopCount(prev => {
      const newCount = prev + 1;
      try {
        localStorage.setItem(`jashnBalloonPopCount_${targetStoryId || 'global'}`, newCount.toString());
      } catch {}
      return newCount;
    });

    // Send balloon pop event to backend to aggregate globally
    if (targetStoryId) {
      fetch('/api/balloon-pop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: targetStoryId,
          isPremium: data?.mode === 'PREMIUM' || false
        })
      }).catch(err => console.error('Error posting balloon pop:', err));
    }

    setShowPopNumber(true);
    setTimeout(() => {
      setShowPopNumber(false);
    }, 800);
  };

  const onVolTouchStart = (e: TouchEvent) => {
    if (isOverlayOpen.current) return;
    if (stage !== 'STORY') return;
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    touchStartVol.current = volumeLevel.current;
    isVolGesture.current = false;
    gestureDecided.current = false;
  };

  const onVolTouchMove = (e: TouchEvent) => {
    if (isOverlayOpen.current) return;
    if (stage !== 'STORY') return;

    const currX = e.touches[0].clientX;
    const currY = e.touches[0].clientY;
    const dx = Math.abs(currX - touchStartPos.current.x);
    const dy = Math.abs(currY - touchStartPos.current.y);

    if (!gestureDecided.current && (dx > 8 || dy > 8)) {
      gestureDecided.current = true;
      isVolGesture.current = dy > dx;
    }

    if (!isVolGesture.current) return;

    e.preventDefault();

    const verticalDelta = touchStartPos.current.y - currY;
    const volumeChange = (verticalDelta / window.innerHeight) * 150;
    let newVol = Math.round(touchStartVol.current + volumeChange);
    newVol = Math.max(0, Math.min(100, newVol));

    volumeLevel.current = newVol;
    setVolDisplay({ show: true, level: newVol });

    const audioEl = document.querySelector('audio') as HTMLAudioElement;
    if (audioEl) audioEl.volume = newVol / 100;
  };

  const onVolTouchEnd = () => {
    if (isVolGesture.current) {
      if (volHideTimer.current) clearTimeout(volHideTimer.current);
      volHideTimer.current = setTimeout(() => {
        setVolDisplay(prev => ({ ...prev, show: false }));
      }, 300);
    }
    gestureDecided.current = false;
    isVolGesture.current = false;
  };

  useEffect(() => {
    document.addEventListener('touchstart', onVolTouchStart as any, { passive: true });
    document.addEventListener('touchmove', onVolTouchMove as any, { passive: false });
    document.addEventListener('touchend', onVolTouchEnd);

    return () => {
      document.removeEventListener('touchstart', onVolTouchStart as any);
      document.removeEventListener('touchmove', onVolTouchMove as any);
      document.removeEventListener('touchend', onVolTouchEnd);
      if (volHideTimer.current) clearTimeout(volHideTimer.current);
    };
  }, [stage]);

  // Removed buggy popstate navigation listener that forced automatic redirect to home in iframe environments.

  // Parse timestamp string "00:15" or "15" into seconds
  const parseTimestampSeconds = (ts?: string): number => {
    if (!ts) return 0;
    const clean = String(ts).trim().toLowerCase().replace('s', '');
    if (clean.includes(':')) {
      const parts = clean.split(':');
      const mins = parseFloat(parts[0]) || 0;
      const secs = parseFloat(parts[1]) || 0;
      return mins * 60 + secs;
    }
    return parseFloat(clean) || 0;
  };

  // Audio controller with 2-second smooth fade-in and timestamp support for Story Mode
  const playAudioWithSettings = useCallback(() => {
    const songUrl = data?.youtubeMusicUrl || data?.music;
    const videoId = extractYouTubeId(songUrl);
    if (videoId) {
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
      }
      return;
    }
    if (!audioRef.current || !data?.music || muted) return;

    const timestampSecs = parseTimestampSeconds(data.storyAudioStartTimestamp || data.webAudioStartTimestamp);
    if (timestampSecs > 0 && Math.abs(audioRef.current.currentTime - timestampSecs) > 1 && audioRef.current.paused) {
      try {
        audioRef.current.currentTime = timestampSecs;
      } catch (err) {
        console.warn('Could not set currentTime on audio element:', err);
      }
    }

    const fadeDuration = 2000; // 2-second fade-in effect for Story mode
    const targetVol = (volumeLevel.current || 70) / 100;

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

  // Preload YouTube background song immediately on load and during ENVELOPE / PRELOADER stage
  useEffect(() => {
    const songUrl = data?.youtubeMusicUrl || data?.music;
    const videoId = extractYouTubeId(songUrl);
    if (!videoId) return;

    let cancelled = false;
    let checkInterval: any = null;
    const startSecs = parseTimestampSeconds(data?.storyAudioStartTimestamp || data?.webAudioStartTimestamp);

    const createYtPlayer = () => {
      if (cancelled || !ytContainerRef.current || !window.YT?.Player) return;
      if (ytPlayerRef.current) return;
      try {
        new window.YT.Player(ytContainerRef.current, {
          videoId,
          playerVars: {
            autoplay: 1, controls: 0, modestbranding: 1, rel: 0,
            iv_load_policy: 3, disablekb: 1, playsinline: 1,
            enablejsapi: 1, loop: 1, playlist: videoId,
            ...(startSecs > 0 ? { start: Math.floor(startSecs) } : {})
          },
          events: {
            onReady: (e: any) => {
              if (cancelled) return;
              ytPlayerRef.current = e.target;
              setYtReady(true);
              ytLoadedRef.current = true;
              try {
                if (startSecs > 0 && !ytSoughtOnceRef.current) {
                  e.target.seekTo(startSecs, true);
                  ytSoughtOnceRef.current = true;
                }
                if (userHasInteracted.current || stage === 'COUNTDOWN' || stage === 'STORY') {
                  e.target.unMute();
                  e.target.setVolume(volumeLevel.current || 70);
                  e.target.playVideo();
                } else {
                  e.target.mute();
                  e.target.playVideo();
                  setTimeout(() => { try { e.target.pauseVideo(); } catch {} }, 300);
                }
              } catch {}
            },
            onStateChange: (e: any) => {
              if (e.data === window.YT.PlayerState.ENDED) {
                try { e.target.playVideo(); } catch {}
              }
              if (e.data === 1 || e.data === 2 || e.data === 3 || e.data === 5) {
                ytLoadedRef.current = true;
              }
            }
          }
        });
      } catch (err) {
        console.warn('YouTube Player creation error:', err);
      }
    };

    if (window.YT?.Player) {
      createYtPlayer();
    } else {
      const existing = document.getElementById('youtube-iframe-api');
      if (!existing) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevReady?.();
        createYtPlayer();
      };
      checkInterval = setInterval(() => {
        if (cancelled) return;
        if (ytLoadedRef.current || (ytPlayerRef.current && ytPlayerRef.current.getPlayerState?.() !== -1)) {
          ytLoadedRef.current = true;
          if (checkInterval) clearInterval(checkInterval);
          return;
        }
        if (window.YT?.Player) {
          createYtPlayer();
        }
      }, 150);
    }

    return () => {
      cancelled = true;
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [data?.youtubeMusicUrl, data?.music, data?.storyAudioStartTimestamp, data?.webAudioStartTimestamp]);

  // Gesture unlock on "Tap to Open" click
  const handleTapToOpen = (e?: React.MouseEvent) => {
    if (stage !== 'ENVELOPE') return;
    if (e) e.stopPropagation();
    userHasInteracted.current = true;
    const songUrl = data?.youtubeMusicUrl || data?.music;
    const videoId = extractYouTubeId(songUrl);
    const startSecs = parseTimestampSeconds(data?.storyAudioStartTimestamp || data?.webAudioStartTimestamp);

    if (videoId && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume((volumeLevel.current || 70));
        if (startSecs > 0 && !ytSoughtOnceRef.current) {
          ytPlayerRef.current.seekTo(startSecs, true);
          ytSoughtOnceRef.current = true;
        }
        ytPlayerRef.current.playVideo();
      } catch (e) {
        console.warn('YouTube gesture unlock error:', e);
      }
    } else if (audioRef.current && data?.music && !muted) {
      try {
        audioRef.current.volume = 0.7;
        if (startSecs > 0) audioRef.current.currentTime = startSecs;
        audioRef.current.play().then(() => {
          // audio unlocked
        }).catch(() => {});
      } catch (e) {}
    }

    setStage('COUNTDOWN');
  };

  // Ensure playback runs smoothly during COUNTDOWN or STORY stage without disrupting ongoing stream
  useEffect(() => {
    if (stage === 'COUNTDOWN' || stage === 'STORY') {
      const songUrl = data?.youtubeMusicUrl || data?.music;
      const videoId = extractYouTubeId(songUrl);
      const startSecs = parseTimestampSeconds(data?.storyAudioStartTimestamp || data?.webAudioStartTimestamp);

      if (videoId && !ytPlayerRef.current && window.YT?.Player && ytContainerRef.current) {
        try {
          ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
            videoId,
            playerVars: {
              autoplay: 1, controls: 0, modestbranding: 1, rel: 0,
              iv_load_policy: 3, disablekb: 1, playsinline: 1,
              enablejsapi: 1, loop: 1, playlist: videoId,
              ...(startSecs > 0 ? { start: Math.floor(startSecs) } : {})
            },
            events: {
              onReady: (e: any) => {
                ytPlayerRef.current = e.target;
                ytLoadedRef.current = true;
                try {
                  e.target.unMute();
                  e.target.setVolume(volumeLevel.current || 70);
                  if (startSecs > 0 && !ytSoughtOnceRef.current) {
                    e.target.seekTo(startSecs, true);
                    ytSoughtOnceRef.current = true;
                  }
                  e.target.playVideo();
                } catch {}
              }
            }
          });
        } catch {}
      }

      let attempts = 0;
      const retryTimer = setInterval(() => {
        attempts++;
        if (ytPlayerRef.current) {
          try {
            const playerState = ytPlayerRef.current.getPlayerState?.();
            // 1 = PLAYING, 3 = BUFFERING. If playing or buffering, DO NOT disrupt playback or seek!
            if (playerState === 1 || playerState === 3) {
              ytLoadedRef.current = true;
              clearInterval(retryTimer);
              return;
            }
            // State is paused (-1, 2, 5). Unmute and trigger play ONCE.
            ytPlayerRef.current.unMute?.();
            ytPlayerRef.current.setVolume?.(volumeLevel.current || 70);
            if (startSecs > 0 && !ytSoughtOnceRef.current) {
              ytPlayerRef.current.seekTo(startSecs, true);
              ytSoughtOnceRef.current = true;
            }
            ytPlayerRef.current.playVideo();
          } catch (err) {
            console.warn('Retry YouTube play error:', err);
          }
        }
        if (attempts >= 10) {
          clearInterval(retryTimer);
        }
      }, 250);

      return () => clearInterval(retryTimer);
    }
  }, [stage, data]);

  // Trigger audio automatically when entering STORY stage
  useEffect(() => {
    if (stage === 'STORY') {
      if (hasAudioStartedRef.current) return;
      const songUrl = data?.youtubeMusicUrl || data?.music;
      const videoId = extractYouTubeId(songUrl);
      const startSecs = parseTimestampSeconds(data?.storyAudioStartTimestamp || data?.webAudioStartTimestamp);

      if (videoId && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.seekTo(startSecs, true);
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume((volumeLevel.current || 70));
          ytPlayerRef.current.playVideo();
          hasAudioStartedRef.current = true;
        } catch (err) {
          console.warn('YouTube playback error:', err);
        }
      } else if (data?.music && audioRef.current?.paused) {
        playAudioWithSettings();
        hasAudioStartedRef.current = true;
      }
    } else {
      hasAudioStartedRef.current = false;
    }
  }, [stage, data, playAudioWithSettings]);

  // Countdown timer effect with zero-delay synchronous song playback when countdown reaches 0
  useEffect(() => {
    if (stage === 'COUNTDOWN') {
      const t = setInterval(() => setCountdown(c => c - 1), 1000);
      if (countdown === 0) {
        clearInterval(t);
        setStage('STORY');

        const songUrl = data?.youtubeMusicUrl || data?.music;
        const videoId = extractYouTubeId(songUrl);
        const startSecs = parseTimestampSeconds(data?.storyAudioStartTimestamp || data?.webAudioStartTimestamp);

        if (videoId && ytPlayerRef.current) {
          try {
            ytPlayerRef.current.seekTo(startSecs, true);
            ytPlayerRef.current.unMute();
            ytPlayerRef.current.setVolume((volumeLevel.current || 70));
            ytPlayerRef.current.playVideo();
          } catch (err) {
            console.warn('YouTube playback at countdown end error:', err);
          }
        } else {
          playAudioWithSettings();
        }

        if (!confettiHasFired) {
          confettiHasFired = true;
          setTimeout(() => {
            triggerProfessionalConfetti();
          }, 300);
        }
      }
      return () => clearInterval(t);
    }
  }, [stage, countdown, data, playAudioWithSettings]);

  useEffect(() => {
    if (stage === 'STORY' && data?.photos?.length > 1) {
      const t = setInterval(() => setCurrentSlide(i => (i + 1) % data.photos.length), 4000);
      return () => clearInterval(t);
    }
  }, [stage, data]);

  useEffect(() => {
    setCurrentImgSrc('');
  }, [currentSlide]);

  const getSmartFestivalTitle = (occasionName: string) => {
    if (!occasionName) return '';
    const trimmed = occasionName.trim();
    if (trimmed.toLowerCase().startsWith('happy')) {
      return trimmed;
    }
    return `Happy ${trimmed}`;
  };

  const getFormattedTitle = () => {
    if (!data) return '';

    if (data.category === 'SPECIAL') {
      if (data.specialSubcategory === 'NEW_MEMBERS' || data.specialSubcategory === 'MARRIAGE_DATE_FIX') {
        if (data.selectedLanguage === 'hindi') {
          return 'जश्न करने का समय';
        } else {
          return "Let's Celebration Time";
        }
      }
      if (data.specialSubcategory === 'FESTIVALS') {
        return getSmartFestivalTitle(data.occasionName || '');
      }
      return data.occasionName || '';
    }

    if (data.category === 'BIRTHDAY' && data.isForSelf) {
      return '';
    }

    const count = data.count ? getOrdinal(data.count) : '';
    if (data.category === 'BIRTHDAY') return `Happy ${count} Birthday`;
    if (data.category === 'MARRIAGE' || data.category === 'RELATIONSHIP') return `Happy ${count} Anniversary`;
    return data.occasion || 'Celebration';
  };

  const getTermLine = () => {
    if (!data) return '';

    if (data.termLine) return data.termLine;
    if (data.tagline) return data.tagline;
    if (data.funnyTagline) return data.funnyTagline;

    if (data.category === 'BIRTHDAY') {
      if (data.isForSelf) {
        if (emotionalTerm || data.emotionalTerm) return emotionalTerm || data.emotionalTerm;
      } else {
        if (data.relation || data.relationLabel) return data.relation || data.relationLabel;
      }
    }

    if (data.category === 'MARRIAGE' || data.category === 'RELATIONSHIP') {
      if (data.isForSelf && (emotionalTerm || data.emotionalTerm)) return emotionalTerm || data.emotionalTerm;
      if (!data.isForSelf && (data.relationLabel || data.relation)) return data.relationLabel || data.relation;
      return data.relation || data.relationLabel || data.emotionalTerm || '';
    }

    if (data.category === 'SPECIAL') {
      if (data.specialSubcategory === 'NEW_MEMBERS' && (babyTerm || data.babyTerm)) return babyTerm || data.babyTerm;
      if (data.specialSubcategory === 'MARRIAGE_DATE_FIX' && (coupleTerm || data.coupleTerm)) return coupleTerm || data.coupleTerm;
    }

    return data.relation || data.relationLabel || data.emotionalTerm || data.babyTerm || data.coupleTerm || '';
  };

  const getDisplayName = () => {
    if (!data) return '';

    if (data.category === 'BIRTHDAY' && data.isForSelf) {
      return '';
    }

    if (data.category === 'SPECIAL') {
      if (data.specialSubcategory === 'NEW_MEMBERS') {
        const fatherName = data.fatherName || '';
        const motherName = data.motherName || '';
        if (fatherName && motherName) return `${fatherName} & ${motherName}`;
        if (fatherName) return fatherName;
        if (motherName) return motherName;
        return 'Our Family';
      }

      if (data.specialSubcategory === 'MARRIAGE_DATE_FIX') {
        const name1 = data.name1 || '';
        const name2 = data.name2 || '';
        if (name1 && name2) return `${name1} & ${name2}`;
        if (name1) return name1;
        if (name2) return name2;
        return 'The Couple';
      }

      return '';
    }

    if (data.category === 'BIRTHDAY') {
      return data.names || '';
    }

    if (data.category === 'MARRIAGE' || data.category === 'RELATIONSHIP') {
      return data.names || '';
    }

    return data.names || '';
  };

  const getSelfProfileText = () => {
    if (!data || !data.isForSelf) return '';
    if (data.category === 'MARRIAGE') {
      if (data.whoAreYou === 'WIFE') return 'From your wife';
      if (data.whoAreYou === 'HUSBAND') return 'From your husband';
    }
    if (data.category === 'RELATIONSHIP') {
      if (data.whoAreYou === 'FEMALE_PARTNER') return 'Your dear';
      if (data.whoAreYou === 'MALE_PARTNER') return 'Your love';
    }
    return '';
  };

  const isAutoProfile = (name: string) => {
    if (!name) return false;
    const autoProfilePrefixes = ['From your', 'Your dear', 'Your love'];
    return autoProfilePrefixes.some(prefix => name.startsWith(prefix));
  };


  // ═══════════════════════════════════════════════════════════════════
  // HANDLE DOWNLOAD — DOM-to-Image Architecture
  // Pipeline A (success): Gemini returns HTML → render in hidden div
  //                       → html-to-image captures → JPEG download
  // Pipeline B (fallback): Gemini fails → hardcoded canvas poster
  //
  // Routes:
  //   LAYOUT_1_COLLAGE → /api/generate-poster-styling  (9:16, up to 5 photos)
  //   LAYOUT_2_JAYANTI → /api/generate-poster-layout   (1:1, 1 hero photo)
  // ═══════════════════════════════════════════════════════════════════

  // ── Helper: HTMLImageElement → { url: base64, orientation } ────────────
  // orientation = 'vertical' if taller than wide, 'horizontal' otherwise.
  // Routes use orientation to pick frame aspect-ratio (1/1 vs 4/3).
  // All images rendered with object-position:center center (equal crop on all sides).
  const imageToPayload = (img: HTMLImageElement): { url: string; orientation: string } => {
    const iw = img.naturalWidth  || img.width  || 512;
    const ih = img.naturalHeight || img.height || 512;

    // ── MODULE 6: Safe-Head drawImage math ───────────────────────────────────
    // GOAL: preserve the top 95% of the image (face zone), crop only bottom 5%.
    // MATH:
    //   SOURCE skip: sy = ih × 0.05  (skip top 5% of source image)
    //   SOURCE read: sh = ih − sy    (read remaining 95% of source)
    //   DEST canvas: same as source dimensions (no scaling distortion)
    // RESULT: top 5% of image is cropped → face/head always preserved.
    //         Contrast: drawImage(img,0,0) crops equally from all sides on cover display.
    const sy = Math.floor(ih * 0.05);   // skip top 5% of source
    const sh = ih - sy;                  // read 95% of source height

    const c  = document.createElement('canvas');
    c.width  = iw;
    c.height = sh;  // canvas height = 95% of original (top 5% discarded)
    const cx = c.getContext('2d');
    if (cx) {
      try {
        // drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
        // sx=0: start at left edge | sy=skip top 5%
        // sw=iw, sh: read full width, 95% height
        // dx=0, dy=0, dw=iw, dh=sh: draw to canvas at same size
        cx.drawImage(img, 0, sy, iw, sh, 0, 0, iw, sh);
      } catch (corsErr) {
        // Canvas tainted by CORS — placeholder so poster still renders
        console.warn('[imageToPayload] Canvas tainted (CORS), using placeholder');
        cx.fillStyle = '#e8e0d0';
        cx.fillRect(0, 0, iw, sh);
      }
    }
    const url = c.toDataURL('image/jpeg', 0.85).split(',')[1] || '';
    // Orientation: square within 10% aspect ratio tolerance
    const ratio = iw / ih;
    const orientation = ratio > 1.1 ? 'horizontal' : ratio < 0.9 ? 'vertical' : 'square';
    return { url, orientation };
  };
  // Backwards-compat shim — canvas fallback still uses plain base64
  const imageElementToBase64 = (img: HTMLImageElement): string => imageToPayload(img).url;

  // ── Helper: inject user photos into Gemini HTML by replacing tokens ──
  // Gemini uses {{PHOTO_0}}, {{PHOTO_1}} … as src placeholders.
  const injectPhotosIntoHtml = (html: string, photosBase64: string[]): string => {
    let result = html;

    // ── Inject real photos for each available token ───────────────────────
    photosBase64.forEach((b64, i) => {
      if (!b64) return;
      const dataUri = `data:image/jpeg;base64,${b64}`;
      // Replace all quote variants Gemini might produce:
      //   src="{{PHOTO_0}}"  src='{{PHOTO_0}}'  src={{PHOTO_0}}  src={{PHOTO_0}};
      result = result
        .replace(new RegExp(`"\{\{PHOTO_${i}\}\}"`, 'g'), `"${dataUri}"`)
        .replace(new RegExp(`'\{\{PHOTO_${i}\}\}'`, 'g'), `"${dataUri}"`)
        .replace(new RegExp(`\{\{PHOTO_${i}\}\}`, 'g'), dataUri);
    });

    // ── MODULE: White Box Bug Fix ─────────────────────────────────────────
    // If Gemini generated more {{PHOTO_N}} tokens than the user provided photos
    // (e.g. user gave 3 photos but Gemini generated 5 slots), unreplaced tokens
    // render as white boxes (broken img src). Fix: sweep remaining tokens and
    // replace with a 1×1 transparent placeholder so the img element is invisible.
    const TRANSPARENT = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    result = result.replace(
      /\{\{PHOTO_\d+\}\}/g,
      (match) => {
        console.warn(`[InjectPhotos] Unreplaced token ${match} → transparent placeholder`);
        return TRANSPARENT;
      }
    );

    return result;
  };

  // ── Helper: download a base64 string as a file ────────────────────
  const downloadBase64Image = (base64: string, mimeType: string, filename: string) => {
    const bytes = atob(base64);
    const ab    = new ArrayBuffer(bytes.length);
    const ua    = new Uint8Array(ab);
    for (let i = 0; i < bytes.length; i++) ua[i] = bytes.charCodeAt(i);
    const blob  = new Blob([ab], { type: mimeType });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.download  = filename;
    a.href      = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  // ── Helper: download a full data URL (base64) as a file via Blob ──
  // Works in sandboxed/iframe contexts. Accepts data:image/...;base64,... strings.
  const downloadPoster = (dataUrl: string, filename?: string) => {
    try {
      const arr       = dataUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime      = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr      = atob(arr[1] || '');
      let   n         = bstr.length;
      const u8arr     = new Uint8Array(n);
      while (n--) { u8arr[n] = bstr.charCodeAt(n); }
      const blob = new Blob([u8arr], { type: mime });
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = filename || `poster-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      console.log('[JASHN-DEBUG] Download trigger', { fileSize: blob.size, filename: a.download });
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch (dlErr) {
      console.error('[JASHN-DEBUG] ERROR Download failed:', dlErr);
    }
  };

  // ── useEffect: fires after geminiHtml state update renders the hidden div ──
  useEffect(() => {
    if (!pendingCapture || !geminiHtml || !posterRenderRef.current) return;

    const captureNode = posterRenderRef.current;

    // Double requestAnimationFrame: ensures React has committed + browser has painted
    // THEN 1200ms setTimeout for fonts, base64 images, CSS animations to fully decode.
    // This two-stage approach is the most reliable way to guarantee non-zero dimensions.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const timer = setTimeout(async () => {
          try {
            console.log('[DOMCapture] Starting html-to-image capture...');

            // ── Guard: abort if node still has zero dimensions ──────────
            // Happens when the hidden div hasn't laid out yet.
            if (captureNode.offsetWidth === 0 || captureNode.offsetHeight === 0) {
              console.error(`[DOMCapture] Target too small (${captureNode.offsetWidth}×${captureNode.offsetHeight}) — layout not painted`);
              alert('Poster render failed: layout not ready. Please try again.');
              return;
            }
            console.log(`[DOMCapture] Node size: ${captureNode.offsetWidth}×${captureNode.offsetHeight}`);

            // ── Lazy import: avoids "r is not defined" Turbopack SSR bundle bug ──
            const { toJpeg } = await import('html-to-image');

            // ── onclone: comprehensive external resource stripping to fix CORS ───
            // html-to-image internally fetches all CSS resources it finds.
            // Even ONE external URL (Google Fonts @import, background-image url(https://...))
            // throws a raw Event → surfaces as "CORS/resource load failure".
            //
            // We must strip ALL external references from the cloned DOM:
            //   1. <link rel="stylesheet"> tags          (already had this)
            //   2. @import url(https://...) in <style>   (NEW — the main remaining cause)
            //   3. url(https://...) in inline CSS        (NEW — background-image etc.)
            //   4. <img src="https://..."> external imgs  (NEW — any Gemini-added external imgs)
            const TRANSPARENT_PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            const onclone = (cloned: Document) => {
              // 1. Remove external <link> stylesheet tags
              cloned.querySelectorAll('link[rel="stylesheet"], link[rel="preconnect"], link[rel="preload"]')
                    .forEach(el => el.remove());

              // 2. Strip @import and external url() from inline <style> blocks
              cloned.querySelectorAll('style').forEach(styleEl => {
                if (!styleEl.textContent) return;
                styleEl.textContent = styleEl.textContent
                  // Remove @import url(https://...) lines entirely
                  .replace(/@import\s+url\s*\(\s*['"]?https?:\/\/[^)'"]+['"]?\s*\)[^;]*;?/gi, '')
                  // Replace url(https://...) with none (keeps the property, removes external ref)
                  .replace(/url\s*\(\s*['"]?https?:\/\/[^)'"]+['"]?\s*\)/gi, 'none');
              });

              // 3. Replace external <img src="https://..."> with transparent placeholder
              (cloned.querySelectorAll('img') as NodeListOf<HTMLImageElement>).forEach(img => {
                if (img.src && /^https?:\/\//i.test(img.src)) {
                  img.src = TRANSPARENT_PX;
                }
              });

              // 4. Strip external url() from inline style attributes
              cloned.querySelectorAll('[style]').forEach(el => {
                const s = (el as HTMLElement).style;
                if (s.backgroundImage && /url\s*\(\s*['"]?https?:\/\//i.test(s.backgroundImage)) {
                  s.backgroundImage = 'none';
                }
              });
            };

            // ── Properly typed capture options ──────────────────────────────────
            // 'onclone' + 'cacheBust' are valid html-to-image runtime options but
            // may be absent from older @types packages. Extending the base type
            // locally fixes ts(2353) without using 'any' or eslint-disable.
            type CaptureOptions = NonNullable<Parameters<typeof toJpeg>[1]> & {
              onclone?: (doc: Document) => void;
              cacheBust?: boolean;
            };

            const safeOptions: CaptureOptions = {
              quality:           0.94,
              pixelRatio:        1.5,   // was 2 → 24 MB canvas on mobile exceeded limit
              cacheBust:         false,
              skipFonts:         true,
              onclone,
              imagePlaceholder:  TRANSPARENT_PX,
            };

            // Pre-warm: first toJpeg call caches resources; swallow any error
            const preWarmOpts: CaptureOptions = {
              quality: 0.4, pixelRatio: 1, skipFonts: true,
              onclone,      imagePlaceholder: TRANSPARENT_PX,
            };
            try {
              await toJpeg(captureNode, preWarmOpts);
            } catch (preWarmErr) {
              const msg = preWarmErr instanceof Error ? preWarmErr.message
                : (typeof Event !== 'undefined' && preWarmErr instanceof Event)
                  ? `Event(${preWarmErr.type}): CORS/resource`
                  : String(preWarmErr);
              console.warn('[DOMCapture] Pre-warm failed, continuing:', msg);
            }

            // ── CRITICAL FIX: Wait for ALL <img> elements to fully decode ────────
            // ROOT CAUSE of "CORS/resource load failure":
            //   html-to-image internally clones the DOM and re-creates every <img>.
            //   If the image src (even a data: URI) hasn't been decoded by the
            //   browser's image pipeline yet, the cloned <img> fires onerror,
            //   which html-to-image surfaces as a raw Event → CORS/resource failure.
            //
            // FIX: Before calling toJpeg, explicitly ensure every <img> in the
            //   capture node is fully loaded (img.complete && naturalWidth > 0).
            //   If not, wait for its onload event. This puts the image into the
            //   browser's decode cache so the html-to-image clone finds it cached.
            {
              const captureImgs = Array.from(
                captureNode.querySelectorAll('img')
              ) as HTMLImageElement[];

              if (captureImgs.length > 0) {
                console.log(`[DOMCapture] Pre-loading ${captureImgs.length} image(s) before capture...`);
                await Promise.all(
                  captureImgs.map(img =>
                    new Promise<void>(resolve => {
                      // Already decoded — resolve immediately
                      if (img.complete && img.naturalWidth > 0) return resolve();

                      // Set handlers before checking src (avoids race)
                      img.onload  = () => resolve();
                      img.onerror = () => {
                        // Don't block capture on a failed image — just log and continue
                        console.warn('[DOMCapture] Image pre-load failed (will use placeholder):', img.src?.slice(0, 60));
                        resolve();
                      };

                      // Force a fresh decode attempt if src is already set
                      // (handles the case where img is in error state from a prior attempt)
                      if (img.src && !img.complete) {
                        // eslint-disable-next-line no-self-assign
                        img.src = img.src; // triggers re-decode from cache
                      }
                    })
                  )
                );
                console.log('[DOMCapture] ✅ All images pre-loaded — proceeding with capture');
              }
            }

            // ── Helper: stringify any thrown value (including raw Event objects) ──
            const errToStr = (e: unknown): string => {
              if (!e) return 'unknown';
              if (e instanceof Error) return e.message;
              if (e instanceof ErrorEvent) return `ErrorEvent: ${e.message || 'CORS/resource'}`;
              // html-to-image rejects with a raw Event (img.onerror) — handle it
              if (typeof Event !== 'undefined' && e instanceof Event) return `Event(${e.type}): CORS/resource load failure`;
              try { return JSON.stringify(e); } catch { return String(e); }
            };

            // Actual high-res capture — retry up to 3 times (400ms gap) to survive
            // intermittent CORS / resource-load Event rejections from html-to-image.
            let dataUrl = '';
            let lastErr: unknown;
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                dataUrl = await toJpeg(captureNode, safeOptions);
                break; // success — exit retry loop
              } catch (retryErr) {
                lastErr = retryErr;
                console.warn(`[DOMCapture] toJpeg attempt ${attempt}/3 failed:`, errToStr(retryErr));
                if (attempt < 3) await new Promise(r => setTimeout(r, 500));
              }
            }

            if (!dataUrl) {
              // html-to-image failed completely — throw a proper Error so the
              // outer catch block can log it cleanly (no "[object Event]" noise).
              throw new Error(`html-to-image failed after 3 attempts: ${errToStr(lastErr)}`);
            }

            const base64 = dataUrl.split(',')[1] || '';
            const pending_filename = `Jashn-${Date.now()}.jpg`;
            downloadBase64Image(base64, 'image/jpeg', pending_filename);

            console.log('[DOMCapture] ✅ Poster captured and downloaded');
            setHasDownloaded(true);
          } catch (captureErr) {
            console.error('[DOMCapture] html-to-image failed:', captureErr instanceof Error ? captureErr.message : String(captureErr));
            alert('Poster download failed. Please try again.');
          } finally {
            setGeminiHtml(null);
            setPendingCapture(false);
            setIsDownloading(false);
          }
        }, 1200);

        // Cleanup only clears the setTimeout; RAFs already fired
        return () => clearTimeout(timer);
      });
    });
  }, [pendingCapture, geminiHtml]);

  // ── Main download handler ─────────────────────────────────────────
  const handleDownload = async () => {
    if (!data) return;
    setIsDownloading(true);

    try {
      const title      = getFormattedTitle();
      const subtitle   = data.customMessage || '';
      // ── MODULE 2: Strict Routing Law ──────────────────────────────────
      // Mode A (generate-poster-layout) → Dynamic vertical, EXACTLY 1 image
      //   Triggers ONLY for: JYANTI | DIVAS | FESTIVALS (subcats of SPECIAL)
      // Mode B (generate-poster-styling) → 9:16 collage, up to 5 images
      //   Triggers for: ALL personal celebrations + NEW_MEMBERS + MARRIAGE_DATE_FIX
      //
      // OLD BUG: modeACategories.includes('SPECIAL') routed ALL SPECIAL subcats
      //          to Mode A — including NEW_MEMBERS and MARRIAGE_DATE_FIX which
      //          are personal celebrations and MUST be Mode B.
      const MODE_A_SUBCATS = new Set(['JYANTI', 'DIVAS', 'FESTIVALS']);
      const isLayout2 = MODE_A_SUBCATS.has(data.specialSubcategory);
      // Explicit Mode B subcats (failsafe — these must NEVER go to Mode A)
      const FORCE_MODE_B_SUBCATS = new Set(['NEW_MEMBERS', 'MARRIAGE_DATE_FIX']);
      const forcedModeB = FORCE_MODE_B_SUBCATS.has(data.specialSubcategory);
      const useLayout2  = isLayout2 && !forcedModeB;

      const layoutType  = useLayout2 ? 'LAYOUT_2_JAYANTI' : 'LAYOUT_1_COLLAGE';
      const apiEndpoint = useLayout2 ? '/api/generate-poster-layout' : '/api/generate-poster-styling';
      const maxPhotos   = useLayout2 ? 1 : 5;
      const filename    = `Jashn-${(getDisplayName() || 'Celebration').replace(/\s/g, '-')}`;

      // ── Step 1: Normalise blob: URLs → data: URIs ─────────────────────
      // blob: URLs are session-scoped and become invalid after navigation or
      // Codespace restart, causing "Failed to load image: blob:https://..." errors.
      // Convert them to stable data: URIs before anything else touches them.
      const rawPhotos: string[] = (data.photos?.length > 0) ? data.photos.slice(0, maxPhotos) : [];
      const normalisedPhotos: string[] = await Promise.all(
        rawPhotos.map(async (src: string) => {
          if (!src?.startsWith('blob:')) return src;
          try {
            const resp = await fetch(src);
            const blob = await resp.blob();
            return await new Promise<string>((res, rej) => {
              const reader = new FileReader();
              reader.onload  = () => res(reader.result as string);
              reader.onerror = () => rej(new Error('FileReader failed'));
              reader.readAsDataURL(blob);
            });
          } catch (blobErr) {
            console.warn('[BlobNorm] Could not convert blob URL, skipping:', src?.substring(0, 60), blobErr);
            return null;
          }
        })
      ).then(arr => arr.filter(Boolean) as string[]);

      // ── Step 2: Load user photos (CORS-safe with retry) ───────────
      // Since blob: URLs are already normalised to data: URIs above,
      // CORS retry is mainly a safety net for http:// URLs.
      const loadedImages: HTMLImageElement[] = [];
      const photosToLoad = normalisedPhotos;

      for (const src of photosToLoad) {
        if (!src) continue;
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = () => {
            if (img.naturalWidth > 0) loadedImages.push(img);
            resolve();
          };

          img.onerror = () => {
            // CORS failed — retry without crossOrigin attribute
            console.warn('[ImageLoad] crossOrigin failed, retrying:', src.substring(0, 60));
            const img2 = new Image();
            img2.onload  = () => { if (img2.naturalWidth > 0) loadedImages.push(img2); resolve(); };
            img2.onerror = () => {
              // Both attempts failed — skip this image, never reject (prevents download abort)
              console.error('[ImageLoad] Both load attempts failed, skipping:', src.substring(0, 60));
              resolve(); // resolve not reject — we continue without this photo
            };
            img2.src = src;
          };

          img.src = src;
        });
      }

      // ── Step 3: Prepare orientation metadata for API ──────────────────────
      // API now returns JSON styling only — no images needed by server.
      // Base64 stays client-side (used only if legacy HTML path ever triggers).
      const imagePayloads = loadedImages.map(imageToPayload).filter(p => p.url);
      const photosBase64: string[] = imagePayloads.map(p => p.url);
      const photosMeta = imagePayloads.map(p => ({ orientation: p.orientation }));
      console.log('[JASHN-DEBUG] API call start', {
        endpoint: apiEndpoint,
        inputDataSummary: { photos: photosMeta.length, orientations: photosMeta.map(p => p.orientation), layoutType },
      });

      // ── Step 4: Call API → get { isDynamic, blueprint, layoutStyleId, blueprintId } ──
      // New architecture: API returns JSON styling only. All geometry is hardcoded
      // in posterRenderer.ts (LAYOUT_DEFS, BLUEPRINT_DEFS_5IMG, JAYANTI_LAYOUT_DEF).
      // No second API call. No HTML. One round-trip.
      let styleConfig: any = {};
      try {
        const res = await fetch(apiEndpoint, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            occasion:      title,
            name:          getDisplayName() || title,
            partnerName:   getDisplayName() || '',
            relationLabel: data.relation || data.relationLabel || getTermLine() || '',
            message:       subtitle,
            quote:         subtitle,
            photos:        photosMeta,
            design_seed:   crypto.randomUUID(),
            poster_index:  posterIndex,          // 0→T0 abstract art, 1→T1 framed, 2→T2 polaroid
            aspect_ratio:  '9:16',
            photo_count:   photosMeta.length,
            gender: (() => {
              const w = data.whoAreYou || '';
              if (['HUSBAND','MALE_PARTNER','BOYFRIEND','MALE'].includes(w)) return 'MALE';
              if (['WIFE','FEMALE_PARTNER','GIRLFRIEND','FEMALE'].includes(w)) return 'FEMALE';
              const rel = (data.relation || data.relationLabel || '').toLowerCase();
              if (['husband','bhai','brother','papa','uncle','grandfather','dada','nana'].some(r => rel.includes(r))) return 'MALE';
              if (['wife','behen','sister','mama','aunt','grandmother','dadi','nani'].some(r => rel.includes(r))) return 'FEMALE';
              return 'UNKNOWN';
            })(),
          }),
        });

        if (res.ok) {
          const result = await res.json();

          if (result.isDynamic && result.blueprint) {
            // ✅ New architecture — JSON styling received, canvas will apply hardcoded geometry
            styleConfig = result;
            console.log('[JASHN-DEBUG] API call end', {
              endpoint:      apiEndpoint,
              status:        res.status,
              responseType:  'isDynamic-json',
              blueprintId:   result.blueprintId   ?? 'n/a',
              layoutStyleId: result.layoutStyleId ?? 'n/a',
              fallbackUsed:  result.fallbackUsed  ?? false,
            });
          } else if (result.isHtmlPoster && result.html) {
            // Legacy HTML path — preserved; will not trigger with current routes
            // but kept intact so existing html-to-image capture code still works
            // if the routes are ever temporarily reverted.
            console.warn('[JASHN-DEBUG] Legacy HTML path triggered — sanitizing and rendering...');
            const sanitizeGeminiHtml = (raw: string): string => {
              let s = raw;
              s = s.replace(/^```[\w]*\s*/im, '').replace(/\s*```\s*$/im, '');
              s = s.replace(/<script[\s\S]*?<\/script>/gi, '');
              s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
              s = s.replace(/<!--[\s\S]*?-->/g, '');
              const firstTagIdx = s.search(/<(div|section|article|main|figure)/i);
              if (firstTagIdx > 0) { const leading = s.slice(0, firstTagIdx); if (!/<[a-z]/i.test(leading)) s = s.slice(firstTagIdx); }
              const lastDivIdx = s.lastIndexOf('</div>');
              if (lastDivIdx !== -1 && lastDivIdx < s.length - 8) { const trailing = s.slice(lastDivIdx + 6); if (!/<[a-z]/i.test(trailing)) s = s.slice(0, lastDivIdx + 6); }
              return s.trim();
            };
            const sanitized = sanitizeGeminiHtml(result.html);
            if (sanitized.startsWith('<')) {
              const injectedHtml = injectPhotosIntoHtml(sanitized, photosBase64);
              setGeminiHtml(injectedHtml);
              setPendingCapture(true);
              setPosterIndex(prev => (prev + 1) % 3);   // advance loop: 0→1→2→0→1→2
              return; // useEffect takes over
            }
          } else {
            console.warn('[JASHN-DEBUG] API returned neither isDynamic nor isHtmlPoster — using empty styleConfig');
          }
        } else {
          console.warn(`[JASHN-DEBUG] API HTTP ${res.status} — proceeding with empty styleConfig`);
        }
      } catch (apiErr) {
        console.warn('[JASHN-DEBUG] API error — proceeding with empty styleConfig:', apiErr);
      }

      // ── Step 5: Canvas render — hardcoded geometry + AI styling from Step 4 ──
      // styleConfig already populated above. No second API call needed.
      console.log('[JASHN-DEBUG] Canvas draw start', { pipeline: layoutType, canvasSize: '1080x1920' });
      const canvas = document.createElement('canvas');
      await generatePosterCanvas(
        canvas, layoutType,
        { title, subtitle, photos: loadedImages, relationName: getDisplayName(), termLine: getTermLine() },
        styleConfig
      );

      // Blank canvas guard
      try {
        const guardCtx = canvas.getContext('2d');
        if (guardCtx) {
          const imgData   = guardCtx.getImageData(0, 0, Math.min(canvas.width, 10), Math.min(canvas.height, 10));
          const hasPixels = imgData.data.some((v, i) => i % 4 !== 3 && v > 0);
          if (!hasPixels) {
            console.error('[JASHN-DEBUG] ERROR Canvas is blank — aborting download');
            alert('Poster generation failed: canvas was blank. Please try again.');
            setIsDownloading(false);
            return;
          }
        }
      } catch (checkErr) {
        console.warn('[JASHN-DEBUG] WARNING Could not verify canvas pixels:', checkErr);
      }

      const canvasDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      console.log('[JASHN-DEBUG] Canvas draw end', { pixelsRendered: canvas.width * canvas.height });
      downloadPoster(canvasDataUrl, `${filename}.jpg`);
      setHasDownloaded(true);

    } catch (err) {
      console.error(err);
      alert('Error generating poster.');
    } finally {
      // Only set false here for the canvas path; legacy HTML path does it in useEffect
      if (!pendingCapture) setIsDownloading(false);
    }
  };


  // Pre-fetch base64 QR code to prevent CORS failures when capturing Invitation Card
  useEffect(() => {
    let cancelled = false;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&color=1a0505&bgcolor=FFFFFF`;

    (async () => {
      try {
        const resp = await fetch(qrImageUrl);
        const blob = await resp.blob();
        const reader = new FileReader();
        reader.onload = () => {
          if (!cancelled) setQrDataUri(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        console.warn('Could not fetch base64 QR code:', e);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const handleShareQR = async () => {
    try {
      if (shareCardRef.current) {
        const { toBlob } = await import('html-to-image');
        const blob = await toBlob(shareCardRef.current, {
          cacheBust: true,
          pixelRatio: 3,
          backgroundColor: '#FAF7F2',
          style: {
            transform: 'none',
            margin: '0',
            boxShadow: 'none',
            borderRadius: '16px',
          },
          filter: (node) => {
            if (node.nodeType === 1) {
              const el = node as HTMLElement;
              if (el.tagName === 'LINK' && el.getAttribute('rel') === 'stylesheet') {
                return false;
              }
            }
            return true;
          }
        });
        
        if (blob && navigator.share) {
          const file = new File([blob], "invitation-card.png", { type: "image/png" });
          await navigator.share({
            title: data?.names || data?.occasionName || 'Celebration Story',
            text: 'You are cordially invited to this celebration!',
            url: window.location.href,
            files: [file]
          });
          return;
        }
      }
      
      if (navigator.share) {
        await navigator.share({
          title: data?.names || data?.occasionName || 'Celebration Story',
          text: 'You are cordially invited to this celebration!',
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Invitation link copied to clipboard!");
      }
    } catch (e) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Invitation link copied to clipboard!");
      } catch (_) {}
    }
  };

  const saveName = () => { if (visitorName.trim()) { localStorage.setItem('jashnVisitorName', visitorName); setIsNameSet(true); } };

  const addComment = () => {
    if (!inputMsg.trim() || !data) return;

    const c: Comment = {
      id: Date.now().toString(),
      name: visitorName || 'Guest',
      message: inputMsg,
      timestamp: new Date().toISOString(),
      storyId: data.storyId
    };

    // Save locally
    const allCommentsStr = localStorage.getItem('storyCommentsV3');
    const allComments = allCommentsStr ? JSON.parse(allCommentsStr) : [];
    const updatedAllComments = [...allComments, c];
    localStorage.setItem('storyCommentsV3', JSON.stringify(updatedAllComments));

    // Save to Firestore if shared URL has storyId
    const searchParams = new URLSearchParams(window.location.search);
    const storyIdParam = searchParams.get('storyId');
    if (storyIdParam) {
      fetch('/api/free-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: storyIdParam,
          comment: c
        })
      }).then(res => res.json())
        .then(json => {
          if (json.success && json.comments) {
            setComments(json.comments);
          }
        })
        .catch(err => console.error('Error posting comment to backend:', err));
    }

    const storyComments = updatedAllComments.filter((comment: any) => comment.storyId === data.storyId);
    setComments(storyComments);

    setInputMsg('');
  };

  if (storyNotFound && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#1A0505] text-white p-6 text-center space-y-6 font-serif">
        <div className="w-20 h-20 bg-[#d4af37]/20 border border-[#d4af37]/40 rounded-full flex items-center justify-center text-[#d4af37] text-3xl shadow-[0_0_30px_rgba(212,175,55,0.3)]">
          ✨
        </div>
        <h1 className="text-2xl font-bold text-[#d4af37]">Celebration Page Not Found</h1>
        <p className="text-white/70 max-w-md text-sm leading-relaxed">
          The celebration story link you opened might be invalid or expired.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-[#d4af37] text-[#1A0505] font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          Create a New Celebration Website
        </button>
      </div>
    );
  }

  const screenW = typeof window !== 'undefined' ? window.innerWidth : 430;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 932;
  const qrModalMaxWidth = Math.min(380, screenW - 32);
  const qrSize = Math.min(200, qrModalMaxWidth - 48);
  const commentsModalMaxWidth = Math.min(420, screenW - 16);
  const commentsModalMaxHeight = Math.min(screenH * 0.8, 600);

  const termLine = getTermLine();
  const displayName = getDisplayName();

  const selfProfileText = getSelfProfileText();
  const effectiveCreatorName = data?.creatorName || (data?.isForSelf ? selfProfileText : '');
  const effectiveCreatorPhoto = data?.creatorPhoto || null;

  const isBirthdaySelf = data?.category === 'BIRTHDAY' && data?.isForSelf;

  const isOccasionNameType =
    data?.specialSubcategory === 'JYANTI' ||
    data?.specialSubcategory === 'DIVAS' ||
    data?.specialSubcategory === 'FESTIVALS';

  return (
    <>
      {/* Hidden YouTube IFrame API Player Container - Always mounted from frame 1 */}
      <div id="hidden-yt-player-wrapper" className="pointer-events-none fixed -top-[9999px] -left-[9999px] w-1 h-1 overflow-hidden opacity-0" aria-hidden="true">
        <div ref={ytContainerRef} />
      </div>

      {!data || isSavingStory ? (
        <PremiumLoader scale={scale} message={isSavingStory ? "Publishing your beautiful Jashn Story..." : "Loading celebration..."} />
      ) : !imagesPreloaded ? (
        <PremiumLoader scale={scale} message={`Optimizing & preloading photos (${preloadingProgress}%)...`} />
      ) : (
        <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-black" onClick={e => { if (stage === 'ENVELOPE') handleTapToOpen(e); }}>
          <meta name="robots" content="noindex, nofollow" />
          {isDownloading && <PremiumLoader scale={scale} />}

          <PopCounter count={globalPopCount} show={showPopNumber} />

          <AchievementModal
            show={showAchievements}
            onClose={() => setShowAchievements(false)}
            globalCount={globalPopCount}
          />

      <AnimatePresence>
        {stage === 'ENVELOPE' && (
          <motion.div exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-[#1a0505]" onClick={handleTapToOpen}>
            <div className="flex flex-col items-center animate-pulse cursor-pointer">
              <Gift style={{ width: S.envelopeIconSize, height: S.envelopeIconSize }} className="text-[#d4af37]" />
              <p style={{ fontSize: S.envelopeTextSize, marginTop: S.envelopeTextMarginTop }} className="text-[#d4af37] tracking-widest uppercase">Tap to Open</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {stage === 'COUNTDOWN' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#1a0505]">
          <h1 style={{ fontSize: S.countdownFontSize }} className="font-serif text-[#d4af37]">{countdown}</h1>
        </div>
      )}

      {stage === 'STORY' && (
        <div className="relative w-full h-full">
          <BalloonSystem scale={scale} S={S} onPop={handleBalloonPop} />

          <div className="absolute inset-0 bg-black" style={{ zIndex: 0 }}>
            {imgFit === 'contain' && data.photos?.[currentSlide] && (<div className="absolute inset-0" style={{ zIndex: 1, backgroundImage: `url(${data.photos[currentSlide]})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(40px) brightness(0.5) saturate(1.2)', transform: 'scale(1.1)' }} />)}
            {imgFit === 'contain' && (<div className="absolute inset-0 bg-black/30" style={{ zIndex: 2 }} />)}
            <AnimatePresence mode="popLayout">
              <motion.img
                key={currentSlide}
                src={data.photos?.[currentSlide]}
                loading="eager"
                decoding="async"
                onLoad={e => handleImageLoad(e.currentTarget)}
                onError={e => {
                  const target = e.currentTarget;
                  const originalSrc = data.photos?.[currentSlide];
                  if (originalSrc && !target.dataset.retried) {
                    target.dataset.retried = 'true';
                    const sep = originalSrc.includes('?') ? '&' : '?';
                    target.src = `${originalSrc}${sep}_retry=${Date.now()}`;
                  } else if (data.heroImage && target.src !== data.heroImage) {
                    target.src = data.heroImage;
                  } else if (Array.isArray(data.galleryPhotos) && data.galleryPhotos[0] && target.src !== data.galleryPhotos[0]) {
                    target.src = data.galleryPhotos[0];
                  }
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
                className="absolute inset-0 w-full h-full"
                style={{ zIndex: 3, objectFit: imgFit, objectPosition: 'center center' }}
                alt=""
              />
            </AnimatePresence>
            <div className="absolute bottom-0 left-0 w-full pointer-events-none" style={{ zIndex: 4, height: `${BASE.overlayHeightPercent}%`, background: 'linear-gradient(to top, #000 15%, rgba(0,0,0,0.9) 50%, transparent 100%)' }} />
          </div>

          <div className="absolute top-0 w-full flex justify-between items-center" style={{ padding: S.topPadding, zIndex: 20 }}>
            <div className="flex items-center" style={{ gap: S.topGap }}>
              <button onClick={() => router.push('/')} className="flex items-center justify-center bg-black/40 rounded-full backdrop-blur-md border border-[#d4af37]/30 hover:bg-[#d4af37] hover:text-black transition-all" style={{ width: S.topButtonSize, height: S.topButtonSize }}>
                <Home style={{ width: S.topIconSize, height: S.topIconSize }} />
              </button>

              {effectiveCreatorName && (
                <div className="flex items-center bg-black/40 backdrop-blur-md border border-[#d4af37]/30 rounded-full shadow-lg" style={{ paddingTop: S.creatorPillPadY, paddingBottom: S.creatorPillPadY, paddingRight: S.creatorPillPadX, paddingLeft: S.creatorPillPadY, gap: S.creatorPillGap }}>
                  <div className="rounded-full border border-[#d4af37] overflow-hidden bg-gray-800" style={{ width: S.creatorAvatarSize, height: S.creatorAvatarSize }}>
                    {effectiveCreatorPhoto ? <img src={effectiveCreatorPhoto} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-[#d4af37]" style={{ fontSize: S.creatorNameSize }}>{effectiveCreatorName?.charAt(0) || 'M'}</div>}
                  </div>
                  <div className="flex flex-col leading-none justify-center" style={{ textAlign: 'left' }}>
                    {!isAutoProfile(effectiveCreatorName) && (
                      <span className="text-[#d4af37] uppercase tracking-wider" style={{ fontSize: S.creatorBySize, marginBottom: S.creatorByMargin }}>By</span>
                    )}
                    {effectiveCreatorName === 'From your wife' ? (
                      <div style={{ fontSize: S.creatorNameSize, lineHeight: '1.2', textAlign: 'left' }}>
                        <span className="text-white font-bold" style={{ display: 'block' }}>From</span>
                        <span className="text-white font-bold" style={{ display: 'block' }}>your wife</span>
                      </div>
                    ) : effectiveCreatorName === 'From your husband' ? (
                      <div style={{ fontSize: S.creatorNameSize, lineHeight: '1.2', textAlign: 'left' }}>
                        <span className="text-white font-bold" style={{ display: 'block' }}>From</span>
                        <span className="text-white font-bold" style={{ display: 'block' }}>your husband</span>
                      </div>
                    ) : (
                      <span className="text-white font-bold" style={{ fontSize: S.creatorNameSize, maxWidth: S.creatorNameMaxWidth, lineHeight: '1.2', wordWrap: 'break-word', textAlign: 'left' }}>{effectiveCreatorName}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center" style={{ gap: S.topGap }}>
              <AchievementBadge
                globalCount={globalPopCount}
                onClick={() => setShowAchievements(true)}
                S={S}
              />
              <button onClick={() => { setMuted(!muted); if (audioRef.current) audioRef.current.muted = !muted; }} className="flex items-center justify-center bg-black/40 rounded-full backdrop-blur-md border border-[#d4af37]/30 text-white" style={{ width: S.topButtonSize, height: S.topButtonSize }}>
                {muted ? <VolumeX style={{ width: S.topIconSize, height: S.topIconSize }} /> : <Volume2 style={{ width: S.topIconSize, height: S.topIconSize }} />}
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 w-full text-center flex flex-col items-center justify-end pointer-events-none" style={{ height: `${BASE.overlayHeightPercent}%`, paddingLeft: S.contentPadX, paddingRight: S.contentPadX, paddingBottom: S.contentPadBottom, zIndex: 20 }}>

            {isBirthdaySelf ? (
              <>
                <h1
                  className="font-serif leading-tight drop-shadow-[0_4px_8px_rgba(0,0,0,1)]"
                  style={{
                    fontSize: S.nameSize,
                    marginBottom: S.nameMarginBottom * 1.5,
                    letterSpacing: '0.04em',
                    fontWeight: 'normal',
                    color: '#d4af37',
                    textShadow: '0 0 18px rgba(212, 175, 55, 0.7), 0 0 35px rgba(212, 175, 55, 0.35)',
                  }}
                >
                  {birthdaySelfLine}
                </h1>

                {termLine && (
                  <div
                    className="bg-[#d4af37]/20 border border-[#d4af37]/40 backdrop-blur-sm"
                    style={{
                      marginBottom: S.subtitleMarginBottom,
                      paddingLeft: S.subtitlePadX,
                      paddingRight: S.subtitlePadX,
                      paddingTop: S.subtitlePadY,
                      paddingBottom: S.subtitlePadY,
                      borderRadius: S.subtitleRadius
                    }}
                  >
                    <p className="font-bold text-[#d4af37] uppercase tracking-widest drop-shadow-md"
                      style={{ fontSize: S.subtitleSize }}>
                      {termLine}
                    </p>
                  </div>
                )}

                <p className="text-white/80 italic leading-relaxed font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                  style={{ fontSize: S.messageSize, maxWidth: S.messageMaxWidth }}>
                  "{data.customMessage}"
                </p>
              </>
            ) : isOccasionNameType ? (
              <>
                {getFormattedTitle() && (
                  <h1
                    className="font-serif leading-tight drop-shadow-[0_4px_8px_rgba(0,0,0,1)]"
                    style={{
                      fontSize: S.nameSize,
                      marginBottom: S.nameMarginBottom * 1.5,
                      letterSpacing: '0.04em',
                      fontWeight: 'normal',
                      color: '#d4af37',
                      textShadow: '0 0 18px rgba(212, 175, 55, 0.7), 0 0 35px rgba(212, 175, 55, 0.35)',
                    }}
                  >
                    {getFormattedTitle()}
                  </h1>
                )}

                {termLine && (
                  <div
                    className="bg-[#d4af37]/20 border border-[#d4af37]/40 backdrop-blur-sm"
                    style={{
                      marginBottom: S.subtitleMarginBottom,
                      paddingLeft: S.subtitlePadX,
                      paddingRight: S.subtitlePadX,
                      paddingTop: S.subtitlePadY,
                      paddingBottom: S.subtitlePadY,
                      borderRadius: S.subtitleRadius
                    }}
                  >
                    <p className="font-bold text-[#d4af37] uppercase tracking-widest drop-shadow-md"
                      style={{ fontSize: S.subtitleSize }}>
                      {termLine}
                    </p>
                  </div>
                )}

                <p className="text-white/80 italic leading-relaxed font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                  style={{ fontSize: S.messageSize, maxWidth: S.messageMaxWidth }}>
                  "{data.customMessage}"
                </p>
              </>
            ) : (
              <>
                {getFormattedTitle() && (
                  <h3
                    className="font-sans uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                    style={{
                      fontSize: S.titleSize,
                      letterSpacing: '0.3em',
                      marginBottom: S.titleMarginBottom,
                      paddingBottom: S.titlePadBottom,
                      fontWeight: 'normal',
                      color: '#d4af37',
                      textShadow: 'none',
                      borderBottom: '1px solid rgba(212, 175, 55, 0.4)',
                    }}
                  >
                    {getFormattedTitle()}
                  </h3>
                )}

                {displayName && (
                  <h1 className="font-serif text-white drop-shadow-[0_4px_8px_rgba(0,0,0,1)] leading-tight"
                    style={{ fontSize: S.nameSize, marginBottom: S.nameMarginBottom }}>
                    {displayName}
                  </h1>
                )}

                {termLine && (
                  <div
                    className="bg-[#d4af37]/20 border border-[#d4af37]/40 backdrop-blur-sm"
                    style={{
                      marginBottom: S.subtitleMarginBottom,
                      paddingLeft: S.subtitlePadX,
                      paddingRight: S.subtitlePadX,
                      paddingTop: S.subtitlePadY,
                      paddingBottom: S.subtitlePadY,
                      borderRadius: S.subtitleRadius
                    }}
                  >
                    <p className="font-bold text-[#d4af37] uppercase tracking-widest drop-shadow-md"
                      style={{ fontSize: S.subtitleSize }}>
                      {termLine}
                    </p>
                  </div>
                )}

                <p className="text-white/80 italic leading-relaxed font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                  style={{ fontSize: S.messageSize, maxWidth: S.messageMaxWidth }}>
                  "{data.customMessage}"
                </p>
              </>
            )}
          </div>

          <CommentSlideshow comments={comments} S={S} />

          <div className="absolute w-full flex justify-center" style={{ bottom: S.actionBottom, gap: S.actionGap, zIndex: 30 }}>
            {[
              { icon: hasDownloaded ? RefreshCw : Download, label: hasDownloaded ? 'Redesign' : 'Save', onClick: handleDownload },
              { icon: Share2, label: 'Share', onClick: handleShareQR },
              { icon: MessageCircle, label: 'Wishes', onClick: () => setShowComments(true) },
              { icon: QrCode, label: 'QR', onClick: () => setShowQR(true) },
            ].map(({ icon: Icon, label, onClick }) => (
              <button key={label} onClick={onClick} className="flex flex-col items-center text-white/90 hover:text-[#d4af37] group transition-colors" style={{ gap: S.actionItemGap }}>
                <Icon style={{ width: S.actionIconSize, height: S.actionIconSize }} className="group-hover:scale-110 transition-transform" />
                <span className="uppercase tracking-wider font-bold" style={{ fontSize: S.actionLabelSize }}>{label}</span>
              </button>
            ))}
          </div>

          {volDisplay.show && (
            <div style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              opacity: 1,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
              zIndex: 9999,
              background: 'rgba(0,0,0,0.55)',
              borderRadius: '16px',
              padding: '14px 10px',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}>
              <div style={{ width: 20, height: 20 }}>
                {volDisplay.level === 0 ? <VolumeMuteSVG /> :
                  volDisplay.level < 30 ? <VolumeLowSVG /> :
                    volDisplay.level < 70 ? <VolumeMidSVG /> : <VolumeHighSVG />}
              </div>

              <div style={{
                width: '5px',
                height: '120px',
                borderRadius: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  width: '100%',
                  height: `${volDisplay.level}%`,
                  backgroundColor: 'rgba(212, 175, 55, 0.9)',
                  borderRadius: '3px',
                  transition: 'height 0.05s linear'
                }} />
              </div>

              <span style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.85)',
                fontWeight: '700',
                textShadow: '0 1px 2px rgba(0,0,0,0.4)'
              }}>
                {volDisplay.level}
              </span>
            </div>
          )}
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" style={{ padding: 16 }} onClick={() => setShowQR(false)}>
          <div className="bg-[#1a0505] border border-[#d4af37]/40 rounded-2xl text-center shadow-[0_0_50px_rgba(212,175,55,0.25)] overflow-hidden flex flex-col items-center" style={{ width: Math.min(340, (typeof window !== 'undefined' ? window.innerWidth : 340) - 32), maxWidth: '100%', padding: '20px 16px' }} onClick={e => e.stopPropagation()}>
            
            {/* Capturable Vertical Portrait Invitation Card */}
            <div ref={shareCardRef} className="relative rounded-2xl flex flex-col items-center justify-between text-center overflow-hidden" style={{ width: 280, minHeight: 390, padding: '30px 20px 26px 20px', background: '#FAF7F2', border: '2px solid #d4af37', boxShadow: 'none' }}>
              {/* Inner Gold Inset Frame */}
              <div className="absolute inset-2 border border-[#d4af37]/40 rounded-xl pointer-events-none" />

              {/* Gold Corner Accents */}
              <span className="absolute top-3.5 left-3.5 w-3.5 h-3.5 border-t-2 border-l-2" style={{ borderColor: '#d4af37' }} />
              <span className="absolute top-3.5 right-3.5 w-3.5 h-3.5 border-t-2 border-r-2" style={{ borderColor: '#d4af37' }} />
              <span className="absolute bottom-3.5 left-3.5 w-3.5 h-3.5 border-b-2 border-l-2" style={{ borderColor: '#d4af37' }} />
              <span className="absolute bottom-3.5 right-3.5 w-3.5 h-3.5 border-b-2 border-r-2" style={{ borderColor: '#d4af37' }} />

              {/* Top Header */}
              <div className="flex flex-col items-center gap-1.5 w-full text-center z-10">
                <Sparkles style={{ width: 18, height: 18, color: '#c59b27' }} />
                <p className="text-[10px] uppercase tracking-[0.28em] font-semibold" style={{ color: '#c59b27' }}>
                  YOU ARE CORDIALLY INVITED
                </p>
                <p className="font-serif font-bold text-center leading-snug px-1" style={{ color: '#1a0505', fontSize: '18px' }}>
                  {data?.names || data?.occasionName || (data?.personName ? `${data.personName}'s Celebration` : 'Celebration')}
                </p>
              </div>

              {/* Middle QR Container */}
              <div className="relative rounded-xl p-2.5 bg-white flex items-center justify-center border border-[#d4af37]/50 shadow-sm z-10 my-3" style={{ width: 140, height: 140 }}>
                {qrLoading && !qrDataUri && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white rounded-xl">
                    <Loader2 className="animate-spin text-[#1a0505]" style={{ width: 28, height: 28 }} />
                  </div>
                )}
                <img
                  src={qrDataUri || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&color=1a0505&bgcolor=FFFFFF`}
                  className="w-full h-full object-contain"
                  onLoad={() => setQrLoading(false)}
                  alt="Invitation QR Code"
                />
              </div>

              {/* Bottom Tagline */}
              <div className="flex flex-col items-center gap-0.5 w-full text-center z-10">
                <p className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: '#c59b27' }}>
                  SCAN TO JOIN
                </p>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2 mt-3">
              <button onClick={handleShareQR} className="w-full bg-[#d4af37] text-[#1a0505] font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center shadow-lg" style={{ padding: '12px 16px', fontSize: 14, gap: 8 }}>
                <Share2 style={{ width: 18, height: 18 }} /> Share Invitation Card
              </button>
              <button onClick={() => setShowQR(false)} className="text-white/40 hover:text-white transition-colors w-full" style={{ padding: 6, fontSize: 13 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showComments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ padding: 8 }} onClick={() => setShowComments(false)}>
          <div className="bg-[#1a0505] rounded-2xl border border-[#d4af37]/30 flex flex-col shadow-2xl overflow-hidden" style={{ width: commentsModalMaxWidth, maxWidth: '100%', height: commentsModalMaxHeight, maxHeight: 'calc(100vh - 32px)' }} onClick={e => e.stopPropagation()}>
            {!isNameSet ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center overflow-auto" style={{ padding: 24, gap: 20 }}>
                <div className="rounded-full bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/30 flex-shrink-0" style={{ width: 64, height: 64 }}>
                  <User style={{ width: 32, height: 32 }} className="text-[#d4af37]" />
                </div>
                <div>
                  <h3 className="font-serif text-[#d4af37]" style={{ fontSize: 20, marginBottom: 8 }}>Who are you?</h3>
                  <p className="text-white/60" style={{ fontSize: 13 }}>Enter your name to join.</p>
                </div>
                <input autoFocus className="w-full bg-black/30 border border-[#d4af37]/30 rounded-xl text-white text-center focus:border-[#d4af37] outline-none transition-all" placeholder="Your Name" value={visitorName} onChange={e => setVisitorName(e.target.value)} style={{ padding: 14, fontSize: 16 }} />
                <button onClick={saveName} disabled={!visitorName.trim()} className="w-full bg-[#d4af37] text-[#1a0505] font-bold rounded-xl disabled:opacity-50 hover:scale-[1.02] transition-transform" style={{ padding: 14, fontSize: 16 }}>Continue</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-[#d4af37]/20 bg-[#150404] flex-shrink-0" style={{ padding: 14 }}>
                  <h3 className="text-[#d4af37] font-bold flex items-center font-serif" style={{ fontSize: 16, gap: 8 }}>
                    <MessageCircle style={{ width: 18, height: 18 }} /> Wishes ({comments.length})
                  </h3>
                  <button onClick={() => setShowComments(false)} className="text-white/50 hover:text-white p-2">
                    <X style={{ width: 18, height: 18 }} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto bg-[#1a0505]" style={{ padding: 14 }}>
                  {comments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/20" style={{ gap: 8, minHeight: 150 }}>
                      <MessageCircle style={{ width: 40, height: 40 }} />
                      <p className="italic" style={{ fontSize: 13 }}>No wishes yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {comments.map(c => (
                        <div key={c.id} className="flex" style={{ gap: 10 }}>
                          <div className="rounded-full bg-gradient-to-br from-[#d4af37] to-[#8a6e15] flex items-center justify-center text-[#1a0505] font-bold flex-shrink-0 shadow-lg border border-white/10" style={{ width: 36, height: 36, fontSize: 13 }}>{c.name.charAt(0).toUpperCase()}</div>
                          <div className="flex-1 bg-black/40 rounded-2xl rounded-tl-none border border-[#d4af37]/10" style={{ padding: 10 }}>
                            <div className="flex justify-between items-baseline" style={{ marginBottom: 4 }}>
                              <span className="font-bold text-[#d4af37]" style={{ fontSize: 13 }}>{c.name}</span>
                              <span className="text-white/30" style={{ fontSize: 10 }}>{formatTime(c.timestamp)}</span>
                            </div>
                            <p className="text-white/90 leading-relaxed" style={{ fontSize: 13 }}>{c.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-[#150404] border-t border-[#d4af37]/20 flex-shrink-0" style={{ padding: 12 }}>
                  <div className="flex" style={{ gap: 10 }}>
                    <input className="flex-1 bg-black/30 border border-[#d4af37]/20 rounded-full text-white focus:border-[#d4af37] outline-none placeholder:text-white/30 transition-all" placeholder={`Wish as ${visitorName}...`} value={inputMsg} onChange={e => setInputMsg(e.target.value)} style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 10, paddingBottom: 10, fontSize: 14 }} />
                    <button className="bg-[#d4af37] text-[#1a0505] rounded-full flex items-center justify-center disabled:opacity-50 hover:scale-110 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]" disabled={!inputMsg.trim()} onClick={addComment} style={{ width: 42, height: 42 }}>
                      <Send style={{ width: 18, height: 18 }} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <audio ref={audioRef} loop src={!extractYouTubeId(data?.youtubeMusicUrl || data?.music) ? (data?.music || undefined) : undefined} />

      {/* ── Hidden DOM-to-Image Render Target ──────────────────────────────
          Uses transform instead of left/top so the browser keeps the node in
          the normal layout flow and paints it (left:-9999px skips paint → 0×0).
          Explicit width:1080px ensures Gemini HTML lays out at full resolution
          before html-to-image measures the node.                              */}
      {geminiHtml && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            transform: 'translateX(-9999px)',  // ← visual-only offset; layout stays in-flow
            width: '1080px',                    // ← must match Gemini HTML root width
            zIndex: -9999,
            pointerEvents: 'none',
            overflow: 'visible',
          }}
          aria-hidden="true"
        >
          <div
            ref={posterRenderRef}
            dangerouslySetInnerHTML={{ __html: geminiHtml }}
          />
        </div>
      )}
        </div>
      )}
    </>
  );
}

// sync
