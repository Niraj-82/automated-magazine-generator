// src/pages/shared/NotificationsPage.tsx
import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification } from '../../types';
import { SkeletonRow } from '../../components/ui/SkeletonLoader';

type FilterTab = 'all' | 'approved' | 'flagged' | 'rejected' | 'comment' | 'system';

const tabConfig: { id: FilterTab; label: string; color: string }[] = [
  { id: 'all', label: 'All', color: 'var(--accent-indigo)' },
  { id: 'approved', label: 'Approved', color: 'var(--status-clean)' },
  { id: 'flagged', label: 'Flagged', color: 'var(--status-flagged)' },
  { id: 'rejected', label: 'Rejected', color: 'var(--status-blocked)' },
  { id: 'comment', label: 'Comments', color: 'var(--accent-cyan)' },
  { id: 'system', label: 'System', color: 'var(--text-muted)' },
];

const typeColors: Record<string, { color: string; bg: string; icon: string }> = {
  approved: { color: 'var(--status-clean)', bg: 'var(--status-clean-bg)', icon: '●' },
  flagged: { color: 'var(--status-flagged)', bg: 'var(--status-flagged-bg)', icon: '◑' },
  rejected: { color: 'var(--status-blocked)', bg: 'var(--status-blocked-bg)', icon: '✕' },
  comment: { color: 'var(--accent-cyan)', bg: 'var(--accent-cyan-glow)', icon: '◎' },
  system: { color: 'var(--text-muted)', bg: 'rgba(100,116,139,0.15)', icon: '◈' },
};

// Demo notifications for fallback
const demoNotifs: Notification[] = [
  { id: 'n1', userId: 'stu_001', type: 'approved', message: 'Your article "Machine Learning in Healthcare" has been approved for publication.', read: false, createdAt: new Date(Date.now() - 3600000).toISOString(), link: '/student/submissions/s1' },
  { id: 'n2', userId: 'stu_001', type: 'comment', message: 'Prof. Meera Nair commented on "Inter-College Hackathon Report": Great writing!', read: false, createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), link: '/student/submissions/s2' },
  { id: 'n3', userId: 'stu_001', type: 'flagged', message: 'Your submission "Annual Sports Day" has been flagged for grammar improvements.', read: true, createdAt: new Date(Date.now() - 86400000).toISOString(), link: '/student/submissions/s3' },
  { id: 'n4', userId: 'stu_001', type: 'system', message: 'Magazine submission deadline extended to June 15, 2026.', read: true, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'n5', userId: 'stu_001', type: 'approved', message: 'Your article "Blockchain in Supply Chain" is featured in the cover section.', read: true, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
];

function timeAgo(d: string): string {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const NotificationsPage: React.FC = () => {
  const { notifications: apiNotifs, loading, unreadCount, markRead, markAllRead } = useNotifications();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Use demo data if API returns nothing
  const notifications = apiNotifs.length > 0 ? apiNotifs : demoNotifs;

  const filtered = activeTab === 'all' ? notifications : notifications.filter(n => n.type === activeTab);

  const handleClick = (notif: Notification) => {
    if (!notif.read) markRead(notif.id);
    if (notif.link) window.location.href = notif.link;
  };

  return (
    <div className="page-enter" style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.25rem' }}>Notifications</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary" onClick={markAllRead} style={{ cursor: 'none', padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
            ✓ Mark All Read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
        {tabConfig.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', whiteSpace: 'nowrap',
              background: activeTab === tab.id ? tab.color : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 500,
              cursor: 'none', transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} columns={2} />) :
          filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>◎</div>
              <p style={{ fontSize: '0.9rem' }}>No notifications in this category</p>
            </div>
          ) : filtered.map(notif => {
            const tc = typeColors[notif.type] || typeColors.system;
            return (
              <div key={notif.id} data-hoverable onClick={() => handleClick(notif)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                  padding: '1rem 1.25rem', cursor: 'none',
                  background: notif.read ? 'var(--bg-card)' : 'rgba(99,102,241,0.04)',
                  border: `1px solid ${notif.read ? 'var(--border-subtle)' : 'rgba(99,102,241,0.2)'}`,
                  borderRadius: 'var(--radius-md)', transition: 'all 0.2s ease',
                  borderLeft: `3px solid ${tc.color}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = notif.read ? 'var(--border-subtle)' : 'rgba(99,102,241,0.2)'; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: tc.color, flexShrink: 0 }}>
                  {tc.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', color: notif.read ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.5, fontWeight: notif.read ? 400 : 500 }}>
                    {notif.message}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{timeAgo(notif.createdAt)}</span>
                    <span className="badge" style={{ background: tc.bg, color: tc.color, fontSize: '0.62rem', padding: '0.1rem 0.4rem' }}>{notif.type}</span>
                  </div>
                </div>
                {!notif.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-indigo)', flexShrink: 0, marginTop: '0.5rem' }} />}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default NotificationsPage;
