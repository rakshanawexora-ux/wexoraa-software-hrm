import { readTimer, timerKey, workTime } from '../../lib/workClock';
import WorkspaceNav from '../../components/WorkspaceNav';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import API from '../../api/axios';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const storageKey = timerKey(user);
  const navigate = useNavigate();
  const [draft] = useState(() => readTimer(storageKey));
  const [tasks, setTasks] = useState([]);
  const [timerStatus, setTimerStatus] = useState(draft?.status || 'idle');
  const [workSeconds, setWorkSeconds] = useState(draft?.workSeconds || 0);
  const [breakSeconds, setBreakSeconds] = useState(draft?.breakSeconds || 0);
  const [startTime, setStartTime] = useState(draft?.startTime || null);
  const [breaks, setBreaks] = useState(draft?.breaks || []);
  const [currentBreakStart, setCurrentBreakStart] = useState(draft?.currentBreakStart || null);
  const [workSaved, setWorkSaved] = useState(Boolean(draft?.saved));
  const [saving, setSaving] = useState(false);
  const [timerError, setTimerError] = useState('');
  const tickRef = useRef(null);

  // Reference timestamps - epoch ms, tab inactive aanalum correct a calculate pannum
  const workAccumulatedRef = useRef(draft?.workSeconds || 0); // seconds accumulated before current segment
  const breakAccumulatedRef = useRef(draft?.breakSeconds || 0);
  const segmentStartRef = useRef(draft?.segmentStart || null); // epoch ms when current working/break segment started



  // Single ticking interval - recalculates from epoch time every second, works even if tab was inactive
  useEffect(() => {
    if (timerStatus === 'working' || timerStatus === 'break') {
      tickRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedSinceSegment = segmentStartRef.current
          ? Math.floor((now - segmentStartRef.current) / 1000)
          : 0;

        if (timerStatus === 'working') {
          const total = workAccumulatedRef.current + elapsedSinceSegment;
          setWorkSeconds(total);
        } else {
          const total = breakAccumulatedRef.current + elapsedSinceSegment;
          setBreakSeconds(total);
        }
      }, 1000);
    } else {
      clearInterval(tickRef.current);
    }
    return () => clearInterval(tickRef.current);
  }, [timerStatus]);

  // Recalculate immediately when tab becomes visible again (catches up missed time instantly)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && segmentStartRef.current) {
        const now = Date.now();
        const elapsedSinceSegment = Math.floor((now - segmentStartRef.current) / 1000);
        if (timerStatus === 'working') {
          setWorkSeconds(workAccumulatedRef.current + elapsedSinceSegment);
        } else if (timerStatus === 'break') {
          setBreakSeconds(breakAccumulatedRef.current + elapsedSinceSegment);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [timerStatus]);

  const saveToLocal = (ws, bs, status, breakHistory, activeBreak) => {
    localStorage.setItem(storageKey, JSON.stringify({
      status,
      workSeconds: ws,
      breakSeconds: bs,
      startTime,
      breaks: breakHistory,
      currentBreakStart: activeBreak,
      segmentStart: segmentStartRef.current
    }));
  };

  const fetchData = async () => {
    try {
      const taskRes = await API.get('/tasks/my');
      setTasks(taskRes.data.slice(0, 4));
    } catch (err) { console.log(err); }
  };

  useEffect(() => {
    const pending = setTimeout(fetchData, 0);
    return () => clearTimeout(pending);
  }, []);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStartWork = () => {
    const now = workTime();
    setStartTime(now);
    setTimerStatus('working');
    setWorkSeconds(0);
    setBreakSeconds(0);
    setBreaks([]);
    setWorkSaved(false);
    workAccumulatedRef.current = 0;
    breakAccumulatedRef.current = 0;
    segmentStartRef.current = Date.now();
    localStorage.setItem(storageKey, JSON.stringify({
      status: 'working', workSeconds: 0, breakSeconds: 0,
      startTime: now, breaks: [], segmentStart: Date.now()
    }));
  };

  const handleBreak = () => {
    const now = workTime();
    // Freeze current work total into accumulated, start break segment
    const elapsed = segmentStartRef.current ? Math.floor((Date.now() - segmentStartRef.current) / 1000) : 0;
    workAccumulatedRef.current = workAccumulatedRef.current + elapsed;
    setWorkSeconds(workAccumulatedRef.current);
    segmentStartRef.current = Date.now();
    setCurrentBreakStart(now);
    setTimerStatus('break');
    saveToLocal(workAccumulatedRef.current, breakAccumulatedRef.current, 'break', breaks, now);
  };

  const handleResume = () => {
    const now = workTime();
    const newBreaks = [...breaks, { start: currentBreakStart, end: now }];
    setBreaks(newBreaks);
    // Freeze current break total into accumulated, start work segment
    const elapsed = segmentStartRef.current ? Math.floor((Date.now() - segmentStartRef.current) / 1000) : 0;
    breakAccumulatedRef.current = breakAccumulatedRef.current + elapsed;
    setBreakSeconds(breakAccumulatedRef.current);
    segmentStartRef.current = Date.now();
    setTimerStatus('working');
    saveToLocal(workAccumulatedRef.current, breakAccumulatedRef.current, 'working', newBreaks, null);
  };

  const handleEndWork = async (endedAt) => {
    const elapsed = segmentStartRef.current ? Math.floor((endedAt - segmentStartRef.current) / 1000) : 0;
    let finalWork = workAccumulatedRef.current;
    let finalBreak = breakAccumulatedRef.current;
    if (timerStatus === 'working') finalWork += elapsed;
    if (timerStatus === 'break') finalBreak += elapsed;

    setWorkSeconds(finalWork);
    setBreakSeconds(finalBreak);
    setTimerStatus('ended');
    clearInterval(tickRef.current);

    const draft = {
      status: 'ended',
      workSeconds: finalWork,
      breakSeconds: finalBreak,
      startTime: startTime,
      endTime: workTime(),
      breaks: timerStatus === 'break' ? [...breaks, { start: currentBreakStart, end: workTime() }] : breaks
    };
    setBreaks(draft.breaks);
    localStorage.setItem(storageKey, JSON.stringify(draft));
    await saveAttendance(draft);
  };

  const saveAttendance = async (draft) => {
    setSaving(true);
    setTimerError('');
    try {
      const { data } = await API.post('/attendance/save-timer', {
        checkIn: draft.startTime,
        workSeconds: draft.workSeconds,
        breakSeconds: draft.breakSeconds,
        breakCount: draft.breaks.length
      });
      localStorage.setItem(storageKey, JSON.stringify({ ...draft, endTime: data.checkOut, saved: true }));
      setWorkSaved(true);
    } catch (err) {
      setTimerError(err.response?.data?.message || 'Attendance could not be saved. Please retry.');
    } finally {
      setSaving(false);
    }
  };


  const statusColor = (s) => ({
    pending: { bg: '#f3f4f6', color: '#555' },
    inprogress: { bg: '#fef9c3', color: '#ca8a04' },
    done: { bg: '#dcfce7', color: '#16a34a' }
  }[s] || { bg: '#f3f4f6', color: '#555' });


  return (
    <div className="workspace">
      <WorkspaceNav />
      <main className="workspace-content">
        <div style={{ marginBottom: '1.5rem' }}>
          <h1>Welcome, {user?.name}</h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>{new Date().toDateString()}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '12px', marginBottom: '12px' }}>
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #eee', padding: '1.25rem' }}>
            <p style={{ fontWeight: '500', margin: '0 0 1rem', fontSize: '15px' }}>Work Timer</p>

            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ marginBottom: '8px' }}>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 2px' }}>Work Time</p>
                <div style={{
                  fontSize: '32px', fontWeight: '700', fontFamily: 'monospace',
                  color: timerStatus === 'working' ? '#16a34a' : timerStatus === 'ended' ? '#16a34a' : '#555'
                }}>
                  {formatTime(workSeconds)}
                </div>
              </div>

              {timerStatus !== 'idle' && (
                <div>
                  <p style={{ fontSize: '11px', color: '#888', margin: '0 0 2px' }}>Break Time</p>
                  <div style={{
                    fontSize: '20px', fontWeight: '600', fontFamily: 'monospace',
                    color: timerStatus === 'break' ? '#ca8a04' : '#aaa'
                  }}>
                    {formatTime(breakSeconds)}
                  </div>
                </div>
              )}

              <p style={{ fontSize: '12px', color: '#888', margin: '8px 0 0' }}>
                {timerStatus === 'idle' && 'Click Start Work to begin'}
                {timerStatus === 'working' && `🟢 Working • Started ${startTime}`}
                {timerStatus === 'break' && `🟡 On Break`}
                {timerStatus === 'ended' && `✅ Work ended`}
              </p>
            </div>

            {timerStatus !== 'idle' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
                <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: '#16a34a', margin: '0 0 2px' }}>Total Work</p>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#16a34a', margin: 0 }}>{Math.floor(workSeconds / 60)} min</p>
                </div>
                <div style={{ background: '#fef9c3', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: '#ca8a04', margin: '0 0 2px' }}>Total Break</p>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#ca8a04', margin: 0 }}>{Math.floor(breakSeconds / 60)} min ({breaks.length} times)</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {timerStatus === 'idle' && (
                <button onClick={handleStartWork} style={{ width: '100%', padding: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                  ▶ Start Work
                </button>
              )}
              {timerStatus === 'working' && (
                <>
                  <button onClick={handleBreak} style={{ width: '100%', padding: '10px', background: '#fef9c3', color: '#ca8a04', border: '1px solid #fde047', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                    ⏸ Take Break
                  </button>
                  <button onClick={() => handleEndWork(Date.now())} style={{ width: '100%', padding: '10px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                    ⏹ End Work
                  </button>
                </>
              )}
              {timerStatus === 'break' && (
                <button onClick={handleResume} style={{ width: '100%', padding: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                  ▶ Resume Work
                </button>
              )}
              {timerError && <p role="alert" className="login-error">{timerError}</p>}
              {timerStatus === 'ended' && !workSaved && (
                <button className="login-submit" disabled={saving} onClick={() => saveAttendance(readTimer(storageKey))}>
                  {saving ? 'Saving attendance…' : 'Retry saving attendance'}
                </button>
              )}
              {timerStatus === 'ended' && workSaved && (
                <div>
                  <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center', marginBottom: '8px' }}>
                    <p style={{ fontSize: '13px', color: '#16a34a', margin: 0, fontWeight: '500' }}>✓ Work completed!</p>
                    <p style={{ fontSize: '12px', color: '#16a34a', margin: '4px 0 0' }}>
                      Work: {Math.floor(workSeconds / 60)} min | Break: {Math.floor(breakSeconds / 60)} min
                    </p>
                  </div>
                  <button onClick={() => navigate('/employee/report')} style={{ width: '100%', padding: '9px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    📝 Submit Daily Report
                  </button>
                </div>
              )}
            </div>

            {breaks.length > 0 && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid #f5f5f5', paddingTop: '10px' }}>
                <p style={{ fontSize: '12px', color: '#888', margin: '0 0 6px' }}>Break History ({breaks.length} breaks)</p>
                {breaks.map((b, i) => (
                  <div key={i} style={{ fontSize: '11px', color: '#555', padding: '3px 0' }}>
                    Break {i + 1}: {b.start} → {b.end}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #eee', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={{ fontWeight: '500', margin: 0, fontSize: '15px' }}>My Tasks</p>
              <span onClick={() => navigate('/employee/tasks')} style={{ fontSize: '12px', color: '#16a34a', cursor: 'pointer' }}>View all</span>
            </div>
            {tasks.length === 0 ? (
              <p style={{ color: '#888', fontSize: '13px' }}>No tasks assigned yet</p>
            ) : (
              tasks.map((task) => (
                <div key={task._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '6px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>{task.title}</p>
                    <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>Due: {task.dueDate || 'No date'}</p>
                  </div>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: statusColor(task.status).bg, color: statusColor(task.status).color }}>
                    {task.status === 'inprogress' ? 'In Progress' : task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #eee', padding: '1.25rem' }}>
          <p style={{ fontWeight: '500', margin: '0 0 1rem', fontSize: '15px' }}>Quick Actions</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/employee/report')} style={{ padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Submit Daily Report</button>
            <button onClick={() => navigate('/employee/tasks')} style={{ padding: '10px 20px', background: 'white', color: '#16a34a', border: '1px solid #16a34a', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>View My Tasks</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;