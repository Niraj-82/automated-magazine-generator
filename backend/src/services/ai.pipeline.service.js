// src/services/ai.pipeline.service.js
// ─────────────────────────────────────────────────────────
// AI Multi-Agent Pipeline Orchestrator
//
// Flow:
//  1. Safety Scanner runs FIRST. If blocked → stop.
//  2. Grammar, Summarization, Categorization run in PARALLEL.
//  3. Update MongoDB Submission with full aiAnalysis.
//  4. Set status to "needs_review".
//
// This function NEVER throws to the caller — all errors
// are caught and logged internally.
// ─────────────────────────────────────────────────────────
const logger = require('../config/logger');

// Lazy-load models to avoid circular-dependency issues at startup
const getSubmission = () => {
  try {
    const { Submission } = require('../models/mongo');
    return Submission;
  } catch (err) {
    logger.error(`Cannot load Submission model: ${err.message}`);
    return null;
  }
};

const getAuditLog = () => {
  try {
    const { AuditLog } = require('../models/sql');
    return AuditLog;
  } catch (err) {
    logger.warn(`AuditLog model not available: ${err.message}`);
    return null;
  }
};

const getNotificationService = () => {
  try {
    return require('./notification.service');
  } catch (err) {
    logger.warn(`Notification service not available: ${err.message}`);
    return null;
  }
};

// Agent imports
const safetyScanner = require('./agents/safety.scanner');
const grammarAgent = require('./agents/grammar.tone.agent');
const summarizationAgent = require('./agents/summarization.agent');
const categorizationAgent = require('./agents/categorization.agent');

/**
 * Process a submission through the full AI pipeline.
 * This function catches ALL errors — it never throws.
 *
 * @param {string} submissionId — the MongoDB _id of the submission
 */
const processSubmission = async (submissionId) => {
  try {
    logger.info(`AI Pipeline: starting for submission ${submissionId}`);

    const Submission = getSubmission();
    if (!Submission) {
      logger.error('AI Pipeline: Submission model not available — aborting.');
      return;
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      logger.error(`AI Pipeline: Submission ${submissionId} not found — aborting.`);
      return;
    }

    const content = submission.sanitizedContent || submission.content || '';
    const title = submission.title || '';

    // ─────────────────────────────────────────────────────
    // STEP 1 — Safety Scanner (runs FIRST, synchronous gate)
    // ─────────────────────────────────────────────────────
    logger.info('AI Pipeline: Step 1 — Safety scan');
    const safetyResult = safetyScanner.scan(`${title} ${content}`);

    if (safetyResult.riskLevel === 'blocked') {
      logger.warn(`AI Pipeline: Submission ${submissionId} BLOCKED by safety scanner.`);

      submission.aiAnalysis = {
        grammarScore: 0,
        toneScore: 0,
        correctedText: null,
        diffSummary: 'Blocked by safety scanner.',
        shortSummary: null,
        teaserParagraph: null,
        suggestedCategory: submission.category,
        riskLevel: 'blocked',
        riskScore: safetyResult.riskScore,
        flaggedKeywords: safetyResult.flaggedKeywords,
      };
      submission.status = 'blocked';
      await submission.save();

      // Notify student
      const notifService = getNotificationService();
      if (notifService && notifService.notifyStudentStatusChange) {
        await notifService.notifyStudentStatusChange(
          submission,
          'blocked',
          'Your submission was automatically blocked by the content safety scanner.'
        );
      }

      // Audit log
      const AuditLog = getAuditLog();
      if (AuditLog && AuditLog.logAction) {
        await AuditLog.logAction('AI_BLOCK', 'system', {
          submissionId,
          riskScore: safetyResult.riskScore,
          flaggedKeywords: safetyResult.flaggedKeywords,
        });
      }

      return;
    }

    // ─────────────────────────────────────────────────────
    // STEP 2 — Grammar, Summarization, Categorization (PARALLEL)
    // ─────────────────────────────────────────────────────
    logger.info('AI Pipeline: Step 2 — Running agents in parallel');

    const [grammarResult, summaryResult, categoryResult] = await Promise.allSettled([
      grammarAgent.analyze(content, title),
      summarizationAgent.summarize(content, title),
      categorizationAgent.categorize(content, title, submission.category),
    ]);

    // Extract results with safe defaults
    const grammar = grammarResult.status === 'fulfilled'
      ? grammarResult.value
      : { grammarScore: 50, toneScore: 50, correctedText: content, diffSummary: 'Grammar analysis failed.' };

    const summary = summaryResult.status === 'fulfilled'
      ? summaryResult.value
      : { shortSummary: content.substring(0, 150), teaserParagraph: content.substring(0, 400) };

    const category = categoryResult.status === 'fulfilled'
      ? categoryResult.value
      : { suggestedCategory: submission.category, confidence: 0, scores: {} };

    // Log any agent failures
    if (grammarResult.status === 'rejected') {
      logger.error(`AI Pipeline: Grammar agent failed — ${grammarResult.reason}`);
    }
    if (summaryResult.status === 'rejected') {
      logger.error(`AI Pipeline: Summarization agent failed — ${summaryResult.reason}`);
    }
    if (categoryResult.status === 'rejected') {
      logger.error(`AI Pipeline: Categorization agent failed — ${categoryResult.reason}`);
    }

    // ─────────────────────────────────────────────────────
    // STEP 3 — Update MongoDB with full aiAnalysis
    // ─────────────────────────────────────────────────────
    logger.info('AI Pipeline: Step 3 — Saving analysis results');

    submission.aiAnalysis = {
      grammarScore: grammar.grammarScore,
      toneScore: grammar.toneScore,
      correctedText: grammar.correctedText || null,
      diffSummary: grammar.diffSummary || null,
      shortSummary: summary.shortSummary || null,
      teaserParagraph: summary.teaserParagraph || null,
      suggestedCategory: category.suggestedCategory || submission.category,
      riskLevel: safetyResult.riskLevel,
      riskScore: safetyResult.riskScore,
      flaggedKeywords: safetyResult.flaggedKeywords || [],
    };

    submission.status = 'needs_review';
    await submission.save();

    // Audit log
    const AuditLog = getAuditLog();
    if (AuditLog && AuditLog.logAction) {
      await AuditLog.logAction('AI_TRIAGE', 'system', {
        submissionId,
        grammarScore: grammar.grammarScore,
        toneScore: grammar.toneScore,
        riskLevel: safetyResult.riskLevel,
        suggestedCategory: category.suggestedCategory,
      });
    }

    logger.info(
      `AI Pipeline: Completed for ${submissionId} — ` +
      `grammar=${grammar.grammarScore}, tone=${grammar.toneScore}, ` +
      `risk=${safetyResult.riskLevel}, category=${category.suggestedCategory}`
    );
  } catch (error) {
    // ─────────────────────────────────────────────────────
    // CATCH ALL — the pipeline never throws to the caller
    // ─────────────────────────────────────────────────────
    logger.error(`AI Pipeline: Unhandled error for ${submissionId}: ${error.message}`);
    if (error.stack) logger.error(error.stack);

    // Best-effort: set status to needs_review so it doesn't get stuck
    try {
      const Submission = getSubmission();
      if (Submission) {
        await Submission.findByIdAndUpdate(submissionId, {
          status: 'needs_review',
          aiAnalysis: {
            grammarScore: 0,
            toneScore: 0,
            riskLevel: 'flagged',
            riskScore: 20,
            flaggedKeywords: ['pipeline_error'],
            diffSummary: 'AI pipeline encountered an error — manual review required.',
          },
        });
      }
    } catch (updateErr) {
      logger.error(`AI Pipeline: Failed to update submission on error: ${updateErr.message}`);
    }
  }
};

module.exports = { processSubmission };
