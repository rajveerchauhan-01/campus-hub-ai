import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, getErrorMessage } from '../services/api';

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [forgot, setForgot] = useState(false);
  const [resetStage, setResetStage] = useState('request');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', department: '', semester: '1', code: '', newPassword: '', confirmPassword: '' });
  if (user) return <Navigate to="/dashboard" replace />;
  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try {
      if (forgot && resetStage === 'request') {
        const { data } = await api.post('/auth/forgot-password', { email: form.email });
        setNotice(data.developmentCode ? `${data.message} Development reset code: ${data.developmentCode}` : data.message);
        if (data.developmentCode) setForm(p => ({ ...p, code: data.developmentCode }));
        setResetStage('reset');
      } else if (forgot) {
        if (form.newPassword.length < 10) throw new Error('New password must be at least 10 characters.');
        if (form.newPassword !== form.confirmPassword) throw new Error('The passwords do not match.');
        const { data } = await api.post('/auth/reset-password', { email: form.email, code: form.code, newPassword: form.newPassword });
        setNotice(data.message); setForgot(false); setResetStage('request');
      } else if (isRegister) {
        await register({ ...form, semester: Number(form.semester) }); navigate('/dashboard');
      } else {
        await login({ email: form.email, password: form.password }); navigate(location.state?.from?.pathname || '/dashboard');
      }
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  }

  return <div className="auth-page">
    <Link to="/" className="auth-back"><ArrowLeft size={16}/> Back to home</Link>
    <div className="auth-visual">
      <div className="auth-visual-content">
        <div className="brand landing-brand"><div className="brand-mark"><BookOpen size={21}/></div><div><strong>Campus<span>Hub</span></strong><small>AI LEARNING SPACE</small></div></div>
        <div className="auth-message"><span className="hero-kicker"><Sparkles size={14}/> LEARN WITHOUT LIMITS</span><h1>Knowledge grows<br/>when it's <em>shared.</em></h1><p>Your academic community, your resources and your AI study companion—all in one place.</p></div>
        <div className="auth-visual-footer"><span>Discover • Share • Understand • Improve</span><span>Campus Study Hub AI</span></div>
      </div>
    </div>
    <div className="auth-panel">
      <div className="auth-form-wrap">
        <span className="eyebrow">{forgot ? 'ACCOUNT RECOVERY' : isRegister ? 'JOIN YOUR CAMPUS' : 'WELCOME BACK'}</span>
        <h2>{forgot ? resetStage === 'request' ? 'Reset your password' : 'Enter your reset code' : isRegister ? 'Create your account' : 'Sign in to your hub'}</h2>
        <p className="auth-subtitle">{forgot ? resetStage === 'request' ? 'We’ll send a reset code if an account exists.' : `Enter the code sent to ${form.email} and choose a new password.` : isRegister ? 'Build your learning space and grow with your community.' : 'Pick up where you left off. Your study space is waiting.'}</p>
        <form onSubmit={submit} className="auth-form">
          {isRegister && !forgot && <div className="auth-two"><label>First name<input name="firstName" required minLength="2" value={form.firstName} onChange={change} placeholder="First name"/></label><label>Last name<input name="lastName" required value={form.lastName} onChange={change} placeholder="Last name"/></label></div>}
          <label>Email address<input name="email" type="email" required value={form.email} onChange={change} placeholder="you@college.edu" autoComplete="email" disabled={forgot && resetStage === 'reset'}/></label>
          {isRegister && !forgot && <div className="auth-two"><label>Department<input name="department" value={form.department} onChange={change} placeholder="e.g. MCA"/></label><label>Semester<select name="semester" value={form.semester} onChange={change}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>Semester {i+1}</option>)}</select></label></div>}
          {!forgot && <label>Password<div className="password-wrap"><input name="password" type={showPassword ? 'text' : 'password'} required minLength={isRegister ? 10 : 1} value={form.password} onChange={change} placeholder={isRegister ? 'At least 10 characters' : 'Enter your password'} autoComplete={isRegister ? 'new-password' : 'current-password'}/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>}
          {forgot && resetStage === 'reset' && <><label>6-digit reset code<input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" required value={form.code} onChange={change} placeholder="Enter code"/></label><label>New password<input name="newPassword" type="password" minLength="10" required value={form.newPassword} onChange={change} placeholder="At least 10 characters"/></label><label>Confirm new password<input name="confirmPassword" type="password" minLength="10" required value={form.confirmPassword} onChange={change} placeholder="Re-enter new password"/></label></>}
          {!isRegister && !forgot && <div className="auth-inline"><span>Secure sign-in</span><button type="button" onClick={()=>{setForgot(true);setError('');setNotice('');}}>Forgot password?</button></div>}
          {error && <p className="form-error">{error}</p>}{notice && <p className="form-success">{notice}</p>}
          <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : forgot ? resetStage === 'request' ? 'Send reset code' : 'Update password' : isRegister ? 'Create account' : 'Sign in'}</button>
        </form>
        {forgot ? <p className="auth-switch"><button onClick={()=>{setForgot(false);setResetStage('request');setError('');setNotice('');}}>Back to sign in</button>{resetStage==='reset'&&<button className="reset-resend" onClick={()=>{setResetStage('request');setNotice('');}}>Use another email</button>}</p> : <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to CampusHub?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>}
        <p className="auth-note">By continuing, you agree to use shared academic resources responsibly.</p>
      </div>
    </div>
  </div>;
}
