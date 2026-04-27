// src/services/pdf.generator.service.js
// ─────────────────────────────────────────────────────────
// PDF Generation Engine
//
// 1. Fetch all approved submissions from MongoDB
// 2. Group by category
// 3. Build full HTML document with magazine layout
// 4. Render to PDF via Puppeteer
// 5. Save to outputs/ directory
// ─────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// Ensure outputs directory exists
const outputsDir = path.join(__dirname, '..', '..', 'outputs');
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
}

/**
 * Escape all user content before injecting into HTML — no exceptions.
 */
const escapeHtml = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Category display names and colors.
 */
const CATEGORY_META = {
  technical:    { label: 'Technical',    color: '#6366F1', bg: '#EEF2FF' },
  sports:       { label: 'Sports',       color: '#10B981', bg: '#ECFDF5' },
  cultural:     { label: 'Cultural',     color: '#F59E0B', bg: '#FFFBEB' },
  academic:     { label: 'Academic',     color: '#3B82F6', bg: '#EFF6FF' },
  achievements: { label: 'Achievements', color: '#8B5CF6', bg: '#F5F3FF' },
  department:   { label: 'Department',   color: '#06B6D4', bg: '#ECFEFF' },
};

/**
 * Build the full magazine HTML document.
 */
const buildMagazineHTML = (groupedSubmissions, config = {}) => {
  const title = escapeHtml(config.title || 'Tech Odyssey 2026');
  const volume = escapeHtml(config.volume || 'Vol. XII');
  const year = escapeHtml(config.year || '2026');
  const department = escapeHtml(config.department || 'Computer Engineering');
  const generatedAt = new Date().toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  let articlesHTML = '';
  let articleIndex = 0;

  for (const [category, submissions] of Object.entries(groupedSubmissions)) {
    const meta = CATEGORY_META[category] || CATEGORY_META.technical;

    // Category section header
    articlesHTML += `
      <div class="category-section" style="page-break-before: always;">
        <div class="category-header" style="background: ${meta.bg}; border-left: 5px solid ${meta.color};">
          <h2 style="color: ${meta.color}; margin: 0; font-size: 28px; font-family: 'Georgia', serif;">
            ${escapeHtml(meta.label)}
          </h2>
          <p style="color: #6B7280; margin: 4px 0 0 0; font-size: 13px;">
            ${submissions.length} article${submissions.length !== 1 ? 's' : ''}
          </p>
        </div>
    `;

    for (const sub of submissions) {
      articleIndex++;
      const aiSummary = sub.aiAnalysis?.teaserParagraph || sub.aiAnalysis?.shortSummary || '';

      articlesHTML += `
        <div class="article ${articleIndex % 2 === 0 ? 'article-even' : ''}">
          <div class="article-title-bar">
            <h3 class="article-title">${escapeHtml(sub.title)}</h3>
            <span class="article-category-tag" style="background: ${meta.bg}; color: ${meta.color};">
              ${escapeHtml(meta.label)}
            </span>
          </div>

          <div class="article-meta">
            <span class="author-name">✦ ${escapeHtml(sub.authorName)}</span>
            <span class="author-detail">${escapeHtml(sub.authorRoll || '')} · ${escapeHtml(sub.department || '')}</span>
          </div>

          ${aiSummary ? `
            <div class="teaser-box">
              <em>${escapeHtml(aiSummary)}</em>
            </div>
          ` : ''}

          <div class="article-body">
            ${escapeHtml(sub.sanitizedContent || sub.content || '').replace(/\n/g, '<br/>')}
          </div>

          ${sub.aiAnalysis ? `
            <div class="ai-scores">
              <span class="score-pill" style="background: ${sub.aiAnalysis.grammarScore >= 70 ? '#ECFDF5' : '#FEF2F2'}; color: ${sub.aiAnalysis.grammarScore >= 70 ? '#059669' : '#DC2626'};">
                Grammar: ${sub.aiAnalysis.grammarScore}/100
              </span>
              <span class="score-pill" style="background: ${sub.aiAnalysis.toneScore >= 70 ? '#ECFDF5' : '#FEF2F2'}; color: ${sub.aiAnalysis.toneScore >= 70 ? '#059669' : '#DC2626'};">
                Tone: ${sub.aiAnalysis.toneScore}/100
              </span>
            </div>
          ` : ''}
        </div>
      `;
    }

    articlesHTML += '</div>'; // close category-section
  }

  const totalArticles = Object.values(groupedSubmissions).reduce((sum, arr) => sum + arr.length, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 18mm 25mm 18mm;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.65;
      color: #1F2937;
      background: white;
    }

    /* ── Cover Page ── */
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, #312E81 0%, #1E1B4B 40%, #0F172A 100%);
      color: white;
      page-break-after: always;
      padding: 60px 40px;
      position: relative;
      overflow: hidden;
    }

    .cover-page::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at 30% 70%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
                  radial-gradient(circle at 70% 30%, rgba(6, 182, 212, 0.1) 0%, transparent 50%);
    }

    .cover-title {
      font-size: 52px;
      font-weight: 700;
      letter-spacing: 3px;
      margin-bottom: 12px;
      position: relative;
      text-transform: uppercase;
    }

    .cover-subtitle {
      font-size: 18px;
      font-weight: 400;
      opacity: 0.85;
      margin-bottom: 40px;
      position: relative;
    }

    .cover-line {
      width: 80px;
      height: 3px;
      background: linear-gradient(90deg, #6366F1, #06B6D4);
      margin: 0 auto 30px;
      border-radius: 2px;
      position: relative;
    }

    .cover-info {
      font-size: 13px;
      opacity: 0.7;
      line-height: 1.8;
      position: relative;
    }

    .cover-stats {
      margin-top: 40px;
      display: flex;
      gap: 40px;
      position: relative;
    }

    .cover-stat {
      text-align: center;
    }

    .cover-stat-num {
      font-size: 36px;
      font-weight: 700;
      display: block;
      background: linear-gradient(135deg, #818CF8, #06B6D4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-stat-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.7;
    }

    /* ── Table of Contents ── */
    .toc-page {
      page-break-after: always;
      padding: 40px 0;
    }

    .toc-title {
      font-size: 28px;
      color: #1E1B4B;
      margin-bottom: 30px;
      padding-bottom: 10px;
      border-bottom: 2px solid #6366F1;
    }

    .toc-category {
      margin-bottom: 20px;
    }

    .toc-category-name {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
      padding: 6px 12px;
      border-radius: 4px;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 12px 4px 24px;
      font-size: 12px;
      color: #4B5563;
      border-bottom: 1px dotted #E5E7EB;
    }

    .toc-item-author {
      color: #9CA3AF;
      font-style: italic;
    }

    /* ── Category Header ── */
    .category-header {
      padding: 20px 24px;
      margin: 0 0 24px 0;
      border-radius: 6px;
    }

    /* ── Article ── */
    .article {
      margin-bottom: 36px;
      padding-bottom: 24px;
      border-bottom: 1px solid #E5E7EB;
      page-break-inside: avoid;
    }

    .article-title-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    .article-title {
      font-size: 20px;
      color: #111827;
      font-weight: 700;
      line-height: 1.3;
      flex: 1;
    }

    .article-category-tag {
      font-size: 10px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .article-meta {
      margin-bottom: 14px;
      font-size: 12px;
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .author-name {
      color: #6366F1;
      font-weight: 600;
    }

    .author-detail {
      color: #9CA3AF;
    }

    .teaser-box {
      background: #F8FAFC;
      border-left: 3px solid #6366F1;
      padding: 12px 16px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #4B5563;
      border-radius: 0 6px 6px 0;
      line-height: 1.6;
    }

    .article-body {
      font-size: 12pt;
      line-height: 1.7;
      text-align: justify;
      color: #374151;
    }

    .ai-scores {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .score-pill {
      font-size: 10px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 10px;
    }

    /* ── Footer ── */
    .page-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: #9CA3AF;
      border-top: 1px solid #E5E7EB;
    }

    /* ── Back Cover ── */
    .back-cover {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%);
      color: white;
      page-break-before: always;
    }

    .back-cover h2 {
      font-size: 24px;
      margin-bottom: 16px;
      opacity: 0.9;
    }

    .back-cover p {
      font-size: 13px;
      opacity: 0.6;
      max-width: 400px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <!-- ── COVER PAGE ── -->
  <div class="cover-page">
    <div class="cover-title">${title}</div>
    <div class="cover-line"></div>
    <div class="cover-subtitle">${department} · ${volume} · ${year}</div>
    <div class="cover-info">
      Fr. C. Rodrigues Institute of Technology<br/>
      Vashi, Navi Mumbai<br/>
      Generated on ${escapeHtml(generatedAt)}
    </div>
    <div class="cover-stats">
      <div class="cover-stat">
        <span class="cover-stat-num">${totalArticles}</span>
        <span class="cover-stat-label">Articles</span>
      </div>
      <div class="cover-stat">
        <span class="cover-stat-num">${Object.keys(groupedSubmissions).length}</span>
        <span class="cover-stat-label">Categories</span>
      </div>
    </div>
  </div>

  <!-- ── TABLE OF CONTENTS ── -->
  <div class="toc-page">
    <h1 class="toc-title">Table of Contents</h1>
    ${Object.entries(groupedSubmissions).map(([cat, subs]) => {
      const meta = CATEGORY_META[cat] || CATEGORY_META.technical;
      return `
        <div class="toc-category">
          <div class="toc-category-name" style="background: ${meta.bg}; color: ${meta.color};">
            ${escapeHtml(meta.label)} (${subs.length})
          </div>
          ${subs.map(s => `
            <div class="toc-item">
              <span>${escapeHtml(s.title)}</span>
              <span class="toc-item-author">${escapeHtml(s.authorName)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }).join('')}
  </div>

  <!-- ── ARTICLES ── -->
  ${articlesHTML}

  <!-- ── BACK COVER ── -->
  <div class="back-cover">
    <h2>${title}</h2>
    <p>
      A publication by the students and faculty of
      ${escapeHtml(department)},
      Fr. C. Rodrigues Institute of Technology, Vashi, Navi Mumbai.
    </p>
    <p style="margin-top: 20px; font-size: 11px; opacity: 0.4;">
      Automated Magazine Generator · ${year}
    </p>
  </div>

  <div class="page-footer">
    ${title} · Fr. C. Rodrigues Institute of Technology
  </div>
</body>
</html>`;
};

/**
 * Generate the magazine PDF.
 *
 * @param {Object} config — { title, department, volume, year, templateId }
 * @returns {Promise<{ filename: string, path: string, pageCount: number, articleCount: number }>}
 */
const generateMagazinePDF = async (config = {}) => {
  let browser = null;

  try {
    // ── 1. Fetch approved submissions ────────────────────
    const { Submission } = require('../models/mongo');

    const filter = { status: 'approved' };
    if (config.department && config.department !== 'All Departments') {
      filter.department = config.department;
    }

    const submissions = await Submission.find(filter).sort({ category: 1, createdAt: -1 });

    if (submissions.length === 0) {
      throw new Error('No approved submissions found — cannot generate magazine.');
    }

    logger.info(`PDF Generator: Found ${submissions.length} approved submissions.`);

    // ── 2. Group by category ─────────────────────────────
    const grouped = {};
    const categoryOrder = ['technical', 'academic', 'achievements', 'cultural', 'sports', 'department'];

    for (const sub of submissions) {
      const cat = sub.category || 'technical';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(sub);
    }

    // Sort categories into standard order
    const orderedGroups = {};
    for (const cat of categoryOrder) {
      if (grouped[cat] && grouped[cat].length > 0) {
        orderedGroups[cat] = grouped[cat];
      }
    }
    // Add any remaining categories not in the standard order
    for (const cat of Object.keys(grouped)) {
      if (!orderedGroups[cat]) {
        orderedGroups[cat] = grouped[cat];
      }
    }

    // ── 3. Build HTML ────────────────────────────────────
    const html = buildMagazineHTML(orderedGroups, config);

    // ── 4. Launch Puppeteer and render PDF ────────────────
    const puppeteer = require('puppeteer');

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const timestamp = Date.now();
    const safeDept = (config.department || 'all').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `TechOdyssey_${config.year || '2026'}_${safeDept}_${timestamp}.pdf`;
    const outputPath = path.join(outputsDir, filename);

    const pdfBuffer = await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '18mm', bottom: '25mm', left: '18mm' },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    });

    // Get approximate page count from PDF buffer size
    // (Puppeteer doesn't expose page count directly, but we can estimate)
    const pdfString = pdfBuffer.toString('latin1');
    const pageMatches = pdfString.match(/\/Type\s*\/Page\b/g);
    const pageCount = pageMatches ? pageMatches.length : Math.ceil(submissions.length / 2);

    await browser.close();
    browser = null;

    logger.info(`PDF Generator: Created "${filename}" — ${pageCount} pages, ${submissions.length} articles.`);

    // ── 5. Audit log ─────────────────────────────────────
    try {
      const { AuditLog } = require('../models/sql');
      if (AuditLog && AuditLog.logAction) {
        await AuditLog.logAction('PDF_GENERATE', 'system', {
          filename,
          pageCount,
          articleCount: submissions.length,
        });
      }
    } catch (auditErr) {
      logger.warn(`PDF audit log failed: ${auditErr.message}`);
    }

    return {
      filename,
      path: outputPath,
      pageCount,
      articleCount: submissions.length,
    };
  } catch (error) {
    logger.error(`PDF Generator error: ${error.message}`);
    if (error.stack) logger.error(error.stack);
    throw error; // Let the controller handle the error response
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        logger.warn(`Browser close error: ${closeErr.message}`);
      }
    }
  }
};

/**
 * List all previously generated PDFs.
 *
 * @returns {{ filename: string, size: number, createdAt: Date }[]}
 */
const listGeneratedPDFs = () => {
  try {
    if (!fs.existsSync(outputsDir)) return [];

    const files = fs.readdirSync(outputsDir)
      .filter((f) => f.endsWith('.pdf'))
      .map((f) => {
        const filePath = path.join(outputsDir, f);
        const stats = fs.statSync(filePath);
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.birthtime || stats.mtime,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return files;
  } catch (error) {
    logger.error(`List PDFs error: ${error.message}`);
    return [];
  }
};

module.exports = {
  generateMagazinePDF,
  listGeneratedPDFs,
  escapeHtml,
};
