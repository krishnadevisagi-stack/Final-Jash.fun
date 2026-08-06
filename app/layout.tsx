import type { Metadata } from 'next';
import './globals.css';
import BackgroundEffects from './components/BackgroundEffects';
import SecurityGuard from './components/SecurityGuard';

export const metadata: Metadata = {
  metadataBase: new URL('https://jashn.fun'),
  verification: {
    google: 'dJsJGLzIqR20yJhgmnNp1__XOLCQbg4ny_Tv3os_vm4',
  },
  title: {
    default: 'Jashn - #1 Celebration Website | Capture & Share Moments for Wife, Husband, Best Friend & Events',
    template: '%s | Jashn Celebration Website',
  },
  description: 'Jashn is the premier online celebration website to capture and celebrate special moments for your wife, husband, best friend, brother, sister, birthdays, marriage anniversaries, political events, and religious dates. Share royal digital celebration stories on WhatsApp, Instagram, or direct link.',
  keywords: [
    'celebration website',
    'online celebration website',
    'celebrate wife husband moments',
    'wife celebration website',
    'husband celebration page',
    'best friend celebration story',
    'brother sister celebration',
    'happy birthday celebration website',
    'marriage anniversary celebration maker',
    'relationship anniversary story',
    'political event celebration website',
    'religious date celebration page',
    'jayanti festival celebration website',
    'whatsapp celebration story maker',
    'instagram celebration story link',
    'share celebration link',
    'capture celebration moments online',
    'jashn celebration'
  ],
  applicationName: 'Jashn Celebration Website',
  authors: [{ name: 'Jashn Celebrations', url: 'https://jashn.fun' }],
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  creator: 'Jashn',
  publisher: 'Jashn',
  category: 'Celebration & Events',
  openGraph: {
    title: 'Jashn - #1 Online Celebration Website for Every Special Moment',
    description: 'Capture and celebrate special moments for your wife, husband, best friend, brother, sister, birthdays, political events, religious dates, and anniversaries. Create & share stories on WhatsApp and Instagram!',
    url: 'https://jashn.fun',
    siteName: 'Jashn Celebration Website',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jashn - #1 Celebration Website',
    description: 'The ultimate online celebration website for wife, husband, best friend, brother, sister, birthdays, political & religious events. Share on WhatsApp & Instagram.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://jashn.fun',
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'name': 'Jashn Celebration Website',
  'alternateName': ['Jashn', 'Jashn Online Celebration Website'],
  'url': 'https://jashn.fun',
  'description': 'The premier celebration website to capture, create, and share custom digital celebration stories for wife, husband, best friend, brother, sister, birthdays, political dates, religious events, and anniversaries.',
  'inLanguage': 'en',
};

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  'name': 'Jashn - Online Celebration Website',
  'applicationCategory': 'MultimediaApplication',
  'operatingSystem': 'All',
  'url': 'https://jashn.fun',
  'description': 'Create and share royal digital celebration stories for wife, husband, best friend, brother, sister, birthdays, political events, religious dates, and anniversaries on WhatsApp and Instagram.',
  'offers': {
    '@type': 'Offer',
    'price': '0',
    'priceCurrency': 'INR',
  },
  'featureList': [
    'Celebrate wife, husband, best friend, brother, and sister moments',
    'Happy Birthday celebration stories and greeting cards',
    'Marriage and relationship anniversary celebration pages',
    'Political event, Jayanti, and special date celebrations',
    'Religious date and festival celebrations',
    'Post celebration stories on WhatsApp status, Instagram stories, or direct link sharing'
  ],
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': [
    {
      '@type': 'Question',
      'name': 'What is Jashn Celebration Website?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Jashn is the premier online celebration website designed to help you capture and celebrate special moments for your wife, husband, best friend, brother, sister, birthdays, political events, religious occasions, and anniversaries. Create royal digital celebration pages and stories to share with your loved ones.',
      },
    },
    {
      '@type': 'Question',
      'name': 'What celebration options are available on Jashn?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': '1. Marriage Anniversary: Celebrate for yourself, parents, brother, sister, wife, or husband. 2. Relationship Anniversary: Celebrate for yourself, partner, wife, husband, or best friend. 3. Happy Birthday: Celebrate for yourself, brother, sister, best friend, wife, or husband. 4. Special Date: Celebrate Jayanti, political events, religious dates, festivals, Diwali, new family members, or memorable dates.',
      },
    },
    {
      '@type': 'Question',
      'name': 'How do I share my celebration story on WhatsApp and Instagram?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Once created, you can post your celebration page link directly to WhatsApp status, Instagram stories, or send direct invitation links to your wife, husband, best friend, brother, sister, or guests to view and join your celebration story.',
      },
    },
    {
      '@type': 'Question',
      'name': 'Can I celebrate political and religious events on this website?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Yes! Jashn includes Special Date options specifically designed for political events, political campaigns, religious occasions, Jayanti celebrations, and festivals.',
      },
    },
  ],
};

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  'name': 'Jashn Online Celebration Website Services & Options',
  'description': 'Comprehensive list of celebration categories, event options, and relationship stories available on Jashn Celebration Website.',
  'itemListElement': [
    {
      '@type': 'ListItem',
      'position': 1,
      'name': 'Marriage Anniversary Celebration Website',
      'description': 'Create and share royal digital marriage anniversary celebration stories for self, wife, husband, parents, brother, and sister.',
    },
    {
      '@type': 'ListItem',
      'position': 2,
      'name': 'Relationship Anniversary Celebration Page',
      'description': 'Capture relationship anniversary milestones for self, partner, wife, husband, and best friend with personalized photos and music.',
    },
    {
      '@type': 'ListItem',
      'position': 3,
      'name': 'Happy Birthday Celebration Story Maker',
      'description': 'Design animated happy birthday celebration pages for wife, husband, best friend, brother, sister, and loved ones.',
    },
    {
      '@type': 'ListItem',
      'position': 4,
      'name': 'Special Date & Event Celebration (Political, Religious, Jayanti, Festivals)',
      'description': 'Celebrate specific dates including political events, political campaigns, religious occasions, Jayanti, Diwali, new family members, and wedding dates.',
    },
    {
      '@type': 'ListItem',
      'position': 5,
      'name': 'Social Sharing on WhatsApp, Instagram & Direct Invitation Links',
      'description': 'Instantly post celebration pages to WhatsApp status, Instagram stories, or share direct links to invite wife, husband, best friend, brother, and sister.',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" 
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function p(e){e.preventDefault();e.stopPropagation();return false;}document.addEventListener('contextmenu',p,true);window.addEventListener('contextmenu',p,true);document.addEventListener('keydown',function(e){if(e.key==='F12'||e.keyCode===123)return p(e);var c=e.ctrlKey||e.metaKey;if(c){if(e.shiftKey&&(e.key==='I'||e.key==='i'||e.key==='J'||e.key==='j'||e.key==='C'||e.key==='c'||e.keyCode===73||e.keyCode===74||e.keyCode===67))return p(e);if(e.key==='U'||e.key==='u'||e.keyCode===85)return p(e);if(e.key==='S'||e.key==='s'||e.keyCode===83)return p(e);if(e.key==='P'||e.key==='p'||e.keyCode===80)return p(e);}},true);document.addEventListener('dragstart',p,true);})();`,
          }}
        />
      </head>
      <body className="antialiased text-[#fae8e8] overflow-hidden">
        <SecurityGuard />
        <BackgroundEffects />
        
        <div className="relative z-0 w-full h-full">
          {children}
        </div>
        
      </body>
    </html>
  );
}

// sync
