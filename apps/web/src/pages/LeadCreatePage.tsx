// apps/web/src/pages/LeadCreatePage.tsx
import { useNavigate } from 'react-router-dom';
import { EntityForm } from '../components/EntityForm';
import { createLead } from '../api/leads';

export function LeadCreatePage() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">New Lead</h1>
      <EntityForm
        fields={[
          { name: 'name', label: 'Name' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'company', label: 'Company' },
          { name: 'source', label: 'Source' },
        ]}
        initialValues={{ name: '', email: '', company: '', source: '' }}
        onSubmit={async (values) => {
          await createLead(values);
          navigate('/leads');
        }}
        submitLabel="Create Lead"
      />
    </div>
  );
}
