// src/components/ui/SkeletonLoader.tsx
import React from 'react';

// ── Skeleton Text: single line placeholder ──
export const SkeletonText: React.FC<{ width?: string; height?: string }> = ({
  width = '100%',
  height = '14px',
}) => (
  <div
    className="skeleton"
    style={{ width, height, borderRadius: '6px' }}
  />
);

// ── Skeleton Row: table row placeholder ──
export const SkeletonRow: React.FC<{ columns?: number }> = ({ columns = 4 }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '0.75rem 1rem',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)',
    }}
  >
    {/* Avatar skeleton */}
    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
    {/* Column placeholders */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {Array.from({ length: Math.min(columns, 3) }).map((_, i) => (
        <SkeletonText key={i} width={i === 0 ? '60%' : i === 1 ? '40%' : '30%'} />
      ))}
    </div>
    {/* Action placeholder */}
    <div className="skeleton" style={{ width: 60, height: 28, borderRadius: '6px', flexShrink: 0 }} />
  </div>
);

// ── Skeleton Card: card placeholder with header + body ──
export const SkeletonCard: React.FC = () => (
  <div
    style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}
  >
    {/* Category badge */}
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div className="skeleton" style={{ width: 70, height: 22, borderRadius: '100px' }} />
      <div className="skeleton" style={{ width: 50, height: 18, borderRadius: '100px' }} />
    </div>
    {/* Title */}
    <SkeletonText width="85%" height="16px" />
    {/* Content lines */}
    <SkeletonText width="100%" />
    <SkeletonText width="75%" />
    {/* Author row */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
      <div className="skeleton" style={{ width: 24, height: 24, borderRadius: '50%' }} />
      <SkeletonText width="100px" />
    </div>
  </div>
);

// ── Skeleton Grid: grid of skeleton cards ──
export const SkeletonGrid: React.FC<{ count?: number; columns?: string }> = ({
  count = 6,
  columns = 'repeat(auto-fill, minmax(280px, 1fr))',
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: columns, gap: '1rem' }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

// ── Skeleton Stat Card ──
export const SkeletonStatCard: React.FC = () => (
  <div
    className="stat-card"
    style={{ borderLeft: '3px solid var(--border-subtle)' }}
  >
    <SkeletonText width="80px" height="12px" />
    <div className="skeleton" style={{ width: 60, height: 32, borderRadius: '6px' }} />
  </div>
);

export default SkeletonGrid;
