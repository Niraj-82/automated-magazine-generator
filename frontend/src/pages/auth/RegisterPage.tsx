// src/pages/auth/RegisterPage.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService, getErrorMessage } from '../../services/api';
import ThemeToggle from '../../components/ui/ThemeToggle';

const departments = [
  'Computer Engineering',
  'Information Technology',
  'Electronics & Telecommunication',
  'Mechanical Engineering',
  'Electrical Engineering',
];

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 20, label: 'Weak', color: 'var(--status-blocked)' };
  if (score <= 2) return { level: 40, label: 'Fair', color: 'var(--status-flagged)' };
  if (score <= 3) return { level: 60, label: 'Good', color: 'var(--status-flagged)' };
  if (score <= 4) return { level: 80, label: 'Strong', color: 'var(--status-clean)' };
  return { level: 100, label: 'Very Strong', color: 'var(--status-clean)' };
}

// Reuse magazine illustration from login
function MagazineIllustration() {
  const accentColor = '#06B6D4';
  const css = `
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    @keyframes pulse-op { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
    .mag-float { animation: float 4s ease-in-out infinite; }
    .mag-float2 { animation: float 4s ease-in-out infinite; animation-delay: 0.5s; }
    .pulse-op { animation: pulse-op 2s ease-in-out infinite; }
  `;
  return (
    <svg width="260" height="190" viewBox="0 0 300 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <ellipse cx="150" cy="190" rx="120" ry="20" fill="rgba(6,182,212,0.1)" />
      <g className="mag-float2" style={{ transformOrigin: '110px 120px' }}>
        <rect x="80" y="40" width="100" height="140" rx="6" fill="#1E293B" stroke="#334155" strokeWidth="1" />
        <rect x="90" y="55" width="80" height="50" rx="3" fill="#334155" />
        <rect x="90" y="115" width="80" height="8" rx="2" fill="#334155" />
        <rect x="90" y="128" width="60" height="6" rx="2" fill="#2D3F55" />
      </g>
      <g className="mag-float" style={{ transformOrigin: '150px 120px' }}>
        <rect x="100" y="30" width="110" height="150" rx="6" fill="#1E293B" stroke={accentColor} strokeWidth="1.5" />
        <rect x="108" y="40" width="94" height="65" rx="4" fill={`${accentColor}20`} />
        <text x="155" y="77" textAnchor="middle" fontSize="22" fill={accentColor} className="pulse-op">◎</text>
        <rect x="108" y="116" width="94" height="10" rx="3" fill={`${accentColor}80`} />
        <rect x="108" y="132" width="70" height="7" rx="2" fill="#334155" />
        <rect x="108" y="144" width="80" height="7" rx="2" fill="#334155" />
        <circle cx="185" cy="168" r="4" fill={accentColor} className="pulse-op" />
      </g>
    </svg>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    rollNumber: '',
    email: '',
    department: departments[0],
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pwStrength = getPasswordStrength(form.password);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'student',
        rollNumber: form.rollNumber,
        department: form.department,
      });
      const { token, user } = res.data.data || {};
      if (token && user) {
        localStorage.setItem('token', token);
        await login(user.email, form.password, 'student');
      }
      navigate('/student');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-enter"
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Theme toggle */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
        <ThemeToggle />
      </div>

      {/* BG orbs */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '40%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Left panel — illustration */}
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
        <div style={{ marginBottom: '2rem' }}>
          <MagazineIllustration />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', lineHeight: 1.1, marginBottom: '0.75rem' }}>
          <span className="gradient-text">Join Tech Odyssey</span>
          <br />
          <span style={{ color: 'var(--text-secondary)', fontSize: '1.3rem', fontWeight: 400 }}>2026 Edition</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 340, fontSize: '0.88rem', lineHeight: 1.7 }}>
          Register as a student to submit articles to Fr. CRIT's automated college magazine platform.
        </p>
      </div>

      {/* Right panel — register form */}
      <div
        className="fade-in fade-in-delay-1"
        style={{ width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
      >
        <div className="glass-card" style={{ width: '100%', padding: '2rem 2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.25rem', fontSize: '1.4rem' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Student self-registration</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div>
              <label className="label">Full Name *</label>
              <input type="text" name="name" className="input-field" placeholder="Arjun Sharma" value={form.name} onChange={handleChange} required />
            </div>

            <div>
              <label className="label">Roll Number *</label>
              <input type="text" name="rollNumber" className="input-field" placeholder="TE-CE-042" value={form.rollNumber} onChange={handleChange} required />
            </div>

            <div>
              <label className="label">Email *</label>
              <input type="email" name="email" className="input-field" placeholder="arjun.sharma@fcrit.ac.in" value={form.email} onChange={handleChange} required autoComplete="email" />
            </div>

            <div>
              <label className="label">Department</label>
              <select name="department" className="input-field" value={form.department} onChange={handleChange}>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Password *</label>
              <input type="password" name="password" className="input-field" placeholder="••••••••" value={form.password} onChange={handleChange} required minLength={6} />
              {form.password && (
                <div style={{ marginTop: '0.4rem' }}>
                  <div style={{ height: 4, borderRadius: 100, background: 'var(--border-subtle)', overflow: 'hidden' }}>
                    <div style={{ width: `${pwStrength.level}%`, height: '100%', background: pwStrength.color, borderRadius: 100, transition: 'all 0.3s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: pwStrength.color, marginTop: '0.2rem' }}>{pwStrength.label}</div>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm Password *</label>
              <input type="password" name="confirmPassword" className="input-field" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} required />
            </div>

            {error && (
              <div style={{ background: 'var(--status-blocked-bg)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-md)', padding: '0.7rem 1rem', fontSize: '0.84rem', color: 'var(--status-blocked)' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem', padding: '0.85rem', cursor: 'none' }}>
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Creating account...
                </span>
              ) : (
                '✦ Create Student Account'
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
            Already have an account?{' '}
            <Link to="/login" data-hoverable style={{ color: 'var(--accent-indigo)', fontWeight: 600, cursor: 'none' }}>Sign in →</Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Fr. C. Rodrigues Institute of Technology · Vashi
          </p>
        </div>
      </div>
    </div>
  );
}
