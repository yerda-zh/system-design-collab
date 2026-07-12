import { useLayoutEffect, useRef, useState } from 'react';

interface ArrowAnchor {
  x: number;
  y: number;
}

interface ClampOptions {
  margin?: number;
  // Viewport-space point the popup's decorative arrow should point at
  // (e.g. the center of the badge that triggered it). When provided, the
  // hook also returns:
  //  - `arrowOffsetX` — clamped so the arrow never renders outside the
  //    popup's own edges — for use as the arrow's `left` style.
  //  - `arrowSide` — whether the popup ended up above or below the anchor
  //    (it can flip from its natural side when clamped near an edge), so
  //    the arrow can be moved to the matching edge and re-pointed.
  arrowAnchor?: ArrowAnchor;
}

const ARROW_MARGIN = 12;

export function useClampToViewport<T extends HTMLElement>(
  deps: readonly unknown[] = [],
  options: ClampOptions = {},
) {
  const { margin = 8, arrowAnchor } = options;
  const ref = useRef<T>(null);
  const [offset, setOffset] = useState({ dx: 0, dy: 0 });
  const [arrowOffsetX, setArrowOffsetX] = useState<number | null>(null);
  const [arrowSide, setArrowSide] = useState<'top' | 'bottom'>('bottom');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    // Undo any offset already baked into this render (e.g. left over from
    // the last time this element was shown) so the math below is relative
    // to the popup's natural, unshifted position.
    const naturalLeft = rect.left - offset.dx;
    const naturalTop = rect.top - offset.dy;
    const naturalRight = rect.right - offset.dx;
    const naturalBottom = rect.bottom - offset.dy;

    let dx = 0;
    let dy = 0;
    const overflowRight = naturalRight - (window.innerWidth - margin);
    if (overflowRight > 0) dx = -overflowRight;
    const overflowBottom = naturalBottom - (window.innerHeight - margin);
    if (overflowBottom > 0) dy = -overflowBottom;
    if (naturalLeft + dx < margin) dx += margin - (naturalLeft + dx);
    if (naturalTop + dy < margin) dy += margin - (naturalTop + dy);

    if (dx !== offset.dx || dy !== offset.dy) setOffset({ dx, dy });

    if (arrowAnchor) {
      const finalLeft = naturalLeft + dx;
      const rawX = arrowAnchor.x - finalLeft;
      setArrowOffsetX(Math.min(Math.max(rawX, ARROW_MARGIN), rect.width - ARROW_MARGIN));

      const finalTop = naturalTop + dy;
      const finalBottom = naturalBottom + dy;
      const boxMidY = (finalTop + finalBottom) / 2;
      setArrowSide(arrowAnchor.y < boxMidY ? 'top' : 'bottom');
    }
    // Re-measures whenever the caller-supplied deps change (e.g. a tooltip's
    // visibility or anchor), not just on this hook's own mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ref,
    style: offset.dx || offset.dy
      ? { transform: `translate(${offset.dx}px, ${offset.dy}px)` }
      : undefined,
    arrowOffsetX,
    arrowSide,
  };
}
