import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

const PASSWORD_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
]);

const FORBIDDEN_PROTO_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const MAX_OBJECT_DEPTH = 10;

function sanitizeString(value: string, key?: string): string {
  // Never alter raw user passwords (only reject NUL bytes)
  if (key && PASSWORD_KEYS.has(key)) {
    if (value.includes('\u0000')) {
      throw new BadRequestException('Invalid null character in password.');
    }
    return value;
  }

  // Strip null bytes and disallowed ASCII control chars (keep \t, \n, \r)
  let cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  // Block dangerous scriptable/SVG data URIs
  const lower = cleaned.trim().toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html') ||
    lower.startsWith('data:image/svg+xml')
  ) {
    throw new BadRequestException('Potentially unsafe URL or data payload rejected.');
  }

  // Skip HTML tag stripping on validated raster photo data URLs
  if (lower.startsWith('data:image/')) {
    return cleaned.trim();
  }

  // Neutralize common HTML/script injection constructs in text fields
  cleaned = cleaned
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<\/?script\b[^>]*>/gi, '')
    .replace(/<\/?(?:iframe|object|embed|svg)\b[^>]*>/gi, '')
    .replace(/\son(?:load|error|click|mouseover|focus|blur|submit)\s*=/gi, ' data-blocked-handler=');

  return cleaned.trim();
}

function sanitizeValue(value: unknown, depth = 0, key?: string): unknown {
  if (depth > MAX_OBJECT_DEPTH) {
    throw new BadRequestException('Request payload nesting depth exceeded.');
  }

  if (typeof value === 'string') {
    return sanitizeString(value, key);
  }

  if (Array.isArray(value)) {
    if (value.length > 500) {
      throw new BadRequestException('Array payload exceeds maximum allowed items.');
    }
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > 150) {
      throw new BadRequestException('Object payload exceeds maximum allowed keys.');
    }
    for (const [k, v] of entries) {
      if (FORBIDDEN_PROTO_KEYS.has(k)) {
        continue;
      }
      out[k] = sanitizeValue(v, depth + 1, k);
    }
    return out;
  }

  return value;
}

/**
 * Global input sanitization pipe protecting all controllers from NUL bytes,
 * prototype-pollution keys, scriptable URIs, excessive nesting, and HTML script tags
 * while preserving passwords and raster base64 images.
 */
@Injectable()
export class SanitizeInputPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (
      metadata.type !== 'body' &&
      metadata.type !== 'query' &&
      metadata.type !== 'param'
    ) {
      return value;
    }
    return sanitizeValue(value, 0);
  }
}

