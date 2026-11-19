import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import MyNotesPage from './pages/MyNotesPage';
import CommunityPage from './pages/CommunityPage';
import NoteDetailsPage from './pages/NoteDetailsPage';
import AIStudyPage from './pages/AIStudyPage';
import QuizzesPage from './pages/QuizzesPage';
import FlashcardsPage from './pages/FlashcardsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import TeacherPage from './pages/TeacherPage';
import LeaderboardPage from './pages/LeaderboardPage';
import NotificationsPage from './pages/NotificationsPage';
import PublicProfilePage from './pages/PublicProfilePage';
import AssignmentsPage from './pages/AssignmentsPage';
import SavedNotesPage from './pages/SavedNotesPage';
import './styles/global.css';

function AppRoutes(){
  return <Routes>
    <Route path="/" element={<LandingPage/>}/>
    <Route path="/login" element={<AuthPage mode="login"/>}/>
    <Route path="/register" element={<AuthPage mode="register"/>}/>
    <Route element={<ProtectedRoute/>}>
      <Route element={<AppShell/>}>
        <Route path="/dashboard" element={<DashboardPage/>}/>
        <Route path="/my-notes" element={<MyNotesPage/>}/>
        <Route path="/saved" element={<SavedNotesPage/>}/>
        <Route path="/community" element={<CommunityPage/>}/>
        <Route path="/assignments" element={<AssignmentsPage/>}/>
        <Route path="/notes/:id" element={<NoteDetailsPage/>}/>
        <Route path="/ai-study" element={<AIStudyPage/>}/>
        <Route path="/quizzes" element={<QuizzesPage/>}/>
        <Route path="/flashcards" element={<FlashcardsPage/>}/>
        <Route path="/profile" element={<ProfilePage/>}/>
        <Route path="/profile/:id" element={<PublicProfilePage/>}/>
        <Route path="/leaderboard" element={<LeaderboardPage/>}/>
        <Route path="/notifications" element={<NotificationsPage/>}/>
        <Route path="/teacher" element={<ProtectedRoute roles={['teacher','admin']}/> }>
          <Route index element={<TeacherPage/>}/>
        </Route>
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}/> }>
          <Route index element={<AdminPage/>}/>
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<LandingPage/>}/>
  </Routes>;
}
export default function App(){return <BrowserRouter><AuthProvider><AppRoutes/></AuthProvider></BrowserRouter>;}
