// apps/web/src/pages/AccountsListPage.tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAccounts, deleteAccount } from '../api/accounts';
import { DeleteButton } from '../components/DeleteButton';

export function AccountsListPage() {
  const {
    data: accounts,
    isLoading,
    error,
  } = useQuery({ queryKey: ['accounts'], queryFn: getAccounts });

  if (isLoading) return <p>Loading accounts...</p>;
  if (error) return <p className="text-red-600">Failed to load accounts.</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Accounts</h1>
        <Link
          to="/accounts/new"
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          + New Account
        </Link>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">Name</th>
            <th className="py-2">Domain</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {accounts?.map((acc) => (
            <tr key={acc.id} className="border-b hover:bg-gray-50">
              <td className="py-2">
                <Link
                  to={`/accounts/${acc.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {acc.name}
                </Link>
              </td>
              <td className="py-2">{acc.domain}</td>
              <td className="py-2">
                <DeleteButton
                  onDelete={() => deleteAccount(acc.id)}
                  invalidateKey="accounts"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
