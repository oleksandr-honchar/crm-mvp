// apps/web/src/pages/AccountCreatePage.tsx
import { useNavigate } from 'react-router-dom';
import { EntityForm } from '../components/EntityForm';
import { createAccount } from '../api/accounts';

export function AccountCreatePage() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">New Account</h1>
      <EntityForm
        fields={[
          { name: 'name', label: 'Account Name' },
          { name: 'domain', label: 'Domain' },
        ]}
        initialValues={{ name: '', domain: '' }}
        onSubmit={async (values) => {
          await createAccount(values);
          navigate('/accounts');
        }}
        submitLabel="Create Account"
      />
    </div>
  );
}
