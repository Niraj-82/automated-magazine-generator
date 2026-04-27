// src/config/moderation.config.js
// ─────────────────────────────────────────────────────────
// Centralized content-moderation dictionaries.
// Edit ONLY this file to add / remove moderation terms.
// ─────────────────────────────────────────────────────────

/**
 * Blocked keywords — instant rejection. Content containing ANY of
 * these (case-insensitive, word-boundary match) is set to "blocked".
 */
const blockedKeywords = [
  'hate speech',
  'racial slur',
  'death threat',
  'bomb threat',
  'kill everyone',
  'school shooting',
  'terrorist attack',
  'ethnic cleansing',
  'white supremacy',
  'child abuse',
  'sexual assault',
  'revenge porn',
  'doxxing',
  'swatting',
  'self-harm instructions',
];

/**
 * Flagged keywords — raise the risk score (+15 per match) but do NOT
 * block automatically. Faculty review is required.
 */
const flaggedKeywords = [
  'violence',
  'drugs',
  'alcohol',
  'gambling',
  'profanity',
  'harassment',
  'bullying',
  'discrimination',
  'plagiarism',
  'cheating',
  'weapon',
  'extremism',
  'radicalization',
  'conspiracy',
  'misinformation',
  'explicit',
  'obscene',
  'defamation',
  'slander',
  'libel',
];

/**
 * Suspicious patterns — regex patterns that add +5 to +10 to the
 * risk score when matched.
 *
 * Each entry:  { pattern: RegExp, score: number, label: string }
 */
const suspiciousPatterns = [
  {
    pattern: /\b(hack|exploit|crack)\s+(system|server|password|account)\b/i,
    score: 10,
    label: 'hacking reference',
  },
  {
    pattern: /\b(buy|sell|free)\s+(followers|likes|accounts)\b/i,
    score: 8,
    label: 'spam / fraud language',
  },
  {
    pattern: /\b(make\s+money\s+fast|get\s+rich\s+quick)\b/i,
    score: 7,
    label: 'scam language',
  },
  {
    pattern: /https?:\/\/bit\.ly|https?:\/\/tinyurl/i,
    score: 5,
    label: 'shortened URL',
  },
  {
    pattern: /(.)\1{6,}/,
    score: 5,
    label: 'character spam',
  },
  {
    pattern: /[A-Z\s]{20,}/,
    score: 5,
    label: 'excessive caps',
  },
  {
    pattern: /\b(nigger|faggot|retard)\b/i,
    score: 10,
    label: 'slur detected',
  },
  {
    pattern: /\b(penis|vagina|sex|porn|nude|naked)\b/i,
    score: 8,
    label: 'explicit content reference',
  },
];

module.exports = {
  blockedKeywords,
  flaggedKeywords,
  suspiciousPatterns,
};
