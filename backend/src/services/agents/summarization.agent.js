// src/services/agents/summarization.agent.js
// ─────────────────────────────────────────────────────────
// Summarization Agent — extractive sentence scoring
// Returns { shortSummary, teaserParagraph }
// ─────────────────────────────────────────────────────────
const logger = require('../../config/logger');

// ── Stop words to ignore during keyword density scoring ──
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
  'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  'can', 'could', 'not', 'no', 'nor', 'so', 'as', 'if', 'then',
  'than', 'too', 'very', 'just', 'about', 'above', 'after',
  'again', 'all', 'also', 'any', 'because', 'before', 'between',
  'both', 'each', 'few', 'from', 'further', 'here', 'how',
  'into', 'its', 'more', 'most', 'much', 'my', 'other', 'our',
  'out', 'over', 'own', 'same', 'some', 'such', 'that', 'their',
  'them', 'there', 'these', 'they', 'this', 'those', 'through',
  'under', 'until', 'up', 'we', 'what', 'when', 'where',
  'which', 'while', 'who', 'whom', 'why', 'you', 'your', 'it',
  'he', 'she', 'him', 'her', 'his', 'i', 'me',
]);

/**
 * Tokenise text into lowercase words, letters only.
 */
const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

/**
 * Split text into sentences using common sentence boundaries.
 */
const splitSentences = (text) => {
  // Handle common abbreviations to avoid false splits
  const cleaned = text
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|St|Jr|Sr|vs|etc|i\.e|e\.g)\./gi, '$1<DOT>')
    .replace(/([.!?])\s+/g, '$1\n')
    .replace(/<DOT>/g, '.');

  return cleaned
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 10); // Ignore very short fragments
};

/**
 * Compute TF (term frequency) for an array of words.
 */
const computeTF = (words) => {
  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  const total = words.length || 1;
  const tf = {};
  for (const [word, count] of Object.entries(freq)) {
    tf[word] = count / total;
  }
  return tf;
};

/**
 * Score each sentence based on:
 *  - Position (first & last sentences weighted more)
 *  - Keyword density (TF-based)
 *  - Title keyword overlap
 *  - Sentence length (prefer medium-length)
 */
const scoreSentences = (sentences, titleWords, documentTF) => {
  const total = sentences.length || 1;

  return sentences.map((sentence, index) => {
    const words = tokenize(sentence);
    let score = 0;

    // ── 1. Position score (first 20% and last 10% of document) ──
    const relPos = index / total;
    if (relPos < 0.2) {
      score += 0.3 * (1 - relPos / 0.2); // Strongest at very beginning
    }
    if (relPos > 0.9) {
      score += 0.15; // Conclusion sentences
    }

    // ── 2. Keyword density (overlap with document TF) ───────────
    if (words.length > 0) {
      let tfSum = 0;
      for (const w of words) {
        tfSum += documentTF[w] || 0;
      }
      score += (tfSum / words.length) * 2;
    }

    // ── 3. Title overlap ────────────────────────────────────────
    if (titleWords.length > 0) {
      const overlap = words.filter((w) => titleWords.includes(w)).length;
      score += (overlap / titleWords.length) * 0.4;
    }

    // ── 4. Sentence length preference (15–30 words ideal) ───────
    const wordCount = sentence.split(/\s+/).length;
    if (wordCount >= 15 && wordCount <= 30) {
      score += 0.15;
    } else if (wordCount > 40) {
      score -= 0.1; // Too long
    } else if (wordCount < 8) {
      score -= 0.1; // Too short
    }

    // ── 5. Contains numeric data (often important) ──────────────
    if (/\d+/.test(sentence)) {
      score += 0.05;
    }

    return { sentence, score, index };
  });
};

/**
 * Summarize content using extractive summarization.
 *
 * @param {string} content — the article body
 * @param {string} title   — the article title
 * @returns {Promise<{ shortSummary: string, teaserParagraph: string }>}
 */
const summarize = async (content, title = '') => {
  try {
    if (!content || typeof content !== 'string' || content.trim().length < 20) {
      return {
        shortSummary: content ? content.substring(0, 150).trim() : 'No content available for summarization.',
        teaserParagraph: content || 'No content available.',
      };
    }

    const sentences = splitSentences(content);

    if (sentences.length <= 2) {
      // Content is already very short — use as-is
      return {
        shortSummary: sentences[0] || content.substring(0, 150),
        teaserParagraph: sentences.join(' '),
      };
    }

    const allWords = tokenize(content);
    const titleWords = tokenize(title);
    const documentTF = computeTF(allWords);

    const scored = scoreSentences(sentences, titleWords, documentTF);

    // ── Short summary: top 2 sentences by score, in document order ──
    const topForSummary = scored
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .sort((a, b) => a.index - b.index);

    const shortSummary = topForSummary
      .map((s) => s.sentence)
      .join(' ')
      .substring(0, 300)
      .trim();

    // ── Teaser paragraph: top 3-4 sentences, in document order ──
    const teaserCount = Math.min(4, Math.max(3, Math.ceil(sentences.length * 0.2)));
    const topForTeaser = scored
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, teaserCount)
      .sort((a, b) => a.index - b.index);

    const teaserParagraph = topForTeaser
      .map((s) => s.sentence)
      .join(' ')
      .substring(0, 600)
      .trim();

    logger.info(`Summarization completed: ${sentences.length} sentences → summary ${shortSummary.length} chars.`);

    return { shortSummary, teaserParagraph };
  } catch (error) {
    logger.error(`Summarization agent error: ${error.message}`);
    // Fallback: first 150 chars
    return {
      shortSummary: content ? content.substring(0, 150).trim() + '...' : 'Summarization failed.',
      teaserParagraph: content ? content.substring(0, 400).trim() + '...' : 'Summarization failed.',
    };
  }
};

module.exports = { summarize };
