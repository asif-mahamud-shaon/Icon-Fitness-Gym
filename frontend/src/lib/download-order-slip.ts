import QRCode from 'qrcode';
import { formatBdt, formatDateTime } from '@/lib/api';
import {
  amountInWordsBdt,
  formatPaymentMethod,
  formatVerifiedByLabel,
} from '@/lib/receipt-helpers';

export function buildOrderTrackingUrl(orderNumber: string): string {
  const safeCode = encodeURIComponent(String(orderNumber || '').trim());
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/verify/order/${safeCode}`;
  }
  return `/verify/order/${safeCode}`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawDashedDivider(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  color = '#94A3B8',
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

export async function downloadOrderPaymentSlip(
  order: any,
  officialPhone = '+880 1685-475975',
): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    !order?.orderNumber
  ) {
    return false;
  }

  const orderNumber = String(order.orderNumber || 'IFG-ORD');
  const status = String(order.status || 'PENDING').toUpperCase();
  const isCompleted = status === 'COMPLETED';
  const slipNumber =
    order.slipNumber ||
    (isCompleted
      ? orderNumber.startsWith('IFG-ORD-')
        ? orderNumber.replace('IFG-ORD-', 'IFG-SLIP-')
        : `IFG-SLIP-${orderNumber}`
      : orderNumber);

  const totalBdt = Math.max(0, Number(order.totalAmountBdt || 0));
  const discountAmountBdt = Math.max(0, Number(order.discountAmountBdt || 0));
  const deliveryFeeBdt = Math.max(0, Number(order.deliveryFeeBdt || 0));
  const subtotalBdt =
    order.subtotalBdt !== null && order.subtotalBdt !== undefined
      ? Math.max(0, Number(order.subtotalBdt))
      : Math.max(0, totalBdt + discountAmountBdt - deliveryFeeBdt);
  const advancePaidBdt = Math.max(0, Number(order.advancePaidBdt || 0));
  const balanceDueBdt = isCompleted
    ? 0
    : Math.max(0, totalBdt - advancePaidBdt);

  const cashierLabel =
    formatVerifiedByLabel(
      order?.processedByUser?.fullName || '',
      order?.processedByUser?.role || '',
    ) || 'Ashkona POS Desk';

  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);

  const statusText =
    status === 'COMPLETED'
      ? 'PAID & COMPLETED'
      : status === 'CANCELLED'
        ? 'CANCELLED'
        : status === 'READY_FOR_PICKUP'
          ? 'READY FOR PICKUP'
          : status === 'CONFIRMED'
            ? 'CONFIRMED'
            : 'PENDING PAYMENT';

  const statusColor =
    status === 'COMPLETED'
      ? '#047857'
      : status === 'CANCELLED'
        ? '#BE123C'
        : '#B45309';

  const formattedHotline = officialPhone.startsWith('+')
    ? officialPhone
    : officialPhone.startsWith('0') && officialPhone.length === 11
      ? `+880 ${officialPhone.slice(1, 5)}-${officialPhone.slice(5)}`
      : officialPhone;

  const trackUrl = buildOrderTrackingUrl(orderNumber);

  const [qrDataUrl, logoImg] = await Promise.all([
    QRCode.toDataURL(trackUrl, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0F172A', light: '#FFFFFF' },
    }),
    loadImage('/logo.jpg'),
  ]);
  const qrImg = await loadImage(qrDataUrl);

  // Exact 1:1 thermal POS slip logical width (380px) rendered at 2x DPI (760px)
  const scale = 2;
  const W = 380;
  const padX = 24;
  const contentW = W - padX * 2;
  const monoFont = '"Cascadia Mono", "Consolas", "Courier New", monospace';
  const uiFont = '"Segoe UI", "Nirmala UI", "Noto Sans Bengali", Arial, sans-serif';

  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = W;
  measureCanvas.height = 100;
  const mCtx = measureCanvas.getContext('2d');
  if (!mCtx) return false;

  // Prepare wrapped metadata, items, note, and in-words lines
  mCtx.font = `400 11px ${monoFont}`;
  const addressWrapped =
    order.fulfillmentType === 'DELIVERY' && order.deliveryAddress
      ? wrapText(mCtx, String(order.deliveryAddress), 220)
      : [];

  mCtx.font = `700 11px ${uiFont}`;
  const itemEntries = items.map((item, idx) => {
    const nameLines = wrapText(
      mCtx,
      `${idx + 1}. ${String(item.productName || 'Store Item')}`,
      contentW * 0.5 - 6,
    );
    const subParts = [item.product?.sku, item.product?.unitLabel].filter(Boolean);
    return {
      item,
      nameLines,
      subLine: subParts.length > 0 ? subParts.join(' • ') : '',
    };
  });

  mCtx.font = `400 10px ${monoFont}`;
  const noteLines = order.pickupNote
    ? wrapText(mCtx, `Note: ${order.pickupNote}`, contentW)
    : [];
  const inWordsLines = wrapText(
    mCtx,
    `In Words: ${amountInWordsBdt(totalBdt)}`,
    contentW,
  );

  // Calculate exact height dynamically so nothing clips
  const metaRowsCount =
    7 + // SLIP NO, ORDER, DATE, CASHIER, CUSTOMER, MODE, STATUS
    (order.customerPhone ? 1 : 0) +
    (order.memberCode ? 1 : 0);
  const metaHeight =
    metaRowsCount * 17 +
    (addressWrapped.length > 0 ? addressWrapped.length * 14 + 6 : 0) +
    14;

  const itemsHeight =
    28 + // Table header
    itemEntries.reduce(
      (sum, entry) =>
        sum + entry.nameLines.length * 14 + (entry.subLine ? 12 : 0) + 8,
      0,
    ) +
    (noteLines.length > 0 ? noteLines.length * 13 + 12 : 0) +
    12;

  const totalsRowsCount =
    4 + // ITEMS/QTY, SUBTOTAL, DISCOUNT/PROMO, PAYMENT MODE
    (deliveryFeeBdt > 0 ? 1 : 0) +
    (advancePaidBdt > 0 ? (isCompleted ? 1 : 2) : 0) +
    (order.transactionReference ? 1 : 0);
  const totalsHeight =
    totalsRowsCount * 17 +
    36 + // Thick divider + NET PAID / TOTAL PAYABLE row
    inWordsLines.length * 13 +
    16;

  const totalLogicalHeight =
    8 + // Top stripe
    20 + // Top inner padding
    108 + // Store Header + Voucher pill + dashed divider
    12 +
    metaHeight +
    12 +
    itemsHeight +
    12 +
    totalsHeight +
    14 +
    196 + // Scannable QR + Footer text
    8; // Bottom serrated cut edge

  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = totalLogicalHeight * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.scale(scale, scale);

  // Paper background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, totalLogicalHeight);

  // 1. Top Perforated Accent Strip (#0F172A / #C7F464 repeating 8px blocks)
  for (let x = 0; x < W; x += 16) {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(x, 0, Math.min(8, W - x), 8);
    ctx.fillStyle = '#C7F464';
    ctx.fillRect(x + 8, 0, Math.min(8, W - (x + 8)), 8);
  }

  let y = 28;

  // 2. Supershop Store Header (matches StoreOrderSlipModal.tsx 1:1)
  const titleText = 'ICON FITNESS GYM';
  ctx.font = `700 14px ${monoFont}`;
  const titleW = ctx.measureText(titleText).width;
  const logoSize = 30;
  const headerClusterW = (logoImg ? logoSize + 8 : 0) + titleW;
  const clusterStartX = (W - headerClusterW) / 2;

  if (logoImg) {
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(clusterStartX, y - 4, logoSize, logoSize, 4);
    ctx.fill();
    ctx.stroke();
    ctx.drawImage(logoImg, clusterStartX + 2, y - 2, logoSize - 4, logoSize - 4);
    ctx.fillStyle = '#0F172A';
    ctx.fillText(titleText, clusterStartX + logoSize + 8, y + 16);
  } else {
    ctx.fillStyle = '#0F172A';
    ctx.fillText(titleText, clusterStartX, y + 16);
  }

  y += 34;

  const drawCenteredText = (
    text: string,
    font: string,
    color: string,
    offsetY: number,
  ) => {
    ctx.font = font;
    ctx.fillStyle = color;
    const tw = ctx.measureText(text).width;
    ctx.fillText(text, (W - tw) / 2, offsetY);
  };

  drawCenteredText(
    'PRO SHOP & SUPPLEMENTS COUNTER',
    `700 10px ${monoFont}`,
    '#334155',
    y,
  );
  y += 14;
  drawCenteredText(
    'Ashkona, Dakshinkhan, Dhaka-1230',
    `400 10px ${monoFont}`,
    '#475569',
    y,
  );
  y += 14;
  drawCenteredText(
    `Hotline: ${formattedHotline}`,
    `400 10px ${monoFont}`,
    '#475569',
    y,
  );
  y += 10;

  // Pill Badge: CASH MEMO / SALES SLIP or ORDER VOUCHER
  const pillLabel = isCompleted ? 'CASH MEMO / SALES SLIP' : 'ORDER VOUCHER';
  ctx.font = `700 10px ${monoFont}`;
  const pillW = ctx.measureText(pillLabel).width + 20;
  const pillX = (W - pillW) / 2;
  ctx.fillStyle = isCompleted ? '#0F172A' : '#F1F5F9';
  ctx.beginPath();
  ctx.roundRect(pillX, y, pillW, 20, 4);
  ctx.fill();
  ctx.fillStyle = isCompleted ? '#C7F464' : '#0F172A';
  ctx.fillText(pillLabel, pillX + 10, y + 13.5);

  y += 32;
  drawDashedDivider(ctx, padX, W - padX, y);
  y += 16;

  // 3. POS Slip Metadata
  const drawKeyVal = (
    label: string,
    value: string,
    color = '#0F172A',
    bold = false,
  ) => {
    ctx.fillStyle = '#64748B';
    ctx.font = `400 11px ${monoFont}`;
    ctx.fillText(label, padX, y);

    ctx.fillStyle = color;
    ctx.font = `${bold ? '700' : '400'} 11px ${uiFont}`;
    const vw = ctx.measureText(value).width;
    ctx.fillText(value, W - padX - vw, y);
    y += 17;
  };

  drawKeyVal('SLIP NO :', slipNumber, '#0F172A', true);
  drawKeyVal('ORDER   :', orderNumber, '#334155', false);
  drawKeyVal(
    'DATE    :',
    formatDateTime(
      isCompleted
        ? order.updatedAt || order.createdAt || new Date().toISOString()
        : order.createdAt || new Date().toISOString(),
    ),
    '#0F172A',
    false,
  );
  drawKeyVal('CASHIER :', cashierLabel, '#0F172A', true);
  drawKeyVal('CUSTOMER:', order.customerName || 'Walk-In', '#0F172A', true);
  if (order.customerPhone) {
    drawKeyVal('PHONE   :', String(order.customerPhone), '#334155', false);
  }
  if (order.memberCode) {
    drawKeyVal(
      'MEMBER  :',
      `${order.memberCode}${order.isMemberVerified ? ' (Verified)' : ''}`,
      '#0F172A',
      true,
    );
  }
  drawKeyVal(
    'MODE    :',
    order.fulfillmentType === 'DELIVERY'
      ? `Online Delivery (${order.deliveryArea === 'OUTSIDE_DHAKA' ? 'Nationwide' : 'Dhaka'})`
      : 'Ashkona Desk Pickup',
    '#0F172A',
    true,
  );
  if (addressWrapped.length > 0) {
    ctx.fillStyle = '#64748B';
    ctx.font = `400 11px ${monoFont}`;
    ctx.fillText('ADDRESS :', padX, y);
    ctx.fillStyle = '#334155';
    ctx.font = `400 11px ${uiFont}`;
    addressWrapped.forEach((line, i) => {
      const lw = ctx.measureText(line).width;
      ctx.fillText(line, W - padX - lw, y + i * 14);
    });
    y += addressWrapped.length * 14 + 5;
  }
  drawKeyVal('STATUS  :', statusText, statusColor, true);

  y += 2;
  drawDashedDivider(ctx, padX, W - padX, y);
  y += 16;

  // 4. Itemized POS Lines
  const colItemX = padX;
  const colQtyCenterX = padX + contentW * 0.58;
  const colRateRightX = padX + contentW * 0.79;
  const colAmtRightX = W - padX;

  ctx.fillStyle = '#475569';
  ctx.font = `700 10px ${monoFont}`;
  ctx.fillText('ITEM', colItemX, y);
  const qtyHdrW = ctx.measureText('QTY').width;
  ctx.fillText('QTY', colQtyCenterX - qtyHdrW / 2, y);
  const rateHdrW = ctx.measureText('RATE').width;
  ctx.fillText('RATE', colRateRightX - rateHdrW, y);
  const amtHdrW = ctx.measureText('AMT').width;
  ctx.fillText('AMT', colAmtRightX - amtHdrW, y);

  y += 6;
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(W - padX, y);
  ctx.stroke();
  y += 16;

  itemEntries.forEach(({ item, nameLines, subLine }) => {
    const startY = y;
    ctx.fillStyle = '#0F172A';
    ctx.font = `700 11px ${uiFont}`;
    nameLines.forEach((line, lIdx) => {
      ctx.fillText(line, colItemX, startY + lIdx * 14);
    });

    if (subLine) {
      ctx.fillStyle = '#64748B';
      ctx.font = `400 9px ${monoFont}`;
      ctx.fillText(subLine, colItemX, startY + nameLines.length * 14);
    }

    ctx.font = `700 11px ${monoFont}`;
    ctx.fillStyle = '#0F172A';
    const qStr = String(item.quantity || 1);
    ctx.fillText(qStr, colQtyCenterX - ctx.measureText(qStr).width / 2, startY);

    ctx.font = `400 11px ${monoFont}`;
    ctx.fillStyle = '#334155';
    const rStr = Number(item.unitPriceBdt || 0).toLocaleString();
    ctx.fillText(rStr, colRateRightX - ctx.measureText(rStr).width, startY);

    ctx.font = `700 11px ${monoFont}`;
    ctx.fillStyle = '#0F172A';
    const aStr = Number(item.subtotalBdt || 0).toLocaleString();
    ctx.fillText(aStr, colAmtRightX - ctx.measureText(aStr).width, startY);

    y += nameLines.length * 14 + (subLine ? 12 : 0) + 8;
  });

  if (noteLines.length > 0) {
    y += 2;
    ctx.save();
    ctx.strokeStyle = '#CBD5E1';
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(W - padX, y);
    ctx.stroke();
    ctx.restore();
    y += 12;
    ctx.fillStyle = '#475569';
    ctx.font = `400 10px ${uiFont}`;
    noteLines.forEach((line, lIdx) => {
      ctx.fillText(line, padX, y + lIdx * 13);
    });
    y += noteLines.length * 13;
  }

  y += 4;
  drawDashedDivider(ctx, padX, W - padX, y);
  y += 16;

  // 5. Totals Summary
  const drawSumRow = (
    left: string,
    right: string,
    color = '#475569',
    bold = false,
  ) => {
    ctx.fillStyle = color;
    ctx.font = `${bold ? '700' : '400'} 11px ${monoFont}`;
    ctx.fillText(left, padX, y);
    ctx.font = `${bold ? '700' : '400'} 11px ${uiFont}`;
    const rw = ctx.measureText(right).width;
    ctx.fillText(right, W - padX - rw, y);
    y += 17;
  };

  drawSumRow(
    'ITEMS / QTY',
    `${items.length} item${items.length === 1 ? '' : 's'} / ${totalQty} pcs`,
    '#475569',
  );
  drawSumRow('SUBTOTAL', formatBdt(subtotalBdt), '#475569');
  drawSumRow(
    order.discountCode ? `DISCOUNT (${order.discountCode})` : 'DISCOUNT / PROMO',
    discountAmountBdt > 0 ? `-${formatBdt(discountAmountBdt)}` : '৳0',
    discountAmountBdt > 0 ? '#047857' : '#475569',
  );
  if (deliveryFeeBdt > 0) {
    drawSumRow(
      'DELIVERY CHARGE (SEPARATE)',
      `+${formatBdt(deliveryFeeBdt)}`,
      '#B45309',
      true,
    );
  }

  // Thick Total Line
  y += 2;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(W - padX, y);
  ctx.stroke();
  y += 22;

  ctx.fillStyle = '#0F172A';
  ctx.font = `700 14px ${monoFont}`;
  ctx.fillText(isCompleted ? 'NET PAID' : 'TOTAL PAYABLE', padX, y);
  ctx.font = `700 18px ${uiFont}`;
  const totalStr = formatBdt(totalBdt);
  ctx.fillText(totalStr, W - padX - ctx.measureText(totalStr).width, y);
  y += 20;

  if (advancePaidBdt > 0) {
    drawSumRow('ADVANCE PAID', formatBdt(advancePaidBdt), '#047857', true);
    if (!isCompleted) {
      drawSumRow('BALANCE DUE', formatBdt(balanceDueBdt), '#B45309', true);
    }
  }

  drawSumRow(
    'PAYMENT MODE',
    formatPaymentMethod(order.paymentMethod),
    '#334155',
    true,
  );
  if (order.transactionReference) {
    drawSumRow('TRX REF', String(order.transactionReference), '#334155', true);
  }

  ctx.fillStyle = '#475569';
  ctx.font = `400 10px ${uiFont}`;
  inWordsLines.forEach((line, idx) => {
    ctx.fillText(line, padX, y + idx * 13);
  });
  y += inWordsLines.length * 13 + 6;

  drawDashedDivider(ctx, padX, W - padX, y);
  y += 14;

  // 6. Scannable QR Verification & Track Footer
  if (qrImg) {
    const qrFrameSize = 112;
    const qrX = (W - qrFrameSize) / 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(qrX, y, qrFrameSize, qrFrameSize, 8);
    ctx.fill();
    ctx.stroke();
    ctx.drawImage(qrImg, qrX + 4, y + 4, qrFrameSize - 8, qrFrameSize - 8);
    y += qrFrameSize + 14;
  }

  drawCenteredText(
    'SCAN QR TO VERIFY RECEIPT & TRACK ORDER STATUS',
    `700 9px ${monoFont}`,
    '#475569',
    y,
  );
  y += 18;
  drawCenteredText(
    'THANK YOU FOR SHOPPING WITH ICON FITNESS!',
    `700 10px ${monoFont}`,
    '#0F172A',
    y,
  );
  y += 13;
  drawCenteredText(
    'Please check items & change before leaving counter.',
    `400 9px ${monoFont}`,
    '#64748B',
    y,
  );

  // 7. Bottom Serrated Cut Edge Visual (matches StoreOrderSlipModal.tsx)
  const sawY = totalLogicalHeight - 8;
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(0, sawY, W, 8);
  ctx.fillStyle = '#FFFFFF';
  for (let x = 0; x < W; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, sawY + 8);
    ctx.lineTo(x + 6, sawY);
    ctx.lineTo(x + 12, sawY + 8);
    ctx.closePath();
    ctx.fill();
  }

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  const safeSlug = orderNumber.replace(/[^A-Za-z0-9-_]/g, '-');
  link.href = dataUrl;
  link.download = `IconFitness-PaymentSlip-${safeSlug}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
