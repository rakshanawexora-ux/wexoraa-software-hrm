import WorkspaceNav from '../../components/WorkspaceNav';
import { useState, useEffect } from 'react';
import API from '../../api/axios';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    try {
      const res = await API.get('/tasks/my');
      setTasks(res.data);
    } catch (err) { console.log(err); }
  };

  useEffect(() => {
    const pending = setTimeout(fetchTasks, 0);
    return () => clearTimeout(pending);
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await API.put(`/tasks/${id}/status`, { status });
      fetchTasks();
    } catch (err) { console.log(err); }
  };



  const statusColor = (s) => ({
    pending: { bg: '#f3f4f6', color: '#555' },
    inprogress: { bg: '#fef9c3', color: '#ca8a04' },
    done: { bg: '#dcfce7', color: '#16a34a' }
  }[s] || { bg: '#f3f4f6', color: '#555' });

  const priorityColor = (p) => ({
    high: { bg: '#fee2e2', color: '#dc2626' },
    medium: { bg: '#fef9c3', color: '#ca8a04' },
    low: { bg: '#f3f4f6', color: '#555' }
  }[p] || { bg: '#f3f4f6', color: '#555' });

  return (
    <div className="workspace">
      <WorkspaceNav />
      <main className="workspace-content">
        <div style={{ marginBottom: '1.25rem' }}>
          <h1>My Tasks</h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>{tasks.length} tasks assigned</p>
        </div>

        {tasks.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #eee', padding: '3rem', textAlign: 'center', color: '#888' }}>
            No tasks assigned yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.map((task) => (
              <div key={task._id} style={{ background: 'white', borderRadius: '10px', border: '1px solid #eee', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <p style={{ fontWeight: '500', margin: '0 0 4px', fontSize: '15px' }}>{task.title}</p>
                    <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>{task.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: priorityColor(task.priority).bg, color: priorityColor(task.priority).color }}>{task.priority}</span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: statusColor(task.status).bg, color: statusColor(task.status).color }}>
                      {task.status === 'inprogress' ? 'In Progress' : task.status}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f5f5f5' }}>
                  <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Due: {task.dueDate || 'No date'}</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {task.status !== 'inprogress' && task.status !== 'done' && (
                      <button onClick={() => handleStatusUpdate(task._id, 'inprogress')} style={{ padding: '5px 10px', fontSize: '12px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '6px', color: '#ca8a04', cursor: 'pointer' }}>Start</button>
                    )}
                    {task.status !== 'done' && (
                      <button onClick={() => handleStatusUpdate(task._id, 'done')} style={{ padding: '5px 10px', fontSize: '12px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '6px', color: '#16a34a', cursor: 'pointer' }}>Done</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyTasks;