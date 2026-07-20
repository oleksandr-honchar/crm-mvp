// apps/web/src/components/EntityForm.tsx
import { useState } from 'react';

interface FieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel';
}

interface EntityFormProps<T extends Record<string, string>> {
  fields: FieldConfig[];
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  submitLabel: string;
}

export function EntityForm<T extends Record<string, string>>({
  fields,
  initialValues,
  onSubmit,
  submitLabel,
}: EntityFormProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(values);
    } catch {
      setError('Save failed. Check the fields and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {fields.map((f) => (
        <div key={f.name}>
          <label className="mb-1 block text-sm text-gray-600">{f.label}</label>
          <input
            type={f.type ?? 'text'}
            value={values[f.name] ?? ''}
            onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
            className="w-full rounded border px-3 py-2"
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
