import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Task {
  id: string;
  title: string;
  dueDate: string | null;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export default function Calendar() {
  const from = startOfWeek(new Date()).toISOString().slice(0, 10);
  const to = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().slice(0, 10);

  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tasks', { from, to }],
    queryFn: () => api.get<Task[]>(`/tasks?from=${from}&to=${to}`),
  });

  if (isLoading) return <p>Loading this week…</p>;
  if (error) return <p>Couldn't load the calendar. Is the API running?</p>;

  return (
    <section>
      <h1>Week / Month</h1>
      <p>
        Showing tasks due {from} – {to}.
      </p>
      <ul>
        {tasks?.map((task) => (
          <li key={task.id}>
            {task.dueDate?.slice(0, 10)} — {task.title}
          </li>
        ))}
      </ul>
    </section>
  );
}
