'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

export default function TermsAndConditions() {
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
            <FileText size={28} className="text-[#d4af37]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#d4af37] mb-2">Terms & Conditions</h1>
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
            Welcome to Jashn. These Terms & Conditions (&quot;Terms&quot;) govern your access to and use of the Jashn website and services. By using Jashn, you agree to comply with these Terms. If you do not agree with any part of these Terms, please do not use our services.
          </p>

          <hr className="border-[#d4af37]/10" />

          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">01.</span> About Jashn
            </h2>
            <p className="text-white/70">
              Jashn is a premium digital celebration platform where users can create personalized celebration pages for anniversaries, birthdays, relationships, and other special occasions.
            </p>
            <p className="text-white/70">
              Jashn provides the platform and tools required to create these pages. The content published on a celebration page is created and controlled by the respective user.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">02.</span> Eligibility
            </h2>
            <p className="text-white/70">
              By using Jashn, you confirm that:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-white/70">
              <li>You have the legal capacity to use this website under the laws applicable to you.</li>
              <li>The information you provide is accurate to the best of your knowledge.</li>
              <li>You will use the platform responsibly and lawfully.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">03.</span> User Content
            </h2>
            <p className="text-white/70">
              You are solely responsible for all content you upload or publish, including but not limited to:
            </p>
            <div className="grid grid-cols-2 gap-2 pl-2 text-white/70 text-xs font-mono">
              <div>• Photos</div>
              <div>• Videos</div>
              <div>• Messages</div>
              <div>• Names</div>
              <div>• Dates</div>
              <div>• Graphics</div>
            </div>
            <p className="text-white/70">
              By uploading content, you confirm that you have the necessary rights or permission to use and share that content.
            </p>
            <p className="text-white/70">
              Jashn does not claim ownership of your original content.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">04.</span> Acceptable Use
            </h2>
            <p className="text-white/70">
              You agree not to use Jashn for any purpose that is unlawful, harmful, or violates the rights of others.
            </p>
            <p className="text-white/70">
              You must not upload or publish content that:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-white/70">
              <li>Violates any applicable law.</li>
              <li>Infringes copyright, trademark, or other intellectual property rights.</li>
              <li>Contains malware, viruses, or malicious code.</li>
              <li>Promotes fraud, scams, or illegal activities.</li>
              <li>Contains hate speech, threats, harassment, or abusive material.</li>
              <li>Invades another person&apos;s privacy without permission.</li>
              <li>Attempts to interfere with the security or operation of Jashn.</li>
            </ul>
            <p className="text-white/70 italic text-xs text-red-300">
              We reserve the right to remove content that violates these Terms.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">05.</span> User Responsibility
            </h2>
            <p className="text-white/70">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-white/70">
              <li>Maintaining the accuracy of the information you provide.</li>
              <li>Keeping your celebration page links secure if you wish them to remain private.</li>
              <li>Ensuring that your content complies with applicable laws.</li>
              <li>Any consequences arising from the content you publish.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">06.</span> Contributions and Payments
            </h2>
            <p className="text-white/70">
              Jashn allows users to make a voluntary contribution to create a celebration page.
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-white/70">
              <li>The minimum contribution is ₹1.</li>
              <li>Users may contribute any amount equal to or greater than the minimum amount, subject to any technical limits displayed on the platform.</li>
              <li>The contribution amount is entirely your personal choice.</li>
              <li>Jashn does not require users to contribute more than the applicable minimum to use the service.</li>
            </ul>
            <p className="text-[#d4af37] font-semibold text-xs">
              All eligible contributions are final and non-refundable, except where a refund is required by applicable law.
            </p>
            <p className="text-white/70 italic text-xs">
              The amount contributed does not determine the value of a relationship, celebration, or personal affection.
            </p>
          </div>

          {/* Section 7 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">07.</span> Celebration Philosophy
            </h2>
            <p className="text-white/70">
              At Jashn, we believe that love, respect, and appreciation cannot be measured by money.
            </p>
            <p className="text-white/70">
              Whether someone contributes ₹1 or a much larger amount, every celebration is equally meaningful.
            </p>
            <p className="text-white/70">
              Our platform exists to help users express emotions—not to measure them.
            </p>
          </div>

          {/* Section 8 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">08.</span> Intellectual Property
            </h2>
            <p className="text-white/70">
              The Jashn platform, including its branding, logo, design elements, software, and original website content, is protected by applicable intellectual property laws.
            </p>
            <p className="text-white/70">
              Users may not copy, reproduce, distribute, or commercially exploit Jashn&apos;s original platform without prior authorization.
            </p>
            <p className="text-white/70">
              User-generated content remains the responsibility of the respective user.
            </p>
          </div>

          {/* Section 9 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">09.</span> Privacy
            </h2>
            <p className="text-white/70">
              Your use of Jashn is also governed by our Privacy Policy, which explains how we collect, use, store, and protect your information.
            </p>
          </div>

          {/* Section 10 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">10.</span> Service Availability
            </h2>
            <p className="text-white/70">
              We aim to provide a reliable service, but we do not guarantee uninterrupted availability.
            </p>
            <p className="text-white/70">
              Maintenance, technical issues, security improvements, or circumstances beyond our reasonable control may temporarily affect access to the platform.
            </p>
          </div>

          {/* Section 11 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">11.</span> Limitation of Liability
            </h2>
            <p className="text-white/70">
              Jashn provides the platform on an &quot;as available&quot; and &quot;as is&quot; basis.
            </p>
            <p className="text-white/70">
              To the extent permitted by applicable law, Jashn shall not be liable for indirect, incidental, consequential, or special damages arising from the use or inability to use the platform.
            </p>
            <p className="text-white/70">
              Nothing in these Terms limits any rights that cannot legally be excluded under applicable law.
            </p>
          </div>

          {/* Section 12 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">12.</span> Changes to the Service
            </h2>
            <p className="text-white/70">
              We may modify, improve, suspend, or discontinue certain features of Jashn from time to time.
            </p>
            <p className="text-white/70">
              Where appropriate, we may also update these Terms to reflect changes in our services or legal requirements.
            </p>
          </div>

          {/* Section 13 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">13.</span> Changes to These Terms
            </h2>
            <p className="text-white/70">
              These Terms may be revised periodically.
            </p>
            <p className="text-white/70">
              The latest version will always be available on this page, and your continued use of Jashn after updates become effective constitutes acceptance of the revised Terms.
            </p>
          </div>

          {/* Section 14 */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">14.</span> Governing Law
            </h2>
            <p className="text-white/70">
              These Terms shall be governed by and interpreted in accordance with the applicable laws of India, without affecting any mandatory legal rights available to users under applicable law.
            </p>
          </div>

          {/* Section 15 */}
          <div className="space-y-4">
            <h2 className="text-lg font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="text-xs font-mono opacity-50">15.</span> Contact Us
            </h2>
            <p className="text-white/70">
              If you have any questions regarding these Terms & Conditions, please contact us:
            </p>
            <div className="bg-[#2A0A0A]/50 border border-[#d4af37]/20 p-4 rounded-xl space-y-2 font-mono text-xs text-white/80">
              <div><span className="text-[#d4af37]">Email:</span> contact.jashn.fun@gmail.com</div>
              <div><span className="text-[#d4af37]">Instagram:</span> @jashn.fun</div>
              <div><span className="text-[#d4af37]">WhatsApp (Chat Support Only):</span> +91 6206606232</div>
            </div>
          </div>

          <hr className="border-[#d4af37]/10" />

          <p className="text-center text-xs text-white/50 pt-2 font-serif">
            Thank you for choosing Jashn. Our mission is to provide a premium, respectful, and secure platform where people can celebrate life&apos;s most meaningful moments with confidence and privacy.
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
