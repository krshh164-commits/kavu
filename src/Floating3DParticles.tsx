import type { CSSProperties } from 'react';
import './floating-3d-particles.css';

export function Floating3DParticles() {
  return <div className="kavu-floating-particles" aria-hidden="true">
    {Array.from({ length: 18 }, (_, index) => {
      const style = {
        '--particle-x': `${12 + (index * 47) % 76}%`,
        '--particle-y': `${14 + (index * 31) % 68}%`,
        '--particle-depth': `${-90 + (index * 59) % 180}px`,
        '--particle-delay': `${(index * 0.47) % 5}s`,
        '--particle-duration': `${6 + (index % 5)}s`,
      } as CSSProperties;
      return <span key={index} style={style} />;
    })}
  </div>;
}
