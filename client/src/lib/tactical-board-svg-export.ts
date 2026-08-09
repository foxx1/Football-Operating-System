import { svgToDataUri, CONTENT_SCALE, type BoardElement, type BackgroundType } from '@/components/tactical-board/types';
import footballBallSvgRaw from '@/assets/tactical-icons/football-ball.svg?raw';

const footballBallSvg = svgToDataUri(footballBallSvgRaw);

// Fixed marker sizes below were originally tuned for an 800-wide pitch;
// scale them so the export matches what's drawn on the (now larger) canvas.
const S = CONTENT_SCALE;

// Konva's Stage is canvas-based, so `stage.toDataURL()` can only ever produce
// a raster (PNG). To offer a real vector export we re-serialize the element
// list (and a hand-drawn pitch) as a standalone SVG document.

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&apos;';
    }
  });
}

function pitchMarkings(width: number, height: number, backgroundType: BackgroundType, halfSide: 'left' | 'right'): string {
  const lineColor = 'rgba(255,255,255,0.8)';
  const lineWidth = 3 * S;
  const spotR = 2.5 * S;
  const arcR = 60 * S;
  const boxW = Math.min(width * 0.16, 130 * S);
  const boxH = height * 0.5;
  const goalBoxW = boxW * 0.45;
  const goalBoxH = height * 0.24;
  const parts: string[] = [
    `<rect x="0" y="0" width="${width}" height="${height}" fill="#2d5016" />`,
    `<rect x="4" y="4" width="${width - 8}" height="${height - 8}" fill="none" stroke="${lineColor}" stroke-width="${lineWidth}" />`,
  ];

  const drawGoalEnd = (side: 'left' | 'right') => {
    const x = side === 'left' ? 4 : width - 4 - boxW;
    const y = (height - boxH) / 2;
    const gx = side === 'left' ? 4 : width - 4 - goalBoxW;
    const gy = (height - goalBoxH) / 2;
    parts.push(`<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" fill="none" stroke="${lineColor}" stroke-width="${lineWidth}" />`);
    parts.push(`<rect x="${gx}" y="${gy}" width="${goalBoxW}" height="${goalBoxH}" fill="none" stroke="${lineColor}" stroke-width="${lineWidth}" />`);
    const spotX = side === 'left' ? x + boxW * 0.6 : x + boxW * 0.4;
    parts.push(`<circle cx="${spotX}" cy="${height / 2}" r="${spotR}" fill="${lineColor}" />`);
  };

  if (backgroundType === 'full') {
    parts.push(`<line x1="${width / 2}" y1="4" x2="${width / 2}" y2="${height - 4}" stroke="${lineColor}" stroke-width="${lineWidth}" />`);
    parts.push(`<circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * 0.12}" fill="none" stroke="${lineColor}" stroke-width="${lineWidth}" />`);
    parts.push(`<circle cx="${width / 2}" cy="${height / 2}" r="${spotR}" fill="${lineColor}" />`);
    drawGoalEnd('left');
    drawGoalEnd('right');
  } else {
    // Half pitch: halfway line sits at the edge opposite the goal we show.
    const halfwayX = halfSide === 'left' ? width - 4 : 4;
    parts.push(`<line x1="${halfwayX}" y1="4" x2="${halfwayX}" y2="${height - 4}" stroke="${lineColor}" stroke-width="${lineWidth}" />`);
    parts.push(`<path d="M ${halfwayX} ${height / 2 - arcR} A ${arcR} ${arcR} 0 0 ${halfSide === 'left' ? 1 : 0} ${halfwayX} ${height / 2 + arcR}" fill="none" stroke="${lineColor}" stroke-width="${lineWidth}" />`);
    drawGoalEnd(halfSide);
  }

  return parts.join('\n  ');
}

function elementToSvg(el: BoardElement): string {
  const color = el.color || 'white';
  const opacity = el.opacity ?? 1;
  const fill = el.fill ? color : 'none';

  if (el.type === 'player') {
    const numberText = el.number != null ? String(el.number) : (el.label || '');
    const textColor = color === 'yellow' || color === 'white' ? '#000000' : '#ffffff';
    const nameY = 16 * S + 9 * S;
    const posY = (el.playerName ? 27 * S : 16 * S) + 7.5 * S;
    const subLabel = [
      el.playerName ? `<text x="0" y="${nameY}" fill="#ffffff" font-size="${9 * S}" font-weight="600" font-family="sans-serif" text-anchor="middle">${escapeXml(el.playerName)}</text>` : '',
      el.positionLabel ? `<text x="0" y="${posY}" fill="#e5e7eb" font-size="${7.5 * S}" font-family="sans-serif" text-anchor="middle">${escapeXml(el.positionLabel)}</text>` : '',
    ].join('');
    return `<g transform="translate(${el.x} ${el.y}) rotate(${el.rotation || 0})">
    <circle r="${14 * S}" fill="${color}" stroke="#ffffff" stroke-width="${2 * S}" />
    <text x="0" y="0" fill="${textColor}" font-size="${11 * S}" font-weight="bold" font-family="sans-serif" text-anchor="middle" dominant-baseline="central">${escapeXml(numberText)}</text>
    ${subLabel}
  </g>`;
  }

  if (el.type === 'equipment') {
    if (el.subtype === 'ball') {
      const size = 20 * S;
      return `<image href="${footballBallSvg}" x="${el.x - size / 2}" y="${el.y - size / 2}" width="${size}" height="${size}" />`;
    }
    if (el.subtype === 'cone') {
      return `<circle cx="${el.x}" cy="${el.y}" r="${8 * S}" fill="orange" stroke="black" stroke-width="${S}" />`;
    }
    if (el.subtype === 'goal') {
      return `<rect x="${el.x - 20 * S}" y="${el.y - 5 * S}" width="${40 * S}" height="${10 * S}" fill="white" fill-opacity="0.5" stroke="black" stroke-width="${S}" />`;
    }
    return '';
  }

  if (el.type === 'text') {
    const fontSize = el.fontSize ?? 24;
    const fontFamily = el.fontFamily || 'Arial';
    const isBold = el.fontStyle === 'bold' || el.fontStyle === 'italic bold';
    const isItalic = el.fontStyle === 'italic' || el.fontStyle === 'italic bold';
    const width = el.width ?? 360;
    const textAnchor = el.textAlign === 'center' ? 'middle' : el.textAlign === 'right' ? 'end' : 'start';
    const anchorX = el.textAlign === 'center' ? el.x + width / 2 : el.textAlign === 'right' ? el.x + width : el.x;
    const lineHeight = fontSize * 1.2;
    const lines = (el.text || '').split('\n');
    const tspans = lines
      .map((line, i) => `<tspan x="${anchorX}" dy="${i === 0 ? fontSize : lineHeight}">${escapeXml(line)}</tspan>`)
      .join('');
    return `<text x="${anchorX}" y="${el.y}" fill="${color}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="${isBold ? 'bold' : 'normal'}" font-style="${isItalic ? 'italic' : 'normal'}" text-decoration="${el.textDecoration || 'none'}" text-anchor="${textAnchor}">${tspans}</text>`;
  }

  // Drawing elements
  const points = el.points || [0, 0];
  const strokeW = 2.5 * S;
  const dashArray = `${6 * S},${5 * S}`;
  const dash = el.dashed ? ` stroke-dasharray="${dashArray}"` : '';

  if (el.subtype === 'line' || el.subtype === 'dribble') {
    const [x1, y1, x2, y2] = [el.x + points[0], el.y + points[1], el.x + (points[2] ?? points[0]), el.y + (points[3] ?? points[1])];
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeW}"${el.subtype === 'dribble' ? ` stroke-dasharray="${dashArray}"` : ''} />`;
  }

  if (el.subtype === 'curve') {
    const [x1, y1, x2, y2] = [el.x + points[0], el.y + points[1], el.x + (points[2] ?? points[0]), el.y + (points[3] ?? points[1])];
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - 30 * S;
    return `<path d="M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${strokeW}"${dash} />`;
  }

  if (el.subtype === 'arrow') {
    const [x1, y1, x2, y2] = [el.x + points[0], el.y + points[1], el.x + (points[2] ?? points[0]), el.y + (points[3] ?? points[1])];
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 10 * S;
    const hx1 = x2 - headLen * Math.cos(angle - Math.PI / 6);
    const hy1 = y2 - headLen * Math.sin(angle - Math.PI / 6);
    const hx2 = x2 - headLen * Math.cos(angle + Math.PI / 6);
    const hy2 = y2 - headLen * Math.sin(angle + Math.PI / 6);
    return `<g>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeW}"${dash} />
    <polygon points="${x2},${y2} ${hx1},${hy1} ${hx2},${hy2}" fill="${color}" />
  </g>`;
  }

  if (el.subtype === 'square') {
    const w = el.width || 0;
    const h = el.height || 0;
    const x = w < 0 ? el.x + w : el.x;
    const y = h < 0 ? el.y + h : el.y;
    return `<rect x="${x}" y="${y}" width="${Math.abs(w)}" height="${Math.abs(h)}" fill="${fill}" fill-opacity="${opacity}" stroke="${color}" stroke-width="${strokeW}"${dash} />`;
  }

  if (el.subtype === 'circle') {
    const r = Math.max(Math.abs(el.width || 0), Math.abs(el.height || 0)) / 2;
    const cx = el.x + (el.width || 0) / 2;
    const cy = el.y + (el.height || 0) / 2;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" fill-opacity="${opacity}" stroke="${color}" stroke-width="${strokeW}"${dash} />`;
  }

  return '';
}

export function elementsToSvgString(
  elements: BoardElement[],
  backgroundType: BackgroundType,
  pitchWidth: number,
  pitchHeight: number,
  halfSide: 'left' | 'right' = 'left',
): string {
  const width = backgroundType === 'half' ? pitchWidth / 2 : pitchWidth;
  const height = pitchHeight;

  const body = elements.map(elementToSvg).filter(Boolean).join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${pitchMarkings(width, height, backgroundType, halfSide)}
  ${body}
</svg>`;
}

export function downloadSvg(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
