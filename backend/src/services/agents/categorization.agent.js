// src/services/agents/categorization.agent.js
// ─────────────────────────────────────────────────────────
// Categorization Agent — always local keyword matching
// across 6 categories. If confidence < 25%, trust the
// author's own category.
// Returns { suggestedCategory, confidence, scores }
// ─────────────────────────────────────────────────────────
const logger = require('../../config/logger');

/**
 * Category keyword dictionaries.
 * Each key maps to an array of keywords/phrases associated with that category.
 * Weights: exact multi-word phrases score 3, single words score 1.
 */
const CATEGORY_KEYWORDS = {
  technical: {
    phrases: [
      'machine learning', 'deep learning', 'artificial intelligence',
      'neural network', 'natural language processing', 'computer vision',
      'data science', 'cloud computing', 'web development', 'mobile app',
      'cyber security', 'blockchain', 'internet of things', 'devops',
      'open source', 'software engineering', 'full stack', 'front end',
      'back end', 'database management', 'version control', 'agile methodology',
      'api development', 'microservices', 'distributed systems',
    ],
    words: [
      'algorithm', 'programming', 'code', 'coding', 'software', 'hardware',
      'python', 'javascript', 'react', 'node', 'server', 'deploy',
      'api', 'framework', 'library', 'github', 'docker', 'kubernetes',
      'linux', 'terminal', 'compiler', 'debug', 'testing', 'automation',
      'encryption', 'protocol', 'binary', 'repository', 'stack',
      'database', 'sql', 'mongodb', 'backend', 'frontend', 'typescript',
      'html', 'css', 'java', 'rust', 'golang', 'tensorflow', 'pytorch',
      'gpu', 'cpu', 'ram', 'semiconductor', 'iot', 'robotics',
    ],
  },

  sports: {
    phrases: [
      'sports day', 'annual sports', 'inter college', 'intra college',
      'sports fest', 'cricket match', 'football match', 'basketball game',
      'table tennis', 'chess tournament', 'marathon run', 'relay race',
      'long jump', 'high jump', 'sports committee', 'team captain',
      'gold medal', 'silver medal', 'bronze medal',
    ],
    words: [
      'cricket', 'football', 'basketball', 'volleyball', 'tennis',
      'badminton', 'athletics', 'swimming', 'hockey', 'kabaddi',
      'chess', 'marathon', 'sprint', 'tournament', 'championship',
      'match', 'game', 'player', 'team', 'coach', 'score',
      'goal', 'wicket', 'medal', 'trophy', 'fitness', 'athlete',
      'race', 'stadium', 'ground', 'sport', 'league', 'semifinal',
      'final', 'quarterfinal', 'winner', 'runner',
    ],
  },

  cultural: {
    phrases: [
      'cultural fest', 'annual day', 'college fest', 'dance competition',
      'music performance', 'street play', 'nukkad natak', 'fashion show',
      'talent show', 'art exhibition', 'cultural committee', 'traditional day',
      'ethnic day', 'freshers party', 'farewell party', 'college band',
    ],
    words: [
      'dance', 'music', 'singing', 'drama', 'theater', 'theatre',
      'art', 'painting', 'photography', 'film', 'movie', 'festival',
      'celebration', 'performance', 'stage', 'concert', 'band',
      'cultural', 'tradition', 'heritage', 'creativity', 'fashion',
      'design', 'poetry', 'literature', 'writing', 'sketch',
      'carnival', 'exhibition', 'gallery', 'talent',
    ],
  },

  academic: {
    phrases: [
      'research paper', 'academic year', 'semester exam', 'guest lecture',
      'workshop on', 'seminar on', 'webinar on', 'project presentation',
      'lab experiment', 'thesis defense', 'peer review', 'journal publication',
      'conference paper', 'academic excellence', 'dean list', 'honor roll',
      'study group', 'curriculum design', 'course material',
    ],
    words: [
      'research', 'study', 'exam', 'examination', 'syllabus', 'curriculum',
      'lecture', 'professor', 'faculty', 'semester', 'academic',
      'university', 'college', 'education', 'learning', 'thesis',
      'dissertation', 'journal', 'publication', 'conference', 'workshop',
      'seminar', 'webinar', 'laboratory', 'experiment', 'theory',
      'hypothesis', 'methodology', 'analysis', 'scholarship', 'grades',
      'gpa', 'cgpa', 'topper', 'marks', 'assessment',
    ],
  },

  achievements: {
    phrases: [
      'won first place', 'first prize', 'second prize', 'third prize',
      'best paper', 'best project', 'gold medal', 'national level',
      'international level', 'state level', 'placement record',
      'got placed', 'campus recruitment', 'hackathon winner',
      'coding competition', 'award ceremony', 'certificate of merit',
      'letter of appreciation', 'patent filed', 'startup founded',
    ],
    words: [
      'achievement', 'award', 'winner', 'champion', 'recognition',
      'honor', 'honour', 'prize', 'medal', 'certificate', 'trophy',
      'placement', 'internship', 'recruited', 'hired', 'hackathon',
      'competition', 'contest', 'rank', 'topper', 'valedictorian',
      'excellence', 'accomplishment', 'milestone', 'success',
      'breakthrough', 'innovation', 'patent', 'startup', 'funding',
      'scholarship', 'fellowship', 'distinguished',
    ],
  },

  department: {
    phrases: [
      'department event', 'department fest', 'hod message',
      'faculty achievement', 'department newsletter', 'alumni meet',
      'parent teacher', 'industry visit', 'industrial visit',
      'department report', 'annual report', 'committee report',
      'student council', 'department head', 'lab inauguration',
    ],
    words: [
      'department', 'committee', 'council', 'alumni', 'faculty',
      'hod', 'principal', 'dean', 'staff', 'administration',
      'infrastructure', 'lab', 'library', 'campus', 'facility',
      'inauguration', 'anniversary', 'foundation', 'newsletter',
      'report', 'meeting', 'minutes', 'agenda', 'budget',
      'collaboration', 'mou', 'partnership', 'industry',
    ],
  },
};

const VALID_CATEGORIES = [
  'technical', 'sports', 'cultural', 'academic', 'achievements', 'department',
];

/**
 * Tokenise text into lowercase words.
 */
const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

/**
 * Categorize content based on keyword matching.
 *
 * @param {string} content          — the article body
 * @param {string} title            — the article title
 * @param {string} currentCategory  — author's chosen category
 * @returns {Promise<{ suggestedCategory: string, confidence: number, scores: Record<string, number> }>}
 */
const categorize = async (content, title = '', currentCategory = '') => {
  try {
    if (!content || typeof content !== 'string') {
      return {
        suggestedCategory: VALID_CATEGORIES.includes(currentCategory) ? currentCategory : 'technical',
        confidence: 0,
        scores: {},
      };
    }

    const fullText = `${title} ${title} ${content}`.toLowerCase(); // Title weighted 2×
    const words = tokenize(fullText);
    const wordSet = new Set(words);

    const scores = {};

    for (const [category, dict] of Object.entries(CATEGORY_KEYWORDS)) {
      let score = 0;

      // Multi-word phrase matching (weight = 3 per match)
      for (const phrase of dict.phrases) {
        if (fullText.includes(phrase.toLowerCase())) {
          score += 3;
        }
      }

      // Single word matching (weight = 1 per match)
      for (const word of dict.words) {
        if (wordSet.has(word.toLowerCase())) {
          score += 1;
        }
      }

      scores[category] = score;
    }

    // Find the top-scoring category
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topScore = sorted[0]?.[1] || 0;
    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0) || 1;

    const confidence = Math.round((topScore / totalScore) * 100);
    const topCategory = sorted[0]?.[0] || 'technical';

    // If confidence < 25%, trust the author's own category
    let suggestedCategory;
    if (confidence < 25 && VALID_CATEGORIES.includes(currentCategory)) {
      suggestedCategory = currentCategory;
      logger.info(
        `Categorization: low confidence (${confidence}%) — trusting author's category "${currentCategory}".`
      );
    } else {
      suggestedCategory = topCategory;
      logger.info(
        `Categorization: "${suggestedCategory}" with ${confidence}% confidence. Scores: ${JSON.stringify(scores)}`
      );
    }

    return { suggestedCategory, confidence, scores };
  } catch (error) {
    logger.error(`Categorization agent error: ${error.message}`);
    return {
      suggestedCategory: VALID_CATEGORIES.includes(currentCategory) ? currentCategory : 'technical',
      confidence: 0,
      scores: {},
    };
  }
};

module.exports = { categorize };
