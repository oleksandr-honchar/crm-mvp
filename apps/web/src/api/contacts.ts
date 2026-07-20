// apps/web/src/api/contacts.ts
import { apiClient } from './client';

export interface Contact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  accountId: string | null;
}

export async function getContacts(): Promise<Contact[]> {
  const { data } = await apiClient.get('/contacts');
  return data;
}

export async function getContact(id: string): Promise<Contact> {
  const { data } = await apiClient.get(`/contacts/${id}`);
  return data;
}

export async function createContact(values: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}) {
  const { data } = await apiClient.post('/contacts', values);
  return data;
}
