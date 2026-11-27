import WorkspaceNav from '../../components/WorkspaceNav';
import { useState, useEffect } from 'react';
import API from '../../api/axios';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [message, setMessage] = useState('');

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/employees');
      setEmployees(res.data);
    } catch (err) { console.log(err); }
  };

  useEffect(() => {
    const pending = setTimeout(fetchEmployees, 0);
    return () => clearTimeout(pending);
  }, []);

  const handleAdd = async () => {
    try {
      await API.post('/employees', form);
      setMessage('Employee added!');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', department: '' });
      fetchEmployees();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await API.delete(`/employees/${id}`);
      fetchEmployees();
    } catch (err) { console.log(err); }
  };



  return (
    <div className="workspace">
      <WorkspaceNav />
      <main className="workspace-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>Employees</h1>
          <button onClick={() => setShowModal(true)} style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>+ Add Employee</button>
        </div>

        {message && <div style={{ padding: '10px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', marginBottom: '1rem', fontSize: '13px', color: '#16a34a' }}>{message}</div>}

        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #eee', overflow: 'hidden' }}>
          <div className="table-scroll"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee', background: '#f8f9fa' }}>
                <th style={{ textAlign: 'left', padding: '12px 1rem', fontWeight: '500', color: '#555' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px 1rem', fontWeight: '500', color: '#555' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 1rem', fontWeight: '500', color: '#555' }}>Department</th>
                <th style={{ textAlign: 'left', padding: '12px 1rem', fontWeight: '500', color: '#555' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '12px 1rem', fontWeight: '500', color: '#555' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No employees yet</td></tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px 1rem' }}>{emp.name}</td>
                    <td style={{ padding: '12px 1rem', color: '#555' }}>{emp.email}</td>
                    <td style={{ padding: '12px 1rem', color: '#555' }}>{emp.department || '-'}</td>
                    <td style={{ padding: '12px 1rem' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: emp.isActive ? '#dcfce7' : '#fee2e2', color: emp.isActive ? '#16a34a' : '#dc2626' }}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 1rem' }}>
                      <button onClick={() => handleDelete(emp._id)} style={{ padding: '4px 10px', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '6px', color: '#cc0000', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table></div>
        </div>
      </main>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '400px' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 1.25rem' }}>Add Employee</p>
            {['name', 'email', 'password', 'department'].map((field) => (
              <div key={field} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: '#555', textTransform: 'capitalize' }}>{field}</label>
                <input
                  type={field === 'password' ? 'password' : 'text'}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem' }}>
              <button onClick={handleAdd} style={{ flex: 1, padding: '9px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Add</button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '9px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;