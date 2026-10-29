import { cn } from '@/lib/utils';

const GRID = 5;

/** True for the dots of a 5x5 grid that make up a circle (everything except the four corners). */
export function isWithinCircularMask(row, col) {
  const x = col - (GRID - 1) / 2;
  const y = row - (GRID - 1) / 2;
  return Math.sqrt(x * x + y * y) <= 2.25;
}

/**
 * Renders a square 5x5 matrix of round dots. `animationResolver` decides each
 * dot's className / inline style from its position and the current phase.
 */
export function DotMatrixBase({
  size = 36,
  dotSize = 5,
  animated = true,
  phase = 'idle',
  animationResolver,
  onMouseEnter,
  onMouseLeave,
  className,
  style,
  ariaLabel,
}) {
  const gap = Math.max(0, (size - GRID * dotSize) / (GRID - 1));

  return (
    <div
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn('inline-grid shrink-0', className)}
      style={{
        width: size,
        height: size,
        gridTemplateColumns: `repeat(${GRID}, ${dotSize}px)`,
        gridTemplateRows: `repeat(${GRID}, ${dotSize}px)`,
        gap,
        ...style,
      }}
    >
      {Array.from({ length: GRID * GRID }, (_, index) => {
        const row = Math.floor(index / GRID);
        const col = index % GRID;
        const resolved = animationResolver ? animationResolver({ row, col, phase, animated }) : {};

        return (
          <span
            key={index}
            className={cn('rounded-full bg-current transition-opacity duration-150', resolved.className)}
            style={{ width: dotSize, height: dotSize, ...resolved.style }}
          />
        );
      })}
    </div>
  );
}
