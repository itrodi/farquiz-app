import type { Metadata } from 'next';
import HomeClient from './home-client'; // Import the new client component

const frameMetadata = {
  "version": "next",
  "imageUrl": "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/RBv8coHVCER8/farquiz_icon-IXTBuZNFH0DudhmcvziRZArAtuvCWn.png?reUe",
  "button": {
    "title": "Play Now",
    "action": {
      "type": "launch_frame",
      "name": "FarQuiz",
      "url": "https://farquizapp.vercel.app",
      "splashImageUrl": "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/RBv8coHVCER8/farquiz_splash-h61l64V89HzQsrn3v0Ey1RJGCVtPvq.png?Ik5m",
      "splashBackgroundColor": "#8B5CF6"
    }
  }
};

export const metadata: Metadata = {
  other: {
    'fc:frame': JSON.stringify(frameMetadata),
  },
};

export default function Home() {
  return <HomeClient />;
}
