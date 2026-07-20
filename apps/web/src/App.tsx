// apps/web/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ContactsListPage } from './pages/ContactsListPage';
import { ContactDetailPage } from './pages/ContactDetailPage';
import { AccountsListPage } from './pages/AccountsListPage';
import { AccountDetailPage } from './pages/AccountDetailPage';
import { DealsListPage } from './pages/DealsListPage';
import { ContactCreatePage } from './pages/ContactCreatePage';
import { AccountCreatePage } from './pages/AccountCreatePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/contacts" element={<ContactsListPage />} />
            <Route path="/contacts/:id" element={<ContactDetailPage />} />
            <Route path="/accounts" element={<AccountsListPage />} />
            <Route path="/accounts/:id" element={<AccountDetailPage />} />
            <Route path="/deals" element={<DealsListPage />} />
            <Route path="/contacts/new" element={<ContactCreatePage />} />
            <Route path="/accounts/new" element={<AccountCreatePage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
