import QRCode from 'qrcode';
import type { ConversationStarter, Scrut } from '@/types';

export type CardFormat = 'twitter' | 'square' | 'story';
export type CardTheme = 'obsidian' | 'neon' | 'sunset' | 'monochrome';

export interface CardOptions {
  format: CardFormat;
  theme: CardTheme;
  showQr: boolean;
  showStats: boolean;
  scrut?: Scrut | null;
}

const FORMAT_CONFIG: Record<CardFormat, { width: number; height: number; name: string; ratio: string }> = {
  twitter: { width: 1200, height: 630, name: 'Twitter / X (1.91:1)', ratio: '1.91:1' },
  square: { width: 1080, height: 1080, name: 'Square (1:1)', ratio: '1:1' },
  story: { width: 1080, height: 1920, name: 'Story (9:16)', ratio: '9:16' },
};

const THEME_CONFIG: Record<
  CardTheme,
  {
    bg: string;
    cardBg: string;
    cardBorder: string;
    accent: string;
    accentText: string;
    glow1: string;
    glow2: string;
    badgeBg: string;
  }
> = {
  obsidian: {
    bg: '#0a0a12',
    cardBg: 'rgba(18, 18, 28, 0.78)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    accent: '#a855f7',
    accentText: '#c084fc',
    glow1: 'rgba(168, 85, 247, 0.18)',
    glow2: 'rgba(236, 72, 153, 0.12)',
    badgeBg: 'rgba(255, 255, 255, 0.08)',
  },
  neon: {
    bg: '#06060e',
    cardBg: 'rgba(14, 16, 32, 0.85)',
    cardBorder: 'rgba(56, 189, 248, 0.25)',
    accent: '#38bdf8',
    accentText: '#38bdf8',
    glow1: 'rgba(56, 189, 248, 0.22)',
    glow2: 'rgba(147, 51, 234, 0.22)',
    badgeBg: 'rgba(56, 189, 248, 0.12)',
  },
  sunset: {
    bg: '#0e0a12',
    cardBg: 'rgba(24, 16, 28, 0.82)',
    cardBorder: 'rgba(251, 146, 60, 0.22)',
    accent: '#f97316',
    accentText: '#fb923c',
    glow1: 'rgba(249, 115, 22, 0.20)',
    glow2: 'rgba(225, 29, 72, 0.18)',
    badgeBg: 'rgba(249, 115, 22, 0.1)',
  },
  monochrome: {
    bg: '#050507',
    cardBg: 'rgba(18, 18, 22, 0.9)',
    cardBorder: 'rgba(255, 255, 255, 0.14)',
    accent: '#ffffff',
    accentText: '#e2e8f0',
    glow1: 'rgba(255, 255, 255, 0.06)',
    glow2: 'rgba(150, 150, 160, 0.04)',
    badgeBg: 'rgba(255, 255, 255, 0.08)',
  },
};

const TOPIC_COLORS: Record<string, string> = {
  Life: '#a78bfa',
  Relationships: '#f472b6',
  Work: '#60a5fa',
  Money: '#34d399',
  Technology: '#22d3ee',
  Culture: '#fb923c',
  Family: '#fb7185',
  Society: '#fbbf24',
  Fun: '#facc15',
  Education: '#818cf8',
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export async function generateConversationCard(
  conversation: ConversationStarter,
  options: CardOptions
): Promise<{ dataUrl: string; blob: Blob; width: number; height: number }> {
  const { format, theme, showQr, showStats, scrut } = options;
  const { width, height } = FORMAT_CONFIG[format];
  const t = THEME_CONFIG[theme];

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // 1. Background Fill
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, width, height);

  // 2. Cosmic Ambient Glows
  const glow1 = ctx.createRadialGradient(
    width * 0.85,
    height * 0.15,
    20,
    width * 0.85,
    height * 0.15,
    width * 0.65
  );
  glow1.addColorStop(0, t.glow1);
  glow1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, width, height);

  const glow2 = ctx.createRadialGradient(
    width * 0.15,
    height * 0.85,
    20,
    width * 0.15,
    height * 0.85,
    width * 0.65
  );
  glow2.addColorStop(0, t.glow2);
  glow2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  // Subtle star dust particles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  const seed = (conversation.id || 'seed').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  for (let i = 0; i < 48; i++) {
    const px = ((seed * (i + 1) * 31) % width);
    const py = ((seed * (i + 1) * 67) % height);
    const pr = ((seed * (i + 1)) % 3) * 0.6 + 0.6;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Main Glass Card Container
  const pad = format === 'story' ? 56 : 48;
  const cardX = pad;
  const cardY = pad;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;
  const cardRadius = 32;

  // Outer subtle border glow
  roundRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.fillStyle = t.cardBg;
  ctx.fill();

  ctx.strokeStyle = t.cardBorder;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // 4. Header Section (Logo, Brand & Category)
  const headerY = cardY + (format === 'story' ? 60 : 46);
  const contentLeft = cardX + 48;
  const contentRight = cardX + cardW - 48;

  // Brand Logo Mark: Stylized letter "S" in a rounded squircle
  const logoSize = 44;
  const logoX = contentLeft;
  const logoY = headerY - 8;
  roundRect(ctx, logoX, logoY, logoSize, logoSize, 12);
  const logoGrad = ctx.createLinearGradient(logoX, logoY, logoX + logoSize, logoY + logoSize);
  logoGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
  logoGrad.addColorStop(1, 'rgba(255,255,255,0.04)');
  ctx.fillStyle = logoGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // "S" logo typography
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', logoX + logoSize / 2, logoY + logoSize / 2 + 1);

  // Brand text next to mark
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 21px "Inter", sans-serif';
  ctx.fillText('Scruttin', contentLeft + logoSize + 14, headerY - 6);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = '400 13px "Inter", sans-serif';
  ctx.fillText('less showing. more saying.', contentLeft + logoSize + 14, headerY + 18);

  // Right-side category pill / topic badge
  const categoryLabel = conversation.is_platform
    ? 'SCRUTTIN ASKS'
    : conversation.type === 'statement'
    ? 'STATEMENT'
    : 'GLOBAL QUESTION';

  ctx.font = '700 12px "Inter", sans-serif';
  const catWidth = ctx.measureText(categoryLabel).width + 24;
  const catX = contentRight - catWidth;
  const catY = headerY - 4;

  roundRect(ctx, catX, catY, catWidth, 32, 16);
  ctx.fillStyle = t.badgeBg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = t.accentText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(categoryLabel, catX + catWidth / 2, catY + 16);

  // Topic pill (if present)
  if (conversation.topic) {
    const topicText = conversation.topic;
    ctx.font = '600 12px "Inter", sans-serif';
    const topicWidth = ctx.measureText(topicText).width + 22;
    const topicX = catX - topicWidth - 10;
    roundRect(ctx, topicX, catY, topicWidth, 32, 16);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    ctx.fillStyle = TOPIC_COLORS[conversation.topic] || '#cbd5e1';
    ctx.fillText(topicText, topicX + topicWidth / 2, catY + 16);
  }

  // 5. Divider Line
  const divY = headerY + (format === 'story' ? 76 : 56);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(contentLeft, divY);
  ctx.lineTo(contentRight, divY);
  ctx.stroke();

  // 6. Body Content / Question / Statement / Scrut Text
  const bodyY = divY + (format === 'story' ? 60 : 38);
  const availableWidth = contentRight - contentLeft;

  // Large decorative quotation mark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.font = '700 84px "Lora", Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('“', contentLeft - 8, bodyY - 14);

  // Compute text to display
  const primaryText = conversation.body.trim();
  const textLeft = contentLeft + (format === 'twitter' ? 24 : 16);
  const textMaxWidth = availableWidth - (format === 'twitter' ? 48 : 32);

  // Adaptive Font Sizing based on character length & format
  let fontSize = 38;
  if (format === 'twitter') {
    if (primaryText.length > 200) fontSize = 28;
    else if (primaryText.length > 140) fontSize = 32;
    else if (primaryText.length > 80) fontSize = 36;
    else fontSize = 42;
  } else if (format === 'square') {
    if (primaryText.length > 240) fontSize = 34;
    else if (primaryText.length > 140) fontSize = 40;
    else fontSize = 48;
  } else {
    // story
    if (primaryText.length > 240) fontSize = 38;
    else if (primaryText.length > 140) fontSize = 46;
    else fontSize = 54;
  }

  ctx.font = `500 ${fontSize}px "Lora", Georgia, serif`;
  const lineHeight = fontSize * 1.45;
  const lines = wrapText(ctx, primaryText, textMaxWidth);

  let currentY = bodyY + 44;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  for (const line of lines) {
    ctx.fillText(line, textLeft, currentY);
    currentY += lineHeight;
  }

  // If there's an author attribution
  if (!conversation.is_platform && conversation.user?.display_name) {
    currentY += 18;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '400 15px "Inter", sans-serif';
    const authorLocation = conversation.user.country ? ` • ${conversation.user.country}` : '';
    ctx.fillText(`— Asked by ${conversation.user.display_name}${authorLocation}`, textLeft, currentY);
    currentY += 26;
  }

  // If we are sharing a specific Scrut response card
  if (scrut && scrut.text) {
    currentY += 20;
    const responseBoxY = currentY;
    const responseBoxH = 110;
    roundRect(ctx, textLeft, responseBoxY, textMaxWidth, responseBoxH, 16);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '600 11px "Inter", sans-serif';
    ctx.fillText(
      `PERSPECTIVE BY ${scrut.user.display_name.toUpperCase()}${scrut.user.country ? ` (${scrut.user.country.toUpperCase()})` : ''}`,
      textLeft + 16,
      responseBoxY + 14
    );

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'italic 16px "Lora", serif';
    const scrutLines = wrapText(ctx, `"${scrut.text}"`, textMaxWidth - 32);
    let sY = responseBoxY + 36;
    for (const sl of scrutLines.slice(0, 2)) {
      ctx.fillText(sl, textLeft + 16, sY);
      sY += 22;
    }
  }

  // 7. Bottom Stats & QR Code Bar
  const footerY = cardY + cardH - (format === 'story' ? 140 : 100);
  const footerH = format === 'story' ? 100 : 70;

  // Subtle top border for footer
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(contentLeft, footerY);
  ctx.lineTo(contentRight, footerY);
  ctx.stroke();

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.scruttin.com';
  const shareUrl = `${origin}/questions/${conversation.id}`;

  // Draw QR code if requested
  if (showQr) {
    try {
      const qrDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#ffffff',
          light: '#00000000',
        },
      });

      await new Promise<void>((resolve) => {
        const qrImg = new Image();
        qrImg.onload = () => {
          const qrSize = format === 'story' ? 68 : 56;
          const qrX = contentRight - qrSize;
          const qrY = footerY + 14;

          // QR container backdrop
          roundRect(ctx, qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 10);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.stroke();

          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          resolve();
        };
        qrImg.onerror = () => resolve();
        qrImg.src = qrDataUrl;
      });
    } catch {
      // Ignore QR errors gracefully
    }
  }

  // Draw stats pills on left
  let statX = contentLeft;
  const statY = footerY + 18;

  if (showStats) {
    // Ruts pill
    const scrutPill = `🎙️ ${conversation.scrut_count} Voice & Text Ruts`;
    ctx.font = '600 12px "Inter", sans-serif';
    const pill1W = ctx.measureText(scrutPill).width + 24;
    roundRect(ctx, statX, statY, pill1W, 30, 15);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(scrutPill, statX + 12, statY + 15);
    statX += pill1W + 12;

    // Countries pill
    if (conversation.country_count > 0 && format !== 'twitter') {
      const countryPill = `🌍 ${conversation.country_count} Countries`;
      const pill2W = ctx.measureText(countryPill).width + 24;
      roundRect(ctx, statX, statY, pill2W, 30, 15);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(countryPill, statX + 12, statY + 15);
      statX += pill2W + 12;
    }
  }

  // URL / Invitation text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '400 12px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const urlDisplay = 'Join the conversation at www.scruttin.com';
  ctx.fillText(urlDisplay, contentLeft, footerY + 54);

  // Return canvas as dataUrl and blob
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to create blob from canvas'));
    }, 'image/png');
  });

  return { dataUrl, blob, width, height };
}

function getBaseShareUrl(conversationId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.scruttin.com';
  return `${origin}/questions/${conversationId}`;
}

export function buildTwitterShareUrl(conversation: ConversationStarter): string {
  const url = getBaseShareUrl(conversation.id);
  const text = `"${conversation.body}"\n\nWhat do you think? Listen to global voice & text thoughts on @scruttin 🎙️`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

export function buildWhatsAppShareUrl(conversation: ConversationStarter): string {
  const url = getBaseShareUrl(conversation.id);
  const text = `"${conversation.body}" — Join the global conversation on Scruttin: ${url}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

export function buildLinkedInShareUrl(conversation: ConversationStarter): string {
  const url = getBaseShareUrl(conversation.id);
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

export function buildTelegramShareUrl(conversation: ConversationStarter): string {
  const url = getBaseShareUrl(conversation.id);
  const text = `"${conversation.body}" — Global perspectives on Scruttin`;
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}
