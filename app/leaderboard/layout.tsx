import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Celebration Leaderboard | Jashn - #1 Celebration Website',
  description: 'View the Jashn Celebration Leaderboard. Discover top public celebration stories and contributions for birthdays, anniversaries, wife, husband, best friend, brother, sister, political & religious celebrations.',
  openGraph: {
    title: 'Celebration Leaderboard - Jashn Celebration Website',
    description: 'Discover top celebration stories and pop stories on Jashn Celebration Website.',
    url: 'https://jashn.fun/leaderboard',
  },
  alternates: {
    canonical: 'https://jashn.fun/leaderboard',
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
