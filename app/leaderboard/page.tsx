'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Loader2, Sparkles, Heart } from 'lucide-react';
import Link from 'next/link';

interface LeaderboardItem {
  _id: string;
  name: string;
  amount?: number;
  pops?: number;
  isPublic: boolean;
  storyId?: string;
  storyType?: 'PREMIUM' | 'FREE';
  createdAt: string;
}

export default function Leaderboard() {
  const [tab, setTab] = useState<'CONTRIBUTIONS' | 'POPS'>('CONTRIBUTIONS');
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const typeParam = tab === 'POPS' ? 'pops' : 'contributions';
    
    fetch(`/api/leaderboard?type=${typeParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.users)) {
          setItems(data.users);
        } else {
          setItems([]);
        }
      })
      .catch((err) => {
        console.error('Error fetching leaderboard:', err);
        setItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tab]);

  return (
    <main className="fixed inset-0 w-full h-[100dvh] overflow-y-auto no-scrollbar bg-transparent">
      <div className="min-h-full flex flex-col items-center py-10 px-4 md:px-6 relative z-10 max-w-lg mx-auto">
        
        {/* Header Section */}
        <div className="w-full text-center space-y-3 mb-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
            <Trophy size={24} className="text-[#d4af37]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#d4af37] tracking-tight">
            Celebration Leaderboard
          </h1>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
            {tab === 'CONTRIBUTIONS' ? 'Highest Contributions' : 'Highest Pops Content'}
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="w-full mb-6 p-1 bg-[#3D1010]/60 backdrop-blur-md rounded-full border border-[#d4af37]/30 flex">
          <button
            type="button"
            onClick={() => setTab('CONTRIBUTIONS')}
            className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === 'CONTRIBUTIONS'
                ? 'bg-[#d4af37] text-[#2A0A0A] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Highest Contributions</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('POPS')}
            className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === 'POPS'
                ? 'bg-[#d4af37] text-[#2A0A0A] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Heart size={14} />
            <span>Highest Pops</span>
          </button>
        </div>

        {/* Content Section */}
        <div className="w-full flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="animate-spin text-[#d4af37]" size={24} />
              <p className="text-white/40 text-xs font-mono uppercase tracking-wider">Loading Leaderboard...</p>
            </div>
          ) : items.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center space-y-4 bg-[#3D1010]/20 backdrop-blur-md border border-white/5 rounded-2xl"
            >
              <p className="text-white/60 text-sm leading-relaxed max-w-xs font-serif">
                {tab === 'CONTRIBUTIONS'
                  ? 'No contributions have been recorded yet.'
                  : 'No pop stories found on the leaderboard yet.'}
              </p>
              <p className="text-white/30 text-xs leading-relaxed max-w-xs">
                Create a celebration story to place yourself at the top!
              </p>
            </motion.div>
          ) : (
            /* Leaderboard entries */
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full bg-[#3D1010]/30 backdrop-blur-md border border-[#d4af37]/20 rounded-2xl p-2 space-y-1 overflow-hidden"
            >
              {items.map((item, index) => {
                const rank = index + 1;
                const isClickable = item.isPublic !== false && !!item.storyId;
                
                const url = tab === 'POPS' || item.storyType === 'FREE'
                  ? `/celebrate/preview?storyId=${item.storyId}`
                  : `/celebrate/premium?storyId=${item.storyId}`;

                const innerContent = (
                  <div
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                      isClickable 
                        ? 'cursor-pointer hover:bg-[#d4af37]/10 hover:border-[#d4af37]/40 border-white/5 bg-[#3D1010]/20' 
                        : 'border-transparent select-text opacity-90'
                    }`}
                  >
                    {/* Rank & Name */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <span className="font-mono text-xs text-[#d4af37] font-bold w-6 text-right">
                        #{rank}
                      </span>
                      <div className="flex flex-col min-w-0 text-left">
                        <span className="text-white/90 text-sm font-medium truncate pr-2">
                          {item.name}
                        </span>
                      </div>
                    </div>

                    {/* Metric Display (Contribution Amount OR Pops) */}
                    <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs font-bold text-[#d4af37]">
                      {tab === 'CONTRIBUTIONS' ? (
                        <>
                          <span>₹</span>
                          <span>{(item.amount || 0).toLocaleString('en-IN')}</span>
                        </>
                      ) : (
                        <>
                          <span>🎈</span>
                          <span>{(item.pops || 0).toLocaleString('en-IN')} Pops</span>
                        </>
                      )}
                    </div>
                  </div>
                );

                if (isClickable) {
                  return (
                    <Link href={url} key={item._id} prefetch={false} className="block no-underline">
                      {innerContent}
                    </Link>
                  );
                }

                return (
                  <div key={item._id}>
                    {innerContent}
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Back to Home Button */}
        <div className="pt-8 w-full flex justify-center">
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/10 bg-[#3D1010]/40 text-white/70 hover:text-[#d4af37] hover:border-[#d4af37]/30 font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
            >
              <ArrowLeft size={12} />
              <span>Back to Home</span>
            </motion.div>
          </Link>
        </div>

      </div>
    </main>
  );
}

// sync
