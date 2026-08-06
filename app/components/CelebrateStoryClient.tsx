'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Volume2, VolumeX, Gift, QrCode, MessageCircle, X, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Fireworks = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    // 🔥 UPDATED COLORS
    const colors = ['#d4af37', '#FFD700', '#FF4500', '#FF8C00', '#ffebb7']; 

    const createExplosion = (x: number, y: number) => {
       const particleCount = 40;
       for(let i=0; i<particleCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 5 + 2;
          particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            decay: Math.random() * 0.02 + 0.015
          });
       }
    };

    let tick = 0;
    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tick++;
      if(tick % 25 === 0 && tick < 300) { 
         createExplosion(Math.random() * canvas.width, Math.random() * canvas.height * 0.5);
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; 
        p.alpha -= p.decay;
        if (p.alpha <= 0) particles.splice(i, 1);
        else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 z-50 pointer-events-none" />;
};

export default function FreeStory() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [stage, setStage] = useState('GIFT');
  const [countdown, setCountdown] = useState(3);
  const [currIndex, setCurrIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<string[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showFireworks, setShowFireworks] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('celebrationData');
    if (saved) {
        setData(JSON.parse(saved));
        const savedComments = localStorage.getItem('storyComments');
        if(savedComments) setComments(JSON.parse(savedComments));
    }
  }, []);

  const handleStart = () => {
    setStage('TIMER');
    if (audioRef.current) {
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(e => console.log("Waiting for user"));
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push('/');
    }
  };

  useEffect(() => {
    if (stage === 'TIMER') {
      const int = setInterval(() => setCountdown(c => c - 1), 1000);
      if (countdown === 0) {
        clearInterval(int);
        setStage('SHOW');
        setShowFireworks(true); 
      }
      return () => clearInterval(int);
    }
  }, [stage, countdown]);

  useEffect(() => {
    if(showFireworks) {
        const t = setTimeout(() => setShowFireworks(false), 6000);
        return () => clearTimeout(t);
    }
  }, [showFireworks]);

  useEffect(() => {
    if (stage === 'SHOW' && data?.photos?.length) {
      const int = setInterval(() => setCurrIndex(prev => (prev + 1) % data.photos.length), 4000);
      return () => clearInterval(int);
    }
  }, [stage, data]);

  const addComment = () => {
    if(!newComment.trim()) return;
    const updated = [...comments, newComment];
    setComments(updated);
    localStorage.setItem('storyComments', JSON.stringify(updated));
    setNewComment("");
  };

  if (!data) return null;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden flex flex-col font-serif text-[#fae8e8] z-50">
      
      {stage === 'GIFT' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 cursor-pointer" onClick={handleStart}>
          <div className="p-8 rounded-full border border-[#d4af37]/20 bg-[#3D1010] shadow-[0_0_50px_rgba(212,175,55,0.2)]">
            <Gift size={80} className="text-[#d4af37] animate-bounce" />
          </div>
          <p className="text-[#d4af37] mt-8 text-sm uppercase tracking-[0.3em] animate-pulse">Tap to Open</p>
        </div>
      )}

      {stage === 'TIMER' && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
           <span className="text-[10rem] text-[#d4af37] animate-ping">{countdown}</span>
        </div>
      )}

      {stage === 'SHOW' && (
        <div className="relative w-full h-full">
          {showFireworks && <Fireworks />}

          <AnimatePresence mode='wait'>
            <motion.img 
              key={currIndex}
              src={data.photos[currIndex]}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-b from-[#2A0A0A]/60 via-transparent to-[#2A0A0A]/90 z-10" />

          <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20">
             <button onClick={handleBack} className="bg-[#2A0A0A]/40 p-2 rounded-full backdrop-blur-md border border-[#d4af37]/20">
                <ArrowLeft size={20} className="text-white"/>
             </button>
             <div className="flex gap-3">
                 <button onClick={() => setShowQR(true)} className="bg-[#2A0A0A]/40 p-2 rounded-full backdrop-blur-md border border-[#d4af37]/20">
                    <QrCode size={20} className="text-white"/>
                 </button>
                 <button onClick={() => { setMuted(!muted); if(audioRef.current) audioRef.current.muted = !muted; }} className="bg-[#2A0A0A]/40 p-2 rounded-full backdrop-blur-md border border-[#d4af37]/20">
                    {muted ? <VolumeX size={20} className="text-white"/> : <Volume2 size={20} className="text-white"/>}
                 </button>
             </div>
          </div>

          <div className="absolute bottom-24 w-full px-8 text-center z-20">
             <h1 className="text-5xl font-serif text-[#d4af37] mb-2 drop-shadow-md">{data.names}</h1>
             <p className="text-white/90 italic text-lg leading-relaxed">"{data.customMessage}"</p>
          </div>

          <div className="absolute bottom-6 w-full flex justify-center gap-8 z-30">
             <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100">
                <MessageCircle size={24} />
                <span className="text-[10px]">Wishes</span>
             </button>
             <button onClick={() => navigator.share({ title: 'Story', url: window.location.href })} className="flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100">
                <Share2 size={24} />
                <span className="text-[10px]">Share</span>
             </button>
          </div>
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2A0A0A]/90 backdrop-blur-sm p-4" onClick={() => setShowQR(false)}>
            <div className="bg-[#3D1010] border border-[#d4af37] p-6 rounded-xl text-center shadow-[0_0_30px_#2b0a0a]" onClick={e => e.stopPropagation()}>
                <h3 className="text-[#d4af37] text-lg font-bold mb-4">Share the Love</h3>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&color=d4af37&bgcolor=3D1010`} className="mx-auto rounded-lg border border-[#d4af37]/30 p-1" />
                <button onClick={() => setShowQR(false)} className="mt-4 text-white hover:text-[#d4af37]">Close</button>
            </div>
        </div>
      )}

      {showComments && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2A0A0A]/80 backdrop-blur-sm" onClick={() => setShowComments(false)}>
            <div className="w-full max-w-md h-[60vh] bg-[#3D1010] border-t sm:border border-[#d4af37]/30 rounded-t-2xl sm:rounded-2xl p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                    <h3 className="text-[#d4af37] font-bold">Wishes & Love</h3>
                    <X className="text-white/50 cursor-pointer" onClick={() => setShowComments(false)} />
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                    {comments.length === 0 && <p className="text-white/30 text-center text-sm italic">Be the first to wish them!</p>}
                    {comments.map((c, i) => (
                        <div key={i} className="bg-[#2A0A0A] p-3 rounded-lg text-sm text-white/90 border border-[#d4af37]/10">
                            {c}
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Write a wish..."
                        className="flex-1 bg-[#2A0A0A] border border-[#d4af37]/30 rounded-full px-4 py-2 text-sm text-white focus:border-[#d4af37] outline-none"
                    />
                    <button onClick={addComment} className="text-[#d4af37] font-bold text-sm">Post</button>
                </div>
            </div>
        </div>
      )}

      <audio ref={audioRef} loop src={data.music} />
    </div>
  );
}

// sync
