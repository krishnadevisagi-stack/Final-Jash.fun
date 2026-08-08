'use client';

import React from 'react';
import Link from 'next/link';
import { BLOG_POSTS } from '../../lib/blogs-data';
import { ArrowLeft, BookOpen, Clock, Calendar, ChevronRight, Sparkles } from 'lucide-react';

export default function BlogsPage() {
  return (
    <main className="fixed inset-0 w-full h-[100dvh] overflow-y-auto no-scrollbar bg-[#1A0505] text-white font-serif selection:bg-[#d4af37]/30 selection:text-[#d4af37]">
      <div className="min-h-full flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 pb-32 relative z-10">
        <div className="w-full max-w-4xl space-y-10">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#d4af37] hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-widest font-mono">
            <BookOpen size={14} className="text-[#d4af37]" /> Jashn Articles
          </div>
        </div>

        {/* Title Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-mono">
            <Sparkles size={14} /> Official Guides &amp; Insights
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#d4af37] tracking-tight">
            Celebration Blogs &amp; Guides
          </h1>
          <p className="text-white/70 max-w-xl mx-auto text-sm leading-relaxed font-sans">
            Explore creative ideas, wish templates, and guides for crafting unforgettable digital celebration websites.
          </p>
        </div>

        {/* Blog Post List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {BLOG_POSTS.map(post => (
            <article
              key={post.slug}
              className="bg-[#3D1010]/40 backdrop-blur-sm border border-[#d4af37]/20 rounded-2xl p-6 flex flex-col justify-between hover:border-[#d4af37]/50 hover:bg-[#3D1010]/60 transition-all duration-300 shadow-lg group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-white/50 font-sans">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 font-medium">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {post.publishedAt}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-white group-hover:text-[#d4af37] transition-colors leading-snug">
                  <Link href={`/blogs/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>

                <p className="text-white/60 text-xs leading-relaxed font-sans line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-white/40 font-mono">By {post.author}</span>
                <Link
                  href={`/blogs/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#d4af37] group-hover:translate-x-1 transition-transform"
                >
                  Read Article <ChevronRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom Callout */}
        <div className="mt-12 p-8 rounded-2xl bg-[#3D1010]/40 backdrop-blur-sm border border-[#d4af37]/30 text-center space-y-4 shadow-xl">
          <h3 className="text-xl font-bold text-[#d4af37]">Ready to create your own celebration story?</h3>
          <p className="text-white/70 text-xs max-w-md mx-auto leading-relaxed font-sans">
            Build interactive birthday pages, romantic anniversary stories, or milestone pages in under 2 minutes.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-[#2A0A0A] font-extrabold text-sm rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
          >
            Create Celebration Website Now
          </Link>
        </div>

        {/* Footer Links matching Home Page */}
        <div className="w-full max-w-xl flex flex-wrap justify-center items-center gap-x-4 gap-y-2 pt-6 text-center mx-auto">
          <Link href="/privacy" className="text-[10px] text-white/30 uppercase tracking-widest hover:text-[#d4af37] transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-[10px] text-white/30 uppercase tracking-widest hover:text-[#d4af37] transition-colors">Terms &amp; Conditions</Link>
          <Link href="/about" className="text-[10px] text-white/30 uppercase tracking-widest hover:text-[#d4af37] transition-colors">About Us &amp; Contact Us</Link>
          <Link href="/leaderboard" className="text-[10px] text-white/30 uppercase tracking-widest hover:text-[#d4af37] transition-colors">Leaderboard</Link>
          <Link href="/blogs" className="text-[10px] text-white/30 uppercase tracking-widest hover:text-[#d4af37] transition-colors">Blogs</Link>
        </div>

        </div>
      </div>
    </main>
  );
}
