// apps/web/src/components/ActivityBadge.tsx
const typeStyles: Record<string, string> = {
  note: 'bg-gray-100 text-gray-700',
  call: 'bg-purple-100 text-purple-700',
  email: 'bg-blue-100 text-blue-700',
  meeting: 'bg-amber-100 text-amber-700',
  task: 'bg-teal-100 text-teal-700',
  stage_change: 'bg-indigo-100 text-indigo-700',
};

export function ActivityBadge({ type }: { type: string }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${typeStyles[type] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {type.replace('_', ' ')}
    </span>
  );
}
