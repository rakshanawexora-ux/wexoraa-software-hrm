import { workDate } from '../../lib/workClock';
import WorkspaceNav from '../../components/WorkspaceNav';
import { useState, useEffect } from 'react';
import API from '../../api/axios';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(workDate());

  useEffect(() => {
    const controller = new AbortController();
    API.get('/attendance/by-date', { params: { date: selectedDate }, signal: controller.signal })
      .then(({ data }) => setAttendance(data))
      .catch((error) => { if (!controller.signal.aborted) console.error(error.message); });
    return () => controller.abort();
  }, [selectedDate]);

  const formatTime = (secs) => {
    if (!secs) return '—';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };



  return (
    <div className="workspace">
      <WorkspaceNav />
      <main className="workspace-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h1>Attendance</h1>
            <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>Employee work & break hours</p>
          </div>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }} />
        </div>

        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #eee', overflow: 'hidden' }}>
          <div className="table-scroll"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee', background: '#f8f9fa' }}>
                <th style={{ textAlign: 'left', padding: '12px 1rem', fontWeight: '500', color: '#555' }}>Employee</th>
                <th style={{ textAlign: 'left', padding: '12px 1rem', fontWeight: '500', color: '#555' }}>Check In</th>
                <th style={{ textAlign: 'left', padding: '12px 1rem', fontWeight: '500', color: '#555' }}>Check Out</th>
                <th style={{ textAlign: 'left', padding: '12px 1rem', fontWeight: '500', color: '#555' }}>Work Hours</th>
                <th style={{ textAlign: 'left', padding: '12px 1rem', fontWeight: '500', color: '#555' }}>Break Hours</th>
                <th style={{ textAlign: 'left', padding: '12px 1rem', fontWeight: '500', color: '#555' }}>Breaks</th>
                <th style={{ textAlign: 'left', padding: '12px 1rem', fontWeight: '500', color: '#555' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No attendance records for this date</td></tr>
              ) : (
                attendance.map((a) => (
                  <tr key={a._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px 1rem' }}>
                      <p style={{ margin: 0, fontWeight: '500' }}>{a.employee?.name}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>{a.employee?.department}</p>
                    </td>
                    <td style={{ padding: '12px 1rem', color: '#555' }}>{a.checkIn || '—'}</td>
                    <td style={{ padding: '12px 1rem', color: '#555' }}>{a.checkOut || '—'}</td>
                    <td style={{ padding: '12px 1rem' }}>
                      <span style={{ fontWeight: '500', color: '#16a34a' }}>{formatTime(a.workSeconds)}</span>
                    </td>
                    <td style={{ padding: '12px 1rem' }}>
                      <span style={{ fontWeight: '500', color: '#ca8a04' }}>{formatTime(a.breakSeconds)}</span>
                    </td>
                    <td style={{ padding: '12px 1rem', color: '#555' }}>{a.breakCount || 0} times</td>
                    <td style={{ padding: '12px 1rem' }}>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                        background: a.status === 'present' ? '#dcfce7' : a.status === 'late' ? '#fef9c3' : '#fee2e2',
                        color: a.status === 'present' ? '#16a34a' : a.status === 'late' ? '#ca8a04' : '#dc2626'
                      }}>{a.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table></div>
        </div>
      </main>
    </div>
  );
};

export default Attendance;