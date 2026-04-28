// src/pages/student/StudentDashboard.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Submission, ContentCategory, SubmissionStatus } from '../../types';
import { submissionService } from '../../services/api';
import { SkeletonGrid } from '../../components/ui/SkeletonLoader';

// ── Mock submissions for demo ──
const mockSubmissions: Submission[] = [
  {
    _id: 's1',
    title: 'Machine Learning in Healthcare',
    content: 'AI is revolutionizing diagnostic medicine...',
    category: 'technical',
    status: 'approved',
    authorId: 'stu_001',
    authorName: 'Arjun Sharma',
    authorRoll: 'TE-CE-042',
    department: 'Computer Engineering',
    attachments: [],
    version: 2,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    aiAnalysis: { grammarScore: 92, toneScore: 88, riskLevel: 'clean', riskScore: 5 },
  },
  {
    _id: 's2',
    title: 'Inter-College Hackathon Report',
    content: 'Our team participated in HackFest 2025...',
    category: 'achievements',
    status: 'ai_triage',
    authorId: 'stu_001',
    authorName: 'Arjun Sharma',
    authorRoll: 'TE-CE-042',
    department: 'Computer Engineering',
    attachments: [],
    version: 1,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    aiAnalysis: { grammarScore: 75, toneScore: 70, riskLevel: 'clean', riskScore: 12 },
  },
  {
    _id: 's3',
    title: 'Annual Sports Day Highlights',
    content: 'The annual sports day was a grand success...',
    category: 'sports',
    status: 'needs_review',
    authorId: 'stu_001',
    authorName: 'Arjun Sharma',
    authorRoll: 'TE-CE-042',
    department: 'Computer Engineering',
    attachments: [],
    version: 1,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const statusConfig: Record<SubmissionStatus, { label: string; color: string; bg: string; icon: string }> = {
  draft: { label: 'Draft', color: 'var(--text-muted)', bg: 'rgba(100,116,139,0.2)', icon: '○' },
  ai_triage: { label: 'AI Review', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: '◑' },
  needs_review: { label: 'Faculty Review', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: '◐' },
  approved: { label: 'Approved', color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: '●' },
  rejected: { label: 'Rejected', color: '#F43F5E', bg: 'rgba(244,63,94,0.12)', icon: '✕' },
  blocked: { label: 'Blocked', color: '#F43F5E', bg: 'rgba(244,63,94,0.12)', icon: '✕' },
};

const categories: ContentCategory[] = ['technical', 'sports', 'cultural', 'academic', 'achievements', 'department'];

const deadline = new Date('2026-06-15');
const today = new Date();
const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / 86400000));
const totalDays = 90;
const progressPct = Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'submit'>('dashboard');
  const [form, setForm] = useState({ title: '', content: '', category: 'technical' as ContentCategory });
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<null | 'uploading' | 'ai_triage' | 'done'>(null);
  const [files, setFiles] = useState<File[]>([]);

  // Fetch submissions from API, fallback to demo data
  useEffect(() => {
    (async () => {
      setLoadingSubs(true);
      try {
        const res = await submissionService.getAll({ limit: 50 });
        const d = res.data.data;
        if (d && d.data && d.data.length > 0) { setSubmissions(d.data); }
        else { setSubmissions(mockSubmissions); }
      } catch { setSubmissions(mockSubmissions); }
      finally { setLoadingSubs(false); }
    })();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => ['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const valid = Array.from(e.target.files).filter((f) =>
        ['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)
      );
      setFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    setSubmitStep('uploading');

    try {
      // Build FormData for API submission
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('category', form.category);
      files.forEach(f => formData.append('attachments', f));

      let newSub: Submission | null = null;
      try {
        const res = await submissionService.create(formData);
        newSub = res.data.data || null;
      } catch {
        // Demo fallback if API unavailable
      }

      setSubmitStep('ai_triage');
      await new Promise((r) => setTimeout(r, 1800));
      setSubmitStep('done');

      if (!newSub) {
        newSub = {
          _id: `s${Date.now()}`, title: form.title, content: form.content,
          category: form.category, status: 'ai_triage', authorId: user!.id,
          authorName: user!.name, authorRoll: user!.rollNumber || '',
          department: user!.department || '', attachments: [], version: 1,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          aiAnalysis: { grammarScore: 82, toneScore: 78, riskLevel: 'clean', riskScore: 8 },
        };
      }

      await new Promise((r) => setTimeout(r, 800));
      setSubmissions((prev) => [newSub!, ...prev]);
    } catch { /* silently fail */ }
    finally {
      setForm({ title: '', content: '', category: 'technical' });
      setFiles([]);
      setSubmitting(false);
      setSubmitStep(null);
      setActiveView('dashboard');
    }
  };

  if (!user) return null;

  return (
    <div className="page-enter" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(99,102,241,0.1))',
            border: '1px solid rgba(6,182,212,0.2)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.75rem 2rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              Hey, {user.name.split(' ')[0]} 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Tech Odyssey 2026 · {user.department} · {user.rollNumber}
            </p>
          </div>

          {/* Deadline progress */}
          <div style={{ minWidth: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Submission Deadline</span>
              <span style={{ color: '#06B6D4', fontWeight: 600 }}>{daysLeft} days left</span>
            </div>
            <div
              style={{
                height: 6,
                background: 'var(--border-subtle)',
                borderRadius: '100px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #06B6D4, #6366F1)',
                  borderRadius: '100px',
                  transition: 'width 1s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'right' }}>
              June 15, 2026
            </div>
          </div>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={activeView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
            onClick={() => setActiveView('dashboard')}
          >
            ◈ Dashboard
          </button>
          <button
            className={activeView === 'submit' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
            onClick={() => setActiveView('submit')}
          >
            ✦ New Submission
          </button>
        </div>
      </div>

      {activeView === 'dashboard' ? (
        <DashboardView submissions={submissions} />
      ) : (
        <SubmitView
          form={form}
          setForm={setForm}
          files={files}
          setFiles={setFiles}
          dragActive={dragActive}
          setDragActive={setDragActive}
          handleDrop={handleDrop}
          handleFileInput={handleFileInput}
          handleSubmit={handleSubmit}
          submitting={submitting}
          submitStep={submitStep}
        />
      )}
    </div>
  );
};

// ── Dashboard view with bento grid ──
const DashboardView: React.FC<{ submissions: Submission[] }> = ({ submissions }) => {
  const approved = submissions.filter((s) => s.status === 'approved').length;
  const inReview = submissions.filter((s) => ['ai_triage', 'needs_review'].includes(s.status)).length;

  return (
    <div>
      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {[
          { label: 'Total Submissions', value: submissions.length, color: '#06B6D4', icon: '◈' },
          { label: 'Approved', value: approved, color: '#10B981', icon: '●' },
          { label: 'In Review', value: inReview, color: '#F59E0B', icon: '◑' },
          { label: 'AI Score Avg', value: '85%', color: '#6366F1', icon: '◉' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`stat-card fade-in-up fade-in-delay-${i + 1}`}
            style={{ borderLeft: `3px solid ${stat.color}` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
            <div className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main bento grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Submissions list */}
        <div className="card fade-in-up fade-in-delay-2">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>My Submissions</h3>
            <span className="badge badge-cyan">{submissions.length} total</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {submissions.map((sub) => {
              const sc = statusConfig[sub.status];
              return (
                <div
                  key={sub._id}
                  data-hoverable
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 0.2s ease',
                    cursor: 'none',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  {/* Category pill */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-indigo-glow)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      flexShrink: 0,
                    }}
                  >
                    {sub.category === 'technical' ? '⚙' :
                     sub.category === 'sports' ? '⚽' :
                     sub.category === 'achievements' ? '★' : '◈'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sub.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(sub.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {sub.aiAnalysis && ` · AI Score: ${sub.aiAnalysis.grammarScore}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <span
                      className="badge"
                      style={{ background: sc.bg, color: sc.color, fontSize: '0.7rem' }}
                    >
                      {sc.icon} {sc.label}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>v{sub.version}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Live Content Health Widget */}
          <div className="card fade-in-up fade-in-delay-3">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1rem' }}>
              Content Health
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {submissions.slice(0, 3).map((sub) => (
                <ContentHealthRing key={sub._id} submission={sub} />
              ))}
            </div>
          </div>

          {/* Quick tips */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.05))',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
            }}
            className="fade-in-up fade-in-delay-4"
          >
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--accent-indigo)' }}>
              ✦ Submission Tips
            </h3>
            {[
              'Articles are auto-reviewed by AI for grammar & tone',
              'Max file size: 10MB per attachment',
              'Accepted formats: PDF, JPG, PNG',
              'Include high-res images for better layouts',
            ].map((tip) => (
              <div key={tip} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--accent-indigo)', flexShrink: 0 }}>›</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Animated content health ring ──
const ContentHealthRing: React.FC<{ submission: Submission }> = ({ submission }) => {
  const sc = statusConfig[submission.status];
  const ringColors: Record<SubmissionStatus, string> = {
    draft: '#64748B',
    ai_triage: '#F59E0B',
    needs_review: '#8B5CF6',
    approved: '#10B981',
    rejected: '#F43F5E',
    blocked: '#F43F5E',
  };
  const color = ringColors[submission.status];
  const score = submission.aiAnalysis?.grammarScore || 0;
  const circumference = 2 * Math.PI * 18;
  const strokeDash = (score / 100) * circumference;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
        <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border-subtle)" strokeWidth="3" />
          <circle
            cx="22" cy="22" r="18" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.6rem',
            fontWeight: 700,
            color,
          }}
        >
          {score || sc.icon}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {submission.title}
        </div>
        <div style={{ fontSize: '0.7rem', color }}>
          {sc.icon} {sc.label}
        </div>
      </div>
    </div>
  );
};

// ── Submission form ──
interface SubmitViewProps {
  form: { title: string; content: string; category: ContentCategory };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  dragActive: boolean;
  setDragActive: React.Dispatch<React.SetStateAction<boolean>>;
  handleDrop: (e: React.DragEvent) => void;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  submitting: boolean;
  submitStep: null | 'uploading' | 'ai_triage' | 'done';
}

const SubmitView: React.FC<SubmitViewProps> = ({
  form, setForm, files, setFiles, dragActive, setDragActive,
  handleDrop, handleFileInput, handleSubmit, submitting, submitStep,
}) => {
  if (submitting) {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: '4rem auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}
        className="fade-in"
      >
        <div style={{ position: 'relative', width: 100, height: 100 }}>
          <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border-subtle)" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke={submitStep === 'done' ? '#10B981' : submitStep === 'ai_triage' ? '#6366F1' : '#F59E0B'}
              strokeWidth="4"
              strokeDasharray={submitStep === 'done' ? '276.5 0' : submitStep === 'ai_triage' ? '180 276.5' : '80 276.5'}
              strokeLinecap="round"
              style={{ transition: 'all 0.8s ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
            }}
          >
            {submitStep === 'done' ? '✓' : submitStep === 'ai_triage' ? '◉' : '↑'}
          </div>
        </div>

        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
            {submitStep === 'uploading' && 'Uploading Content...'}
            {submitStep === 'ai_triage' && 'AI Pipeline Running...'}
            {submitStep === 'done' && 'Submission Complete!'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {submitStep === 'uploading' && 'Securely uploading your files'}
            {submitStep === 'ai_triage' && 'Grammar, tone & safety checks in progress'}
            {submitStep === 'done' && 'Your article is queued for faculty review'}
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
          {[
            { key: 'uploading', label: 'Uploading & validating files' },
            { key: 'ai_triage', label: 'AI Grammar & Tone scan' },
            { key: 'done', label: 'Added to faculty review queue' },
          ].map((step, i) => {
            const stepOrder = ['uploading', 'ai_triage', 'done'];
            const currentIdx = stepOrder.indexOf(submitStep || '');
            const isDone = currentIdx > i;
            const isActive = currentIdx === i;

            return (
              <div
                key={step.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isDone ? 'var(--status-clean-bg)' : isActive ? 'var(--accent-indigo-glow)' : 'var(--bg-card)',
                  border: `1px solid ${isDone ? 'rgba(16,185,129,0.3)' : isActive ? 'rgba(99,102,241,0.3)' : 'var(--border-subtle)'}`,
                }}
              >
                <span style={{ color: isDone ? '#10B981' : isActive ? '#6366F1' : 'var(--text-muted)', fontSize: '1rem' }}>
                  {isDone ? '✓' : isActive ? (
                    <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>◎</span>
                  ) : '○'}
                </span>
                <span style={{ fontSize: '0.85rem', color: isDone ? '#10B981' : isActive ? 'var(--accent-indigo)' : 'var(--text-muted)' }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720 }} className="page-enter">
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>New Submission</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Your article will be automatically scanned by the AI pipeline before faculty review.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="label">Article Title *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter a descriptive title for your article"
              value={form.title}
              onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))}
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select
              className="input-field"
              value={form.category}
              onChange={(e) => setForm((p: any) => ({ ...p, category: e.target.value }))}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Content *</label>
            <textarea
              className="input-field"
              placeholder="Write your article content here. The AI pipeline will check for grammar, tone, and appropriateness..."
              value={form.content}
              onChange={(e) => setForm((p: any) => ({ ...p, content: e.target.value }))}
              required
              style={{ minHeight: 200 }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'right' }}>
              {form.content.length} characters
            </div>
          </div>
        </div>

        {/* File upload */}
        <div
          className={`drop-zone ${dragActive ? 'active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          style={{ position: 'relative' }}
        >
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            onChange={handleFileInput}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'none' }}
          />
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⊞</div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
            {dragActive ? 'Drop files here' : 'Drag & drop files here'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            PDF, JPG, PNG accepted · Max 10MB per file
          </div>

          {files.length > 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {files.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <span>◈</span>
                  <span>{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'none', fontSize: '0.9rem' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI pipeline notice */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            padding: '1rem 1.25rem',
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <span style={{ color: 'var(--accent-indigo)', fontSize: '1.2rem' }}>◉</span>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>AI Editorial Pipeline</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Upon submission, your article will be processed by: Grammar & Tone Agent → Summarization Agent → Auto-Categorization Agent → Safety Scanner
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={() => setForm({ title: '', content: '', category: 'technical' })}>
            Clear
          </button>
          <button type="submit" className="btn-primary" disabled={!form.title || !form.content}>
            ✦ Submit Article
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentDashboard;
