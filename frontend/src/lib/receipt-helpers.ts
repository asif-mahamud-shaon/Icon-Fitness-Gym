export function amountInWordsBdt(rawAmount: number): string {
  const num = Math.round(Math.max(0, Number(rawAmount) || 0));
  if (num === 0) return 'Zero Taka Only';

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const convertTwoDigits = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o > 0 ? `${tens[t]} ${ones[o]}` : tens[t];
  };

  const convertChunk = (n: number): string => {
    if (n === 0) return '';
    if (n < 100) return convertTwoDigits(n);
    const h = Math.floor(n / 100);
    const rem = n % 100;
    return rem > 0
      ? `${ones[h]} Hundred ${convertTwoDigits(rem)}`
      : `${ones[h]} Hundred`;
  };

  const parts: string[] = [];
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;

  if (crore > 0) parts.push(`${convertChunk(crore)} Crore`);
  if (lakh > 0) parts.push(`${convertTwoDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${convertTwoDigits(thousand)} Thousand`);
  if (rest > 0) parts.push(convertChunk(rest));

  return `${parts.join(' ').trim()} Taka Only`;
}

export function formatVerifiedByLabel(
  name?: string | null,
  role?: string | null,
): string {
  const cleanName = String(name || '')
    .replace(/\s*\(Configurable\)/gi, '')
    .trim();
  const upperRole = String(role || '').toUpperCase();

  if (
    upperRole === 'SUPER_ADMIN' ||
    /system\s*super\s*admin/i.test(cleanName)
  ) {
    return 'Owner';
  }

  if (upperRole === 'STAFF') {
    if (!cleanName) return 'Front Desk';
    return /front\s*desk/i.test(cleanName)
      ? cleanName
      : `${cleanName} (Front Desk)`;
  }

  if (upperRole === 'ADMIN') {
    if (!cleanName) return 'Operations Admin';
    return cleanName;
  }

  return cleanName;
}

export function formatPaymentMethod(method?: string | null): string {
  const m = String(method || 'CASH').toUpperCase();
  const map: Record<string, string> = {
    BKASH: 'bKash Mobile Banking',
    NAGAD: 'Nagad Mobile Banking',
    ROCKET: 'Rocket Mobile Banking',
    CASH: 'Front Desk Cash',
    POS_CARD: 'POS Debit / Credit Card',
    CARD: 'Debit / Credit Card',
    BANK_TRANSFER: 'Bank Transfer / EFT',
  };
  return map[m] || m.replace(/_/g, ' ');
}
