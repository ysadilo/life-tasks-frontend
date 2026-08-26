import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Task {
  id: string;
  title: string;
  status: 'backlog' | 'today' | 'needs_triage' | 'done';
}

export default function Today() {
  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tasks', { status: 'today' }],
    queryFn: () => api.get<Task[]>('/tasks?status=today'),
  });

  if (isLoading) return <p>Loading today's board…</p>;
  if (error) return <p>Couldn't load today's board. Is the API running?</p>;

  return (
    <section>
      <h1>Today</h1>
      {tasks && tasks.length === 0 && <p>Nothing on today's board — pull something in from the backlog.</p>}
      <ul>
        {tasks?.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </section>
  );
}
