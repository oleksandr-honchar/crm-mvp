// apps/web/src/pages/DealsBoardPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import { getDeals, transitionDealStage, type Deal } from '../api/deals';
import { getPipelines, getPipelineWithStages } from '../api/pipelines';

function DealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: deal.id,
  });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 10 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="mb-2 cursor-grab rounded border bg-white p-3 text-sm shadow-sm active:cursor-grabbing"
    >
      <p className="font-medium">{deal.title}</p>
      <p className="text-gray-500">${deal.value}</p>
    </div>
  );
}

function StageColumn({
  stageId,
  stageName,
  deals,
}: {
  stageId: string;
  stageName: string;
  deals: Deal[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });

  return (
    <div
      ref={setNodeRef}
      className={`w-64 shrink-0 rounded-lg border p-3 ${isOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}`}
    >
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        {stageName} <span className="text-gray-400">({deals.length})</span>
      </h3>
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} />
      ))}
    </div>
  );
}

export function DealsBoardPage() {
  const queryClient = useQueryClient();

  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: getDeals,
  });
  const { data: pipelines } = useQuery({
    queryKey: ['pipelines'],
    queryFn: getPipelines,
  });

  const firstPipelineId = pipelines?.[0]?.id;
  const { data: pipelineDetail, isLoading: stagesLoading } = useQuery({
    queryKey: ['pipeline', firstPipelineId],
    queryFn: () => getPipelineWithStages(firstPipelineId!),
    enabled: !!firstPipelineId,
  });

  const transitionMutation = useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string; stageId: string }) =>
      transitionDealStage(dealId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return; // dropped outside any column — no-op

    const dealId = active.id as string;
    const targetStageId = over.id as string;
    const deal = deals?.find((d) => d.id === dealId);

    if (!deal || deal.stageId === targetStageId) return; // no real change, skip the API call
    if (deal.status !== 'open') return; // closed deals can't move — matches the backend guard

    transitionMutation.mutate({ dealId, stageId: targetStageId });
  }

  if (dealsLoading || stagesLoading) return <p>Loading board...</p>;
  if (!pipelineDetail)
    return <p className="text-red-600">No pipeline configured yet.</p>;

  // Only open deals belong on the board — won/lost deals are outcomes, not
  // in-progress stages (same open/won/lost split covered in Day 3).
  const openDeals = deals?.filter((d) => d.status === 'open') ?? [];

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Pipeline Board</h1>
      {transitionMutation.isError && (
        <p className="mb-3 text-sm text-red-600">
          Could not move deal — try again.
        </p>
      )}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineDetail.stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stageId={stage.id}
              stageName={stage.name}
              deals={openDeals.filter((d) => d.stageId === stage.id)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
