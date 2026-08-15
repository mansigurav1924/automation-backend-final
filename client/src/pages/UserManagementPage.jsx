import { useState, useEffect } from 'react';
import { Search, UserPlus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create User Form State
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'manager', department: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data || []);
      } catch (err) {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (email, newRole) => {
    try {
      await api.put(`/admin/users/${email}/role`, { role: newRole });
      setUsers(users.map(u => u.email === email ? { ...u, role: newRole } : u));
      toast.success('User role updated');
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleDelete = async (email) => {
    if (!window.confirm(`Are you sure you want to delete the user ${email}?`)) return;
    try {
      await api.delete(`/admin/users/${email}`);
      setUsers(users.filter(u => u.email !== email));
      toast.success('User deleted');
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/admin/users', formData);
      setUsers([...users, { ...formData, createdAt: new Date().toISOString() }]);
      toast.success('User created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: 'manager', department: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-heading)', margin: 0, letterSpacing: '-0.025em' }}>
          User Management
        </h1>
        <p style={{ color: 'var(--color-body)', margin: '0.3rem 0 0', fontSize: '0.875rem' }}>
          Manage all users and their roles within the system.
        </p>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-muted)' }} />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '2.25rem', width: 220 }}
              />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={inputStyle}>
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
              <option value="manager">Manager</option>
            </select>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <UserPlus size={16} /> Create User
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Joined</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}><div className="loader" /></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>No users found.</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.email} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={tdStyle}><strong>{user.name}</strong></td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>
                      <span style={getRoleBadgeStyle(user.role)}>{user.role}</span>
                    </td>
                    <td style={tdStyle}>{user.department || '-'}</td>
                    <td style={{ ...tdStyle, color: 'var(--color-muted)', fontSize: '0.8rem' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <select 
                          value={user.role} 
                          onChange={(e) => handleRoleChange(user.email, e.target.value)}
                          style={{ ...inputStyle, padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                        >
                          <option value="admin">Admin</option>
                          <option value="hr">HR</option>
                          <option value="manager">Manager</option>
                        </select>
                        <button onClick={() => handleDelete(user.email)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '0.25rem' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showCreateModal && (
          <div style={modalOverlayStyle}>
            <div style={modalStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-heading)' }}>Create New User</h3>
                <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>&times;</button>
              </div>
              
              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Temporary Password</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required style={inputStyle}>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {formData.role === 'manager' && (
                  <div>
                    <label style={labelStyle}>Department</label>
                    <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required style={inputStyle}>
                      <option value="">Select Department...</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="Product">Product</option>
                    </select>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn" style={{ flex: 1, background: '#f3f4f6', color: '#374151' }}>Cancel</button>
                  <button type="submit" disabled={creating} className="btn btn-primary" style={{ flex: 1 }}>{creating ? 'Creating...' : 'Create User'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function getRoleBadgeStyle(role) {
  const base = { padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' };
  if (role === 'admin') return { ...base, background: '#FEE2E2', color: '#991B1B' };
  if (role === 'hr') return { ...base, background: '#E0F2FE', color: '#075985' };
  return { ...base, background: '#F3F4F6', color: '#374151' };
}

// Styles
const cardStyle = {
  background: '#fff',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-card)',
  padding: '1.5rem',
  marginBottom: '2rem'
};

const inputStyle = {
  padding: '0.6rem 0.75rem',
  borderRadius: 'var(--radius-button)',
  border: '1px solid #E5E7EB',
  outline: 'none',
  fontSize: '0.85rem',
  width: '100%',
  boxSizing: 'border-box'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  marginBottom: '0.4rem',
  color: 'var(--color-body)'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left'
};

const thStyle = {
  padding: '1rem 0.5rem',
  borderBottom: '2px solid #E5E7EB',
  color: 'var(--color-muted)',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '1rem 0.5rem',
  color: 'var(--color-heading)',
  fontSize: '0.9rem'
};

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: '1rem'
};

const modalStyle = {
  background: '#fff', width: '100%', maxWidth: 450, borderRadius: 'var(--radius-card)',
  padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
};
