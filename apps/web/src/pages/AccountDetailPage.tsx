// apps/web/src/pages/ContactDetailPage.tsx
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getAccount } from '../api/accounts';

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    data: account,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['account', id],
    queryFn: () => getAccount(id!),
    enabled: !!id,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error || !account)
    return <p className="text-red-600">Account not found.</p>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{account.name}</h1>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-gray-500">Domain</dt>
          <dd>{account.domain ?? '—'}</dd>
        </div>
      </dl>
    </div>
  );
}
