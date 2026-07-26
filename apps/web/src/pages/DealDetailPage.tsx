// apps/web/src/pages/DealDetailPage.tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDeal,
  getDealTimeline,
  markDealWon,
  markDealLost,
} from '../api/deals';
import { createActivity } from '../api/activities';
import { ActivityBadge } from '../components/ActivityBadge';
import { AiSidebar } from '../components/AiSidebar';
import { DealSummaryCard } from '../components/DealSummaryCard';

export function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [noteBody, setNoteBody] = useState('');

  const {
    data: deal,
    isLoading: dealLoading,
    error: dealError,
  } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => getDeal(id!),
    enabled: !!id,
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['deal-timeline', id],
    queryFn: () => getDealTimeline(id!),
    enabled: !!id,
  });

  const wonMutation = useMutation({
    mutationFn: () => markDealWon(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', id] });
      queryClient.invalidateQueries({ queryKey: ['deal-timeline', id] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const lostMutation = useMutation({
    mutationFn: () => markDealLost(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', id] });
      queryClient.invalidateQueries({ queryKey: ['deal-timeline', id] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: () =>
      createActivity({
        entityType: 'deal',
        entityId: id!,
        type: 'note',
        body: noteBody,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-timeline', id] });
      setNoteBody('');
    },
  });

  if (dealLoading) return <p>Loading deal...</p>;
  if (dealError || !deal)
    return <p className="text-red-600">Deal not found.</p>;

  return (
    <>
      <div className="max-w-2xl pb-24">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">{deal.title}</h1>
            <p className="text-gray-500">
              ${deal.value} {deal.currency}
            </p>
          </div>
          {deal.status === 'open' ? (
            <div className="flex gap-2">
              <button
                onClick={() => wonMutation.mutate()}
                disabled={wonMutation.isPending}
                className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
              >
                Mark Won
              </button>
              <button
                onClick={() => lostMutation.mutate()}
                disabled={lostMutation.isPending}
                className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                Mark Lost
              </button>
            </div>
          ) : (
            <span
              className={`rounded px-3 py-1.5 text-sm font-medium ${deal.status === 'won' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
            >
              {deal.status}
            </span>
          )}
        </div>

        <div className="mb-6 rounded border p-3">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Add a note
          </label>
          <textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            rows={2}
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Client confirmed budget approval..."
          />
          <button
            onClick={() => addNoteMutation.mutate()}
            disabled={!noteBody.trim() || addNoteMutation.isPending}
            className="mt-2 rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
          </button>
          {addNoteMutation.isError && (
            <p className="mt-1 text-xs text-red-600">Failed to add note.</p>
          )}
        </div>

        {deal && (
          <DealSummaryCard key={timeline?.length ?? 0} dealId={deal.id} />
        )}

        <h2 className="mb-3 text-sm font-semibold text-gray-700">Timeline</h2>
        {timelineLoading && (
          <p className="text-sm text-gray-500">Loading timeline...</p>
        )}
        {timeline && timeline.length === 0 && (
          <p className="text-sm text-gray-400">No activity yet.</p>
        )}
        <ul className="space-y-3">
          {timeline?.map((activity) => (
            <li key={activity.id} className="rounded border p-3 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <ActivityBadge type={activity.type} />
                <span className="text-xs text-gray-400">
                  {new Date(activity.createdAt).toLocaleString()}
                </span>
              </div>
              {activity.body && (
                <p className="text-gray-700">{activity.body}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
      {deal && <AiSidebar dealId={deal.id} />}
    </>
  );
}
