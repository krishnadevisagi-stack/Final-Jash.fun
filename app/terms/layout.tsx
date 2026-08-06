import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Jashn - Online Celebration Website',
  description: 'Read the Terms & Conditions of Jashn Celebration Website. Terms of service for creating, capturing, and sharing digital celebration stories for wife, husband, best friend, birthdays, political & religious occasions.',
  openGraph: {
    title: 'Terms & Conditions - Jashn Celebration Website',
    description: 'Terms and conditions governing the use of Jashn Celebration Website.',
    url: 'https://jashn.fun/terms',
  },
  alternates: {
    canonical: 'https://jashn.fun/terms',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
