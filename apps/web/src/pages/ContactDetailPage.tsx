// apps/web/src/pages/ContactDetailPage.tsx
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getContact } from '../api/contacts';

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    data: contact,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => getContact(id!),
    enabled: !!id,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error || !contact)
    return <p className="text-red-600">Contact not found.</p>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">
        {contact.firstName} {contact.lastName}
      </h1>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-gray-500">Email</dt>
          <dd>{contact.email ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Phone</dt>
          <dd>{contact.phone ?? '—'}</dd>
        </div>
      </dl>
    </div>
  );
}
