// apps/web/src/pages/ContactsListPage.tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getContacts } from '../api/contacts';

export function ContactsListPage() {
  const {
    data: contacts,
    isLoading,
    error,
  } = useQuery({ queryKey: ['contacts'], queryFn: getContacts });

  if (isLoading) return <p>Loading contacts...</p>;
  if (error) return <p className="text-red-600">Failed to load contacts.</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Contacts</h1>
        <Link
          to="/contacts/new"
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          + New Contact
        </Link>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Phone</th>
          </tr>
        </thead>
        <tbody>
          {contacts?.map((c) => (
            <tr key={c.id} className="border-b hover:bg-gray-50">
              <td className="py-2">
                <Link
                  to={`/contacts/${c.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {c.firstName} {c.lastName}
                </Link>
              </td>
              <td className="py-2">{c.email}</td>
              <td className="py-2">{c.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
