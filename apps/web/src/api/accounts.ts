// apps/web/src/api/accounts.ts
import { apiClient } from './client';

export interface Account {
  id: string;
  name: string;
  domain: string | null;
}

export async function getAccounts(): Promise<Account[]> {
  const { data } = await apiClient.get('/accounts');
  return data;
}

export async function getAccount(id: string): Promise<Account> {
  const { data } = await apiClient.get(`/accounts/${id}`);
  return data;
}

// apps/web/src/api/accounts.ts — add this function
export async function createAccount(values: { name: string; domain: string }) {
  const { data } = await apiClient.post('/accounts', values);
  return data;
}
