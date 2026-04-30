// src/components/layout/Sidebar.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import { useNotifications } from '../../hooks/useNotifications';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: number;
}

const roleNavItems: Record<string, NavItem[]> = {
  student: [
    { label: 'Dashboard', path: '/student', icon: '⊞' },
    { label: 'New Submission', path: '/student?view=submit', icon: '✦' },
    { label: 'Notifications', path: '/notifications', icon: '◎' },
  ],
  faculty: [
    { label: 'Dashboard', path: '/faculty', icon: '⊞' },
    { label: 'Review Queue', path: '/faculty/review', icon: '◈' },
    { label: 'Notifications', path: '/notifications', icon: '◎' },
  ],
  lab_assistant: [
    { label: 'Dashboard', path: '/lab', icon: '⊞' },
    { label: 'Manage Users', path: '/lab/users', icon: '◉' },
    { label: 'Notifications', path: '/notifications', icon: '◎' },
  ],
};

const roleColors: Record<string, string> = {
  student: 'var(--accent-cyan)',
  faculty: 'var(--accent-indigo)',
  lab_assistant: '#8B5CF6',
};

const roleLabels: Record<string, string> = {
  student: 'Student',
  faculty: 'Faculty',
  lab_assistant: 'Lab Assistant',
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { unreadCount } = useNotifications();

  if (!user) return null;

  const navItems = roleNavItems[user.role] || [];
  const accentColor = roleColors[user.role];

  const handleNav = (path: string) => navigate(path);

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: collapsed ? '72px' : 'var(--sidebar-width)',
        height: '100vh',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '1.5rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `linear-gradient(135deg, var(--accent-indigo), ${accentColor})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            flexShrink: 0,
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          ◎
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>
              Tech Odyssey
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              2026 Edition
            </div>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div style={{ padding: '0.75rem 1.25rem' }}>
          <span
            className="badge"
            style={{
              background: `${accentColor}20`,
              color: accentColor,
              fontSize: '0.7rem',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            {roleLabels[user.role]}
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {navItems.map((item) => {
          const fullLocation = location.pathname + location.search;
          const isActive = item.path.includes('?') 
            ? fullLocation === item.path 
            : (location.pathname === item.path && !location.search) || location.pathname.startsWith(item.path + '/');
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: collapsed ? '0.75rem' : '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isActive ? `${accentColor}15` : 'transparent',
                color: isActive ? accentColor : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                cursor: 'none',
                transition: 'all 0.15s ease',
                width: '100%',
                textAlign: 'left',
                position: 'relative',
                borderLeft: isActive ? `2px solid ${accentColor}` : '2px solid transparent',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.path.includes('/notifications') && unreadCount > 0 && (
                    <span
                      style={{
                        background: accentColor,
                        color: 'white',
                        borderRadius: '100px',
                        padding: '0.1rem 0.5rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        animation: 'pulse 2s infinite',
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {item.badge && !item.path.includes('/notifications') && (
                    <span
                      style={{
                        background: accentColor,
                        color: 'white',
                        borderRadius: '100px',
                        padding: '0.1rem 0.5rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}

      </nav>

      {/* Theme toggle */}
      {!collapsed && (
        <div style={{ padding: '0 1rem 0.5rem', display: 'flex', justifyContent: 'center' }}>
          <ThemeToggle />
        </div>
      )}

      {/* User profile */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: `linear-gradient(135deg, var(--accent-indigo), ${accentColor})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 700,
            flexShrink: 0,
            color: 'white',
          }}
        >
          {initials}
        </div>
        {!collapsed && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            {user.rollNumber && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.rollNumber}</div>
            )}
          </div>
        )}
        {!collapsed && (
          <button
            onClick={logout}
            title="Logout"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'none',
              fontSize: '1rem',
              padding: '0.25rem',
              borderRadius: '6px',
              transition: 'color 0.2s',
            }}
          >
            ⏻
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          top: '50%',
          right: -12,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          cursor: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          zIndex: 10,
          transition: 'all 0.2s ease',
        }}
      >
        {collapsed ? '›' : '‹'}
      </button>
    </aside>
  );
};

export default Sidebar;
