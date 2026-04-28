// backend/src/services/pdf.generator.service.js
// ZEPHYR-Style Magazine PDF Layout Engine
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { Submission } = require('../models/mongo');
const logger = require('../config/logger');

const OUTPUT_DIR = path.join(__dirname, '../../public/generated');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Layout template definitions ──────────────────────────────────────────────
const LAYOUTS = {
  two_column:      { label: '2-Column Tech Article',    cols: 2, pullQuote: true },
  single_column:   { label: 'Single Column Feature',    cols: 1, pullQuote: false },
  photo_left:      { label: 'Photo Left Feature',       cols: 2, photoSide: 'left' },
  photo_right:     { label: 'Photo Right Feature',      cols: 2, photoSide: 'right' },
  full_bleed:      { label: 'Full-Bleed Cover',         cols: 1, fullBleed: true },
  pull_quote_hero: { label: 'Pull-Quote Hero',          cols: 1, pullQuote: true, hero: true },
};

const CATEGORY_ACCENT = {
  technical:    '#6366F1',
  sports:       '#06B6D4',
  cultural:     '#F59E0B',
  academic:     '#8B5CF6',
  achievements: '#10B981',
  department:   '#64748B',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wordCount(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function excerpt(text = '', words = 40) {
  return text.trim().split(/\s+/).slice(0, words).join(' ') + (wordCount(text) > words ? '…' : '');
}

function chunkParagraphs(text = '') {
  return text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
}

// ── Per-article article HTML fragment ────────────────────────────────────────
function buildArticleHTML(sub, layoutKey = 'single_column', accent = '#6366F1') {
  const layout = LAYOUTS[layoutKey] || LAYOUTS.single_column;
  const paras = chunkParagraphs(sub.content || '');
  const half = Math.ceil(paras.length / 2);
  const col1 = paras.slice(0, half);
  const col2 = paras.slice(half);
  const pullQuotePara = paras[Math.floor(paras.length / 3)] || paras[0] || '';
  const pullQuoteText = pullQuotePara.trim().split(/\s+/).slice(0, 20).join(' ');

  const parasHTML = (arr) => arr.map(p =>
    `<p class="article-para">${escapeHtml(p)}</p>`
  ).join('');

  let bodyHTML = '';

  if (layout.fullBleed) {
    bodyHTML = `
      <div class="full-bleed-hero" style="background:${accent}18; border-left:4px solid ${accent}; padding:1.5rem; margin-bottom:1rem; border-radius:4px;">
        <p class="hero-lead" style="font-size:1.05rem; font-weight:600; color:${accent}; margin:0 0 0.75rem;">${escapeHtml(excerpt(sub.content, 30))}</p>
      </div>
      <div class="article-body">${parasHTML(paras)}</div>`;
  } else if (layout.pullQuote && layout.hero) {
    bodyHTML = `
      <div class="article-body">${parasHTML(col1)}</div>
      <blockquote class="pull-quote" style="border-left:4px solid ${accent}; background:${accent}10; padding:1rem 1.5rem; margin:1.25rem 0; border-radius:4px;">
        <span class="pq-text" style="font-size:1.1rem; font-style:italic; color:${accent}; line-height:1.6;">"${escapeHtml(pullQuoteText)}…"</span>
        <div class="pq-attribution" style="font-size:0.75rem; color:#64748B; margin-top:0.5rem;">— ${escapeHtml(sub.authorName)}</div>
      </blockquote>
      <div class="article-body">${parasHTML(col2)}</div>`;
  } else if (layout.cols === 2) {
    bodyHTML = `
      <div class="two-col-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
        <div class="col">${parasHTML(col1)}</div>
        <div class="col">
          ${layout.pullQuote ? `
          <blockquote class="pull-quote" style="border-left:4px solid ${accent}; background:${accent}10; padding:0.75rem 1rem; margin:0 0 1rem; border-radius:4px; font-style:italic; color:${accent}; font-size:0.95rem;">"${escapeHtml(pullQuoteText)}…"</blockquote>` : ''}
          ${parasHTML(col2)}
        </div>
      </div>`;
  } else {
    bodyHTML = `<div class="article-body">${parasHTML(paras)}</div>`;
  }

  return `
    <article class="magazine-article" style="margin-bottom:2.5rem; page-break-inside:avoid;">
      <!-- Article header -->
      <div class="article-header" style="border-left:5px solid ${accent}; padding-left:1rem; margin-bottom:1rem;">
        <div class="article-category" style="font-size:0.65rem; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; color:${accent}; margin-bottom:0.25rem;">
          ${escapeHtml(sub.category || 'general')}
        </div>
        <h2 class="article-title" style="font-size:1.25rem; font-weight:800; color:#0F172A; margin:0 0 0.25rem; line-height:1.25;">
          ${escapeHtml(sub.title)}
        </h2>
        <div class="article-meta" style="font-size:0.7rem; color:#64748B; display:flex; gap:1rem; flex-wrap:wrap;">
          <span>✦ ${escapeHtml(sub.authorName)}</span>
          ${sub.authorRoll ? `<span>Roll: ${escapeHtml(sub.authorRoll)}</span>` : ''}
          ${sub.department ? `<span>${escapeHtml(sub.department)}</span>` : ''}
          <span>${wordCount(sub.content)} words</span>
        </div>
      </div>
      <!-- AI summary teaser -->
      ${sub.aiAnalysis?.teaserParagraph ? `
        <div class="article-teaser" style="background:${accent}08; border-radius:4px; padding:0.6rem 0.9rem; margin-bottom:0.9rem; font-size:0.8rem; color:#475569; font-style:italic; border:1px solid ${accent}20;">
          ${escapeHtml(sub.aiAnalysis.teaserParagraph)}
        </div>` : ''}
      <!-- Article body -->
      <div class="article-content" style="font-size:0.82rem; line-height:1.7; color:#1E293B;">
        ${bodyHTML}
      </div>
      ${sub.aiAnalysis ? `
        <div class="article-scores" style="display:flex; gap:1rem; margin-top:0.75rem; padding-top:0.5rem; border-top:1px solid #E2E8F0;">
          <span style="font-size:0.65rem; color:#94A3B8;">Grammar: <strong style="color:${accent};">${sub.aiAnalysis.grammarScore}%</strong></span>
          <span style="font-size:0.65rem; color:#94A3B8;">Tone: <strong style="color:${accent};">${sub.aiAnalysis.toneScore}%</strong></span>
        </div>` : ''}
    </article>`;
}

// ── Section divider ───────────────────────────────────────────────────────────
function buildSectionDivider(title, accent = '#6366F1') {
  return `
    <div class="section-divider" style="display:flex; align-items:center; gap:1rem; margin:2rem 0 1.25rem; page-break-before:always;">
      <div style="flex:1; height:2px; background:linear-gradient(90deg,${accent},transparent);"></div>
      <h2 style="font-size:1rem; font-weight:700; color:${accent}; text-transform:uppercase; letter-spacing:0.15em; white-space:nowrap; margin:0;">${escapeHtml(title)}</h2>
      <div style="flex:1; height:2px; background:linear-gradient(270deg,${accent},transparent);"></div>
    </div>`;
}

// ── Table of contents ─────────────────────────────────────────────────────────
function buildTOC(groupedArticles) {
  const rows = Object.entries(groupedArticles).map(([cat, articles]) => {
    const accent = CATEGORY_ACCENT[cat] || '#6366F1';
    return `
      <div style="margin-bottom:0.6rem;">
        <div style="font-size:0.65rem; font-weight:700; text-transform:uppercase; color:${accent}; margin-bottom:0.25rem; letter-spacing:0.1em;">${escapeHtml(cat)}</div>
        ${articles.map(a => `
          <div style="display:flex; justify-content:space-between; padding:0.2rem 0; border-bottom:1px dotted #E2E8F0; font-size:0.78rem; color:#475569;">
            <span>${escapeHtml(a.title)}</span>
            <span style="color:#94A3B8; font-size:0.7rem;">${escapeHtml(a.authorName)}</span>
          </div>`).join('')}
      </div>`;
  }).join('');

  return `
    <div class="toc-section" style="margin-bottom:2rem; padding:1.25rem; background:#F8FAFC; border-radius:8px; border:1px solid #E2E8F0;">
      <h2 style="font-size:0.85rem; font-weight:700; color:#0F172A; margin:0 0 1rem; text-transform:uppercase; letter-spacing:0.12em;">Table of Contents</h2>
      ${rows}
    </div>`;
}

// ── Cover page HTML ───────────────────────────────────────────────────────────
function buildCoverHTML(config) {
  const { title, department, volume, year, submissionCount, approvedCount } = config;
  return `
    <div class="cover-page" style="
      min-height:100vh; display:flex; flex-direction:column;
      justify-content:center; align-items:center;
      background:linear-gradient(135deg,#0F172A 0%,#1E293B 60%,#0F172A 100%);
      page-break-after:always; position:relative; overflow:hidden; padding:4rem 3rem;
    ">
      <!-- Background decorative shapes -->
      <div style="position:absolute; top:-80px; right:-80px; width:400px; height:400px; border-radius:50%; background:rgba(99,102,241,0.12); pointer-events:none;"></div>
      <div style="position:absolute; bottom:-60px; left:-60px; width:300px; height:300px; border-radius:50%; background:rgba(6,182,212,0.08); pointer-events:none;"></div>

      <!-- Institute name -->
      <div style="text-align:center; margin-bottom:2.5rem;">
        <div style="font-size:0.7rem; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:#94A3B8; margin-bottom:0.5rem;">
          Fr. C. Rodrigues Institute of Technology
        </div>
        <div style="font-size:0.65rem; letter-spacing:0.15em; color:#64748B; text-transform:uppercase;">
          Vashi, Navi Mumbai · ${escapeHtml(department || 'Computer Engineering')}
        </div>
      </div>

      <!-- Magazine logo / icon -->
      <div style="margin-bottom:1.5rem;">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="80" height="80" rx="20" fill="rgba(99,102,241,0.15)" stroke="#6366F1" stroke-width="1.5"/>
          <rect x="12" y="12" width="30" height="56" rx="4" fill="rgba(99,102,241,0.3)"/>
          <rect x="46" y="12" width="22" height="56" rx="4" fill="rgba(6,182,212,0.2)"/>
          <rect x="16" y="20" width="22" height="3" rx="1.5" fill="#6366F1" opacity="0.8"/>
          <rect x="16" y="27" width="18" height="2" rx="1" fill="#6366F1" opacity="0.4"/>
          <rect x="16" y="33" width="20" height="2" rx="1" fill="#6366F1" opacity="0.4"/>
        </svg>
      </div>

      <!-- Title -->
      <h1 style="font-size:3.5rem; font-weight:900; text-align:center; line-height:1.05; margin:0 0 0.5rem; letter-spacing:-0.02em;
        background:linear-gradient(135deg,#6366F1,#06B6D4);
        -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">
        ${escapeHtml(title || 'Tech Odyssey')}
      </h1>
      <div style="font-size:1.5rem; font-weight:300; color:#94A3B8; text-align:center; margin-bottom:2rem;">
        ${escapeHtml(year || new Date().getFullYear().toString())} Edition
      </div>

      <!-- Divider line -->
      <div style="width:120px; height:2px; background:linear-gradient(90deg,transparent,#6366F1,transparent); margin-bottom:2rem;"></div>

      <!-- Volume + stats -->
      <div style="display:flex; gap:2.5rem; justify-content:center; margin-bottom:2.5rem;">
        ${[
          { label: 'Volume', value: volume || 'Vol. XII' },
          { label: 'Articles', value: String(approvedCount || 0) },
          { label: 'Year', value: String(year || new Date().getFullYear()) },
        ].map(s => `
          <div style="text-align:center;">
            <div style="font-size:1.6rem; font-weight:800; color:#F1F5F9;">${escapeHtml(s.value)}</div>
            <div style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.12em; color:#64748B; margin-top:0.25rem;">${escapeHtml(s.label)}</div>
          </div>`).join('')}
      </div>

      <!-- Bottom bar -->
      <div style="position:absolute; bottom:0; left:0; right:0; height:4px; background:linear-gradient(90deg,#6366F1,#06B6D4,#8B5CF6);"></div>
      <div style="position:absolute; bottom:1rem; left:0; right:0; text-align:center; font-size:0.6rem; color:#475569; letter-spacing:0.1em; text-transform:uppercase;">
        AI-Powered Editorial Pipeline · Tech Odyssey ${escapeHtml(String(year || new Date().getFullYear()))}
      </div>
    </div>`;
}

// ── Full magazine HTML ────────────────────────────────────────────────────────
function buildMagazineHTML(submissions, config) {
  const approved = submissions.filter(s => s.status === 'approved');

  // Group by category
  const grouped = {};
  const catOrder = ['technical', 'academic', 'achievements', 'sports', 'cultural', 'department'];
  catOrder.forEach(cat => { grouped[cat] = []; });
  approved.forEach(sub => {
    const cat = sub.category || 'department';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(sub);
  });
  // Remove empty categories
  Object.keys(grouped).forEach(k => { if (!grouped[k].length) delete grouped[k]; });

  const categoryLabels = {
    technical: 'Technical Articles',
    academic: 'Academic Excellence',
    achievements: 'Achievements & Awards',
    sports: 'Sports & Fitness',
    cultural: 'Cultural Events',
    department: 'Department News',
  };

  let sectionsHTML = '';
  Object.entries(grouped).forEach(([cat, articles]) => {
    const accent = CATEGORY_ACCENT[cat] || '#6366F1';
    sectionsHTML += buildSectionDivider(categoryLabels[cat] || cat, accent);
    articles.forEach(sub => {
      const layoutKey = sub.labOverrideTemplate || sub.chosenTemplate || 'single_column';
      sectionsHTML += buildArticleHTML(sub, layoutKey, accent);
    });
  });

  const approvedCount = approved.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(config.title || 'Tech Odyssey')} ${escapeHtml(String(config.year || ''))}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif;
      background: #ffffff;
      color: #1E293B;
      line-height: 1.6;
      font-size: 14px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: 'Space Grotesk', 'Plus Jakarta Sans', sans-serif;
    }

    .page-wrapper {
      max-width: 210mm;
      margin: 0 auto;
      padding: 12mm 14mm;
    }

    .magazine-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #6366F1;
      margin-bottom: 1.5rem;
    }

    .mag-header-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #6366F1;
    }

    .mag-header-meta {
      font-size: 0.65rem;
      color: #94A3B8;
    }

    .article-para {
      margin-bottom: 0.7rem;
      text-align: justify;
      hyphens: auto;
    }

    .toc-section { break-inside: avoid; }
    .magazine-article { break-inside: avoid; }

    .magazine-footer {
      text-align: center;
      font-size: 0.6rem;
      color: #94A3B8;
      padding-top: 1rem;
      border-top: 1px solid #E2E8F0;
      margin-top: 2rem;
    }

    @page {
      size: A4;
      margin: 15mm 14mm;
    }

    @media print {
      .cover-page { page-break-after: always; }
      .section-divider { page-break-before: always; }
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  ${buildCoverHTML({ ...config, approvedCount })}

  <!-- INNER PAGES -->
  <div class="page-wrapper">

    <!-- Running header -->
    <div class="magazine-header">
      <span class="mag-header-title">${escapeHtml(config.title || 'Tech Odyssey')} · ${escapeHtml(String(config.year || ''))}</span>
      <span class="mag-header-meta">${escapeHtml(config.volume || '')} · ${escapeHtml(config.department || 'Computer Engineering')}</span>
    </div>

    <!-- Table of Contents -->
    ${buildTOC(grouped)}

    <!-- Article sections -->
    ${sectionsHTML}

    <!-- Footer -->
    <div class="magazine-footer">
      <p>Fr. C. Rodrigues Institute of Technology · Vashi, Navi Mumbai · ${escapeHtml(String(config.year || new Date().getFullYear()))}</p>
      <p style="margin-top:0.25rem;">Generated by Tech Odyssey AI Editorial Pipeline &middot; ${approvedCount} articles</p>
    </div>

  </div>
</body>
</html>`;
}

// ── PDF generation entry point ────────────────────────────────────────────────
async function generateMagazinePDF(config = {}) {
  const {
    title = 'Tech Odyssey',
    department = 'Computer Engineering',
    volume = 'Vol. XII',
    year = String(new Date().getFullYear()),
    templateId,
  } = config;

  // Fetch approved submissions from MongoDB
  let submissions = [];
  try {
    submissions = await Submission.find({ status: 'approved' }).lean();
  } catch (err) {
    logger.error('PDF: Failed to fetch submissions: ' + err.message);
  }

  const html = buildMagazineHTML(submissions, { title, department, volume, year, templateId });

  // Launch puppeteer and render PDF
  let browser;
  try {
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
    const filename = `tech_odyssey_${year}_${timestamp}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '14mm', right: '14mm' },
      displayHeaderFooter: false,
    });

    logger.info(`PDF generated: ${filename} (${submissions.length} submissions)`);
    return { filename, path: outputPath };

  } catch (err) {
    logger.error('PDF generation failed: ' + err.message);
    throw err;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  generateMagazinePDF,
  buildMagazineHTML,   // exposed for tests / preview endpoint
  buildArticleHTML,
  LAYOUTS,
};
