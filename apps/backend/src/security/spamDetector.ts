/**
 * ZenFlowAI — AI/Heuristic Spam & Scam Detection Engine
 *
 * Multi-signal scoring (0–100):
 *  - Banned keyword matching  (scam, phishing, spam patterns)
 *  - Duplicate/near-duplicate detection
 *  - Velocity check (too many submissions in short window)
 *  - Pattern analysis (ALL CAPS, excessive links, repeated chars)
 *  - Bot behavior fingerprinting (UA, timing, IP)
 *  - Suspicious content entropy
 *
 * Score thresholds:
 *   0–29  → CLEAN
 *   30–59 → SUSPICIOUS (flag for review)
 *   60–79 → HIGH_RISK (hold for moderation)
 *   80+   → BLOCK (auto-reject)
 */

import { prisma } from '../utils/prisma';
import { diceCoefficient } from '../services/similarity';
import { auditSecurity } from './audit';
import { verdictFromScore, type SpamVerdict } from './spamVerdict';

export { verdictFromScore };
export type { SpamVerdict };

// ─── Signal Weights ───────────────────────────────────────────────────────────
const WEIGHTS = {
  BANNED_KEYWORD: 30,
  SCAM_PATTERN: 40,
  EXCESSIVE_LINKS: 20,
  ALL_CAPS: 15,
  REPEATED_CHARS: 10,
  VERY_SHORT_CONTENT: 5,
  NEAR_DUPLICATE: 35,
  HIGH_VELOCITY: 25,
  BOT_UA: 40,
  SUSPICIOUS_IP: 20,
  PROFANITY: 15,
  PHONE_NUMBER_SPAM: 15,
  PROMOTIONAL_PATTERN: 20,
  GIBBERISH: 20,
};

// ─── Banned / Scam Keywords (MIT-licensed common lists) ───────────────────────
const SCAM_KEYWORDS = [
  // Financial scams
  'send money', 'wire transfer', 'bitcoin', 'crypto payment', 'western union',
  'money gram', 'gift card', 'itunes card', 'google play card', 'advance fee',
  'nigerian prince', 'lottery winner', 'you have won', 'claim your prize',
  // Phishing
  'verify your account', 'confirm your password', 'click here to login',
  'your account will be suspended', 'update your payment', 'billing failed',
  'suspended account', 'unusual activity detected',
  // Spam advertising
  'limited time offer', 'act now', 'free money', 'make money fast',
  'work from home', 'earn $', 'guaranteed profit', '100% free',
  'no credit card required', 'risk free', 'click here', 'buy now',
  // Abuse
  'i will hack', 'ddos', 'dox you', 'swat',
];

const SPAM_PATTERNS: RegExp[] = [
  /https?:\/\//gi,               // URLs (count > 3 = suspicious)
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // phone numbers
  /(.)\1{5,}/g,                   // repeated character runs (aaaaaa)
  /[A-Z\s]{20,}/g,               // long all-caps sequences
  /\b(click|tap|visit|go to)\s+\w+\.(com|net|org|io)/gi,
  /earn\s+\$[\d,]+/gi,           // "earn $500"
  /(?:free|win|winner|prize|reward|bonus)\s*!*/gi,
];

// ─── Bot User-Agent Fingerprints ──────────────────────────────────────────────
const BOT_UA_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
  /python-requests/i, /http-client/i, /go-http-client/i, /java\//i,
  /libwww/i, /scrapy/i, /mechanize/i, /selenium/i, /puppeteer/i,
  /headless/i, /phantom/i, /playwright/i,
];

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface SpamAnalysis {
  score: number;           // 0–100
  verdict: SpamVerdict;
  flags: string[];
  shouldBlock: boolean;
  shouldFlag: boolean;
  requiresReview: boolean;
}

export interface ContentCheckOptions {
  content: string;
  title?: string;
  userId?: number;
  ip?: string;
  userAgent?: string;
  role?: string;
}

// ─── Main Analysis Function ───────────────────────────────────────────────────

export async function analyzeContent(opts: ContentCheckOptions): Promise<SpamAnalysis> {
  const { content, title = '', userId, ip, userAgent, role } = opts;
  const fullText = `${title} ${content}`.toLowerCase();
  const flags: string[] = [];
  let score = 0;

  // ── 1. Scam/spam keyword matching ─────────────────────────────────────────
  for (const keyword of SCAM_KEYWORDS) {
    if (fullText.includes(keyword)) {
      score += WEIGHTS.SCAM_PATTERN;
      flags.push(`SCAM_KEYWORD:${keyword}`);
      break; // One is enough to trigger
    }
  }

  // ── 2. URL count ──────────────────────────────────────────────────────────
  const urlMatches = content.match(/https?:\/\//gi) ?? [];
  if (urlMatches.length > 3) {
    score += WEIGHTS.EXCESSIVE_LINKS;
    flags.push(`EXCESSIVE_LINKS:${urlMatches.length}`);
  }

  // ── 3. ALL CAPS ───────────────────────────────────────────────────────────
  const upperRatio = (content.match(/[A-Z]/g) ?? []).length / Math.max(content.length, 1);
  if (upperRatio > 0.6 && content.length > 20) {
    score += WEIGHTS.ALL_CAPS;
    flags.push('ALL_CAPS');
  }

  // ── 4. Repeated characters ────────────────────────────────────────────────
  if (/(.)\1{6,}/.test(content)) {
    score += WEIGHTS.REPEATED_CHARS;
    flags.push('REPEATED_CHARS');
  }

  // ── 5. Very short content (possible test/bot submission) ──────────────────
  if (content.trim().length < 10) {
    score += WEIGHTS.VERY_SHORT_CONTENT;
    flags.push('VERY_SHORT_CONTENT');
  }

  // ── 6. Spam pattern matching ──────────────────────────────────────────────
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(fullText)) {
      score += WEIGHTS.PROMOTIONAL_PATTERN;
      flags.push(`PATTERN_MATCH:${pattern.source.substring(0, 30)}`);
      break;
    }
  }

  // ── 7. Bot user-agent detection ───────────────────────────────────────────
  if (userAgent) {
    const isBot = BOT_UA_PATTERNS.some((p) => p.test(userAgent));
    if (isBot) {
      score += WEIGHTS.BOT_UA;
      flags.push(`BOT_UA:${userAgent.substring(0, 50)}`);
    }

    // Empty UA is also suspicious
    if (userAgent.trim().length < 5) {
      score += 15;
      flags.push('EMPTY_USER_AGENT');
    }
  }

  // ── 8. Near-duplicate detection (same user, recent tickets) ───────────────
  if (userId) {
    const recentTickets = await prisma.ticket.findMany({
      where: {
        customerId: userId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // last hour
      },
      select: { title: true, description: true },
      take: 10,
    });

    for (const t of recentTickets) {
      const similarity = diceCoefficient(fullText, `${t.title} ${t.description}`.toLowerCase());
      if (similarity > 0.8) {
        score += WEIGHTS.NEAR_DUPLICATE;
        flags.push(`NEAR_DUPLICATE:${Math.round(similarity * 100)}%`);
        break;
      }
    }
  }

  // ── 9. Velocity check (too many recent submissions) ───────────────────────
  if (userId) {
    const recentCount = await prisma.ticket.count({
      where: {
        customerId: userId,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }, // last 10 min
      },
    });
    if (recentCount >= 5) {
      score += WEIGHTS.HIGH_VELOCITY;
      flags.push(`HIGH_VELOCITY:${recentCount}_in_10min`);
    }
  }

  // ── 10. Gibberish detection (low character variety, high entropy noise) ────
  const charVariety = new Set(content.toLowerCase().replace(/\s/g, '')).size;
  if (charVariety < 5 && content.length > 15) {
    score += WEIGHTS.GIBBERISH;
    flags.push('GIBBERISH');
  }

  // ── 11. Admin/Moderator bypass ────────────────────────────────────────────
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    // Admins bypass spam detection for their own submissions
    score = 0;
    flags.length = 0;
  }

  // ── Cap score at 100 ──────────────────────────────────────────────────────
  score = Math.min(100, score);

  const verdict = verdictFromScore(score);

  if (score >= 30 && userId) {
    await auditSecurity('SPAM_DETECTED', {
      actorId: userId,
      actorIp: ip,
      actorAgent: userAgent,
      message: `Spam score ${score}/100 — ${verdict} — flags: ${flags.join(', ')}`,
      metadata: { score, verdict, flags },
      severity: score >= 80 ? 'CRITICAL' : score >= 60 ? 'ERROR' : 'WARN',
    });

    // Update user's suspicion score
    await updateUserSuspicionScore(userId, score, flags);
  }

  return {
    score,
    verdict,
    flags,
    shouldBlock: verdict === 'BLOCK',
    shouldFlag: verdict === 'HIGH_RISK' || verdict === 'BLOCK',
    requiresReview: verdict !== 'CLEAN',
  };
}

// ─── Bot Request Detection (for Express middleware) ───────────────────────────

export function detectBotRequest(userAgent: string, ip: string): {
  isBot: boolean;
  confidence: number;
  reason?: string;
} {
  if (!userAgent || userAgent.trim().length < 5) {
    return { isBot: true, confidence: 0.9, reason: 'MISSING_USER_AGENT' };
  }

  const isBot = BOT_UA_PATTERNS.some((p) => p.test(userAgent));
  if (isBot) {
    return { isBot: true, confidence: 0.95, reason: 'BOT_USER_AGENT' };
  }

  return { isBot: false, confidence: 0 };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function updateUserSuspicionScore(userId: number, newScore: number, flags: string[]) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { suspicionScore: true, suspicionReason: true },
    });
    if (!user) return;

    // Weighted moving average: 70% existing + 30% new signal
    const updated = user.suspicionScore * 0.7 + newScore * 0.3;
    const topFlag = flags[0] ?? 'UNKNOWN';

    await prisma.user.update({
      where: { id: userId },
      data: {
        suspicionScore: Math.min(100, updated),
        isSuspicious: updated >= 40,
        suspicionReason: updated >= 40 ? topFlag : null,
      },
    });
  } catch {
    // Non-critical
  }
}

// ─── Content Sanitiser ────────────────────────────────────────────────────────

export function sanitizeContent(input: string): string {
  // Remove null bytes
  let out = input.replace(/\0/g, '');
  // Trim excessive whitespace
  out = out.replace(/\s{3,}/g, '  ');
  // Strip zero-width characters
  out = out.replace(/[\u200B-\u200D\uFEFF]/g, '');
  return out.trim();
}

// ─── IP Reputation Check ──────────────────────────────────────────────────────

export async function isIpBlocked(ip: string): Promise<{ blocked: boolean; reason?: string }> {
  const now = Date.now();
  const hit = ipBlockCache.get(ip);
  if (hit && hit.until > now) return hit.value;

  const blocked = await prisma.blockedIp.findFirst({
    where: {
      ip,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });
  const value = blocked ? { blocked: true as const, reason: blocked.reason } : { blocked: false as const };
  ipBlockCache.set(ip, { until: now + 15_000, value });
  return value;
}

const ipBlockCache = new Map<string, { until: number; value: { blocked: boolean; reason?: string } }>();
