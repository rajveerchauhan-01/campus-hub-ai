import { useEffect, useState } from 'react';
import { FilePlus2, Search, SlidersHorizontal } from 'lucide-react';
import { api, getErrorMessage } from '../services/api';
import NoteForm from '../components/NoteForm';
import NoteCard from '../components/NoteCard';
import EmptyState from '../components/EmptyState';
export default function MyNotesPage() {
  const [notes,setNotes]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [showForm,setShowForm]=useState(false); const [editingNote,setEditingNote]=useState(null); const [filter,setFilter]=useState('all'); const [query,setQuery]=useState('');
  const load=()=>{setLoading(true);api.get('/notes/mine').then(({data})=>setNotes(data.notes)).catch(e=>setError(getErrorMessage(e))).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[]);
  const filtered=notes.filter(n=>(filter==='all'||n.status===filter)&&`${n.title} ${n.subject}`.toLowerCase().includes(query.toLowerCase()));
  async function remove(id){if(!window.confirm('Move this note out of the active library?'))return;try{await api.delete(`/notes/${id}`);load();}catch(e){setError(getErrorMessage(e));}}
  return <div className="page-stack"><div className="page-heading"><div><span className="eyebrow">YOUR PERSONAL LIBRARY</span><h1>My notes</h1><p>Keep your academic resources organized and ready whenever you need them.</p></div><button className="button button-primary" onClick={()=>{setEditingNote(null);setShowForm(true);}}><FilePlus2 size={17}/> Upload resource</button></div>
    <div className="toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your uploads…"/></div><div className="filter-control"><SlidersHorizontal size={16}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option><option value="verified">Verified</option><option value="pending">Pending review</option><option value="rejected">Needs changes</option></select></div><span className="result-count">{filtered.length} resources</span></div>
    {error&&<div className="inline-error">{error}</div>}{loading?<div className="page-loader"><span className="spinner"/>Loading your notes…</div>:filtered.length?<div className="note-grid">{filtered.map(note=><div className="note-card-wrap" key={note._id}><NoteCard note={note}/><div className="note-owner-actions"><span className={`status-pill status-${note.status}`}>{note.status}</span><div><button onClick={()=>{setEditingNote(note);setShowForm(true);}} className="text-action">Edit</button><button onClick={()=>remove(note._id)} className="text-danger">Delete</button></div></div></div>)}</div>:<EmptyState title="No matching resources" text={query?'Try another search or status filter.':'Upload class notes, a syllabus or a question paper to start your library.'} action={<button className="button button-primary small-button" onClick={()=>{setEditingNote(null);setShowForm(true);}}><FilePlus2 size={15}/> Upload your first resource</button>}/>}
    {showForm&&<NoteForm note={editingNote} onClose={()=>{setShowForm(false);setEditingNote(null);}} onSaved={load}/>}</div>;
}
