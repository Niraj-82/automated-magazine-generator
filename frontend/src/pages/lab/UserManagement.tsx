// src/pages/lab/UserManagement.tsx
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { userService, getErrorMessage } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { SkeletonRow } from '../../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

const roleColors: Record<string, string> = {
  student: 'var(--accent-cyan)', faculty: 'var(--accent-indigo)', lab_assistant: 'var(--status-review)',
};
const roleLabels: Record<string, string> = {
  student: 'Student', faculty: 'Faculty', lab_assistant: 'Lab Assistant',
};

const demoUsers: User[] = [
  { id: 'u1', name: 'Arjun Sharma', email: 'arjun@fcrit.ac.in', role: 'student', rollNumber: 'TE-CE-042', department: 'Computer Engineering' },
  { id: 'u2', name: 'Priya Menon', email: 'priya@fcrit.ac.in', role: 'student', rollNumber: 'TE-CE-018', department: 'Computer Engineering' },
  { id: 'u3', name: 'Prof. Meera Nair', email: 'meera@fcrit.ac.in', role: 'faculty', department: 'Computer Engineering' },
  { id: 'u4', name: 'Rohan Patil', email: 'rohan@fcrit.ac.in', role: 'student', rollNumber: 'TE-CE-027', department: 'Computer Engineering' },
  { id: 'u5', name: 'Sneha Joshi', email: 'sneha@fcrit.ac.in', role: 'student', rollNumber: 'TE-CE-031', department: 'Computer Engineering' },
  { id: 'u6', name: 'Amit Desai', email: 'amit@fcrit.ac.in', role: 'student', rollNumber: 'TE-CE-009', department: 'Computer Engineering' },
  { id: 'u7', name: 'Kavya Rao', email: 'kavya@fcrit.ac.in', role: 'student', rollNumber: 'TE-CE-055', department: 'Computer Engineering' },
  { id: 'u8', name: 'Lab Kumar', email: 'lab@fcrit.ac.in', role: 'lab_assistant', department: 'Computer Engineering' },
];

interface ModalProps { onClose: () => void; onSave: (data: Record<string, string>) => void; saving: boolean; }
const AddUserModal: React.FC<ModalProps> = ({ onClose, onSave, saving }) => {
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'student', rollNumber: '', department: 'Computer Engineering' });
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, width: 440, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Add New User</h3>
          <button onClick={onClose} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'none', color: 'var(--text-muted)', fontSize: '0.8rem' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div><label className="label">Full Name *</label><input className="input-field" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="Enter name" /></div>
          <div><label className="label">Email *</label><input className="input-field" type="email" value={f.email} onChange={e => setF(p => ({ ...p, email: e.target.value }))} placeholder="user@fcrit.ac.in" /></div>
          <div><label className="label">Password *</label><input className="input-field" type="password" value={f.password} onChange={e => setF(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" /></div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}><label className="label">Role</label><select className="input-field" value={f.role} onChange={e => setF(p => ({ ...p, role: e.target.value }))}><option value="student">Student</option><option value="faculty">Faculty</option><option value="lab_assistant">Lab Assistant</option></select></div>
            <div style={{ flex: 1 }}><label className="label">Roll Number</label><input className="input-field" value={f.rollNumber} onChange={e => setF(p => ({ ...p, rollNumber: e.target.value }))} placeholder="TE-CE-XXX" /></div>
          </div>
          <div><label className="label">Department</label><select className="input-field" value={f.department} onChange={e => setF(p => ({ ...p, department: e.target.value }))}><option>Computer Engineering</option><option>Information Technology</option><option>Electronics</option></select></div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose} style={{ cursor: 'none' }}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(f)} disabled={!f.name || !f.email || !f.password || saving} style={{ cursor: 'none' }}>{saving ? '...' : '+ Add User'}</button>
        </div>
      </div>
    </>
  );
};

interface DrawerProps { user: User; onClose: () => void; onSave: (data: Partial<User>) => void; saving: boolean; }
const EditDrawer: React.FC<DrawerProps> = ({ user: u, onClose, onSave, saving }) => {
  const [f, setF] = useState({ name: u.name, email: u.email, role: u.role as string, rollNumber: u.rollNumber || '', department: u.department || '' });
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className={`side-drawer open`}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>Edit User</h3>
          <button onClick={onClose} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'none', color: 'var(--text-muted)', fontSize: '0.8rem' }}>✕</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div><label className="label">Name</label><input className="input-field" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className="label">Email</label><input className="input-field" value={f.email} onChange={e => setF(p => ({ ...p, email: e.target.value }))} /></div>
          <div><label className="label">Role</label><select className="input-field" value={f.role} onChange={e => setF(p => ({ ...p, role: e.target.value }))}><option value="student">Student</option><option value="faculty">Faculty</option><option value="lab_assistant">Lab Assistant</option></select></div>
          <div><label className="label">Roll Number</label><input className="input-field" value={f.rollNumber} onChange={e => setF(p => ({ ...p, rollNumber: e.target.value }))} /></div>
          <div><label className="label">Department</label><input className="input-field" value={f.department} onChange={e => setF(p => ({ ...p, department: e.target.value }))} /></div>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center', cursor: 'none' }}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave({ name: f.name, email: f.email, role: f.role as UserRole, rollNumber: f.rollNumber, department: f.department })} disabled={saving} style={{ flex: 1, justifyContent: 'center', cursor: 'none' }}>{saving ? '...' : '✓ Save'}</button>
        </div>
      </div>
    </>
  );
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const fetchUsers = async (p: number = 1, s: string = '') => {
    setLoading(true);
    try {
      const res = await userService.getAll({ page: p, limit: 10, search: s || undefined });
      const d = res.data.data;
      if (d && d.data && d.data.length > 0) { setUsers(d.data); setTotalPages(d.totalPages || 1); }
      else { setUsers(demoUsers); setTotalPages(1); }
    } catch { setUsers(demoUsers); setTotalPages(1); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(1, debouncedSearch); setPage(1); }, [debouncedSearch]);
  useEffect(() => { fetchUsers(page, debouncedSearch); }, [page]);

  const handleAdd = async (data: Record<string, string>) => {
    setSaving(true);
    try {
      await userService.create(data as unknown as { name: string; email: string; password: string; role: string; rollNumber?: string; department?: string });
      toast.success('User created');
      setShowAdd(false);
      fetchUsers(page, debouncedSearch);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleEdit = async (data: Partial<User>) => {
    if (!editUser) return;
    setSaving(true);
    try {
      await userService.update(editUser.id, data);
      toast.success('User updated');
      setEditUser(null);
      fetchUsers(page, debouncedSearch);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await userService.deactivate(id);
      toast.success('User deactivated');
      setConfirmDeactivate(null);
      fetchUsers(page, debouncedSearch);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="page-enter" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.25rem' }}>User Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{users.length} users registered</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ cursor: 'none' }}>+ Add User</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.25rem' }}>
        <input className="input-field" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 400 }} />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '0.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) :
            users.length === 0 ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users found</div> :
            users.map(u => {
              const rc = roleColors[u.role] || 'var(--text-muted)';
              return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${rc}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: rc, flexShrink: 0 }}>
                    {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}{u.rollNumber ? ` · ${u.rollNumber}` : ''}</div>
                  </div>
                  <span className="badge" style={{ background: `${rc}15`, color: rc, fontSize: '0.7rem' }}>{roleLabels[u.role] || u.role}</span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button onClick={() => setEditUser(u)} style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.3rem 0.6rem', color: 'var(--text-muted)', cursor: 'none', fontSize: '0.75rem' }}>Edit</button>
                    <button onClick={() => setConfirmDeactivate(u.id)} style={{ background: 'var(--status-blocked-bg)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '6px', padding: '0.3rem 0.6rem', color: 'var(--status-blocked)', cursor: 'none', fontSize: '0.75rem' }}>Deactivate</button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ cursor: 'none', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>← Prev</button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ cursor: 'none', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>Next →</button>
        </div>
      )}

      {/* Modals */}
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSave={handleAdd} saving={saving} />}
      {editUser && <EditDrawer user={editUser} onClose={() => setEditUser(null)} onSave={handleEdit} saving={saving} />}
      {confirmDeactivate && (
        <>
          <div className="drawer-overlay" onClick={() => setConfirmDeactivate(null)} />
          <div className="fade-in" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, width: 380, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--status-blocked-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.2rem', color: 'var(--status-blocked)' }}>✕</div>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>Deactivate User?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>This is a soft deactivation. The user can be reactivated later.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setConfirmDeactivate(null)} style={{ cursor: 'none' }}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDeactivate(confirmDeactivate)} style={{ cursor: 'none' }}>Deactivate</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;
