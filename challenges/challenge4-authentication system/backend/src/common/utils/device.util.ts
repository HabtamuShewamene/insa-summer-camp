import { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export function extractDeviceInfo(req: Request): {
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
} {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browser = result.browser.name
    ? `${result.browser.name}${result.browser.version ? ' ' + result.browser.version.split('.')[0] : ''}`
    : 'Unknown Browser';

  const os = result.os.name
    ? `${result.os.name}${result.os.version ? ' ' + result.os.version : ''}`
    : 'Unknown OS';

  let device = 'Desktop';
  if (result.device.type === 'mobile') device = 'Mobile';
  else if (result.device.type === 'tablet') device = 'Tablet';
  else if (result.device.vendor) device = result.device.vendor;

  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  return { device, browser, os, ipAddress };
}

export function resolveLocation(ipAddress: string): {
  location: string;
  country?: string;
  city?: string;
} {
  // In production, integrate with a GeoIP service (MaxMind, ip-api, etc.)
  if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.')) {
    return { location: 'Local Network', country: 'Local', city: 'Localhost' };
  }
  return { location: 'Unknown Location' };
}

export async function hashToken(token: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(64).toString('hex');
}
