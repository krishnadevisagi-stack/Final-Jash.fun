import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Jashn - Online Celebration Website',
  description: 'Read the Privacy Policy of Jashn Celebration Website. Learn how we protect your data and privacy when creating and sharing celebration stories for wife, husband, best friend, brother, sister, and special events.',
  openGraph: {
    title: 'Privacy Policy - Jashn Celebration Website',
    description: 'Learn how Jashn handles and protects user privacy across all digital celebration pages and stories.',
    url: 'https://jashn.fun/privacy',
  },
  alternates: {
    canonical: 'https://jashn.fun/privacy',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
