import { BookOpen } from 'lucide-react';
export default function EmptyState({ title = 'Nothing here yet', text = 'Your resources will appear here when you add them.', action }) { return <div className="empty-state"><div className="empty-icon"><BookOpen size={24}/></div><h3>{title}</h3><p>{text}</p>{action}</div>; }
