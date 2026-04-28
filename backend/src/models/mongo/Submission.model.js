const mongoose = require('mongoose');
const crypto = require('crypto');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const attachmentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => crypto.randomUUID(),
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const versionHistorySchema = new mongoose.Schema(
  {
    version: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
      required: true,
      trim: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const aiAnalysisSchema = new mongoose.Schema(
  {
    grammarScore: Number,
    toneScore: Number,
    correctedText: String,
    diffSummary: String,
    shortSummary: String,
    teaserParagraph: String,
    suggestedCategory: {
      type: String,
      enum: ['technical', 'sports', 'cultural', 'academic', 'achievements', 'department'],
    },
    riskLevel: {
      type: String,
      enum: ['clean', 'flagged', 'blocked'],
      default: 'clean',
    },
    riskScore: {
      type: Number,
      default: 0,
    },
    flaggedKeywords: [
      {
        type: String,
      },
    ],
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    sanitizedContent: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['technical', 'sports', 'cultural', 'academic', 'achievements', 'department'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'ai_triage', 'needs_review', 'approved', 'rejected', 'blocked'],
      default: 'draft',
    },
    authorId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorRoll: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    aiAnalysis: {
      type: aiAnalysisSchema,
      default: null,
    },
    facultyComment: {
      type: String,
      trim: true,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    versionHistory: {
      type: [versionHistorySchema],
      default: [],
    },
    // Improvement 4: Per-article template selection
    chosenTemplate: {
      type: String,
      enum: ['two_column', 'single_column', 'photo_left', 'photo_right', 'full_bleed', 'pull_quote_hero'],
      default: 'single_column',
    },
    labOverrideTemplate: {
      type: String,
      enum: ['two_column', 'single_column', 'photo_left', 'photo_right', 'full_bleed', 'pull_quote_hero', null],
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'submissions',
  }
);

submissionSchema.pre('save', function sanitizeContent(next) {
  this.sanitizedContent = DOMPurify.sanitize(this.content || '', {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  next();
});

submissionSchema.index({ status: 1, createdAt: -1 });
submissionSchema.index({ category: 1, status: 1 });
submissionSchema.index({ authorId: 1, createdAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
