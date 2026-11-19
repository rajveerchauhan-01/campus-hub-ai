import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, Library, Compass, BrainCircuit, Layers3, UserRound, ShieldCheck, GraduationCap, LogOut, Menu, Bell, Plus, ChevronRight, Flame, Trophy, X, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AppShell() {
  const { user, logout } = useAuth(); const [open, setOpen] = useState(false); const navigate = useNavigate();
  const links = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/my-notes', label: 'My notes', icon: Library },
    { to: '/saved', label: 'Saved resources', icon: Bookmark },
    { to: '/community', label: 'Explore resources', icon: Compass },
    { to: '/assignments', label: 'Assignments', icon: GraduationCap },
    { to: '/ai-study', label: 'AI study space', icon: BrainCircuit },
    { to: '/quizzes', label: 'My quizzes', icon: Layers3 },
    { to: '/flashcards', label: 'Flashcards', icon: BookOpen },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'My profile', icon: UserRound }
  ];
  if (user?.role === 'teacher' || user?.role === 'admin') links.splice(5, 0, { to: '/teacher', label: 'Teaching space', icon: GraduationCap });
  if (user?.role === 'admin') links.push({ to: '/admin', label: 'Administration', icon: ShieldCheck });
  async function handleLogout() { await logout(); navigate('/login'); }
  return <div className="app-shell">
    {open && <button className="mobile-scrim" onClick={() => setOpen(false)} aria-label="Close menu" />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><BookOpen size={21}/></div><div><strong>Campus<span>Hub</span></strong><small>AI LEARNING SPACE</small></div><button className="mobile-close icon-button" onClick={() => setOpen(false)}><X/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav">{links.map(({to,label,icon:Icon}) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18}/><span>{label}</span>{to === '/ai-study' && <span className="nav-new">AI</span>}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="streak-card"><div className="streak-icon"><Flame size={18}/></div><div><strong>{user?.streak || 0} day streak</strong><small>Keep your learning rhythm</small></div><ChevronRight size={15}/></div><div className="profile-mini"><div className="avatar">{user?.firstName?.[0] || 'U'}</div><div className="profile-mini-info"><strong>{user?.firstName} {user?.lastName}</strong><span>{user?.role || 'student'} · {user?.department || 'Campus member'}</span></div><button className="icon-button logout-button" title="Sign out" onClick={handleLogout}><LogOut size={17}/></button></div></div>
    </aside>
    <main className="main-area"><header className="topbar"><button className="mobile-menu icon-button" onClick={() => setOpen(true)}><Menu/></button><div className="breadcrumbs">Workspace <span>/</span> <strong>Learning hub</strong></div><div className="topbar-right"><div className="semester-pill"><span className="pulse-dot"/> Your learning space</div><NavLink to="/notifications" className="icon-button notification-button" title="Notifications"><Bell size={18}/></NavLink><NavLink to="/profile" className="avatar top-avatar">{user?.firstName?.[0] || 'U'}</NavLink></div></header><div className="page-content"><Outlet /></div></main>
  </div>;
}
