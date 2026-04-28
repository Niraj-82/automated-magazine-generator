// src/pages/faculty/FacultyDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Submission, SubmissionStatus, ContentCategory } from '../../types';
import { submissionService } from '../../services/api';
import { SkeletonStatCard, SkeletonRow } from '../../components/ui/SkeletonLoader';

const categoryColors: Record<ContentCategory, string> = {
  technical: 'var(--accent-indigo)', sports: 'var(--accent-cyan)',
  cultural: 'var(--status-flagged)', academic: 'var(--status-review)',
  achievements: 'var(--status-clean)', department: 'var(--text-muted)',
};

const statusCfg: Record<SubmissionStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'var(--text-muted)', bg: 'rgba(100,116,139,0.2)' },
  ai_triage: { label: 'AI Triage', color: 'var(--status-flagged)', bg: 'var(--status-flagged-bg)' },
  needs_review: { label: 'Needs Review', color: 'var(--status-review)', bg: 'var(--status-review-bg)' },
  approved: { label: 'Approved', color: 'var(--status-clean)', bg: 'var(--status-clean-bg)' },
  rejected: { label: 'Rejected', color: 'var(--status-blocked)', bg: 'var(--status-blocked-bg)' },
  blocked: { label: 'Blocked', color: 'var(--status-blocked)', bg: 'var(--status-blocked-bg)' },
};

const demoSubs: Submission[] = [
  { _id:'d1',title:'Quantum Computing Fundamentals',content:'Quantum computing exploration...',category:'technical',status:'needs_review',authorId:'stu_002',authorName:'Priya Menon',authorRoll:'TE-CE-018',department:'Computer Engineering',attachments:[],version:1,createdAt:new Date(Date.now()-6*3600000).toISOString(),updatedAt:new Date(Date.now()-3600000).toISOString(),aiAnalysis:{grammarScore:91,toneScore:87,riskLevel:'clean',riskScore:3}},
  { _id:'d2',title:'Annual Cultural Fest',content:'A grand celebration...',category:'cultural',status:'needs_review',authorId:'stu_003',authorName:'Rohan Patil',authorRoll:'TE-CE-027',department:'Computer Engineering',attachments:[],version:2,createdAt:new Date(Date.now()-2*86400000).toISOString(),updatedAt:new Date(Date.now()-4*3600000).toISOString(),aiAnalysis:{grammarScore:84,toneScore:79,riskLevel:'clean',riskScore:7}},
  { _id:'d3',title:'Sports Day Champions',content:'Athletics domination...',category:'sports',status:'ai_triage',authorId:'stu_005',authorName:'Amit Desai',authorRoll:'TE-CE-009',department:'Computer Engineering',attachments:[],version:1,createdAt:new Date(Date.now()-3*86400000).toISOString(),updatedAt:new Date(Date.now()-86400000).toISOString(),aiAnalysis:{grammarScore:78,toneScore:82,riskLevel:'clean',riskScore:5}},
  { _id:'d4',title:'Blockchain in Supply Chain',content:'Smart contracts...',category:'technical',status:'approved',authorId:'stu_006',authorName:'Kavya Rao',authorRoll:'TE-CE-055',department:'Computer Engineering',attachments:[],version:3,createdAt:new Date(Date.now()-7*86400000).toISOString(),updatedAt:new Date(Date.now()-3*86400000).toISOString(),aiAnalysis:{grammarScore:97,toneScore:95,riskLevel:'clean',riskScore:0},facultyComment:'Excellent.'},
  { _id:'d5',title:'Neural Networks Research',content:'Lightweight architectures...',category:'academic',status:'approved',authorId:'stu_004',authorName:'Sneha Joshi',authorRoll:'TE-CE-031',department:'Computer Engineering',attachments:[],version:2,createdAt:new Date(Date.now()-5*86400000).toISOString(),updatedAt:new Date(Date.now()-2*86400000).toISOString(),aiAnalysis:{grammarScore:95,toneScore:92,riskLevel:'clean',riskScore:1}},
];

function timeAgo(d: string): string {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await submissionService.getAll({ limit: 50 });
        const d = res.data.data;
        setSubs(d && d.data && d.data.length > 0 ? d.data : demoSubs);
      } catch { setSubs(demoSubs); }
      finally { setLoading(false); }
    })();
  }, []);

  if (!user) return null;

  const pending = subs.filter(s => s.status === 'needs_review').length;
  const approved = subs.filter(s => s.status === 'approved').length;
  const avg = subs.length ? Math.round(subs.reduce((a, s) => a + (s.aiAnalysis?.grammarScore || 0), 0) / subs.length) : 0;
  const catCounts: Record<string, number> = {};
  subs.forEach(s => { catCounts[s.category] = (catCounts[s.category] || 0) + 1; });
  const maxCat = Math.max(1, ...Object.values(catCounts));
  const recent = [...subs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
  const pendingItems = subs.filter(s => s.status === 'needs_review' || s.status === 'ai_triage').slice(0, 5);
  const stats = [
    { label: 'Total', value: subs.length, color: 'var(--accent-cyan)', icon: '◈' },
    { label: 'Pending', value: pending, color: 'var(--status-flagged)', icon: '◑' },
    { label: 'Approved', value: approved, color: 'var(--status-clean)', icon: '●' },
    { label: 'Avg Score', value: `${avg}%`, color: 'var(--accent-indigo)', icon: '◉' },
  ];

  return (
    <div className="page-enter" style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-xl)', padding: '1.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.25rem' }}>Faculty Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Welcome back, {user.name} · Editorial overview</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/faculty/review')} style={{ cursor: 'none' }}>◈ Review Queue →</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />) : stats.map((s, i) => (
          <div key={s.label} className={`stat-card fade-in-up fade-in-delay-${i + 1}`} style={{ borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: s.color }}>{s.icon}</span>
              <span className="stat-label">{s.label}</span>
            </div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Category chart */}
          <div className="card fade-in-up fade-in-delay-2">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1.25rem' }}>Submissions by Category</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 32, borderRadius: '8px' }} />) :
                Object.entries(catCounts).map(([cat, cnt]) => {
                  const c = categoryColors[cat as ContentCategory] || 'var(--text-muted)';
                  const w = Math.max(8, (cnt / maxCat) * 100);
                  return (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: 90, textTransform: 'capitalize' }}>{cat}</span>
                      <div style={{ flex: 1, position: 'relative', height: 28 }}>
                        <div style={{ width: `${w}%`, height: '100%', background: c, borderRadius: '6px', opacity: 0.2, position: 'absolute' }} />
                        <div style={{ width: `${w}%`, height: '100%', background: `linear-gradient(90deg,${c},transparent)`, borderRadius: '6px', opacity: 0.6, position: 'absolute', transition: 'width 1s ease' }} />
                        <div style={{ position: 'absolute', top: '50%', left: `calc(${w}% + 8px)`, transform: 'translateY(-50%)', fontSize: '0.78rem', fontWeight: 700, color: c }}>{cnt}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Pending review */}
          <div className="card fade-in-up fade-in-delay-3">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>Pending Review</h3>
              <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', cursor: 'none' }} onClick={() => navigate('/faculty/review')}>View All →</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {loading ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} columns={2} />) :
                pendingItems.length === 0 ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pending reviews 🎉</div> :
                pendingItems.map(sub => {
                  const sc = statusCfg[sub.status];
                  return (
                    <div key={sub._id} data-hoverable onClick={() => navigate('/faculty/review')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', cursor: 'none', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-indigo-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-indigo)', flexShrink: 0 }}>
                        {sub.authorName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub.authorName} · {new Date(sub.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                      </div>
                      <span className="badge" style={{ background: sc.bg, color: sc.color, fontSize: '0.68rem' }}>{sc.label}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="card fade-in-up fade-in-delay-3" style={{ position: 'sticky', top: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1.25rem' }}>Recent Activity</h3>
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="skeleton" style={{ width: '80%', height: 14, borderRadius: '4px', marginBottom: '0.4rem' }} />
              <div className="skeleton" style={{ width: '50%', height: 10, borderRadius: '4px' }} />
            </div>
          )) : recent.length === 0 ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No activity</div> :
            recent.map((sub, i) => {
              const sc = statusCfg[sub.status];
              return (
                <div key={sub._id} style={{ padding: '0.85rem 0', borderBottom: i < recent.length - 1 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0.2rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
                    {i < recent.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--border-subtle)', marginTop: '0.25rem' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, marginBottom: '0.2rem', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 600 }}>{sub.authorName}</span> submitted <span style={{ color: 'var(--accent-indigo)' }}>{sub.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge" style={{ background: sc.bg, color: sc.color, fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>{sc.label}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{timeAgo(sub.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
