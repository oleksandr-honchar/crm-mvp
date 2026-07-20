// apps/web/src/pages/ContactCreatePage.tsx
import { useNavigate } from 'react-router-dom';
import { EntityForm } from '../components/EntityForm';
import { createContact } from '../api/contacts';

export function ContactCreatePage() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">New Contact</h1>
      <EntityForm
        fields={[
          { name: 'firstName', label: 'First Name' },
          { name: 'lastName', label: 'Last Name' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'phone', label: 'Phone', type: 'tel' },
        ]}
        initialValues={{ firstName: '', lastName: '', email: '', phone: '' }}
        onSubmit={async (values) => {
          await createContact(values);
          navigate('/contacts');
        }}
        submitLabel="Create Contact"
      />
    </div>
  );
}
