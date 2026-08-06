'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Info, Mail, MessageCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AboutAndContact() {
  return (
    <main className="fixed inset-0 w-full h-[100dvh] overflow-y-auto no-scrollbar">
      <div className="min-h-full flex flex-col items-center py-12 px-4 md:px-6 pb-24 relative z-10">
        
        {/* Header section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl text-center mb-10"
        >
          <div className="mb-4 inline-block p-3 rounded-full border border-[#d4af37]/30 bg-[#3D1010]/30 backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.15)]">
            <Info size={28} className="text-[#d4af37]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#d4af37] mb-2">About Us &amp; Contact Us</h1>
          <p className="text-white/40 text-xs uppercase tracking-widest font-mono">Jashn • Last Updated: July 2026</p>
        </motion.div>

        {/* Content Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-2xl bg-[#3D1010]/30 backdrop-blur-md border border-[#d4af37]/20 rounded-3xl p-6 md:p-8 space-y-8 text-[#fae8e8]/90 text-sm leading-relaxed"
        >
          {/* About Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-[#d4af37] border-b border-[#d4af37]/20 pb-2">
              Welcome to Jashn
            </h2>
            <p className="text-white/70">
              Jashn is a premium digital celebration platform created to make life&apos;s special moments more beautiful, memorable, and meaningful.
            </p>
            <p className="text-white/70">
              Whether it is an anniversary, birthday, relationship milestone, or any other special occasion, Jashn allows users to create elegant digital celebration pages that can be shared with the people they care about.
            </p>
            <p className="text-white/70">
              Our mission is to combine beautiful design with simplicity while respecting every user&apos;s privacy.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-2 p-5 rounded-2xl bg-[#2A0A0A]/40 border border-[#d4af37]/10">
              <h3 className="font-serif font-bold text-[#d4af37] text-md">Our Mission</h3>
              <p className="text-white/60 text-xs leading-relaxed">
                To provide a secure, elegant, and easy-to-use platform where people can celebrate their most meaningful moments online without compromising their privacy. We believe every celebration deserves a beautiful presentation.
              </p>
            </div>
            <div className="space-y-2 p-5 rounded-2xl bg-[#2A0A0A]/40 border border-[#d4af37]/10">
              <h3 className="font-serif font-bold text-[#d4af37] text-md">Our Vision</h3>
              <p className="text-white/60 text-xs leading-relaxed">
                We envision Jashn as a trusted celebration platform where creativity, privacy, and meaningful memories come together. Our goal is to continuously improve the experience while keeping it simple and enjoyable.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-serif font-bold text-[#d4af37]">Our Values</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-white/5 bg-[#3D1010]/20 space-y-1">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-[#d4af37]">Privacy First</h4>
                <p className="text-white/60 text-xs">We collect only the information necessary to provide our services and handle it responsibly.</p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-[#3D1010]/20 space-y-1">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-[#d4af37]">Simplicity</h4>
                <p className="text-white/60 text-xs">We believe creating a celebration page should be simple, fast, and enjoyable.</p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-[#3D1010]/20 space-y-1">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-[#d4af37]">Respect</h4>
                <p className="text-white/60 text-xs">Every user deserves equal respect. Every celebration deserves equal importance.</p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-[#3D1010]/20 space-y-1">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-[#d4af37]">Transparency</h4>
                <p className="text-white/60 text-xs">We aim to clearly explain how our platform works and what users can expect.</p>
              </div>
            </div>
          </div>

          {/* Celebration Philosophy */}
          <div className="space-y-3 p-5 rounded-2xl bg-[#d4af37]/5 border border-[#d4af37]/20">
            <h3 className="font-serif font-bold text-[#d4af37] text-md">Our Celebration Philosophy</h3>
            <p className="text-white/70 text-xs leading-relaxed">
              At Jashn, we believe that love, respect, appreciation, and relationships can never be measured by money.
              Whether someone contributes ₹1 or a much larger amount, every celebration is equally valuable.
              The contribution amount is simply a user&apos;s personal choice to support the service and does not represent the importance of a relationship or celebration.
            </p>
          </div>

          {/* Future Leaderboard */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-[#d4af37]">Future Leaderboard</h3>
            <p className="text-white/70 text-xs">
              Jashn may introduce a community leaderboard in the future. Its purpose is to recognize community participation and platform engagement. The leaderboard is not intended to measure love, relationships, emotions, or personal worth. Participation in any leaderboard feature will always remain optional and subject to its own dedicated rules when introduced.
            </p>
          </div>

          {/* Commitment */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-[#d4af37]">Our Commitment</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/70 pl-2">
              <li className="flex items-center gap-2">
                <span className="text-[#d4af37] font-bold">•</span> A secure experience
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#d4af37] font-bold">•</span> A privacy-focused platform
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#d4af37] font-bold">•</span> Beautiful celebration pages
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#d4af37] font-bold">•</span> Continuous improvements
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#d4af37] font-bold">•</span> Respect for users and content
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#d4af37] font-bold">•</span> Fair and transparent policies
              </li>
            </ul>
          </div>

          <hr className="border-[#d4af37]/10" />

          {/* Contact Section */}
          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-serif font-bold text-[#d4af37] border-b border-[#d4af37]/20 pb-2">
              Contact Us
            </h2>
            <p className="text-white/70">
              We are always happy to hear from you. Whether you have questions, suggestions, feedback, or need assistance, our team will do its best to help.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#2A0A0A]/50 border border-[#d4af37]/20 flex flex-col items-center text-center space-y-2">
                <Mail size={20} className="text-[#d4af37]" />
                <span className="font-bold text-xs text-white uppercase tracking-wider">Email</span>
                <span className="text-[10px] text-white/70 font-mono break-all">contact.jashn.fun@gmail.com</span>
              </div>
              <div className="p-4 rounded-xl bg-[#2A0A0A]/50 border border-[#d4af37]/20 flex flex-col items-center text-center space-y-2">
                <MessageCircle size={20} className="text-pink-400" />
                <span className="font-bold text-xs text-white uppercase tracking-wider">Instagram</span>
                <span className="text-[10px] text-white/70 font-mono">@jashn.fun</span>
              </div>
              <div className="p-4 rounded-xl bg-[#2A0A0A]/50 border border-[#d4af37]/20 flex flex-col items-center text-center space-y-2">
                <MessageCircle size={20} className="text-green-400" />
                <span className="font-bold text-xs text-white uppercase tracking-wider">WhatsApp</span>
                <span className="text-[10px] text-white/70 font-mono">+91 6206606232</span>
              </div>
            </div>

            <p className="text-xs text-white/40 italic">
              Please note that WhatsApp support is for chat support only and may not be available at all times. For important requests, email is the preferred contact method.
            </p>

            {/* Business enquiries */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[#d4af37] uppercase tracking-wider">Business &amp; Partnership Enquiries</h4>
              <p className="text-white/70 text-xs">
                For business collaborations, partnership opportunities, media inquiries, or other professional matters, please contact us by email at <span className="text-[#d4af37] font-mono">contact.jashn.fun@gmail.com</span>.
              </p>
            </div>

            {/* Response Time */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[#d4af37] uppercase tracking-wider">Response Time</h4>
              <p className="text-white/70 text-xs">
                We aim to respond to most inquiries within 2–5 business days. Response times may vary depending on the nature and volume of requests.
              </p>
            </div>

            {/* Report a Problem */}
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 space-y-2">
              <h4 className="font-bold text-xs text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert size={14} /> Report a Problem
              </h4>
              <p className="text-white/60 text-xs">
                If you believe your content has been used without permission, a page violates applicable laws or these Terms, you have discovered a security issue, or you encounter a technical problem, please contact us with as much detail as possible so we can review the matter promptly.
              </p>
            </div>
          </div>

          <hr className="border-[#d4af37]/10" />

          <p className="text-center text-xs text-white/50 pt-2 font-serif">
            Thank you for choosing Jashn. We appreciate your trust and remain committed to providing a premium, secure, and privacy-focused celebration platform for everyone.
          </p>
        </motion.div>

        {/* Back Button */}
        <div className="mt-8">
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#3D1010] border border-[#d4af37]/30 text-white hover:border-[#d4af37] transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} className="text-[#d4af37]" />
              <span className="text-xs font-bold uppercase tracking-wider">Back to Home</span>
            </motion.div>
          </Link>
        </div>

      </div>
    </main>
  );
}

// sync
