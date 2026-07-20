// apps/web/src/pages/DealsListPage.tsx
import { useQuery } from '@tanstack/react-query';
import { getDeals } from '../api/deals';

export function DealsListPage() {
  const {
    data: deals,
    isLoading,
    error,
  } = useQuery({ queryKey: ['deals'], queryFn: getDeals });

  if (isLoading) return <p>Loading deals...</p>;
  if (error) return <p className="text-red-600">Failed to load deals.</p>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Deals</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">Title</th>
            <th className="py-2">Value</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {deals?.map((d) => (
            <tr key={d.id} className="border-b hover:bg-gray-50">
              <td className="py-2">{d.title}</td>
              <td className="py-2">${d.value}</td>
              <td className="py-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    d.status === 'won'
                      ? 'bg-green-100 text-green-700'
                      : d.status === 'lost'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {d.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
