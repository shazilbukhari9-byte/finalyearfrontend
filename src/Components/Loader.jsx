import { useEffect, useState } from 'react';
import { DotmCircular12 } from './ui/dotm-circular-12';

const SHOW_MS = 1800;
const SLIDE_MS = 600;

const Loader = ({ onComplete }) => {
  const [slideUp, setSlideUp] = useState(false);

  useEffect(() => {
    const animTimer = setTimeout(() => setSlideUp(true), SHOW_MS);
    const removeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, SHOW_MS + SLIDE_MS);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  return (
    <div
      role="status"
      aria-label="Loading ShazDebug"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-transform duration-500 ease-in-out ${
        slideUp ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <DotmCircular12 size={96} dotSize={11} className="text-primary" />
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          ShazDebug
        </span>
      </div>
    </div>
  );
};

export default Loader;
