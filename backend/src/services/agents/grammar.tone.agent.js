// src/services/agents/grammar.tone.agent.js
// ─────────────────────────────────────────────────────────
// Grammar & Tone Agent
// MODE A: External AI API (OpenAI / Anthropic) when key is set
// MODE B: Local heuristics fallback (always available)
// Returns { grammarScore, toneScore, correctedText, diffSummary }
// ─────────────────────────────────────────────────────────
const logger = require('../../config/logger');

// ── Informal vocabulary list ──────────────────────────────
const INFORMAL_WORDS = new Set([
  'gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'dunno', 'ain\'t',
  'yeah', 'yep', 'nope', 'nah', 'dude', 'bro', 'lol', 'omg',
  'btw', 'tbh', 'imo', 'imho', 'fyi', 'smh', 'lmao', 'rofl',
  'cuz', 'coz', 'tho', 'thru', 'u', 'ur', 'r', 'pls', 'plz',
  'ok', 'okay', 'stuff', 'things', 'cool', 'awesome', 'sucks',
  'like', 'basically', 'literally', 'totally', 'super', 'really',
  'very', 'just', 'actually', 'honestly', 'seriously',
]);

// ── Informal → formal replacements ───────────────────────
const REPLACEMENTS = {
  'gonna': 'going to',
  'wanna': 'want to',
  'gotta': 'got to',
  'kinda': 'kind of',
  'sorta': 'sort of',
  'dunno': 'do not know',
  'ain\'t': 'is not',
  'cuz': 'because',
  'coz': 'because',
  'tho': 'though',
  'thru': 'through',
  'u': 'you',
  'ur': 'your',
  'r': 'are',
  'pls': 'please',
  'plz': 'please',
  'ok': 'okay',
};

// ── Helper utilities ──────────────────────────────────────

/** Split text into sentences (handles common abbreviations). */
const splitSentences = (text) => {
  return text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

/** Count word occurrences. */
const wordFrequency = (words) => {
  const freq = {};
  for (const w of words) {
    const lower = w.toLowerCase();
    freq[lower] = (freq[lower] || 0) + 1;
  }
  return freq;
};

/**
 * Tokenise text into words (lowercase, letters only).
 */
const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);

// ── MODE B: Local heuristic analysis ──────────────────────

const analyzeLocal = (content, title) => {
  const sentences = splitSentences(content);
  const words = tokenize(content);
  const totalWords = words.length;
  const totalSentences = sentences.length || 1;

  // ── Grammar score (100-point scale) ─────────────────────
  let grammarPenalty = 0;
  const diffs = [];

  // 1. Average sentence length check (ideal: 12–25 words)
  const avgSentLen = totalWords / totalSentences;
  if (avgSentLen > 35) {
    grammarPenalty += 15;
    diffs.push('Some sentences are excessively long (>35 words).');
  } else if (avgSentLen > 25) {
    grammarPenalty += 8;
    diffs.push('Average sentence length is slightly high.');
  } else if (avgSentLen < 5 && totalSentences > 2) {
    grammarPenalty += 10;
    diffs.push('Several sentences are very short — consider combining.');
  }

  // 2. Repeated words check
  const freq = wordFrequency(words);
  const repeatedWords = Object.entries(freq)
    .filter(([w, c]) => c > 4 && w.length > 3 && !['that', 'this', 'with', 'from', 'have', 'been', 'were', 'they', 'their', 'which', 'about', 'would', 'could', 'should', 'where', 'when', 'what', 'than'].includes(w))
    .map(([w, c]) => ({ word: w, count: c }));

  if (repeatedWords.length > 0) {
    const penalty = Math.min(repeatedWords.length * 3, 15);
    grammarPenalty += penalty;
    const wordList = repeatedWords.slice(0, 5).map((r) => `"${r.word}" (${r.count}×)`).join(', ');
    diffs.push(`Repeated words detected: ${wordList}.`);
  }

  // 3. Informal vocabulary
  const informalFound = words.filter((w) => INFORMAL_WORDS.has(w));
  const uniqueInformal = [...new Set(informalFound)];
  if (uniqueInformal.length > 0) {
    const penalty = Math.min(uniqueInformal.length * 4, 20);
    grammarPenalty += penalty;
    diffs.push(`Informal words detected: ${uniqueInformal.slice(0, 8).map((w) => `"${w}"`).join(', ')}.`);
  }

  // 4. Sentence-starting variety (penalise if >60% start the same way)
  if (totalSentences >= 4) {
    const starters = sentences.map((s) => (s.split(/\s/)[0] || '').toLowerCase());
    const starterFreq = wordFrequency(starters);
    const maxStart = Math.max(...Object.values(starterFreq));
    if (maxStart / totalSentences > 0.6) {
      grammarPenalty += 8;
      diffs.push('Low variety in sentence openings — try varying how sentences begin.');
    }
  }

  // 5. Very short content
  if (totalWords < 30) {
    grammarPenalty += 10;
    diffs.push('Content is very short — consider expanding with more detail.');
  }

  const grammarScore = Math.max(0, Math.min(100, 100 - grammarPenalty));

  // ── Tone score (100-point scale) ────────────────────────
  let tonePenalty = 0;

  // Excessive exclamation marks
  const exclamations = (content.match(/!/g) || []).length;
  if (exclamations > 5) {
    tonePenalty += Math.min((exclamations - 5) * 2, 15);
    diffs.push('Excessive exclamation marks — consider a more measured tone.');
  }

  // ALL CAPS words (more than 3 consecutive caps words)
  const capsWords = (content.match(/\b[A-Z]{3,}\b/g) || []).filter(
    (w) => !['API', 'HTML', 'CSS', 'HTTP', 'URL', 'SQL', 'PDF', 'CEO', 'CTO', 'USA', 'IEEE', 'ACM', 'FCRIT', 'AI', 'ML', 'IoT', 'IT'].includes(w)
  );
  if (capsWords.length > 3) {
    tonePenalty += 10;
    diffs.push('Multiple ALL-CAPS words detected — avoid shouting in formal writing.');
  }

  // Informal word ratio
  const informalRatio = informalFound.length / (totalWords || 1);
  if (informalRatio > 0.1) {
    tonePenalty += 15;
    diffs.push('High proportion of informal language for a magazine article.');
  } else if (informalRatio > 0.05) {
    tonePenalty += 8;
  }

  // Question marks frequency (more than 5 suggests casual writing)
  const questions = (content.match(/\?/g) || []).length;
  if (questions > 5) {
    tonePenalty += 5;
    diffs.push('Many question marks — magazine articles typically use a declarative tone.');
  }

  const toneScore = Math.max(0, Math.min(100, 100 - tonePenalty));

  // ── Corrected text ──────────────────────────────────────
  let correctedText = content;
  for (const [informal, formal] of Object.entries(REPLACEMENTS)) {
    const regex = new RegExp(`\\b${informal}\\b`, 'gi');
    correctedText = correctedText.replace(regex, formal);
  }

  // Capitalise first letter of sentences
  correctedText = correctedText.replace(/(^|[.!?]\s+)([a-z])/g, (_m, pre, letter) => pre + letter.toUpperCase());

  const diffSummary = diffs.length > 0
    ? diffs.join(' ')
    : 'No significant issues found — content reads well.';

  return {
    grammarScore,
    toneScore,
    correctedText,
    diffSummary,
  };
};

// ── MODE A: External AI API ───────────────────────────────

const analyzeWithAI = async (content, title) => {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openaiKey && !anthropicKey) {
    return null; // Fall back to local
  }

  try {
    if (openaiKey) {
      const { default: fetch } = await import('node-fetch');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          max_tokens: 1024,
          messages: [
            {
              role: 'system',
              content: 'You are an editorial assistant for a college magazine. Analyze the following article for grammar and tone. Return a JSON object with: grammarScore (0-100), toneScore (0-100), correctedText (full corrected version), diffSummary (brief list of changes made). Only respond with valid JSON, no markdown.',
            },
            {
              role: 'user',
              content: `Title: ${title}\n\nContent:\n${content}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        logger.warn(`OpenAI API returned ${response.status} — falling back to local.`);
        return null;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      return JSON.parse(text);
    }

    // Anthropic fallback
    if (anthropicKey) {
      const { default: fetch } = await import('node-fetch');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `You are an editorial assistant for a college magazine. Analyze the following article for grammar and tone. Return a JSON object with: grammarScore (0-100), toneScore (0-100), correctedText (full corrected version), diffSummary (brief list of changes made). Only respond with valid JSON.\n\nTitle: ${title}\n\nContent:\n${content}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        logger.warn(`Anthropic API returned ${response.status} — falling back to local.`);
        return null;
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      return JSON.parse(text);
    }
  } catch (error) {
    logger.warn(`AI API grammar analysis failed: ${error.message} — using local fallback.`);
    return null;
  }

  return null;
};

// ── Public API ────────────────────────────────────────────

/**
 * Analyze content for grammar and tone.
 *
 * @param {string} content - article body
 * @param {string} title   - article title
 * @returns {Promise<{ grammarScore: number, toneScore: number, correctedText: string, diffSummary: string }>}
 */
const analyze = async (content, title = '') => {
  try {
    if (!content || typeof content !== 'string') {
      return {
        grammarScore: 50,
        toneScore: 50,
        correctedText: content || '',
        diffSummary: 'No content provided for analysis.',
      };
    }

    // Try AI first, fall back to local
    const aiResult = await analyzeWithAI(content, title);
    if (aiResult && typeof aiResult.grammarScore === 'number') {
      logger.info('Grammar analysis completed via AI API.');
      return {
        grammarScore: Math.max(0, Math.min(100, aiResult.grammarScore)),
        toneScore: Math.max(0, Math.min(100, aiResult.toneScore)),
        correctedText: aiResult.correctedText || content,
        diffSummary: aiResult.diffSummary || '',
      };
    }

    // Local heuristic fallback
    logger.info('Grammar analysis completed via local heuristics.');
    return analyzeLocal(content, title);
  } catch (error) {
    logger.error(`Grammar/tone agent error: ${error.message}`);
    return {
      grammarScore: 50,
      toneScore: 50,
      correctedText: content || '',
      diffSummary: 'Analysis encountered an error — manual review recommended.',
    };
  }
};

module.exports = { analyze };
