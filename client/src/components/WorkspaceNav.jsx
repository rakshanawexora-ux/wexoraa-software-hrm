import AssignmentNotifications from './AssignmentNotifications';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';

const adminLinks = [
  ['Dashboard', 'dashboard', '◫'],
  ['Employees', 'employees', '♙'],
  ['Attendance', 'attendance', '◷'],
  ['Tasks', 'tasks', '✓'],
  ['Reports', 'reports', '▤'],
  ['Analytics', 'analytics', '▥'],
];

const employeeLinks = [
  ['Dashboard', 'dashboard', '◫'],
  ['My Tasks', 'tasks', '✓'],
  ['Daily Report', 'report', '▤'],
];

export default function WorkspaceNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const admin = user.role === 'admin';

  return (
    <aside className="workspace-nav">
      <NavLink className="workspace-brand" to={`/${user.role}/dashboard`}>
        <span aria-hidden="true">W</span>
        <div>Wexoraa<small>INFOTECH</small></div>
      </NavLink>
      <nav aria-label={admin ? 'Admin navigation' : 'Employee navigation'}>
        {(admin ? adminLinks : employeeLinks).map(([label, route, icon]) => (
          <NavLink end to={`/${user.role}/${route}`} key={route}>
            <span aria-hidden="true">{icon}</span>{label}
          </NavLink>
        ))}
      </nav>
      {!admin && <AssignmentNotifications />}
      <div className="workspace-account">
        <span className="avatar" aria-hidden="true">{user.name?.[0]?.toUpperCase()}</span>
        <div><strong>{user.name}</strong><small>{admin ? 'Administrator' : 'Employee'}</small></div>
        <button type="button" onClick={() => { logout(); navigate('/login', { replace: true }); }}>Sign out</button>
      </div>
    </aside>
  );
}
