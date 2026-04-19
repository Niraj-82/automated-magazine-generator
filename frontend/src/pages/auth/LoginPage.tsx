// src/pages/auth/LoginPage.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface RoleConfig {
  id: UserRole;
  label: string;
  icon: string;
  desc: string;
  color: string;
  demo: string;
}

const roles: RoleConfig[] = [
  {
    id: 'student',
    label: 'Student',
    icon: '◈',
    desc: 'Submit articles & track status',
    color: '#06B6D4',
    demo: 'student@fcrit.ac.in',
  },
  {
    id: 'faculty',
    label: 'Faculty',
    icon: '◉',
    desc: 'Review & approve content',
    color: '#6366F1',
    demo: 'faculty@fcrit.ac.in',
  },
  {
    id: 'lab_assistant',
    label: 'Lab Assistant',
    icon: '✦',
    desc: 'Generate & manage magazine',
    color: '#8B5CF6',
    demo: 'lab@fcrit.ac.in',
  },
];

// Animated SVG magazine illustration
function MagazineIllustration({ accentColor }: { accentColor: string }) {
  const css = `
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    @keyframes pulse-op { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
    .mag-float { animation: float 4s ease-in-out infinite; }
    .mag-float2 { animation: float 4s ease-in-out infinite; animation-delay: 0.5s; }
    .pulse-op { animation: pulse-op 2s ease-in-out infinite; }
  `;

  return (
    <svg width="300" height="220" viewBox="0 0 300 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {/* Background glow */}
      <ellipse cx="150" cy="190" rx="120" ry="20" fill="rgba(99,102,241,0.1)" />
      {/* Back page */}
      <g className="mag-float2" style={{ transformOrigin: '110px 120px' }}>
        <rect x="80" y="40" width="100" height="140" rx="6" fill="#1E293B" stroke="#334155" strokeWidth="1" />
        <rect x="90" y="55" width="80" height="50" rx="3" fill="#334155" />
        <rect x="90" y="115" width="80" height="8" rx="2" fill="#334155" />
        <rect x="90" y="128" width="60" height="6" rx="2" fill="#2D3F55" />
        <rect x="90" y="140" width="70" height="6" rx="2" fill="#2D3F55" />
        <rect x="90" y="152" width="50" height="6" rx="2" fill="#2D3F55" />
      </g>
      {/* Front page */}
      <g className="mag-float" style={{ transformOrigin: '150px 120px' }}>
        <rect x="100" y="30" width="110" height="150" rx="6" fill="#1E293B" stroke={accentColor} strokeWidth="1.5" />
        {/* Cover image area */}
        <rect x="108" y="40" width="94" height="65" rx="4" fill={`${accentColor}20`} />
        <text x="155" y="77" textAnchor="middle" fontSize="22" fill={accentColor} className="pulse-op">◎</text>
        {/* Title block */}
        <rect x="108" y="116" width="94" height="10" rx="3" fill={`${accentColor}80`} />
        <rect x="108" y="132" width="70" height="7" rx="2" fill="#334155" />
        <rect x="108" y="144" width="80" height="7" rx="2" fill="#334155" />
        <rect x="108" y="156" width="55" height="7" rx="2" fill="#2D3F55" />
        {/* Accent dot */}
        <circle cx="185" cy="168" r="4" fill={accentColor} className="pulse-op" />
      </g>
      {/* Floating elements */}
      <g style={{ animation: 'float 3s ease-in-out infinite', transformOrigin: '60px 80px', animationDelay: '1s' }}>
        <rect x="40" y="65" width="32" height="40" rx="4" fill="#1E293B" stroke="#334155" />
        <rect x="44" y="70" width="24" height="16" rx="2" fill="#334155" />
        <rect x="44" y="91" width="16" height="4" rx="1" fill="#334155" />
        <rect x="44" y="99" width="20" height="4" rx="1" fill="#2D3F55" />
      </g>
      <g style={{ animation: 'float 3.5s ease-in-out infinite', transformOrigin: '240px 70px', animationDelay: '0.7s' }}>
        <rect x="222" y="55" width="36" height="46" rx="4" fill="#1E293B" stroke="#334155" />
        <rect x="226" y="60" width="28" height="18" rx="2" fill={`${accentColor}30`} />
        <rect x="226" y="83" width="18" height="4" rx="1" fill="#334155" />
        <rect x="226" y="91" width="22" height="4" rx="1" fill="#2D3F55" />
        <rect x="226" y="99" width="14" height="4" rx="1" fill="#2D3F55" />
      </g>
    </svg>
  );
}

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const activeRole = roles.find((r) => r.id === selectedRole) || roles[0];

  const handleDemoLogin = () => {
    setEmail(activeRole.demo);
    setPassword('demo123');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, selectedRole);
      const paths: Record<UserRole, string> = {
        student: '/student',
        faculty: '/faculty',
        lab_assistant: '/lab',
      };
      navigate(paths[selectedRole as UserRole]);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Animated BG orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '40%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Left panel */}
      <div
        className="fade-in"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* Animated magazine illustration */}
        <div style={{ marginBottom: '2rem', position: 'relative' }}>
          <MagazineIllustration accentColor={activeRole.color} />
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.5rem',
            fontWeight: 800,
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: '0.75rem',
          }}
        >
          <span className="gradient-text">Tech Odyssey</span>
          <br />
          <span style={{ color: 'var(--text-secondary)', fontSize: '1.5rem', fontWeight: 400 }}>
            2026 Edition
          </span>
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            textAlign: 'center',
            maxWidth: 360,
            fontSize: '0.9rem',
            lineHeight: 1.7,
          }}
        >
          Fr. C. Rodrigues Institute of Technology's automated college magazine platform — powered by AI editorial pipeline.
        </p>

      </div>

      {/* Right panel — login card */}
      <div
        className="fade-in fade-in-delay-1"
        style={{
          width: 460,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div
          className="glass-card"
          style={{
            width: '100%',
            padding: '2.5rem',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.25rem', fontSize: '1.5rem' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            Sign in to continue to your workspace
          </p>

          {/* Role selector tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '1.75rem',
              background: 'var(--bg-secondary)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                style={{
                  padding: '0.6rem 0.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedRole === role.id ? `${role.color}20` : 'transparent',
                  color: selectedRole === role.id ? role.color : 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8rem',
                  fontWeight: selectedRole === role.id ? 700 : 400,
                  cursor: 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  outline: selectedRole === role.id ? `1px solid ${role.color}40` : 'none',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{role.icon}</span>
                <span>{role.label}</span>
              </button>
            ))}
          </div>

          {/* Role description */}
          <div
            style={{
              background: `${activeRole.color}10`,
              border: `1px solid ${activeRole.color}30`,
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 1rem',
              fontSize: '0.8rem',
              color: activeRole.color,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>{activeRole.icon}</span>
            <span>{activeRole.desc}</span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder={activeRole.demo}
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div
                style={{
                  background: 'var(--status-blocked-bg)',
                  border: '1px solid rgba(244,63,94,0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.85rem',
                  color: 'var(--status-blocked)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.875rem' }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      display: 'inline-block',
                    }}
                  />
                  Signing in...
                </span>
              ) : (
                `Sign in as ${activeRole.label}`
              )}
            </button>

            {/* Demo shortcut */}
            <button
              type="button"
              onClick={handleDemoLogin}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
            >
              ⚡ Fill demo credentials
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
            Fr. C. Rodrigues Institute of Technology · Vashi
          </p>
        </div>
      </div>
    </div>
  );
}

