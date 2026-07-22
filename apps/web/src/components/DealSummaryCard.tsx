// apps/web/src/components/DealSummaryCard.tsx
import { useMutation } from '@tanstack/react-query';
import { summarizeDeal, type DealSummary } from '../api/ai';

export function DealSummaryCard({ dealId }: { dealId: string }) {
  const mutation = useMutation({
    mutationFn: () => summarizeDeal(dealId),
  });

  const summary: DealSummary | undefined = mutation.data;

  return (
    <div className="mb-6 rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">AI Summary</h2>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rounded bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Generating...' : summary ? 'Regenerate' : '✨ Generate Summary'}
        </button>
      </div>

      {mutation.isError && <p className="text-sm text-red-600">Failed to generate summary — try again.</p>}

      {summary && (
        <div className="space-y-3 text-sm">
          <p className="text-gray-700">{summary.summary}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500">Pain Points</p>
              <p className="text-gray-700">{summary.painPoints}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Next Steps</p>
              <p className="text-gray-700">{summary.nextSteps}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Close Likelihood</p>
            <p className="font-medium text-gray-800">{summary.closeLikelihood}</p>
          </div>
        </div>
      )}

      {!summary && !mutation.isPending && (
        <p className="text-sm text-gray-400">Click "Generate Summary" to get an AI-powered overview of this deal.</p>
      )}
    </div>
  );
}