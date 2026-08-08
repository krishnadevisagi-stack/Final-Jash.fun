import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { BLOG_POSTS, getBlogPostBySlug } from '../../../lib/blogs-data';
import { ArrowLeft, Calendar, Clock, BookOpen, User } from 'lucide-react';

interface Props {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  return BLOG_POSTS.map(post => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPostBySlug(params.slug);
  if (!post) {
    return {
      title: 'Article Not Found | Jashn Blogs',
    };
  }

  return {
    title: `${post.title} | Jashn Blogs`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `https://jashn.fun/blogs/${post.slug}`,
      publishedTime: post.publishedAt,
    },
  };
}

export default function BlogPostDetail({ params }: Props) {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#1A0505] text-white py-12 px-4 sm:px-6 lg:px-8 font-serif selection:bg-[#d4af37]/30 selection:text-[#d4af37]">
      <article className="max-w-3xl mx-auto space-y-8">
        
        {/* Navigation */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#d4af37] hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back to Blogs
          </Link>
          <span className="text-xs text-white/40 font-mono uppercase tracking-widest flex items-center gap-1.5">
            <BookOpen size={14} className="text-[#d4af37]" /> {post.category}
          </span>
        </div>

        {/* Article Header Metadata */}
        <header className="space-y-4 text-left border-b border-white/10 pb-8">
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/50 font-sans">
            <span className="flex items-center gap-1"><Calendar size={13} className="text-[#d4af37]" /> {post.publishedAt}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock size={13} className="text-[#d4af37]" /> {post.readTime}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><User size={13} className="text-[#d4af37]" /> {post.author}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#d4af37] leading-tight">
            {post.title}
          </h1>

          <p className="text-white/70 text-sm sm:text-base leading-relaxed font-sans italic border-l-2 border-[#d4af37] pl-4">
            {post.excerpt}
          </p>
        </header>

        {/* Text-Centric Content Sections (Headings & Paragraphs Only) */}
        <div className="space-y-8 text-white/90 leading-relaxed font-sans text-sm sm:text-base">
          {post.sections.map((section, idx) => (
            <section key={idx} className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#d4af37] pt-2">
                {section.heading}
              </h2>
              {section.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-white/80 leading-relaxed">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        {/* Article Footer & Navigation */}
        <footer className="pt-10 border-t border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#d4af37] hover:underline"
            >
              <ArrowLeft size={16} /> Explore All Blogs
            </Link>
            <Link
              href="/create"
              className="px-5 py-2.5 bg-[#d4af37] text-[#1A0505] font-extrabold text-xs rounded-xl hover:scale-105 transition-transform"
            >
              Create Website
            </Link>
          </div>

          <div className="text-center text-[11px] text-white/30 font-sans pt-4 border-t border-white/5">
            Published on Jashn.fun • All Rights Reserved
          </div>
        </footer>

      </article>
    </main>
  );
}
