

'use client';

import { motion } from 'framer-motion';
import { Gift, Heart, Calendar, PartyPopper, ArrowRight, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const categories = [
    {
      id: 'MARRIAGE',
      title: 'Marriage Anniversary',
      sub: 'Celebrate like: Self, Parents, Brother, Sister',
      icon: <Heart size={24} className="text-[#d4af37] fill-[#d4af37]" />
    },
    {
      id: 'RELATIONSHIP',
      title: 'Relationship Anniversary',
      sub: 'Celebrate like: Self, Partner, Friend',
      icon: <Heart size={24} className="text-pink-500 fill-pink-500" />
    },
    {
      id: 'BIRTHDAY',
      title: 'Happy Birthday',
      sub: 'Celebrate like: Self, Brother, Sister, Friend',
      icon: <PartyPopper size={24} className="text-purple-400" />
    },
    {
      id: 'SPECIAL',
      title: 'Special Date',
      sub: 'Jayanti, Diwali, New Member, Wedding Date',
      icon: <Calendar size={24} className="text-blue-400" />
    }
  ];

  return (
    <main className="fixed inset-0 w-full h-[100dvh] overflow-y-auto no-scrollbar">
      <div className="min-h-full flex flex-col items-center justify-center py-12 px-6 gap-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center w-full max-w-md relative z-10"
        >
          <div className="mb-4 inline-block p-4 rounded-full border border-[#d4af37]/30 bg-[#3D1010]/30 backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.15)]">
            <Gift size={36} className="text-[#d4af37] animate-pulse" />
          </div>

          <h1 className="text-5xl font-bold mb-2 font-serif leading-tight tracking-tight">
            <span className="text-shimmer drop-shadow-md">Jashn</span>
          </h1>
          <p className="text-[#fae8e8]/60 text-sm max-w-xs mx-auto">
            Royal celebration website for moments.
          </p>

          {/* Hidden SEO text for search engine crawlers */}
          <div className="sr-only">
            <h2>The Ultimate Celebration Website for Every Special Moment</h2>
            <p>
              Welcome to Jashn, the premier online celebration website designed to help you capture and celebrate life&apos;s best moments. Whether it is a celebration for your wife, husband, best friend, brother, or sister, Jashn provides royal digital celebration pages and stories.
            </p>
            <p>
              Celebrate Happy Birthdays, Marriage Anniversaries, Relationship Milestones, Political Events, Religious Occasions, Jayanti, and special dates. Share your custom celebration stories directly on WhatsApp status, Instagram stories, or send direct links to invite your user, friend, wife, best friend, husband, sister, and brother to your story.
            </p>
          </div>
        </motion.div>

        <div className="w-full max-w-md space-y-4 relative z-10">
          {categories.map((cat, index) => (
            <Link key={cat.id} href={`/create?category=${cat.id}`} prefetch={false} className="block">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#3D1010]/40 backdrop-blur-sm border border-[#d4af37]/20 rounded-2xl p-5 hover:bg-[#3D1010]/60 hover:border-[#d4af37]/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-[#2A0A0A]/50 border border-[#d4af37]/10 group-hover:border-[#d4af37] transition-colors">
                      <div className="group-hover:text-[#d4af37] transition-colors">
                          {cat.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{cat.title}</h3>
                      <p className="text-white/40 text-xs">{cat.sub}</p>
                    </div>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-[#2A0A0A] transition-all">
                      <ArrowRight size={16} />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        <div className="w-full max-w-md flex flex-wrap justify-center items-center gap-x-4 gap-y-2 pt-4 text-center">
          <Link href="/privacy" className="text-[10px] text-white/30 uppercase tracking-widest hover:text-[#d4af37] transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-[10px] text-white/30 uppercase tracking-widest hover:text-[#d4af37] transition-colors">Terms &amp; Conditions</Link>
          <Link href="/about" className="text-[10px] text-white/30 uppercase tracking-widest hover:text-[#d4af37] transition-colors">About Us &amp; Contact Us</Link>
          <Link href="/leaderboard" className="text-white/30 hover:text-[#d4af37] transition-all duration-300" title="Leaderboard">
            <Trophy size={14} className="text-white/30 hover:text-[#d4af37] transition-colors" />
          </Link>
        </div>

      </div>
    </main>
  );
}

// sync
