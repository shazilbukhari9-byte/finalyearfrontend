import { useCallback, useEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = (event) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * Resolves which phase the matrix is in: 'loop' (always animating),
 * 'hover' (animating while hovered) or 'idle'.
 */
export function useDotMatrixPhases({ animated, hoverAnimated }) {
  const [hovered, setHovered] = useState(false);
  const onMouseEnter = useCallback(() => setHovered(true), []);
  const onMouseLeave = useCallback(() => setHovered(false), []);

  let phase = 'idle';
  if (animated) phase = 'loop';
  else if (hoverAnimated && hovered) phase = 'hover';

  return { phase, onMouseEnter, onMouseLeave };
}

/** Counts 0..steps-1 repeatedly; one full cycle takes cycleMsBase / speed ms. */
export function useSteppedCycle({ active, cycleMsBase, steps, speed = 1 }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    const interval = Math.max(16, cycleMsBase / speed / steps);
    const id = setInterval(() => setStep((current) => (current + 1) % steps), interval);
    return () => clearInterval(id);
  }, [active, cycleMsBase, steps, speed]);

  return active ? step : 0;
}
