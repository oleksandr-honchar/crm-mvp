// apps/web/src/components/AiSidebar.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { askAi, type ChatSource } from '../api/ai';

interface AiSidebarProps {
  dealId: string;
}

interface ChatEntry {
  question: string;
  answer: string;
  sources: ChatSource[];
}

export function AiSidebar({ dealId }: AiSidebarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<ChatEntry[]>([]);

  const mutation = useMutation({
    mutationFn: (q: string) => askAi(q, dealId),
    onSuccess: (response, q) => {
      setHistory((h) => [
        ...h,
        { question: q, answer: response.answer, sources: response.sources },
      ]);
    },
  });

  function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || mutation.isPending) return;
    const currentQuery = query;
    setQuery('');
    mutation.mutate(currentQuery);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 rounded-full bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-indigo-700"
      >
        ✨ Ask AI
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 flex h-[32rem] w-96 flex-col rounded-lg border bg-white shadow-xl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-800">AI Assistant</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {history.length === 0 && (
          <p className="text-sm text-gray-400">
            Ask about this deal — e.g. "What's the client's main concern?" or
            "What are the next steps?"
          </p>
        )}
        {history.map((entry, i) => (
          <div key={i} className="space-y-1.5">
            <p className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
              {entry.question}
            </p>
            <p className="text-sm text-gray-900">{entry.answer}</p>
            {entry.sources.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {entry.sources.map((s, si) => (
                  <span
                    key={s.id}
                    title={s.body ?? ''}
                    className="cursor-help rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-600"
                  >
                    [{si + 1}] {s.type}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {mutation.isPending && (
          <p className="text-sm text-gray-400 italic">Thinking...</p>
        )}
        {mutation.isError && (
          <p className="text-sm text-red-600">
            Something went wrong — try again.
          </p>
        )}
      </div>

      <form onSubmit={handleAsk} className="flex gap-2 border-t p-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 rounded border px-3 py-1.5 text-sm"
          disabled={mutation.isPending}
        />
        <button
          type="submit"
          disabled={!query.trim() || mutation.isPending}
          className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
