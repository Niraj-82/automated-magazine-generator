// src/pages/lab/LabDashboard.tsx
import React, { useState, useEffect } from 'react';
import { TemplateConfig } from '../../types';
import { templateService, generateService, getErrorMessage } from '../../services/api';
import toast from 'react-hot-toast';

const templates: (TemplateConfig & { preview: string })[] = [
  {
    _id: 't1', name: '2-Column Tech Article', description: 'Professional two-column layout for technical articles with pull quotes', thumbnail: '', layout: 'two_column', sections: [], preview: '2col',
  },
  {
    _id: 't2', name: 'Achievement Gallery', description: 'Grid-based layout for student achievements and award photos', thumbnail: '', layout: 'gallery', sections: [], preview: 'gallery',
  },
  {
    _id: 't3', name: 'Cover Page', description: 'Full-bleed cover with large headline and feature image', thumbnail: '', layout: 'cover', sections: [], preview: 'cover',
  },
  {
    _id: 't4', name: 'Single Column Feature', description: 'Clean single-column for long-form articles and editorials', thumbnail: '', layout: 'single_column', sections: [], preview: 'single',
  },
  {
    _id: 't5', name: 'Academic Honours', description: 'Structured layout for department rankings and toppers list', thumbnail: '', layout: 'achievement', sections: [], preview: 'academic',
  },
];

const stats = [
  { label: 'Total Submissions', value: 47, color: '#06B6D4' },
  { label: 'Approved', value: 32, color: '#10B981' },
  { label: 'Pending Review', value: 9, color: '#F59E0B' },
  { label: 'Completion', value: '68%', color: '#6366F1' },
];

const generationSteps = [
  { id: 'layout', label: 'Applying Layout Templates', icon: '⊞' },
  { id: 'format', label: 'Formatting Text Content', icon: '◈' },
  { id: 'images', label: 'Sizing & Placing Images', icon: '⊡' },
  { id: 'export', label: 'Exporting to PDF', icon: '◎' },
];

type GenStatus = 'idle' | 'running' | 'done' | 'error';

const LabDashboard: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('t1');
  const [genStatus, setGenStatus] = useState<GenStatus>('idle');
  const [genStep, setGenStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'generate' | 'users' | 'logs'>('generate');
  const [templateList, setTemplateList] = useState<(TemplateConfig & { preview: string })[]>(templates);
  const [downloadFile, setDownloadFile] = useState<string | null>(null);

  // Fetch templates from API
  useEffect(() => {
    (async () => {
      try {
        const res = await templateService.getAll();
        const d = res.data.data;
        if (d && d.length > 0) {
          setTemplateList(d.map(t => ({ ...t, preview: t.layout === 'two_column' ? '2col' : t.layout === 'gallery' ? 'gallery' : t.layout === 'cover' ? 'cover' : 'single' })));
        }
      } catch { /* keep default templates */ }
    })();
  }, []);

  const startGeneration = async () => {
    setGenStatus('running');
    setGenStep(0);
    setDownloadFile(null);

    // Try real API generation
    try {
      const sel = templateList.find(t => t._id === selectedTemplate);
      const genPromise = generateService.generate({
        templateId: selectedTemplate,
        title: 'Tech Odyssey 2026',
        department: 'Computer Engineering',
        volume: 'Vol. XII',
        year: '2026',
      });

      // Animate steps while waiting
      for (let i = 0; i < generationSteps.length; i++) {
        setGenStep(i);
        await new Promise((r) => setTimeout(r, 1800));
      }

      try {
        const res = await genPromise;
        if (res.data.data?.filename) setDownloadFile(res.data.data.filename);
      } catch { /* demo mode — no real PDF */ }
    } catch {
      for (let i = 0; i < generationSteps.length; i++) {
        setGenStep(i);
        await new Promise((r) => setTimeout(r, 1800));
      }
    }
    setGenStatus('done');
  };

  const handleDownload = async () => {
    if (!downloadFile) {
      toast.success('PDF generated (demo mode)');
      return;
    }
    try {
      const res = await generateService.download(downloadFile);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = downloadFile; a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="page-enter" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          Lab Assistant Workspace
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Magazine generation · Template management · System administration
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {stats.map((s, i) => (
          <div key={s.label} className={`stat-card fade-in-up fade-in-delay-${i + 1}`} style={{ borderTop: `3px solid ${s.color}` }}>
            <span className="stat-label">{s.label}</span>
            <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
        {[
          { id: 'generate', label: '✦ Generate', icon: '✦' },
          { id: 'users', label: '◉ Users', icon: '◉' },
          { id: 'logs', label: '▤ Logs', icon: '▤' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--accent-indigo)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left: Template selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>Select Layout Template</h2>
              <span className="badge badge-indigo">{templates.length} templates</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {templateList.map((t) => (
                <div
                  key={t._id}
                  data-hoverable
                  onClick={() => setSelectedTemplate(t._id)}
                  style={{
                    background: selectedTemplate === t._id ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)',
                    border: `1.5px solid ${selectedTemplate === t._id ? 'var(--accent-indigo)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem',
                    cursor: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedTemplate === t._id ? 'var(--shadow-glow)' : 'none',
                  }}
                >
                  {/* Template wireframe preview */}
                  <TemplateWireframe type={t.preview} active={selectedTemplate === t._id} />

                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.75rem', marginBottom: '0.25rem' }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {t.description}
                  </div>

                  {selectedTemplate === t._id && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--accent-indigo)' }}>
                      ● Selected
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Generation panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Live PDF preview mock */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>Live Preview</h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  {templates.find((t) => t._id === selectedTemplate)?.name}
                </span>
              </div>

              <div
                style={{
                  background: 'white',
                  borderRadius: 'var(--radius-sm)',
                  aspectRatio: '3/4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <PDFPreview templateId={selectedTemplate} />
              </div>
            </div>

            {/* Magazine config */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Edition Config
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label className="label">Magazine Title</label>
                  <input type="text" className="input-field" defaultValue="Tech Odyssey 2026" style={{ fontSize: '0.875rem' }} />
                </div>
                <div>
                  <label className="label">Department</label>
                  <select className="input-field" style={{ fontSize: '0.875rem' }}>
                    <option>Computer Engineering</option>
                    <option>Information Technology</option>
                    <option>Electronics</option>
                    <option>All Departments</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <label className="label">Volume</label>
                    <input type="text" className="input-field" defaultValue="Vol. XII" style={{ fontSize: '0.875rem' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Year</label>
                    <input type="text" className="input-field" defaultValue="2026" style={{ fontSize: '0.875rem' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Generation status */}
            {genStatus !== 'idle' && (
              <div className="card fade-in">
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', marginBottom: '1rem', color: genStatus === 'done' ? '#10B981' : 'var(--accent-indigo)' }}>
                  {genStatus === 'done' ? '✓ Generation Complete!' : '◉ Generating Magazine...'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {generationSteps.map((step, i) => {
                    const done = genStatus === 'done' || i < genStep;
                    const active = i === genStep && genStatus === 'running';
                    return (
                      <div
                        key={step.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.6rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: done ? 'var(--status-clean-bg)' : active ? 'var(--accent-indigo-glow)' : 'var(--bg-secondary)',
                          transition: 'all 0.4s ease',
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', color: done ? '#10B981' : active ? 'var(--accent-indigo)' : 'var(--text-muted)' }}>
                          {done ? '✓' : active ? step.icon : '○'}
                        </span>
                        <span style={{ fontSize: '0.82rem', color: done ? '#10B981' : active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {step.label}
                        </span>
                        {active && (
                          <span style={{ marginLeft: 'auto', width: 14, height: 14, border: '2px solid rgba(99,102,241,0.3)', borderTop: '2px solid var(--accent-indigo)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {genStatus === 'done' && (
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', cursor: 'none' }} onClick={handleDownload}>
                      ↓ Download PDF
                    </button>
                    <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', cursor: 'none' }} onClick={() => { setGenStatus('idle'); setGenStep(0); setDownloadFile(null); }}>
                      ↺ Regenerate
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* BIG generate button */}
            {genStatus === 'idle' && (
              <button
                className="btn-glow"
                onClick={startGeneration}
                style={{ width: '100%', padding: '1.1rem', fontSize: '1rem', borderRadius: 'var(--radius-lg)' }}
              >
                ◎ Orchestrate &amp; Generate PDF
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'logs' && <SystemLogs />}
    </div>
  );
};

// ── Template wireframe SVG previews ──
const TemplateWireframe: React.FC<{ type: string; active: boolean }> = ({ type, active }) => {
  const col = active ? '#6366F1' : '#334155';
  const col2 = active ? '#4f52b0' : '#2D3F55';
  const bg = active ? '#1a1b3a' : '#111827';

  if (type === '2col') return (
    <svg viewBox="0 0 100 130" width="100%" height="80" style={{ display: 'block' }}>
      <rect width="100" height="130" fill={bg} rx="2" />
      <rect x="4" y="4" width="92" height="24" fill={col} rx="1" opacity="0.7" />
      <rect x="4" y="32" width="44" height="60" fill={col2} rx="1" />
      <rect x="52" y="32" width="44" height="60" fill={col2} rx="1" />
      <rect x="4" y="98" width="60" height="4" fill={col} rx="1" opacity="0.5" />
      <rect x="4" y="106" width="40" height="4" fill={col2} rx="1" />
    </svg>
  );
  if (type === 'gallery') return (
    <svg viewBox="0 0 100 130" width="100%" height="80" style={{ display: 'block' }}>
      <rect width="100" height="130" fill={bg} rx="2" />
      <rect x="4" y="4" width="92" height="16" fill={col} rx="1" opacity="0.7" />
      {[0,1,2,3,5,6,7,8].map((i) => (
        <rect key={i} x={4 + (i % 4) * 24} y={24 + Math.floor(i / 4) * 24} width="20" height="20" fill={col2} rx="1" />
      ))}
      <rect x="4" y="96" width="92" height="10" fill={col} rx="1" opacity="0.4" />
    </svg>
  );
  if (type === 'cover') return (
    <svg viewBox="0 0 100 130" width="100%" height="80" style={{ display: 'block' }}>
      <rect width="100" height="130" fill={col} rx="2" opacity="0.3" />
      <rect x="0" y="0" width="100" height="130" fill={bg} rx="2" />
      <rect x="4" y="4" width="92" height="70" fill={col} rx="1" opacity="0.4" />
      <rect x="10" y="80" width="80" height="12" fill={col} rx="1" opacity="0.9" />
      <rect x="10" y="96" width="55" height="6" fill={col2} rx="1" />
      <rect x="10" y="106" width="40" height="4" fill={col2} rx="1" opacity="0.5" />
    </svg>
  );
  return (
    <svg viewBox="0 0 100 130" width="100%" height="80" style={{ display: 'block' }}>
      <rect width="100" height="130" fill={bg} rx="2" />
      <rect x="10" y="4" width="80" height="16" fill={col} rx="1" opacity="0.8" />
      <rect x="10" y="24" width="80" height="6" fill={col2} rx="1" />
      <rect x="10" y="34" width="80" height="6" fill={col2} rx="1" />
      <rect x="10" y="44" width="60" height="6" fill={col2} rx="1" />
      <rect x="10" y="56" width="80" height="30" fill={col} rx="1" opacity="0.3" />
      <rect x="10" y="92" width="80" height="6" fill={col2} rx="1" />
      <rect x="10" y="102" width="55" height="6" fill={col2} rx="1" />
    </svg>
  );
};

// ── PDF live preview mock ──
const PDFPreview: React.FC<{ templateId: string }> = ({ templateId }) => {
  const colors = { header: '#6366F1', line: '#e8e8e8', block: '#f0f0f0', text: '#888' };
  return (
    <svg viewBox="0 0 210 297" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="210" height="297" fill="white" />
      {/* Header */}
      <rect x="0" y="0" width="210" height="32" fill={colors.header} />
      <text x="105" y="21" textAnchor="middle" fontSize="11" fill="white" fontWeight="700" fontFamily="sans-serif">
        TECH ODYSSEY 2026
      </text>
      {/* Body depends on template */}
      {templateId === 't1' ? (
        <>
          <rect x="10" y="42" width="90" height="110" fill={colors.block} rx="2" />
          <rect x="110" y="42" width="90" height="110" fill={colors.block} rx="2" />
          <rect x="10" y="162" width="190" height="8" fill={colors.line} rx="1" />
          <rect x="10" y="175" width="150" height="6" fill={colors.line} rx="1" />
          <rect x="10" y="186" width="170" height="6" fill={colors.line} rx="1" />
        </>
      ) : templateId === 't2' ? (
        <>
          {[0,1,2,3,4,5].map((i) => (
            <rect key={i} x={10 + (i % 3) * 65} y={45 + Math.floor(i / 3) * 70} width="58" height="60" fill={colors.block} rx="2" />
          ))}
        </>
      ) : templateId === 't3' ? (
        <>
          <rect x="10" y="42" width="190" height="140" fill={colors.block} rx="2" />
          <rect x="20" y="192" width="170" height="16" fill={colors.header} rx="2" opacity="0.7" />
          <rect x="20" y="215" width="120" height="8" fill={colors.line} rx="1" />
          <rect x="20" y="228" width="90" height="6" fill={colors.line} rx="1" />
        </>
      ) : (
        <>
          <rect x="20" y="45" width="170" height="12" fill={colors.header} rx="2" opacity="0.8" />
          <rect x="20" y="64" width="170" height="6" fill={colors.line} rx="1" />
          <rect x="20" y="75" width="140" height="6" fill={colors.line} rx="1" />
          <rect x="20" y="86" width="160" height="6" fill={colors.line} rx="1" />
          <rect x="20" y="100" width="170" height="80" fill={colors.block} rx="2" />
          <rect x="20" y="188" width="170" height="6" fill={colors.line} rx="1" />
          <rect x="20" y="199" width="120" height="6" fill={colors.line} rx="1" />
        </>
      )}
      {/* Footer */}
      <rect x="0" y="285" width="210" height="12" fill={colors.header} opacity="0.15" />
      <text x="105" y="294" textAnchor="middle" fontSize="6" fill={colors.text} fontFamily="sans-serif">
        Fr. C. Rodrigues Institute of Technology · Vashi, Navi Mumbai
      </text>
    </svg>
  );
};

// ── User Management stub ──
const UserManagement: React.FC = () => {
  const users = [
    { name: 'Arjun Sharma', roll: 'TE-CE-042', role: 'student', status: 'active', submissions: 3 },
    { name: 'Priya Menon', roll: 'TE-CE-018', role: 'student', status: 'active', submissions: 2 },
    { name: 'Prof. Meera Nair', roll: '—', role: 'faculty', status: 'active', submissions: 0 },
    { name: 'Rohan Patil', roll: 'TE-CE-027', role: 'student', status: 'active', submissions: 2 },
    { name: 'Sneha Joshi', roll: 'TE-CE-031', role: 'student', status: 'active', submissions: 1 },
  ];
  const roleColors: Record<string, string> = { student: '#06B6D4', faculty: '#6366F1', lab_assistant: '#8B5CF6' };

  return (
    <div className="card" style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>User Management</h2>
        <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>+ Add User</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {users.map((u) => (
          <div key={u.roll} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${roleColors[u.role]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: roleColors[u.role], flexShrink: 0 }}>
              {u.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{u.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.roll}</div>
            </div>
            <span className="badge" style={{ background: `${roleColors[u.role]}15`, color: roleColors[u.role], fontSize: '0.7rem' }}>
              {u.role}
            </span>
            {u.submissions > 0 && <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>{u.submissions} articles</span>}
            <button style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.3rem 0.6rem', color: 'var(--text-muted)', cursor: 'none', fontSize: '0.75rem' }}>
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── System Logs stub ──
const SystemLogs: React.FC = () => {
  const logs = [
    { time: '14:32:01', action: 'LOGIN', user: 'arjun.sharma@fcrit.ac.in', entity: 'AUTH', status: 'success' },
    { time: '14:33:44', action: 'UPLOAD', user: 'arjun.sharma@fcrit.ac.in', entity: 'submission:s_new', status: 'success' },
    { time: '14:33:45', action: 'AI_TRIAGE', user: 'system', entity: 'submission:s_new', status: 'success' },
    { time: '14:35:11', action: 'LOGIN', user: 'prof.meera@fcrit.ac.in', entity: 'AUTH', status: 'success' },
    { time: '14:37:02', action: 'APPROVE', user: 'prof.meera@fcrit.ac.in', entity: 'submission:f5', status: 'success' },
    { time: '14:40:19', action: 'LOGIN_FAIL', user: 'unknown@test.com', entity: 'AUTH', status: 'error' },
    { time: '14:41:00', action: 'RATE_LIMIT', user: '192.168.1.45', entity: 'API:/upload', status: 'warning' },
  ];

  const statusColors: Record<string, string> = { success: '#10B981', error: '#F43F5E', warning: '#F59E0B' };

  return (
    <div className="card" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>Audit Logs</h2>
        <span className="badge badge-draft" style={{ fontSize: '0.7rem' }}>Last 24h · {logs.length} entries</span>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {logs.map((log, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', borderLeft: `2px solid ${statusColors[log.status]}` }}>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{log.time}</span>
            <span style={{ color: statusColors[log.status], fontWeight: 700, minWidth: 90, flexShrink: 0 }}>{log.action}</span>
            <span style={{ color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.user}</span>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{log.entity}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LabDashboard;
