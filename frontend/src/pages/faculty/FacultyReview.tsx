// src/pages/faculty/FacultyReview.tsx
import React, { useState, useEffect } from 'react';
import { Submission, SubmissionStatus } from '../../types';
import { submissionService } from '../../services/api';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';

const mockArticles: Submission[] = [
  {
    _id: 'f1', title: 'Quantum Computing Fundamentals', content: `Quantum computing represents a fundamentally different paradigm for computation. Unlike classical computers that use bits (0 or 1), quantum computers use qubits which can exist in superposition states. This paper explores how colleges can leverage quantum simulation tools for academic purposes and the implications for the next generation of computer engineers graduating from our department.\n\nThe fundamental principle of quantum superposition allows a qubit to be in both states simultaneously, exponentially increasing processing power for specific problem types. When multiple qubits become entangled, measuring one instantly determines the state of its partner regardless of distance — a phenomenon Einstein called "spooky action at a distance."\n\nFor the college magazine, understanding these concepts helps contextualise why our Computer Engineering department has introduced quantum algorithms as an elective in the final year curriculum.`,
    category: 'technical', status: 'ai_triage', authorId: 'stu_002', authorName: 'Priya Menon', authorRoll: 'TE-CE-018', department: 'Computer Engineering', attachments: [], version: 1,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    aiAnalysis: { grammarScore: 91, toneScore: 87, riskLevel: 'clean', riskScore: 3, shortSummary: 'Explores quantum computing fundamentals and their relevance to college engineering curriculum.', suggestedCategory: 'technical', flaggedKeywords: [] },
  },
  {
    _id: 'f2', title: 'Annual Cultural Fest Retrospective', content: `This year's Techno-Cultural Fest brought together over 1200 students from 15 colleges across Maharashtra. Our college emerged as the overall champions in both technical and cultural categories. The three-day event showcased incredible talent from robotics demonstrations to classical dance performances.\n\nThe highlight of the technical segment was our college's autonomous robot that navigated a complex obstacle course in under 47 seconds, beating the previous record by 12 seconds. The cultural evening featured a fusion performance blending Bharatanatyam with contemporary hip-hop choreography that received a standing ovation from the audience and judges alike.\n\nSpecial mention goes to the organizing committee who worked tirelessly for four months to make this event a grand success. The fest also featured industry stalwarts from Tata Consultancy Services and Infosys who interacted with students about career opportunities.`,
    category: 'cultural', status: 'needs_review', authorId: 'stu_003', authorName: 'Rohan Patil', authorRoll: 'TE-CE-027', department: 'Computer Engineering', attachments: [], version: 2,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    aiAnalysis: { grammarScore: 84, toneScore: 79, riskLevel: 'clean', riskScore: 7, shortSummary: 'Recap of the annual cultural and technical fest with focus on achievements.', suggestedCategory: 'cultural' },
  },
  {
    _id: 'f3', title: 'Student Research: Neural Networks', content: `Our third-year research group has been investigating lightweight neural network architectures for edge devices. The work, conducted under the guidance of Prof. Sharma, resulted in a 40% reduction in model size without significant accuracy loss. This achievement was recognised at the state-level student research symposium.\n\nThe research focused on knowledge distillation techniques where a smaller "student" network is trained to mimic a larger "teacher" network. By applying structured pruning and quantization, the team achieved deployment-ready models suitable for microcontrollers with limited RAM.`,
    category: 'academic', status: 'ai_triage', authorId: 'stu_004', authorName: 'Sneha Joshi', authorRoll: 'TE-CE-031', department: 'Computer Engineering', attachments: [], version: 1,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    aiAnalysis: { grammarScore: 95, toneScore: 92, riskLevel: 'clean', riskScore: 1, shortSummary: 'Student-led research on efficient neural networks for edge deployment.' },
  },
  {
    _id: 'f4', title: 'Sports Day 2025 Champions', content: `The 2025 Annual Sports Day was held on the college grounds with over 800 students participating across 22 events. Computer Engineering dominated the athletics track with four gold medals in the 100m, 400m, relay, and long jump events. The basketball team also clinched the championship for the third consecutive year.\n\nCoach Mehta praised the dedication of the students: "This team trains every morning at 6 AM despite their demanding academic schedule." The trophy cabinet in the CE department now holds the most trophies among all departments in the college.`,
    category: 'sports', status: 'needs_review', authorId: 'stu_005', authorName: 'Amit Desai', authorRoll: 'TE-CE-009', department: 'Computer Engineering', attachments: [], version: 1,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    aiAnalysis: { grammarScore: 78, toneScore: 82, riskLevel: 'clean', riskScore: 5 },
  },
  {
    _id: 'f5', title: 'Blockchain in Supply Chain', content: `Blockchain technology offers unprecedented transparency in supply chain management. Smart contracts automate vendor payments and quality verification without intermediaries. Our final year project demonstrates a proof-of-concept using Ethereum and Solidity to track pharmaceutical supply chains from manufacturer to end consumer, addressing a critical need in post-pandemic healthcare logistics.`, category: 'technical', status: 'approved', authorId: 'stu_006', authorName: 'Kavya Rao', authorRoll: 'TE-CE-055', department: 'Computer Engineering', attachments: [], version: 3,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    aiAnalysis: { grammarScore: 97, toneScore: 95, riskLevel: 'clean', riskScore: 0 },
    facultyComment: 'Excellent technical depth. Approved for featured article slot.',
  },
];

const columns: { id: SubmissionStatus; title: string; color: string; desc: string }[] = [
  { id: 'ai_triage', title: 'AI Triage', color: '#F59E0B', desc: 'Pending AI pipeline output' },
  { id: 'needs_review', title: 'Needs Review', color: '#8B5CF6', desc: 'Ready for faculty reading' },
  { id: 'approved', title: 'Approved', color: '#10B981', desc: 'Cleared for layout' },
];

interface GrammarHighlight {
  word: string;
  type: 'grammar' | 'tone';
}

const highlightText = (text: string, _highlights: GrammarHighlight[]): React.ReactNode => {
  return text;
};

const FacultyReview: React.FC = () => {
  const [articles, setArticles] = useState<Submission[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Submission | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch from API, fallback to mock
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await submissionService.getAll({ limit: 50 });
        const d = res.data.data;
        if (d && d.data && d.data.length > 0) { setArticles(d.data); }
        else { setArticles(mockArticles); }
      } catch { setArticles(mockArticles); }
      finally { setLoading(false); }
    })();
  }, []);

  const grouped = (status: SubmissionStatus) => articles.filter((a) => a.status === status);

  const openDrawer = (article: Submission) => {
    setSelectedArticle(article);
    setComment(article.facultyComment || '');
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedArticle(null), 350);
  };

  const updateStatus = async (id: string, status: SubmissionStatus) => {
    // Optimistic update
    setArticles((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status, facultyComment: comment, updatedAt: new Date().toISOString() } : a))
    );
    closeDrawer();
    // Call API (non-blocking)
    try {
      await submissionService.updateStatus(id, status, comment);
    } catch {
      // Silently fail in demo mode — optimistic update stays
    }
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          Editorial Hub
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Kanban review board · {articles.length} submissions in pipeline
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {columns.map((col) => (
          <div
            key={col.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '100px',
              background: col.color + '15',
              border: `1px solid ${col.color}30`,
              fontSize: '0.85rem',
              color: col.color,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: col.color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              {grouped(col.id).length}
            </span>
            {col.title}
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem', alignItems: 'flex-start' }}>
        {columns.map((col) => (
          <div key={col.id} className="kanban-col">
            <div className="kanban-col-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700 }}>
                    {col.title}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {col.desc}
                </div>
              </div>
              <span
                style={{
                  background: col.color + '20',
                  color: col.color,
                  borderRadius: '100px',
                  padding: '0.15rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {grouped(col.id).length}
              </span>
            </div>

            <div className="kanban-col-body">
              {grouped(col.id).length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '2rem 0' }}>
                  No articles here
                </div>
              )}
              {grouped(col.id).map((article) => (
                <ArticleCard key={article._id} article={article} colColor={col.color} onOpen={openDrawer} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Overlay */}
      {drawerOpen && <div className="drawer-overlay" onClick={closeDrawer} />}

      {/* Side drawer */}
      <div className={`side-drawer ${drawerOpen ? 'open' : ''}`}>
        {selectedArticle && (
          <ArticleDrawer
            article={selectedArticle}
            comment={comment}
            setComment={setComment}
            onClose={closeDrawer}
            onApprove={() => updateStatus(selectedArticle._id, 'approved')}
            onReject={() => updateStatus(selectedArticle._id, 'rejected')}
            onMoveToReview={() => updateStatus(selectedArticle._id, 'needs_review')}
          />
        )}
      </div>
    </div>
  );
};

// ── Kanban Card ──
const ArticleCard: React.FC<{
  article: Submission;
  colColor: string;
  onOpen: (a: Submission) => void;
}> = ({ article, colColor, onOpen }) => {
  const riskColors: Record<string, string> = {
    clean: '#10B981', flagged: '#F59E0B', blocked: '#F43F5E',
  };
  const riskColor = riskColors[article.aiAnalysis?.riskLevel || 'clean'];

  return (
    <div className="kanban-card" onClick={() => onOpen(article)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
        <span
          className="badge"
          style={{
            background: colColor + '15',
            color: colColor,
            fontSize: '0.68rem',
          }}
        >
          {article.category}
        </span>
        {article.aiAnalysis && (
          <span
            style={{
              fontSize: '0.7rem',
              color: riskColor,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            ● {article.aiAnalysis.riskLevel}
          </span>
        )}
      </div>

      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', lineHeight: 1.3 }}>
        {article.title}
      </div>

      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
        {article.content.slice(0, 90)}...
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--accent-indigo-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.6rem',
              fontWeight: 700,
              color: 'var(--accent-indigo)',
            }}
          >
            {article.authorName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>{article.authorName}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{article.authorRoll}</div>
          </div>
        </div>

        {article.aiAnalysis && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Grammar</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: article.aiAnalysis.grammarScore > 85 ? '#10B981' : '#F59E0B' }}>
              {article.aiAnalysis.grammarScore}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>◎</span>
        <span>Click to review</span>
      </div>
    </div>
  );
};

// ── Article Drawer ──
const ArticleDrawer: React.FC<{
  article: Submission;
  comment: string;
  setComment: (v: string) => void;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onMoveToReview: () => void;
}> = ({ article, comment, setComment, onClose, onApprove, onReject, onMoveToReview }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Drawer header */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>
            Article Review
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {article.authorName} · {article.authorRoll}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'none',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
          }}
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
        {/* AI Analysis panel */}
        {article.aiAnalysis && (
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--accent-indigo)' }}>
              ◉ AI Analysis Report
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: article.aiAnalysis.grammarScore > 85 ? '#10B981' : '#F59E0B' }}>
                  {article.aiAnalysis.grammarScore}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Grammar Score</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: article.aiAnalysis.toneScore > 80 ? '#10B981' : '#F59E0B' }}>
                  {article.aiAnalysis.toneScore}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tone Score</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Safety:</span>
              <span
                className="badge"
                style={{
                  background: article.aiAnalysis.riskLevel === 'clean' ? 'var(--status-clean-bg)' : 'var(--status-flagged-bg)',
                  color: article.aiAnalysis.riskLevel === 'clean' ? 'var(--status-clean)' : 'var(--status-flagged)',
                  fontSize: '0.7rem',
                }}
              >
                ● {article.aiAnalysis.riskLevel} (risk: {article.aiAnalysis.riskScore}/100)
              </span>
            </div>

            {article.aiAnalysis.shortSummary && (
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.6rem 0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  borderLeft: '2px solid var(--accent-indigo)',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>AI Summary: </span>
                {article.aiAnalysis.shortSummary}
              </div>
            )}
          </div>
        )}

        {/* Article title */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          {article.title}
        </h2>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <span className="badge badge-indigo">{article.category}</span>
          <span className="badge badge-draft">v{article.version}</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
            {new Date(article.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Article content with text highlights (grammar = yellow, safety = red) */}
        <div
          style={{
            fontSize: '0.875rem',
            lineHeight: 1.8,
            color: 'var(--text-secondary)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.25rem',
            border: '1px solid var(--border-subtle)',
            maxHeight: 300,
            overflow: 'auto',
          }}
        >
          {article.content}
        </div>

        {/* Faculty comment */}
        <div>
          <label className="label">Faculty Comment</label>
          <textarea
            className="input-field"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a review comment for the student..."
            style={{ minHeight: 80 }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '0.75rem',
          flexShrink: 0,
        }}
      >
        {article.status !== 'approved' && (
          <button className="btn-success" onClick={onApprove} style={{ flex: 1, justifyContent: 'center' }}>
            ✓ Approve
          </button>
        )}
        {article.status === 'ai_triage' && (
          <button className="btn-secondary" onClick={onMoveToReview} style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}>
            → Needs Review
          </button>
        )}
        {article.status !== 'rejected' && (
          <button className="btn-danger" onClick={onReject} style={{ flex: 1, justifyContent: 'center' }}>
            ✕ Reject
          </button>
        )}
      </div>
    </div>
  );
};

export default FacultyReview;
