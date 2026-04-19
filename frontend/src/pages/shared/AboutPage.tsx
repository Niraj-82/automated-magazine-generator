// src/pages/shared/AboutPage.tsx
import React from 'react';

const teamMembers = [
  { name: 'Arjun Sharma', roll: 'TE-CE-042', role: 'Frontend & UI/UX', color: '#06B6D4', icon: '◈' },
  { name: 'Priya Menon', roll: 'TE-CE-018', role: 'AI Pipeline', color: '#6366F1', icon: '◉' },
  { name: 'Rohan Patil', roll: 'TE-CE-027', role: 'Backend & APIs', color: '#8B5CF6', icon: '✦' },
  { name: 'Sneha Joshi', roll: 'TE-CE-031', role: 'Database Design', color: '#10B981', icon: '⊞' },
];

const techStack = [
  { name: 'React + TypeScript', desc: 'Frontend framework with type safety', color: '#06B6D4' },
  { name: 'Node.js / Express', desc: 'REST API backend server', color: '#10B981' },
  { name: 'PostgreSQL', desc: 'Relational DB for users & logs', color: '#3B82F6' },
  { name: 'MongoDB', desc: 'Document DB for content & AI outputs', color: '#10B981' },
  { name: 'Multi-Agent AI', desc: 'Grammar, Tone, Summarization agents', color: '#6366F1' },
  { name: 'Puppeteer / PDFKit', desc: 'Automated PDF generation engine', color: '#F59E0B' },
];

const AboutPage: React.FC = () => {
  return (
    <div className="page-enter" style={{ maxWidth: 900 }}>
      {/* Hero section */}
      <div
        style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.08))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>◎</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', marginBottom: '0.5rem' }}>
          <span className="gradient-text">Tech Odyssey 2026</span>
        </h1>
        <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Automated College Magazine Generator
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <span className="badge badge-indigo">Full Stack Development Laboratory</span>
          <span className="badge badge-cyan">Third Year · Computer Engineering</span>
          <span className="badge badge-draft">Academic Year 2025–26</span>
        </div>

        <div
          style={{
            display: 'inline-block',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1.5rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}
        >
          "This project was developed as part of the Full Stack Development Laboratory course at<br />
          Fr. C. Rodrigues Institute of Technology, Vashi, Navi Mumbai,<br />
          Department of Computer Engineering."
        </div>
      </div>

      {/* Institution info */}
      <div
        className="card fade-in-up"
        style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}
      >
        {[
          { label: 'Institution', value: 'Fr. C. Rodrigues Institute of Technology', icon: '◉' },
          { label: 'Location', value: 'Vashi, Navi Mumbai', icon: '◈' },
          { label: 'Department', value: 'Department of Computer Engineering', icon: '⊞' },
          { label: 'Subject', value: 'Full Stack Development Laboratory', icon: '✦' },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ color: 'var(--accent-indigo)' }}>{item.icon}</span>
              {item.label}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Team section */}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ color: 'var(--accent-indigo)' }}>◈</span>
        Development Team
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {teamMembers.map((member, i) => (
          <div
            key={member.roll}
            className={`card fade-in-up fade-in-delay-${i + 1}`}
            style={{
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 24px ${member.color}30`;
              (e.currentTarget as HTMLDivElement).style.borderColor = member.color + '40';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = '';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
            }}
          >
            {/* Accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${member.color}, transparent)` }} />

            {/* Avatar */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: `${member.color}20`,
                border: `2px solid ${member.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0.75rem auto 1rem',
                color: member.color,
              }}
            >
              {member.icon}
            </div>

            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {member.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontFamily: 'monospace' }}>
              {member.roll}
            </div>
            <span
              className="badge"
              style={{ background: `${member.color}15`, color: member.color, fontSize: '0.7rem' }}
            >
              {member.role}
            </span>
          </div>
        ))}
      </div>

      {/* Mentor */}
      <div
        className="card fade-in-up"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(6,182,212,0.04))',
          border: '1px solid rgba(99,102,241,0.2)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--accent-indigo-glow)',
            border: '2px solid rgba(99,102,241,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            flexShrink: 0,
          }}
        >
          ◉
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
            Faculty Mentor
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: '0.15rem' }}>
            Prof. [Mentor Name]
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Department of Computer Engineering · FCRIT
          </div>
        </div>
        <span className="badge badge-indigo" style={{ marginLeft: 'auto', flexShrink: 0 }}>
          Project Guide
        </span>
      </div>

      {/* Tech stack */}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ color: 'var(--accent-cyan)' }}>⊞</span>
        Technology Stack
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        {techStack.map((tech) => (
          <div
            key={tech.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              borderLeft: `3px solid ${tech.color}`,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{tech.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tech.desc}</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: tech.color, flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: 'center',
          padding: '1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          lineHeight: 1.8,
        }}
      >
        <div style={{ marginBottom: '0.25rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Fr. C. Rodrigues Institute of Technology
        </div>
        <div>Vashi, Navi Mumbai · Department of Computer Engineering</div>
        <div>Full Stack Development Laboratory · 2025–26</div>
      </div>
    </div>
  );
};

export default AboutPage;
