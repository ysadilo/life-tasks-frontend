import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: 'backlog' | 'today' | 'needs_triage' | 'done';
}

export default function Backlog() {
  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tasks', { status: 'backlog' }],
    queryFn: () => api.get<Task[]>('/tasks?status=backlog'),
  });

  if (isLoading) return <p>Loading backlog…</p>;
  if (error) return <p>Couldn't load the backlog. Is the API running?</p>;

  return (
    <section>
      <h1>Backlog</h1>
      {tasks && tasks.length === 0 && <p>Nothing here yet — add a task to get started.</p>}
      <ul>
        {tasks?.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </section>
  );
}
