// apps/web/src/pages/DashboardPage.tsx
import { useQuery } from '@tanstack/react-query';
import { getFunnel, getSummary } from '../api/dashboard';

function SummaryCard({
  label,
  count,
  value,
  colorClass,
}: {
  label: string;
  count: number;
  value: string | null;
  colorClass: string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${colorClass}`}>
      <p className="text-sm opacity-75">{label}</p>
      <p className="text-2xl font-semibold">{count}</p>
      <p className="text-sm opacity-75">${value ?? '0'}</p>
    </div>
  );
}

export function DashboardPage() {
  const { data: funnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['dashboard-funnel'],
    queryFn: getFunnel,
  });
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getSummary,
  });

  if (funnelLoading || summaryLoading) return <p>Loading dashboard...</p>;

  const maxCount = Math.max(1, ...(funnel?.map((f) => f.dealCount) ?? [1]));

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Dashboard</h1>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <SummaryCard
          label="Open Deals"
          count={summary?.open.count ?? 0}
          value={summary?.open.totalValue ?? null}
          colorClass="border-blue-200 bg-blue-50 text-blue-800"
        />
        <SummaryCard
          label="Won Deals"
          count={summary?.won.count ?? 0}
          value={summary?.won.totalValue ?? null}
          colorClass="border-green-200 bg-green-50 text-green-800"
        />
        <SummaryCard
          label="Lost Deals"
          count={summary?.lost.count ?? 0}
          value={summary?.lost.totalValue ?? null}
          colorClass="border-red-200 bg-red-50 text-red-800"
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">
        Pipeline Funnel
      </h2>
      {funnel && funnel.length === 0 && (
        <p className="text-sm text-gray-400">
          No open deals in the pipeline right now.
        </p>
      )}
      <div className="space-y-2">
        {funnel?.map((stage) => (
          <div key={stage.stageId} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm text-gray-600">
              {stage.stageName}
            </span>
            <div className="h-6 flex-1 rounded bg-gray-100">
              <div
                className="h-6 rounded bg-blue-500"
                style={{ width: `${(stage.dealCount / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-20 shrink-0 text-right text-sm text-gray-600">
              {stage.dealCount} · ${stage.totalValue ?? '0'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
