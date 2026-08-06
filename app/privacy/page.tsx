'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicy() {
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
            <Shield size={28} className="text-[#d4af37]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#d4af37] mb-2">Privacy Policy</h1>
          <p className="text-white/40 text-xs uppercase tracking-widest font-mono">Jashn • Last Updated: July 2026</p>
        </motion.div>

        {/* Content Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-2xl bg-[#3D1010]/30 backdrop-blur-md border border-[#d4af37]/20 rounded-3xl p-6 md:p-8 space-y-8 text-[#fae8e8]/90 text-sm leading-relaxed"
        >
          <p className="italic text-white/80 font-serif border-l-2 border-[#d4af37]/50 pl-4 py-1">
            Welcome to Jashn. Your privacy is important to us. This Privacy Policy explains what information we collect, how we use it, how we protect it, and the choices you have when using our platform. By accessing or using Jashn, you agree to this Privacy Policy.
          </p>

          <hr className="border-[#d4af37]/10" />

          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">01.</span> Who We Are
            </h2>
            <p className="text-white/70">
              Jashn is a premium digital celebration platform where users can create beautiful and personalized celebration pages for special occasions such as anniversaries, birthdays, and other memorable events.
            </p>
            <p className="text-white/70">
              Our goal is to provide a secure, elegant, and privacy-focused experience while giving users full control over the content they create.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">02.</span> Information We Collect
            </h2>
            <p className="text-white/70">
              We collect only the information necessary to provide our services. This may include:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-white/70">
              <li>Your email address.</li>
              <li>Information you voluntarily provide while creating a celebration page, such as names, messages, images, videos, dates, or other content.</li>
              <li>Basic technical information required for website security and performance, such as browser type, device information, language preferences, and access logs.</li>
            </ul>
            <p className="text-white/70 font-serif italic text-xs text-[#d4af37]/70">
              We do not intentionally collect unnecessary sensitive personal information.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">03.</span> Why We Collect Information
            </h2>
            <p className="text-white/70">
              We use your information only to:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-white/70">
              <li>Create and deliver your celebration pages.</li>
              <li>Contact you regarding your page or support requests.</li>
              <li>Send important service-related notifications.</li>
              <li>Maintain website security and reliability.</li>
              <li>Improve the quality and performance of our services.</li>
              <li>Comply with applicable legal obligations when required.</li>
            </ul>
            <p className="text-[#d4af37] font-semibold text-xs">
              We do not sell, rent, or trade your personal information.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">04.</span> Data Retention
            </h2>
            <p className="text-white/70">
              Your celebration page data and related information are retained for up to one (1) year from the date of creation.
            </p>
            <p className="text-white/70">
              After the retention period expires, eligible data is automatically scheduled for deletion through our automated system.
            </p>
            <p className="text-white/70">
              Certain limited records may be retained for a longer period only where required by applicable law, fraud prevention, or security purposes.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">05.</span> Private Celebration Pages
            </h2>
            <p className="text-white/70">
              Jashn is designed with privacy in mind.
            </p>
            <p className="text-white/70">
              Celebration pages created on our platform are intended to be unlisted. They are generally accessible only through their unique direct link and are not intended for public browsing or search engine discovery.
            </p>
            <p className="text-white/70 font-semibold italic text-[#d4af37]/90">
              Please remember that anyone who receives the direct link from you may be able to access the page. You are responsible for deciding with whom you share your links.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">06.</span> Email Communication
            </h2>
            <p className="text-white/70">
              Your email address may be used to:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-white/70">
              <li>Send important service notifications.</li>
              <li>Respond to your inquiries.</li>
              <li>Provide account or page-related updates.</li>
              <li>Notify you about significant changes affecting your use of Jashn.</li>
            </ul>
            <p className="text-white/70">
              We do not send unnecessary promotional emails without an appropriate legal basis or your consent where required.
            </p>
          </div>

          {/* Section 7 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">07.</span> Cookies and Similar Technologies
            </h2>
            <p className="text-white/70">
              Jashn may use cookies or similar technologies to:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-white/70">
              <li>Keep the website functioning properly.</li>
              <li>Improve website performance.</li>
              <li>Remember your preferences.</li>
              <li>Enhance security and user experience.</li>
            </ul>
            <p className="text-white/70">
              If additional technologies are introduced in the future, this Privacy Policy may be updated accordingly.
            </p>
          </div>

          {/* Section 8 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">08.</span> Data Security
            </h2>
            <p className="text-white/70">
              We use reasonable technical and organizational measures to help protect your information from unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p className="text-white/70">
              However, no method of electronic storage or internet transmission can be guaranteed to be completely secure. While we work to protect your information, absolute security cannot be guaranteed.
            </p>
          </div>

          {/* Section 9 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">09.</span> Your Rights
            </h2>
            <p className="text-white/70">
              Depending on applicable law, you may have the right to:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-white/70">
              <li>Request access to your personal information.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion of eligible information.</li>
              <li>Contact us regarding privacy-related concerns.</li>
            </ul>
            <p className="text-white/70">
              We will review and respond to valid requests in accordance with applicable laws.
            </p>
          </div>

          {/* Section 10 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">10.</span> Changes to This Privacy Policy
            </h2>
            <p className="text-white/70">
              We may update this Privacy Policy from time to time to reflect changes in our services, legal requirements, or security practices.
            </p>
            <p className="text-white/70">
              The updated version becomes effective immediately upon publication on this page. We encourage users to review this page periodically.
            </p>
          </div>

          {/* Section 11 */}
          <div className="space-y-4">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">11.</span> Contact Us
            </h2>
            <p className="text-white/70">
              If you have any questions or concerns regarding this Privacy Policy or the way your information is handled, please contact us:
            </p>
            <div className="bg-[#2A0A0A]/50 border border-[#d4af37]/20 p-4 rounded-xl space-y-2 font-mono text-xs text-white/80">
              <div><span className="text-[#d4af37]">Email:</span> contact.jashn.fun@gmail.com</div>
              <div><span className="text-[#d4af37]">Instagram:</span> @jashn.fun</div>
              <div><span className="text-[#d4af37]">WhatsApp (Support Only):</span> +91 6206606232</div>
            </div>
          </div>

          <hr className="border-[#d4af37]/10" />

          <p className="text-center text-xs text-white/50 pt-2 font-serif">
            Thank you for trusting Jashn. We are committed to protecting your privacy while helping you celebrate your most meaningful moments with confidence.
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
