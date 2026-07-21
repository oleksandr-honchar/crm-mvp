// apps/web/src/pages/DealCreatePage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createDeal } from '../api/deals';
import { getPipelines, getPipelineWithStages } from '../api/pipelines';

export function DealCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [stageId, setStageId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: pipelines } = useQuery({ queryKey: ['pipelines'], queryFn: getPipelines });
  const firstPipelineId = pipelines?.[0]?.id;
  const { data: pipelineDetail } = useQuery({
    queryKey: ['pipeline', firstPipelineId],
    queryFn: () => getPipelineWithStages(firstPipelineId!),
    enabled: !!firstPipelineId,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createDeal({ title, pipelineId: firstPipelineId!, stageId, value: value ? Number (value) : undefined });
      navigate('/deals');
    } catch {
      setError('Failed to create deal — check the fields.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">New Deal</h1>
      <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="mb-1 block text-sm text-gray-600">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded border px-3 py-2" required />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Value</label>
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Stage</label>
          <select value={stageId} onChange={(e) => setStageId(e.target.value)} className="w-full rounded border px-3 py-2" required>
            <option value="">Select stage</option>
            {pipelineDetail?.stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Create Deal'}
        </button>
      </form>
    </div>
  );
}