import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // ?title=<title>&category=<category>&time=<time>&difficulty=<difficulty>
  const title = searchParams.get('title') || 'Take the Quiz!';
  const category = searchParams.get('category');
  const time = searchParams.get('time');
  const difficulty = searchParams.get('difficulty');

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 40,
          color: 'black',
          background: 'white',
          width: '100%',
          height: '100%',
          padding: '50px 100px',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid #8B5CF6', // Purple border
        }}
      >
        <div style={{ fontSize: 60, marginBottom: 30, color: '#8B5CF6' }}>
          {title}
        </div>
        {category && (
          <div style={{ fontSize: 30, marginBottom: 15 }}>
            Category: {category}
          </div>
        )}
        {time && (
          <div style={{ fontSize: 30, marginBottom: 15 }}>
            Time: {time}
          </div>
        )}
        {difficulty && (
          <div style={{ fontSize: 30, marginBottom: 15, textTransform: 'capitalize' }}>
            Difficulty: {difficulty}
          </div>
        )}
        <div style={{ marginTop: 40, fontSize: 28, color: '#555' }}>
          Powered by FarQuiz
        </div>
      </div>
    ),
    {
      width: 1200, // Standard OG image width
      height: 630, // Standard OG image height (aspect ratio ~1.91:1)
    },
  );
} 