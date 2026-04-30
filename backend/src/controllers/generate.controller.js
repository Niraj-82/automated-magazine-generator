// src/controllers/generate.controller.js
// ─────────────────────────────────────────────────────────
// Controller for magazine generation & PDF download.
// ─────────────────────────────────────────────────────────
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');
const { generateMagazinePDF } = require('../services/pdf.generator.service');

const outputsDir = path.join(__dirname, '..', '..', 'public', 'generated');

/**
 * POST /api/generate
 * Trigger magazine PDF generation.
 */
const generate = async (req, res) => {
  try {
    const { 
      title, department, volume, year, templateId, themeColor, institution, 
      principalMessage, principalName, principalPhoto,
      hodMessage, hodName, hodPhoto,
      achievements
    } = req.body;

    logger.info(`Generate request by ${req.user.name || req.user.id}: title="${title}", dept="${department}"`);

    const result = await generateMagazinePDF({
      title: title || 'Tech Odyssey 2026',
      department: department || 'College',
      volume: volume || 'Vol. XII',
      year: year || '2026',
      templateId: templateId || null,
      themeColor,
      institution,
      principalMessage,
      principalName,
      principalPhoto,
      hodMessage,
      hodName,
      hodPhoto,
      achievements: achievements || []
    });

    // Audit log
    try {
      const { AuditLog } = require('../models/sql');
      if (AuditLog && AuditLog.logAction) {
        await AuditLog.logAction('MAGAZINE_GENERATE', req.user.id, {
          filename: result.filename,
          articleCount: result.articleCount,
        }, req.ip);
      }
    } catch (auditErr) {
      logger.warn(`Generate audit log failed: ${auditErr.message}`);
    }

    return res.status(200).json({
      success: true,
      data: {
        filename: result.filename,
        pageCount: result.pageCount,
        articleCount: result.articleCount,
        downloadUrl: `/api/generate/download/${result.filename}`,
      },
      message: 'Magazine PDF generated successfully.',
    });
  } catch (error) {
    logger.error(`Generate controller error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate magazine PDF.',
    });
  }
};

/**
 * GET /api/generate/download/:filename
 * Download a previously generated PDF.
 *
 * Security: reject filename if it contains ".." or "/" or
 * does not end with ".pdf".
 */
const downloadPDF = async (req, res) => {
  try {
    const { filename } = req.params;

    // ── Path traversal prevention ────────────────────────
    if (
      !filename ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\') ||
      !filename.endsWith('.pdf')
    ) {
      logger.warn(`Download rejected — invalid filename: "${filename}"`);
      return res.status(400).json({
        success: false,
        error: 'Invalid filename. Must be a .pdf file with no path separators.',
      });
    }

    // Double-check: resolve and verify path is inside outputsDir
    const filePath = path.join(outputsDir, filename);
    const resolvedPath = path.resolve(filePath);
    const resolvedOutputsDir = path.resolve(outputsDir);

    if (!resolvedPath.startsWith(resolvedOutputsDir)) {
      logger.warn(`Download rejected — path traversal attempt: "${filename}"`);
      return res.status(400).json({ success: false, error: 'Invalid filename.' });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ success: false, error: 'PDF file not found.' });
    }

    // Audit log
    try {
      const { AuditLog } = require('../models/sql');
      if (AuditLog && AuditLog.logAction) {
        await AuditLog.logAction('PDF_DOWNLOAD', req.user.id, { filename }, req.ip);
      }
    } catch (auditErr) {
      logger.warn(`Download audit log failed: ${auditErr.message}`);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(resolvedPath);
  } catch (error) {
    logger.error(`Download controller error: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to download PDF.' });
  }
};

/**
 * GET /api/generate/history
 * List all previously generated PDFs.
 */
const getHistory = async (_req, res) => {
  try {
    if (!fs.existsSync(outputsDir)) {
      return res.status(200).json({ success: true, data: [] });
    }
    const files = fs.readdirSync(outputsDir)
      .filter(f => f.endsWith('.pdf'))
      .map(f => {
        const stat = fs.statSync(path.join(outputsDir, f));
        return { filename: f, size: stat.size, createdAt: stat.birthtime };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      data: files.map(f => ({
        filename: f.filename,
        size: f.size,
        sizeFormatted: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
        createdAt: f.createdAt,
        downloadUrl: `/api/generate/download/${f.filename}`,
      })),
    });
  } catch (error) {
    logger.error(`History controller error: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to fetch generation history.' });
  }
};

module.exports = {
  generate,
  downloadPDF,
  getHistory,
};
