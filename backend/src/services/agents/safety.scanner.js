// src/services/agents/safety.scanner.js
// ─────────────────────────────────────────────────────────
// Safety Scanner — runs FIRST in the pipeline.
// Returns { riskLevel, riskScore, flaggedKeywords }.
// If riskLevel === 'blocked' the pipeline stops immediately.
// ─────────────────────────────────────────────────────────
const {
  blockedKeywords,
  flaggedKeywords,
  suspiciousPatterns,
} = require('../../config/moderation.config');
const logger = require('../../config/logger');

/**
 * Build a word-boundary regex for a keyword (case-insensitive).
 * Escapes special regex chars inside the keyword first.
 */
const buildKeywordRegex = (kw) => {
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'gi');
};

/**
 * Scan text for blocked / flagged keywords and suspicious patterns.
 *
 * @param {string} text — the raw content to scan
 * @returns {{ riskLevel: 'clean'|'flagged'|'blocked', riskScore: number, flaggedKeywords: string[] }}
 */
const scan = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      return { riskLevel: 'clean', riskScore: 0, flaggedKeywords: [] };
    }

    let riskScore = 0;
    const matched = [];

    // ── 1. Check blocked keywords (instant block) ──────────────────
    for (const kw of blockedKeywords) {
      if (buildKeywordRegex(kw).test(text)) {
        logger.warn(`Safety scanner: BLOCKED keyword detected — "${kw}"`);
        matched.push(kw);
        return {
          riskLevel: 'blocked',
          riskScore: 100,
          flaggedKeywords: matched,
        };
      }
    }

    // ── 2. Check flagged keywords (+15 per match) ──────────────────
    for (const kw of flaggedKeywords) {
      if (buildKeywordRegex(kw).test(text)) {
        riskScore += 15;
        matched.push(kw);
      }
    }

    // ── 3. Check suspicious patterns (+score per match) ────────────
    for (const sp of suspiciousPatterns) {
      if (sp.pattern.test(text)) {
        riskScore += sp.score;
        matched.push(sp.label);
      }
    }

    // ── Determine risk level ───────────────────────────────────────
    let riskLevel = 'clean';
    if (riskScore >= 60) {
      riskLevel = 'blocked';
    } else if (riskScore > 0) {
      riskLevel = 'flagged';
    }

    return {
      riskLevel,
      riskScore: Math.min(riskScore, 100),
      flaggedKeywords: matched,
    };
  } catch (error) {
    logger.error(`Safety scanner error: ${error.message}`);
    // On error, flag for human review rather than silently passing
    return { riskLevel: 'flagged', riskScore: 20, flaggedKeywords: ['scanner_error'] };
  }
};

module.exports = { scan };
