import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { Contact, CreateContactData, CreateInteractionData, Interaction } from './types';

// API functions
export async function getContacts(): Promise<Contact[]> {
  const response = await apiClient.get<{ contacts: Contact[] }>('/api/contacts');
  return response.contacts;
}

export async function getContact(id: number): Promise<Contact> {
  const response = await apiClient.get<{ contact: Contact }>(`/api/contacts/${id}`);
  return response.contact;
}

export async function getContactInteractions(id: number): Promise<Interaction[]> {
  const response = await apiClient.get<{ interactions: Interaction[] }>(
    `/api/contacts/${id}/interactions`
  );
  return response.interactions;
}

export async function createContact(data: CreateContactData): Promise<Contact> {
  const response = await apiClient.post<{ contact: Contact }>('/api/contacts', data);
  return response.contact;
}

export async function createContactInteraction(
  id: number,
  data: CreateInteractionData
): Promise<Interaction> {
  const response = await apiClient.post<{ interaction: Interaction }>(
    `/api/contacts/${id}/interactions`,
    data
  );
  return response.interaction;
}

export async function deleteContact(id: number): Promise<void> {
  await apiClient.delete(`/api/contacts/${id}`);
}

// React Query hooks
export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  });
}

export function useContact(id: number) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: () => getContact(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useContactInteractions(id: number, enabled = true) {
  return useQuery({
    queryKey: ['contacts', id, 'interactions'],
    queryFn: () => getContactInteractions(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useCreateContactInteraction(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInteractionData) => createContactInteraction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', id, 'interactions'] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
