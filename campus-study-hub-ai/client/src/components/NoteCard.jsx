import { BookOpen, Download, Star, Bookmark, FileText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NoteCard({ note, onBookmark, bookmarked = false }) {
  const uploaderId = note.uploader?._id || note.uploader;
  const uploaderName = note.uploader?.firstName ? `${note.uploader.firstName} ${note.uploader.lastName || ''}` : 'Your resource';
  const ext = note.file?.originalName?.split('.').pop()?.toUpperCase() || 'FILE';
  return <article className="note-card">
    <div className="note-card-top"><div className="file-badge"><FileText size={21} /></div><span className="file-type">{ext}</span></div>
    <div className="note-meta"><span>{note.subject}</span><span>Semester {note.semester}</span></div>
    <Link to={`/notes/${note._id}`} className="note-title">{note.title}</Link>
    <p className="note-description">{note.description || 'Academic resource shared with the campus community.'}</p>
    <div className="tag-row">{(note.tags || []).slice(0, 3).map(tag => <span className="tag" key={tag}>#{tag}</span>)}</div>
    <div className="note-card-footer">
      {uploaderId ? <Link to={`/profile/${uploaderId}`} className="uploader"><span className="avatar tiny">{note.uploader?.firstName?.[0] || 'S'}</span><span>{uploaderName}</span>{note.status === 'verified' && <ShieldCheck size={14} className="verified-icon" />}</Link> : <div className="uploader"><span className="avatar tiny">S</span><span>Your resource</span></div>}
      <div className="note-stats"><span><Download size={14}/>{note.downloads || 0}</span><span><Star size={14}/>{Number(note.averageRating || 0).toFixed(1)}</span></div>
    </div>
    {onBookmark && <button className={`bookmark-float ${bookmarked ? 'active' : ''}`} aria-label="Bookmark note" onClick={() => onBookmark(note._id)}><Bookmark size={17} fill={bookmarked ? 'currentColor' : 'none'} /></button>}
  </article>;
}
