import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jashn Blogs & Guides | Celebration Ideas & Stories',
  description: 'Read the official Jashn blogs and guides. Discover creative birthday celebration ideas, romantic anniversary wishes, and digital celebration website tips.',
  openGraph: {
    title: 'Jashn Blogs & Guides - Celebration Ideas & Digital Stories',
    description: 'Explore guides and articles on creating digital celebration websites for birthdays, anniversaries, and special events.',
    url: 'https://jashn.fun/blogs',
    siteName: 'Jashn Celebration Website',
    type: 'website',
  },
};

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
