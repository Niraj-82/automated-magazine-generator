const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { Submission } = require('../models/mongo');
const { User } = require('../models/sql');
const logger = require('../config/logger');

const OUTPUT_DIR = path.join(__dirname, '../../public/generated');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function chunkParagraphs(text = '') {
  return text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
}

function buildMagazineHTML(submissions, config, faculty) {
  const { title, tagline, department, institution, hodName, year, volume, templateId, themeColor } = config;
  
  const theme = {
    bg: templateId === 't2' || templateId === 't4' ? '#ffffff' : '#0a0a0a',
    text: templateId === 't2' || templateId === 't4' ? '#111' : '#ffffff',
    accent: templateId === 't2' ? '#4f46e5' : (templateId === 't4' ? '#666' : '#ccc'),
    cardBg: templateId === 't2' || templateId === 't4' ? '#f8fafc' : '#1e1e1e',
    customColor: themeColor || '#ccc'
  };

  // Group submissions
  const grouped = {};
  submissions.forEach(sub => {
    const cat = sub.category || 'department';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(sub);
  });

  const catOrder = ['technical', 'sports', 'cultural', 'academic', 'department', 'achievements'];

  // A. Cover Page
  const coverHTML = `
    <div style="page-break-after:always; position:relative; width:100%; height:100vh; background:#000; overflow:hidden; display:flex; flex-direction:column;">
      <div style="position:absolute; inset:0; background:linear-gradient(135deg, ${theme.customColor}40, #000 80%);"></div>
      <div style="position:absolute; top:2rem; left:2rem; background:rgba(255,255,255,0.1); padding:0.5rem 1rem; border-radius:4px;">
        <span style="color:#fff; font-family:'Space Mono', monospace; font-size:0.8rem; letter-spacing:0.1em;">${escapeHtml(institution)}</span>
      </div>
      <div style="position:absolute; top:2rem; right:2rem;">
        <span style="color:#fff; font-family:'Space Mono', monospace; font-size:0.8rem; font-style:italic;">${escapeHtml(year)}</span>
      </div>
      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:10; padding:4rem;">
        <h1 style="font-family:'Bebas Neue', cursive; font-size:8rem; color:#fff; line-height:0.9; margin:0; text-align:center; letter-spacing:0.02em;">${escapeHtml(title).toUpperCase()}</h1>
        <div style="font-family:'Space Mono', monospace; font-size:1.2rem; color:${theme.customColor}; margin-top:2rem; letter-spacing:0.2em; text-transform:uppercase;">${escapeHtml(volume)}</div>
      </div>
      <div style="position:absolute; bottom:2rem; left:2rem; max-width:50%; z-index:10;">
        <div style="font-family:'Crimson Text', serif; font-size:1.5rem; font-style:italic; color:#ccc;">"${escapeHtml(tagline)}"</div>
      </div>
      <div style="position:absolute; bottom:2rem; right:2rem; text-align:right; z-index:10;">
        <div style="font-family:'Bebas Neue', cursive; font-size:1.5rem; color:#fff; letter-spacing:0.05em;">${escapeHtml(department)}</div>
        <div style="font-family:'Space Mono', monospace; font-size:0.7rem; color:${theme.customColor}; letter-spacing:0.1em; margin-top:0.25rem;">DEPARTMENT BADGE</div>
      </div>
    </div>
  `;

  // B. Table of Contents
  let tocRows = '';
  let sectionIndex = 1;
  catOrder.forEach(cat => {
    if (grouped[cat]) {
      tocRows += `
        <div style="margin-bottom:1.5rem;">
          <div style="font-family:'Bebas Neue', cursive; font-size:1.5rem; color:${theme.customColor}; letter-spacing:0.05em; border-bottom:1px solid #333; padding-bottom:0.25rem; margin-bottom:0.5rem;">
            ${String(sectionIndex).padStart(2, '0')} — ${cat.toUpperCase()}
          </div>
          ${grouped[cat].map(a => `
            <div style="display:flex; justify-content:space-between; font-family:'Space Mono', monospace; font-size:0.8rem; margin-bottom:0.4rem; color:${theme.text}; opacity:0.8;">
              <span>${escapeHtml(a.title)}</span>
            </div>
          `).join('')}
        </div>
      `;
      sectionIndex++;
    }
  });

  const tocHTML = `
    <div style="page-break-after:always; width:100%; height:100vh; display:flex; background:${theme.bg}; color:${theme.text};">
      <div style="flex:0 0 40%; background:#000; padding:4rem 3rem; overflow-y:auto; color:#fff;">
        <h2 style="font-family:'Bebas Neue', cursive; font-size:3.5rem; margin-bottom:3rem; letter-spacing:0.05em; color:#fff;">CONTENTS</h2>
        ${tocRows}
      </div>
      <div style="flex:0 0 60%; background:linear-gradient(45deg, #222, #111); display:flex; align-items:flex-end; padding:2rem;">
        <div style="font-family:'Space Mono', monospace; font-size:0.7rem; color:#888; text-transform:uppercase; letter-spacing:0.2em; transform:rotate(-90deg); transform-origin:left bottom;">Architectural Element</div>
      </div>
    </div>
  `;

  // C. HOD Message
  const hodHTML = `
    <div style="page-break-after:always; width:100%; min-height:100vh; padding:6rem 4rem; background:${theme.bg}; color:${theme.text}; display:flex; align-items:center; gap:4rem;">
      <div style="flex:0 0 35%; display:flex; flex-direction:column; align-items:center;">
        <div style="width:250px; height:250px; border-radius:50%; background:#333; border:4px solid ${theme.customColor}; margin-bottom:2rem;"></div>
        <div style="font-family:'Bebas Neue', cursive; font-size:2rem; letter-spacing:0.05em;">${escapeHtml(hodName)}</div>
        <div style="font-family:'Space Mono', monospace; font-size:0.8rem; color:${theme.customColor}; text-transform:uppercase; margin-top:0.5rem; text-align:center;">Head of Department<br/>${escapeHtml(department)}</div>
      </div>
      <div style="flex:1;">
        <h2 style="font-family:'Crimson Text', serif; font-size:2.5rem; font-style:italic; margin-bottom:2rem; color:${theme.customColor};">Message from the Desk</h2>
        <div style="font-family:'Crimson Text', serif; font-size:1.1rem; line-height:1.8; text-align:justify;">
          <p style="margin-bottom:1rem;">Welcome to the ${escapeHtml(volume)} of ${escapeHtml(title)}. It gives me immense pleasure to present this edition, which reflects the technical prowess, creativity, and dedication of our students and faculty.</p>
          <p style="margin-bottom:1rem;">In an era of rapid technological advancement, it is crucial to stay abreast of the latest developments. This magazine serves as a platform to share knowledge, showcase achievements, and inspire innovation. The diverse range of articles, from deep technical dives to cultural event highlights, is a testament to the holistic development we strive for at ${escapeHtml(institution)}.</p>
          <p style="margin-bottom:1rem;">I commend the editorial team and all contributors for their hard work. May this edition ignite new ideas and encourage continuous learning.</p>
        </div>
      </div>
    </div>
  `;

  // D & E & G. Section Headers and Article Pages
  let bodyHTML = '';
  catOrder.forEach(cat => {
    if (grouped[cat]) {
      // D. Section Header Page
      bodyHTML += `
        <div style="page-break-after:always; width:100%; height:100vh; background:#111; display:flex; justify-content:center; align-items:center; position:relative; overflow:hidden;">
          <div style="position:absolute; inset:0; background:repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px);"></div>
          <h1 style="font-family:'Bebas Neue', cursive; font-size:6rem; color:#fff; letter-spacing:0.15em; text-transform:uppercase; text-align:center; position:relative; z-index:10; border-top:2px solid ${theme.customColor}; border-bottom:2px solid ${theme.customColor}; padding:1rem 4rem;">
            ${escapeHtml(cat)}
          </h1>
        </div>
      `;

      // E. Article Pages / G. Achievements
      if (cat === 'achievements') {
        // G. Achievements Grid
        bodyHTML += `
          <div style="page-break-after:always; width:100%; min-height:100vh; padding:4rem; background:${theme.bg}; color:${theme.text};">
            <h2 style="font-family:'Bebas Neue', cursive; font-size:3rem; margin-bottom:2rem; border-bottom:1px solid #333; padding-bottom:0.5rem;">HALL OF FAME</h2>
            <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:2rem;">
              ${grouped[cat].map(a => `
                <div style="background:${theme.cardBg}; border-radius:8px; overflow:hidden;">
                  <div style="height:200px; background:#333;"></div>
                  <div style="padding:1.5rem;">
                    <h3 style="font-family:'Bebas Neue', cursive; font-size:1.5rem; margin-bottom:0.5rem; letter-spacing:0.02em;">${escapeHtml(a.title)}</h3>
                    <div style="font-family:'Crimson Text', serif; font-size:0.9rem; line-height:1.5; margin-bottom:1rem;">${escapeHtml(a.content.substring(0, 120))}...</div>
                    <div style="font-family:'Space Mono', monospace; font-size:0.7rem; color:${theme.customColor}; text-transform:uppercase;">${escapeHtml(a.authorName)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        // Regular Articles
        grouped[cat].forEach(sub => {
          const layout = sub.labOverrideTemplate || sub.chosenTemplate || 'single_column';
          const paras = chunkParagraphs(sub.content);
          
          let contentHtml = '';
          if (layout === 'two_column') {
            const half = Math.ceil(paras.length / 2);
            contentHtml = `
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem; font-family:'Crimson Text', serif; font-size:1.05rem; line-height:1.7; text-align:justify;">
                <div>${paras.slice(0, half).map(p => `<p style="margin-bottom:1rem;">${escapeHtml(p)}</p>`).join('')}</div>
                <div>${paras.slice(half).map(p => `<p style="margin-bottom:1rem;">${escapeHtml(p)}</p>`).join('')}</div>
              </div>
            `;
          } else if (layout === 'pull_quote_hero') {
            const quote = paras[0] || '';
            const rest = paras.slice(1);
            contentHtml = `
              <div style="font-family:'Crimson Text', serif; font-size:1.05rem; line-height:1.7; text-align:justify; max-width:800px; margin:0 auto;">
                <div style="font-size:1.5rem; font-style:italic; text-align:center; color:${theme.customColor}; margin:2rem 0; padding:2rem; border-top:1px solid #333; border-bottom:1px solid #333;">
                  "${escapeHtml(quote)}"
                </div>
                ${rest.map(p => `<p style="margin-bottom:1rem;">${escapeHtml(p)}</p>`).join('')}
              </div>
            `;
          } else {
            contentHtml = `
              <div style="font-family:'Crimson Text', serif; font-size:1.05rem; line-height:1.7; text-align:justify; max-width:800px; margin:0 auto;">
                ${paras.map(p => `<p style="margin-bottom:1rem;">${escapeHtml(p)}</p>`).join('')}
              </div>
            `;
          }

          bodyHTML += `
            <div style="page-break-after:always; width:100%; min-height:100vh; padding:4rem; background:${theme.bg}; color:${theme.text}; position:relative;">
              <div style="position:absolute; top:4rem; right:4rem; width:120px; height:120px; border-radius:50%; background:${theme.cardBg}; border:2px solid ${theme.customColor}; overflow:hidden; display:flex; justify-content:center; align-items:center;">
                <span style="font-family:'Space Mono', monospace; font-size:0.7rem; color:#888;">PHOTO</span>
              </div>
              
              <div style="font-family:'Space Mono', monospace; font-size:0.8rem; color:${theme.customColor}; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:1rem;">
                ${escapeHtml(cat)}
              </div>
              <h1 style="font-family:'Bebas Neue', cursive; font-size:4rem; line-height:1; margin-bottom:1rem; max-width:70%;">
                ${escapeHtml(sub.title)}
              </h1>
              <div style="font-family:'Space Mono', monospace; font-size:0.8rem; margin-bottom:3rem; padding-bottom:1rem; border-bottom:1px solid #333; display:flex; gap:2rem;">
                <span>BY <span style="color:${theme.customColor};">${escapeHtml(sub.authorName).toUpperCase()}</span></span>
                ${sub.authorRoll ? `<span>ROLL: ${escapeHtml(sub.authorRoll)}</span>` : ''}
              </div>
              
              ${contentHtml}
            </div>
          `;
        });
      }
    }
  });

  // F. Faculty Profiles
  const facultyHTML = `
    <div style="page-break-after:always; width:100%; min-height:100vh; padding:4rem; background:${theme.bg}; color:${theme.text};">
      <h2 style="font-family:'Bebas Neue', cursive; font-size:4rem; margin-bottom:3rem; text-align:center; letter-spacing:0.05em;">OUR MENTORS</h2>
      <div style="display:flex; flex-direction:column; gap:3rem; max-width:800px; margin:0 auto;">
        ${faculty.map((f, i) => `
          <div style="display:flex; align-items:center; gap:2rem; flex-direction:${i % 2 === 0 ? 'row' : 'row-reverse'};">
            <div style="width:150px; height:150px; border-radius:50%; background:#333; border:3px solid ${theme.customColor}; flex-shrink:0;"></div>
            <div style="background:${theme.cardBg}; padding:1.5rem 2rem; border-radius:50px; flex:1; display:flex; flex-direction:column; justify-content:center;">
              <div style="font-family:'Bebas Neue', cursive; font-size:1.8rem; letter-spacing:0.02em; margin-bottom:0.25rem;">${escapeHtml(f.name)}</div>
              <div style="font-family:'Space Mono', monospace; font-size:0.8rem; color:${theme.customColor}; text-transform:uppercase;">${escapeHtml(f.department || department)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // H. Back Cover
  const backCoverHTML = `
    <div style="page-break-after:avoid; width:100%; height:100vh; background:#000; color:#fff; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:4rem;">
      <h2 style="font-family:'Bebas Neue', cursive; font-size:3rem; margin-bottom:1rem; letter-spacing:0.1em;">THANK YOU</h2>
      <div style="width:60px; height:2px; background:${theme.customColor}; margin-bottom:2rem;"></div>
      <div style="font-family:'Crimson Text', serif; font-size:1.2rem; font-style:italic; color:#ccc; max-width:600px; margin-bottom:4rem;">
        To all the contributors, editors, and faculty members who made this edition possible.
      </div>
      <div style="font-family:'Space Mono', monospace; font-size:0.9rem; text-transform:uppercase; letter-spacing:0.2em; color:#888;">
        ${escapeHtml(institution)}
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: A4; margin: 0; }
  </style>
</head>
<body>
  ${coverHTML}
  ${tocHTML}
  ${hodHTML}
  ${bodyHTML}
  ${facultyHTML}
  ${backCoverHTML}
</body>
</html>`;
}

async function generateMagazinePDF(config = {}) {
  const { year = String(new Date().getFullYear()) } = config;

  let submissions = [];
  try {
    submissions = await Submission.find({ status: 'approved' }).lean();
  } catch (err) {
    logger.error('PDF: Failed to fetch submissions: ' + err.message);
  }

  let faculty = [];
  try {
    faculty = await User.findAll({ where: { role: 'faculty', isActive: true }, attributes: ['name', 'department'], raw: true });
  } catch (err) {
    logger.error('PDF: Failed to fetch faculty: ' + err.message);
  }

  const html = buildMagazineHTML(submissions, config, faculty);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
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
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      displayHeaderFooter: false,
    });

    logger.info(`PDF generated: ${filename}`);
    return { filename, path: outputPath };
  } catch (err) {
    logger.error('PDF generation failed: ' + err.message);
    throw err;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

module.exports = {
  generateMagazinePDF,
  buildMagazineHTML,
};
