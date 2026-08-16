import { ImageResponse } from 'next/og';

// A file-convention image at the root of app/ becomes og:image (and the
// twitter card image) for every route that does not supply its own, with the
// absolute URL and dimension tags written for us. Generated rather than
// checked in as a PNG so the wording tracks the site instead of drifting from
// it, and so there is no binary to keep in sync.
export const alt = 'Church Nepal — churches, Christian community and resources in Nepal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0b3c5d 0%, #123f63 55%, #1d5c85 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 6, color: '#d9b45b', textTransform: 'uppercase' }}>
          Church Nepal
        </div>
        <div style={{ display: 'flex', fontSize: 74, fontWeight: 700, lineHeight: 1.12, marginTop: 26 }}>
          Churches, Christian community and resources in Nepal
        </div>
        <div style={{ display: 'flex', fontSize: 32, marginTop: 32, color: 'rgba(255,255,255,0.82)' }}>
          churchnepal.com
        </div>
      </div>
    ),
    size,
  );
}
