'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function QrCodeSvg({
  value,
  size = 112,
  className = '',
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const [svgMarkup, setSvgMarkup] = useState<string>('');

  useEffect(() => {
    let active = true;
    if (!value) {
      setSvgMarkup('');
      return;
    }
    QRCode.toString(value, {
      type: 'svg',
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then((svg) => {
        if (active) setSvgMarkup(svg);
      })
      .catch(() => {
        if (active) setSvgMarkup('');
      });

    return () => {
      active = false;
    };
  }, [value, size]);

  if (!svgMarkup) {
    return (
      <div
        className={`rounded-lg border border-slate-300 bg-white flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        aria-label="Generating QR code"
      />
    );
  }

  return (
    <div
      className={`inline-block rounded-lg border border-slate-200 bg-white p-1 ${className}`}
      style={{ width: size + 8, height: size + 8 }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
