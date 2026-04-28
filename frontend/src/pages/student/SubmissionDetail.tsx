// src/pages/student/SubmissionDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Submission, SubmissionStatus } from '../../types';
import { submissionService, getErrorMessage } from '../../services/api';
import { SkeletonText } from '../../components/ui/SkeletonLoader';

const statusCfg: Record<SubmissionStatus, { label: string; color: string; bg: string; icon: string }> = {
  draft: { label: 'Draft', color: 'var(--text-muted)', bg: 'rgba(100,116,139,0.2)', icon: '○' },
  ai_triage: { label: 'AI Review', color: 'var(--status-flagged)', bg: 'var(--status-flagged-bg)', icon: '◑' },
  needs_review: { label: 'Faculty Review', color: 'var(--status-review)', bg: 'var(--status-review-bg)', icon: '◐' },
  approved: { label: 'Approved', color: 'var(--status-clean)', bg: 'var(--status-clean-bg)', icon: '●' },
  rejected: { label: 'Rejected', color: 'var(--status-blocked)', bg: 'var(--status-blocked-bg)', icon: '✕' },
  blocked: { label: 'Blocked', color: 'var(--status-blocked)', bg: 'var(--status-blocked-bg)', icon: '✕' },
};

const Ring: React.FC<{ score: number; label: string; color: string; size?: number }> = ({ score, label, color, size = 80 }) => {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="4" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${dash} ${c}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color }}>{score}</div>
      </div>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
    </div>
  );
};

const SubmissionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sub, setSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await submissionService.getById(id);
        if (res.data.data) { setSub(res.data.data); setEditContent(res.data.data.content); setEditTitle(res.data.data.title); }
      } catch (err) { setError(getErrorMessage(err)); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!sub) return;
    setSaving(true);
    try {
      const res = await submissionService.update(sub._id, { title: editTitle, content: editContent });
      if (res.data.data) setSub(res.data.data);
      setEditing(false);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="page-enter" style={{ maxWidth: 900, padding: '2rem' }}>
      <div className="skeleton" style={{ width: '40%', height: 28, borderRadius: '8px', marginBottom: '1rem' }} />
      <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: '12px', marginBottom: '1rem' }} />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%' }} />
        <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%' }} />
        <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%' }} />
      </div>
    </div>
  );

  if (error || !sub) return (
    <div className="page-enter" style={{ maxWidth: 600, margin: '4rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>◈</div>
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>{error || 'Submission not found'}</h2>
      <button className="btn-secondary" onClick={() => navigate('/student')} style={{ cursor: 'none', marginTop: '1rem' }}>← Back to Dashboard</button>
    </div>
  );

  const sc = statusCfg[sub.status];
  const canEdit = sub.status === 'draft' || sub.status === 'rejected';

  return (
    <div className="page-enter" style={{ maxWidth: 900 }}>
      {/* Back nav */}
      <button className="btn-secondary" onClick={() => navigate('/student')} style={{ cursor: 'none', marginBottom: '1.5rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
        ← Back
      </button>

      {/* Header card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            {editing ? (
              <input type="text" className="input-field" value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }} />
            ) : (
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>{sub.title}</h1>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="badge" style={{ background: sc.bg, color: sc.color }}>{sc.icon} {sc.label}</span>
              <span className="badge badge-indigo">{sub.category}</span>
              <span className="badge badge-draft">v{sub.version}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {new Date(sub.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          {canEdit && !editing && (
            <button className="btn-primary" onClick={() => setEditing(true)} style={{ cursor: 'none' }}>✎ Edit</button>
          )}
          {editing && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ cursor: 'none' }}>{saving ? '...' : '✓ Save'}</button>
              <button className="btn-secondary" onClick={() => { setEditing(false); setEditContent(sub.content); setEditTitle(sub.title); }} style={{ cursor: 'none' }}>Cancel</button>
            </div>
          )}
        </div>

        {/* Author info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-indigo-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>
            {sub.authorName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{sub.authorName}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub.authorRoll} · {sub.department}</div>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      {sub.aiAnalysis && (
        <div className="card fade-in-up" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--accent-indigo)' }}>◉ AI Analysis</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <Ring score={sub.aiAnalysis.grammarScore} label="Grammar" color={sub.aiAnalysis.grammarScore > 85 ? 'var(--status-clean)' : 'var(--status-flagged)'} />
            <Ring score={sub.aiAnalysis.toneScore} label="Tone" color={sub.aiAnalysis.toneScore > 80 ? 'var(--status-clean)' : 'var(--status-flagged)'} />
            <Ring score={100 - sub.aiAnalysis.riskScore} label="Safety" color={sub.aiAnalysis.riskLevel === 'clean' ? 'var(--status-clean)' : 'var(--status-blocked)'} />
          </div>
          {sub.aiAnalysis.shortSummary && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', borderLeft: '2px solid var(--accent-indigo)' }}>
              <strong style={{ color: 'var(--accent-indigo)' }}>Summary: </strong>{sub.aiAnalysis.shortSummary}
            </div>
          )}
          {sub.aiAnalysis.suggestedCategory && sub.aiAnalysis.suggestedCategory !== sub.category && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--status-flagged)' }}>
              ⚠ AI suggests category: <strong>{sub.aiAnalysis.suggestedCategory}</strong>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="card fade-in-up" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1rem' }}>Article Content</h3>
        {editing ? (
          <textarea className="input-field" value={editContent} onChange={e => setEditContent(e.target.value)} style={{ minHeight: 300 }} />
        ) : (
          <div style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{sub.content}</div>
        )}
      </div>

      {/* Faculty comment */}
      {sub.facultyComment && (
        <div className="card fade-in-up" style={{ marginBottom: '1.5rem', borderLeft: '3px solid var(--accent-indigo)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-indigo)' }}>Faculty Comment</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{sub.facultyComment}</p>
        </div>
      )}

      {/* Version history accordion */}
      <div className="card fade-in-up">
        <button data-hoverable onClick={() => setHistoryOpen(!historyOpen)}
          style={{ width: '100%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'none', padding: 0, color: 'var(--text-primary)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>Version History</h3>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', transition: 'transform 0.2s', transform: historyOpen ? 'rotate(90deg)' : 'rotate(0)' }}>›</span>
        </button>
        {historyOpen && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array.from({ length: sub.version }).map((_, i) => {
              const v = sub.version - i;
              const isCurrent = v === sub.version;
              return (
                <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', background: isCurrent ? 'var(--accent-indigo-glow)' : 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: `1px solid ${isCurrent ? 'rgba(99,102,241,0.3)' : 'var(--border-subtle)'}` }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isCurrent ? 'var(--accent-indigo)' : 'var(--text-muted)' }}>v{v}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>{isCurrent ? 'Current version' : 'Previous version'}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(new Date(sub.createdAt).getTime() + (v - 1) * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionDetail;
