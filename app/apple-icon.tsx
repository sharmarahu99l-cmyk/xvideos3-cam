import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          borderRadius: '36px',
          border: '8px solid #FF9900',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 900,
          fontSize: '96px',
          letterSpacing: '-4px',
        }}
      >
        <span style={{ color: '#FF9900' }}>H</span>
        <span style={{ color: '#ffffff' }}>T</span>
      </div>
    ),
    { ...size }
  );
}
