import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: '7px',
          border: '2px solid #FF9900',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 900,
          fontSize: '18px',
          letterSpacing: '-1px',
        }}
      >
        <span style={{ color: '#FF9900' }}>H</span>
        <span style={{ color: '#ffffff' }}>T</span>
      </div>
    ),
    { ...size }
  );
}
