import WorkspaceNav from '../../components/WorkspaceNav';
import { useState } from 'react';
import { useAuth } from '../../context/auth';
import { readTimer, timerKey } from '../../lib/workClock';
import API from '../../api/axios';

const DailyReport = () => {
  const { user } = useAuth();
  const storageKey = timerKey(user);
  const [timerSummary, setTimerSummary] = useState(() => {
    const data = readTimer(storageKey);
    return data?.saved ? { ...data, breakCount: data.breaks.length } : null;
  });
  const [form, setForm] = useState({
    tasksCompleted: '',
    hoursWorked: timerSummary ? Math.round(timerSummary.workSeconds / 60) : '',
    blockers: '',
    tomorrowPlan: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const autoFilled = Boolean(timerSummary);

  const formatTime = (secs) => {
    if (!secs) return '0h 0m';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const handleSubmit = async () => {
    if (!form.tasksCompleted.trim() || form.hoursWorked === '') {
      setError('Tasks completed and minutes worked are required!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await API.post('/reports/submit', form);
      setSuccess(true);
      setForm({ tasksCompleted: '', hoursWorked: '', blockers: '', tomorrowPlan: '' });
      setTimerSummary(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting report');
    } finally { setLoading(false); }
  };



  return (
    <div className="workspace">
      <WorkspaceNav />
      <main className="workspace-content">
        <div style={{ marginBottom: '1.25rem' }}>
          <h1>Daily Report</h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>{new Date().toDateString()}</p>
        </div>

        {timerSummary && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '13px', fontWeight: '500', color: '#16a34a', margin: '0 0 8px' }}>⏱ Today's Work Summary (Auto-filled)</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 2px' }}>Start Time</p>
                <p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>{timerSummary.startTime}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 2px' }}>End Time</p>
                <p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>{timerSummary.endTime}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 2px' }}>Work Time</p>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#16a34a', margin: 0 }}>{formatTime(timerSummary.workSeconds)}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 2px' }}>Break Time</p>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#ca8a04', margin: 0 }}>{formatTime(timerSummary.breakSeconds)} ({timerSummary.breakCount} breaks)</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div style={{ padding: '12px 16px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', color: '#16a34a' }}>
            ✓ Report submitted successfully!
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #eee', padding: '1.5rem', maxWidth: '640px' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#555' }}>Tasks Completed Today *</label>
            <textarea value={form.tasksCompleted} onChange={(e) => setForm({ ...form, tasksCompleted: e.target.value })}
              placeholder="Describe what you completed today..."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#555' }}>
              Minutes Worked * {autoFilled && <span style={{ color: '#16a34a', fontWeight: '400', fontSize: '12px' }}>(auto-filled from timer)</span>}
            </label>
            <input type="number" value={form.hoursWorked}
              readOnly
              placeholder="Auto-filled from timer"
              style={{ width: '180px', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: '#f8f9fa', cursor: 'not-allowed' }} />
            {form.hoursWorked && (
              <span style={{ marginLeft: '10px', fontSize: '12px', color: '#888' }}>
                = {(form.hoursWorked / 60).toFixed(1)} hours
              </span>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#555' }}>Blockers / Issues <span style={{ color: '#aaa', fontWeight: '400' }}>(optional)</span></label>
            <textarea value={form.blockers} onChange={(e) => setForm({ ...form, blockers: e.target.value })}
              placeholder="Any blockers or issues..."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', minHeight: '70px', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#555' }}>Tomorrow's Plan <span style={{ color: '#aaa', fontWeight: '400' }}>(optional)</span></label>
            <textarea value={form.tomorrowPlan} onChange={(e) => setForm({ ...form, tomorrowPlan: e.target.value })}
              placeholder="What will you work on tomorrow..."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', minHeight: '70px', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{
            padding: '10px 24px', background: loading ? '#aaa' : '#16a34a', color: 'white',
            border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500'
          }}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default DailyReport;