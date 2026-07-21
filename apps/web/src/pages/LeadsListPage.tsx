// apps/web/src/pages/LeadsListPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLeads, convertLead, deleteLead } from '../api/leads';
import { DeleteButton } from '../components/DeleteButton';
import { getPipelines, getPipelineWithStages } from '../api/pipelines';
import { Link } from 'react-router-dom';

export function LeadsListPage() {
  const queryClient = useQueryClient();
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');

  const {
    data: leads,
    isLoading,
    error,
  } = useQuery({ queryKey: ['leads'], queryFn: getLeads });
  const { data: pipelines } = useQuery({
    queryKey: ['pipelines'],
    queryFn: getPipelines,
  });

  const firstPipelineId = pipelines?.[0]?.id;
  const { data: pipelineDetail } = useQuery({
    queryKey: ['pipeline', firstPipelineId],
    queryFn: () => getPipelineWithStages(firstPipelineId!),
    enabled: !!firstPipelineId,
  });

  const convertMutation = useMutation({
    mutationFn: (leadId: string) =>
      convertLead(leadId, {
        pipelineId: firstPipelineId!,
        stageId: selectedStageId,
        dealTitle,
        dealValue: dealValue ? Number(dealValue) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setConvertingLeadId(null);
      setDealTitle('');
      setDealValue('');
    },
  });

  if (isLoading) return <p>Loading leads...</p>;
  if (error) return <p className="text-red-600">Failed to load leads.</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Leads</h1>
        <Link
          to="/leads/new"
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          + New Lead
        </Link>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">Name</th>
            <th className="py-2">Company</th>
            <th className="py-2">Status</th>
            <th className="py-2"></th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {leads?.map((lead) => (
            <tr key={lead.id} className="border-b hover:bg-gray-50">
              <td className="py-2">{lead.name}</td>
              <td className="py-2">{lead.company}</td>
              <td className="py-2">{lead.status}</td>
              <td className="py-2">
                {lead.status !== 'converted' && (
                  <button
                    onClick={() => {
                      setConvertingLeadId(lead.id);
                      setDealTitle(`${lead.company ?? lead.name} Deal`);
                    }}
                    className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                  >
                    Convert
                  </button>
                )}
              </td>
              <td className="py-2">
                <DeleteButton
                  onDelete={() => deleteLead(lead.id)}
                  invalidateKey="leads"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {convertingLeadId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm space-y-3 rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Convert Lead</h2>
            <input
              type="text"
              placeholder="Deal title"
              value={dealTitle}
              onChange={(e) => setDealTitle(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Deal value"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
            />
            <select
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              <option value="">Select stage</option>
              {pipelineDetail?.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConvertingLeadId(null)}
                className="rounded px-3 py-1.5 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => convertMutation.mutate(convertingLeadId)}
                disabled={
                  !selectedStageId || !dealTitle || convertMutation.isPending
                }
                className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {convertMutation.isPending ? 'Converting...' : 'Convert'}
              </button>
            </div>
            {convertMutation.isError && (
              <p className="text-xs text-red-600">
                Conversion failed — check the fields.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
