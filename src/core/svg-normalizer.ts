/**
 * SVG Normalizer & Converter for 3D Vector Engine
 *
 * Converts arbitrary SVG icons (Lucide, Material, Heroicons, Figma exports,
 * <svg>, <path>, <polygon>, <circle>, <rect>) into centered, scaled,
 * and beveled-ready 2D contours in coordinate space:
 * - Center: (114.27, 114.27)
 * - Optimal diameter: ~170 - 180 units
 * - Format: Pure M / L / C / Z coordinates (compatible with software rasterizer)
 */

export interface NormalizeOptions {
  targetSize?: number;
  targetCenterX?: number;
  targetCenterY?: number;
  samplePoints?: number;
}

export function extractPathFromSvg(svgString: string): string {
  if (!svgString || typeof svgString !== 'string') {
    throw new Error('Input must be a valid SVG string');
  }

  // Pre-clean common typos (like <svgviewBox="0 0 16 16"> without space after svg)
  let trimmed = svgString.trim().replace(/<svg([a-zA-Z])/gi, '<svg $1');

  // If already a clean raw path data string starting with M/m without XML tags
  if (/^[Mm]\s*[\d.-]/.test(trimmed) && !trimmed.includes('<')) {
    return ensurePathClosed(trimmed);
  }

  // Helper to check if a path is a transparent background bounding box
  function isTransparentBox(fill: string, stroke: string, d: string | null) {
    const isNone = fill === 'none' && (!stroke || stroke === 'none');
    const isBoxD = /^M\s*0\s+0\s*h\s*\d+\s*v\s*\d+\s*h\s*-?\d+\s*z?$/i.test(d?.trim() || '');
    return isNone || isBoxD;
  }

  // If in browser DOM environment
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(trimmed, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');

      if (!parserError) {
        const elements = doc.querySelectorAll('path, polygon, polyline, circle, rect, ellipse');
        const pathSegments: string[] = [];

        for (const el of elements) {
          const tag = el.tagName.toLowerCase();
          const fill = (el.getAttribute('fill') || '').trim().toLowerCase();
          const stroke = (el.getAttribute('stroke') || '').trim().toLowerCase();

          if (tag === 'path') {
            const d = el.getAttribute('d');
            if (d && !isTransparentBox(fill, stroke, d)) {
              pathSegments.push(d);
            }
          } else if (tag === 'polygon' || tag === 'polyline') {
            const pointsStr = el.getAttribute('points') || '';
            const pts = pointsStr.trim().split(/[\s,]+/);
            if (pts.length >= 4) {
              const segs = [`M ${pts[0]} ${pts[1]}`];
              for (let i = 2; i < pts.length; i += 2) {
                if (pts[i] && pts[i + 1]) {
                  segs.push(`L ${pts[i]} ${pts[i + 1]}`);
                }
              }
              if (tag === 'polygon') segs.push('Z');
              pathSegments.push(segs.join(' '));
            }
          } else if (tag === 'circle') {
            const cx = parseFloat(el.getAttribute('cx') || '0');
            const cy = parseFloat(el.getAttribute('cy') || '0');
            const r = parseFloat(el.getAttribute('r') || '0');
            if (r > 0 && fill !== 'none') {
              pathSegments.push(
                `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`
              );
            }
          } else if (tag === 'rect') {
            const x = parseFloat(el.getAttribute('x') || '0');
            const y = parseFloat(el.getAttribute('y') || '0');
            const w = parseFloat(el.getAttribute('width') || '0');
            const h = parseFloat(el.getAttribute('height') || '0');
            const rx = parseFloat(el.getAttribute('rx') || '0');
            if (w > 0 && h > 0 && fill !== 'none') {
              if (rx > 0) {
                pathSegments.push(
                  `M ${x + rx} ${y} L ${x + w - rx} ${y} Q ${x + w} ${y} ${x + w} ${y + rx} L ${x + w} ${y + h - rx} Q ${x + w} ${y + h} ${x + w - rx} ${y + h} L ${x + rx} ${y + h} Q ${x} ${y + h} ${x} ${y + h - rx} L ${x} ${y + rx} Q ${x} ${y} ${x + rx} ${y} Z`
                );
              } else {
                pathSegments.push(`M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`);
              }
            }
          }
        }

        if (pathSegments.length > 0) {
          return ensurePathClosed(pathSegments.join(' '));
        }
      }
    } catch {
      // Fallback to regex
    }
  }

  // Regex fallback: extract d="..." from path tags, ignoring transparent bounding boxes
  const pathTags = [...trimmed.matchAll(/<path\b([^>]*)\/?>/gi)];
  const validD: string[] = [];

  for (const match of pathTags) {
    const attrs = match[1];
    const fillM = attrs.match(/\bfill\s*=\s*["']([^"']+)["']/i);
    const strokeM = attrs.match(/\bstroke\s*=\s*["']([^"']+)["']/i);
    const dM = attrs.match(/\bd\s*=\s*["']([^"']+)["']/i);
    if (!dM) continue;

    const fill = fillM ? fillM[1].toLowerCase().trim() : '';
    const stroke = strokeM ? strokeM[1].toLowerCase().trim() : '';
    const d = dM[1];

    if (!isTransparentBox(fill, stroke, d)) {
      validD.push(d);
    }
  }

  if (validD.length > 0) {
    return ensurePathClosed(validD.join(' '));
  }

  // If all were filtered, take any d attribute
  const anyD = trimmed.match(/\bd\s*=\s*["']([^"']+)["']/i);
  if (anyD) {
    return ensurePathClosed(anyD[1]);
  }

  return ensurePathClosed(trimmed);
}

function ensurePathClosed(dStr: string): string {
  const s = dStr.trim();
  if (!s) return s;
  if (!/[zZ]\s*$/.test(s)) {
    return s + ' Z';
  }
  return s;
}

/**
 * Normalizes any SVG path string so it is centered at (114.27, 114.27)
 * and sized appropriately for 3D extrusion.
 */
export function normalizeSvgPathToMotionLab(rawPathOrSvg: string, options: NormalizeOptions = {}): string {
  const {
    targetSize = 172,
    targetCenterX = 114.27,
    targetCenterY = 114.27,
    samplePoints = 110
  } = options;

  const pathD = extractPathFromSvg(rawPathOrSvg);

  // Method 1: In browser, use SVGPathElement native geometry sampling
  if (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    document.createElementNS
  ) {
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 1000 1000');
      svg.style.position = 'absolute';
      svg.style.left = '-9999px';
      svg.style.top = '-9999px';
      svg.style.width = '0px';
      svg.style.height = '0px';
      svg.style.visibility = 'hidden';

      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', pathD);
      svg.appendChild(pathEl);
      document.body.appendChild(svg);

      const totalLen = pathEl.getTotalLength();

      if (totalLen && isFinite(totalLen) && totalLen > 0) {
        const rawPts: [number, number][] = [];
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        const count = Math.max(50, Math.min(180, samplePoints));
        for (let i = 0; i < count; i++) {
          const pt = pathEl.getPointAtLength((i / count) * totalLen);
          if (isFinite(pt.x) && isFinite(pt.y)) {
            minX = Math.min(minX, pt.x);
            maxX = Math.max(maxX, pt.x);
            minY = Math.min(minY, pt.y);
            maxY = Math.max(maxY, pt.y);
            rawPts.push([pt.x, pt.y]);
          }
        }

        document.body.removeChild(svg);

        if (rawPts.length >= 6 && isFinite(minX) && isFinite(maxX)) {
          const w = maxX - minX || 1;
          const h = maxY - minY || 1;
          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;
          const scale = targetSize / Math.max(w, h, 0.001);

          const commands = rawPts.map(([x, y], idx) => {
            const nx = ((x - cx) * scale + targetCenterX).toFixed(2);
            const ny = ((y - cy) * scale + targetCenterY).toFixed(2);
            return `${idx === 0 ? 'M' : 'L'} ${nx} ${ny}`;
          });
          commands.push('Z');
          return commands.join(' ');
        }
      } else {
        document.body.removeChild(svg);
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Method 2: Mathematical parser fallback (for Node / SSR / test environments)
  return normalizePathFallback(pathD, targetSize, targetCenterX, targetCenterY);
}

function parseSvgTokens(dStr: string): (string | number)[] {
  const tokens: (string | number)[] = [];
  const regex = /([a-df-z])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(dStr)) !== null) {
    if (m[1]) tokens.push(m[1]);
    else if (m[2]) tokens.push(parseFloat(m[2]));
  }
  return tokens;
}

function normalizePathFallback(dStr: string, targetSize: number, targetCx: number, targetCy: number): string {
  const tokens = parseSvgTokens(dStr);
  const points: [number, number][] = [];
  let currX = 0;
  let currY = 0;
  let cmd = 'M';

  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (typeof t === 'string' && /^[a-df-z]$/i.test(t)) {
      cmd = t;
      i++;
      continue;
    }

    if (cmd === 'M' || cmd === 'L') {
      currX = Number(tokens[i++]);
      currY = Number(tokens[i++]);
      if (isFinite(currX) && isFinite(currY)) points.push([currX, currY]);
    } else if (cmd === 'm' || cmd === 'l') {
      currX += Number(tokens[i++]);
      currY += Number(tokens[i++]);
      if (isFinite(currX) && isFinite(currY)) points.push([currX, currY]);
    } else if (cmd === 'H') {
      currX = Number(tokens[i++]);
      if (isFinite(currX)) points.push([currX, currY]);
    } else if (cmd === 'h') {
      currX += Number(tokens[i++]);
      if (isFinite(currX)) points.push([currX, currY]);
    } else if (cmd === 'V') {
      currY = Number(tokens[i++]);
      if (isFinite(currY)) points.push([currX, currY]);
    } else if (cmd === 'v') {
      currY += Number(tokens[i++]);
      if (isFinite(currY)) points.push([currX, currY]);
    } else if (cmd === 'C') {
      i += 4;
      currX = Number(tokens[i++]);
      currY = Number(tokens[i++]);
      if (isFinite(currX) && isFinite(currY)) points.push([currX, currY]);
    } else if (cmd === 'c') {
      i += 4;
      currX += Number(tokens[i++]);
      currY += Number(tokens[i++]);
      if (isFinite(currX) && isFinite(currY)) points.push([currX, currY]);
    } else if (cmd === 'A') {
      i += 5;
      currX = Number(tokens[i++]);
      currY = Number(tokens[i++]);
      if (isFinite(currX) && isFinite(currY)) points.push([currX, currY]);
    } else if (cmd === 'a') {
      i += 5;
      currX += Number(tokens[i++]);
      currY += Number(tokens[i++]);
      if (isFinite(currX) && isFinite(currY)) points.push([currX, currY]);
    } else {
      i++;
    }
  }

  if (points.length < 3) {
    return dStr;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  const scale = targetSize / Math.max(w, h, 0.001);

  const normalized = points
    .map(([x, y], idx) => {
      const nx = ((x - cx) * scale + targetCx).toFixed(2);
      const ny = ((y - cy) * scale + targetCy).toFixed(2);
      return `${idx === 0 ? 'M' : 'L'} ${nx} ${ny}`;
    })
    .join(' ') + ' Z';

  return normalized;
}
