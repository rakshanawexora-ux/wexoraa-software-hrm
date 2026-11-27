import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';

const notificationsPath = '/tasks/my/notifications';

export default function AssignmentNotifications() {
  const navigate = useNavigate();
  const [readError, setReadError] = useState(false);
  const [opening, setOpening] = useState(false);
  const [feed, setFeed] = useState({ items: [], unreadCount: 0 });
  const [loadError, setLoadError] = useState(false);
  const request = useRef(null);
  const panel = useRef(null);

  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;

    try {
      const { data } = await API.get(notificationsPath, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setFeed(data);
      setLoadError(false);
    } catch {
      if (!controller.signal.aborted) setLoadError(true);
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 15000);
    const initialLoad = window.setTimeout(refresh, 0);
    window.addEventListener('focus', refresh);
    return () => {
      request.current?.abort();
      window.clearInterval(interval);
      window.clearTimeout(initialLoad);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  async function openAssignment(event, item) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (item.assignmentReadAt) {
      panel.current.open = false;
      return;
    }
    event.preventDefault();
    if (opening) return;

    setOpening(true);
    setReadError(false);
    try {
      await API.put(`${notificationsPath}/${item._id}/read`);
      if (panel.current) panel.current.open = false;
      refresh();
      navigate(`/employee/tasks?task=${item._id}`);
    } catch {
      setReadError(true);
    } finally {
      setOpening(false);
    }
  }

  return (
    <details className="assignment-notifications" ref={panel} onToggle={(event) => {
      if (event.currentTarget.open) refresh();
    }}>
      <summary aria-label={`Notifications, ${feed.unreadCount} unread`}>
        <span aria-hidden="true">🔔</span>
        Notifications
        {feed.unreadCount > 0 && <span className="notification-count" aria-hidden="true">
          {feed.unreadCount > 99 ? '99+' : feed.unreadCount}
        </span>}
      </summary>
      <div className="notification-panel">
        {readError && <p role="alert">Could not open the assignment. Select it again to retry.</p>}
        {loadError && <p role="status">Unable to sync notifications. <button type="button" onClick={refresh}>Retry</button></p>}
        {!loadError && feed.items.length === 0 && <p>No task notifications yet.</p>}
        {feed.items.length > 0 && (
          <ul>
            {feed.items.map((item) => (
              <li key={item._id}>
                <Link to={`/employee/tasks?task=${item._id}`}
                  data-unread={!item.assignmentReadAt}
                  onClick={(event) => openAssignment(event, item)}>
                  <strong>{item.title}</strong>
                  <small>
                    {!item.assignmentReadAt && 'New · '}
                    {item.priority} priority
                    {item.dueDate && ` · Due ${item.dueDate}`}
                  </small>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
