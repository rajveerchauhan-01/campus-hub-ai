import { useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { api, getErrorMessage } from '../services/api';

export default function NoteForm({ onClose, onSaved, note = null }) {
  const [form, setForm] = useState(() => ({ title: note?.title || '', description: note?.description || '', subject: note?.subject || '', branch: note?.branch || '', semester: String(note?.semester || '1'), tags: (note?.tags || []).join(', '), visibility: note?.visibility || 'public', type: note?.type || 'notes' }));
  const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  async function submit(e) {
    e.preventDefault(); setError('');
    if (!file && !note) return setError('Choose a PDF, DOCX, PPT, PPTX or TXT file.');
    const data = new FormData(); Object.entries(form).forEach(([key, value]) => data.append(key, value)); if (file) data.append('file', file);
    setBusy(true);
    try { if (note?._id) await api.patch(`/notes/${note._id}`, data); else await api.post('/notes', data); onSaved?.(); onClose?.(); }
    catch (err) { setError(getErrorMessage(err)); } finally { setBusy(false); }
  }
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose?.()}><section className="modal-card"><div className="modal-heading"><div><p className="eyebrow">CONTRIBUTE TO YOUR CAMPUS</p><h2>{note ? 'Edit study material' : 'Upload study material'}</h2></div><button className="icon-button" onClick={onClose}><X/></button></div>
    <form className="form-grid" onSubmit={submit}>
      <label className="full">Title<input name="title" required minLength="3" maxLength="160" value={form.title} onChange={change} placeholder="e.g. DBMS Unit 1 Notes" /></label>
      <label>Subject<input name="subject" required value={form.subject} onChange={change} placeholder="Database Management" /></label>
      <label>Semester<select name="semester" value={form.semester} onChange={change}>{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>Semester {i+1}</option>)}</select></label>
      <label>Branch<input name="branch" value={form.branch} onChange={change} placeholder="Computer Science" /></label>
      <label>Resource type<select name="type" value={form.type} onChange={change}><option value="notes">Notes</option><option value="syllabus">Syllabus</option><option value="assignment">Assignment</option><option value="question-paper">Question paper</option><option value="lab-manual">Lab manual</option><option value="other">Other</option></select></label>
      <label className="full">Description<textarea name="description" rows="3" value={form.description} onChange={change} placeholder="What does this resource cover?" /></label>
      <label className="full">Tags <span className="muted-inline">(comma separated)</span><input name="tags" value={form.tags} onChange={change} placeholder="normalization, sql, dbms" /></label>
      <label>Visibility<select name="visibility" value={form.visibility} onChange={change}><option value="public">Public — community</option><option value="private">Private — only me</option></select></label>
      <label className="upload-field full"><UploadCloud size={23}/><strong>{file ? file.name : note ? `Current file: ${note.file?.originalName || 'Existing file'} (choose replacement optionally)` : 'Choose your study material'}</strong><span>PDF, DOCX, PPT, PPTX or TXT · max 20 MB</span><input type="file" accept=".pdf,.docx,.ppt,.pptx,.txt" onChange={e => setFile(e.target.files?.[0] || null)} /></label>
      {error && <p className="form-error full">{error}</p>}
      <div className="modal-actions full"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? (note ? 'Saving…' : 'Uploading…') : (note ? 'Save changes' : 'Upload resource')}</button></div>
    </form></section></div>;
}
