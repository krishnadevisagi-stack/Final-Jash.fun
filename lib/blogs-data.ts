export interface BlogSection {
  heading: string;
  paragraphs: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  category: string;
  author: string;
  sections: BlogSection[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-to-create-birthday-celebration-website',
    title: 'How to Create a Memorable Birthday Celebration Website in 2 Minutes',
    excerpt: 'Discover how to turn special birthdays into unforgettable digital experiences with personalized countdowns, cake-cutting animations, music, and photo galleries.',
    publishedAt: 'August 8, 2026',
    readTime: '4 min read',
    category: 'Birthday Guide',
    author: 'Jashn Team',
    sections: [
      {
        heading: 'Why Digital Birthday Cards are the Future of Celebrations',
        paragraphs: [
          'Traditional paper greeting cards are sweet, but they are static and often misplaced over time. In contrast, a personalized celebration website creates a live, interactive experience that your loved one can keep forever.',
          'With a custom celebration website, you can combine interactive cake-cutting animations, custom background music playback, photo galleries, countdown timers, and secret tap-to-open love messages into a single seamless web page.'
        ]
      },
      {
        heading: 'Step-by-Step Guide to Crafting Your Celebration Story',
        paragraphs: [
          'Step 1: Choose Your Celebration Occasion - Select whether your story is for a birthday, milestone year (e.g. 18th, 25th, 50th), partner, best friend, or sibling.',
          'Step 2: Add Heartfelt Wishes & Shayari - Write custom quotes or romantic wishes that automatically display after the virtual cake is cut.',
          'Step 3: Upload Favorite Photo Memories - Add up to 6 high-definition photos in a premium grid layout to showcase your journey together.',
          'Step 4: Set Background Music - Choose an MP3 track or paste a YouTube music video link to play automatically when the recipient opens the link.'
        ]
      },
      {
        heading: 'Adding Surprise Elements for Extra Magic',
        paragraphs: [
          'Make your celebration page extra special by enabling tap-to-reveal secret messages and photo cards. These hidden cards add an element of mystery and surprise that keeps the birthday person engaged from start to finish.',
          'Once your page is ready, you get an instant shareable link that works seamlessly across all mobile devices, WhatsApp, and social media.'
        ]
      }
    ]
  },
  {
    slug: 'top-romantic-anniversary-wish-ideas',
    title: 'Top Romantic Anniversary Wish Ideas for Your Celebration Page',
    excerpt: 'Expressing love beyond simple text messages. Learn how to write heartfelt anniversary letters and combine romantic quotes with milestone memories.',
    publishedAt: 'August 5, 2026',
    readTime: '5 min read',
    category: 'Anniversary & Love',
    author: 'Jashn Team',
    sections: [
      {
        heading: 'Expressing Love Beyond Simple Text Messages',
        paragraphs: [
          'Anniversaries are milestones of togetherness, shared laughter, and overcoming challenges hand-in-hand. Standard messaging apps don\'t do justice to the depth of emotion you feel on your special day.',
          'Creating a dedicated digital love letter paired with your favorite romantic songs creates an emotional moment that your partner will cherish for years.'
        ]
      },
      {
        heading: 'Crafting the Perfect Love Letter',
        paragraphs: [
          'Start with Gratitude: Mention specific moments when your partner supported you or brought warmth into your life.',
          'Highlight Milestone Years: Celebrate the exact number of years you have spent together, whether it is 1 year, 5 years, or 25 silver years.',
          'Include Secret Tap Messages: Write private inside jokes or promises that only your partner can unlock by tapping on secret cards.'
        ]
      },
      {
        heading: 'Combining Visual Memories with Music',
        paragraphs: [
          'Pair your written letter with a nostalgic background song and a gallery of your favorite couple photos. When your partner opens the link, the music begins playback automatically as they scroll through your shared memories.'
        ]
      }
    ]
  },
  {
    slug: 'digital-celebration-websites-trend-2026',
    title: 'Why Digital Celebration Websites are the New Trend in 2026',
    excerpt: 'From environmental benefits to instant global delivery, explore why millions are choosing online celebration pages over traditional paper invites and cards.',
    publishedAt: 'August 1, 2026',
    readTime: '3 min read',
    category: 'Trends & Insights',
    author: 'Jashn Team',
    sections: [
      {
        heading: 'The Shift from Paper Cards to Interactive Experiences',
        paragraphs: [
          'In 2026, digital storytelling has revolutionized how we celebrate life\'s milestones. Paper cards are easily thrown away, but a digital celebration story lives permanently in the cloud.',
          'Digital celebration pages offer instant delivery anywhere in the world, eliminating shipping delays and eco-waste while offering rich multimedia interaction.'
        ]
      },
      {
        heading: 'Personalization for Every Occasion',
        paragraphs: [
          'Whether it is a national Jayanti (e.g. Gandhi Jayanti), Environment Day, a cultural festival like Diwali or Eid, a marriage date announcement, or welcoming a newborn baby into the family, custom celebration websites offer tailored themes for every event.',
          'With real-time balloon popping games, interactive virtual cake cutting, custom quotes, and leaderboard rankings, digital celebrations bring friends and family closer together regardless of physical distance.'
        ]
      }
    ]
  }
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(post => post.slug === slug);
}
