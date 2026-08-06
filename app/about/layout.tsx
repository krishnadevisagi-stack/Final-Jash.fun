import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us & Contact Us | Jashn - #1 Online Celebration Website',
  description: 'Learn about Jashn, the premier digital celebration platform. Discover our mission to provide secure, elegant online celebration pages for birthdays, wife, husband, best friend, brother, sister, political & religious events.',
  openGraph: {
    title: 'About Jashn Celebration Website',
    description: 'Learn about Jashn, the premier digital celebration platform for capturing special moments and sharing celebration stories on WhatsApp & Instagram.',
    url: 'https://jashn.fun/about',
  },
  alternates: {
    canonical: 'https://jashn.fun/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
