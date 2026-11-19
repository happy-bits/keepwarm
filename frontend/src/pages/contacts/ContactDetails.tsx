import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  useContact,
  useContactInteractions,
  useCreateContactInteraction,
} from '../../api/contacts';
import type { CreateInteractionData, Interaction } from '../../api/types';
import { Button, Card, ErrorMessage, LoadingSpinner, BackButton } from '../../components/ui';
import { formInputBase, formInputBorderNormal, formLabel } from '../../utils/styles';
import { useFormSubmission } from '../../hooks/useFormSubmission';

type InteractionFormValues = Omit<CreateInteractionData, 'occurredAt'> & {
  occurredAt: string;
};

function localDateTimeValue(date = new Date()): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function InteractionForm({ contactId }: { contactId: number }) {
  const createInteraction = useCreateContactInteraction(contactId);
  const [formData, setFormData] = useState({
    occurredAt: localDateTimeValue(),
    type: 'call' as Interaction['type'],
    summary: '',
    outcome: '',
    nextStep: '',
  });

  const { error, isSubmitting, handleSubmit } = useFormSubmission<
    InteractionFormValues,
    Interaction
  >({
    onSubmit: (data) =>
      createInteraction.mutateAsync({
        ...data,
        occurredAt: new Date(data.occurredAt).toISOString(),
      }),
    onSuccess: () => {
      setFormData({
        occurredAt: localDateTimeValue(),
        type: 'call',
        summary: '',
        outcome: '',
        nextStep: '',
      });
    },
    validate: (data) => {
      if (!data.summary?.trim()) return 'Summary is required';
      if (!data.occurredAt || Number.isNaN(new Date(data.occurredAt).getTime())) {
        return 'Enter a valid interaction date and time';
      }
      return null;
    },
  });

  const onSubmit = (event: FormEvent) => {
    handleSubmit(event, {
      ...formData,
      summary: formData.summary.trim(),
      outcome: formData.outcome.trim() || null,
      nextStep: formData.nextStep.trim() || null,
    });
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-white mb-5">Record an interaction</h2>
      <form onSubmit={onSubmit} className="space-y-5">
        <ErrorMessage error={error} />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="interaction-date" className={formLabel}>Date and time</label>
            <input
              id="interaction-date"
              type="datetime-local"
              className={`${formInputBase} ${formInputBorderNormal}`}
              value={formData.occurredAt}
              onChange={(event) => setFormData({ ...formData, occurredAt: event.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="interaction-type" className={formLabel}>Type</label>
            <select
              id="interaction-type"
              className={`${formInputBase} ${formInputBorderNormal}`}
              value={formData.type}
              onChange={(event) =>
                setFormData({ ...formData, type: event.target.value as Interaction['type'] })
              }
            >
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="interaction-summary" className={formLabel}>Summary</label>
          <textarea
            id="interaction-summary"
            className={`${formInputBase} ${formInputBorderNormal} min-h-24`}
            value={formData.summary}
            onChange={(event) => setFormData({ ...formData, summary: event.target.value })}
            required
            rows={3}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="interaction-outcome" className={formLabel}>Outcome (optional)</label>
            <textarea
              id="interaction-outcome"
              className={`${formInputBase} ${formInputBorderNormal} min-h-20`}
              value={formData.outcome}
              onChange={(event) => setFormData({ ...formData, outcome: event.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="interaction-next-step" className={formLabel}>Next step (optional)</label>
            <textarea
              id="interaction-next-step"
              className={`${formInputBase} ${formInputBorderNormal} min-h-20`}
              value={formData.nextStep}
              onChange={(event) => setFormData({ ...formData, nextStep: event.target.value })}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-dark-700 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Saving...
              </span>
            ) : (
              'Save interaction'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function ContactDetails() {
  const { id: idParam } = useParams();
  const contactId = Number(idParam);
  const contactQuery = useContact(contactId);
  const interactionsQuery = useContactInteractions(contactId, !!contactQuery.data);

  if (contactQuery.isLoading) {
    return (
      <Card>
        <div className="flex justify-center p-8">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  if (contactQuery.error || !contactQuery.data) {
    return (
      <div className="space-y-5">
        <BackButton to="/contacts" />
        <ErrorMessage error={contactQuery.error?.message ?? 'Contact not found'} />
      </div>
    );
  }

  const contact = contactQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/contacts" />
        <div>
          <h1 className="text-2xl font-bold text-white">{contact.name}</h1>
          <p className="mt-1 text-dark-400">
            {[contact.company, contact.email].filter(Boolean).join(' · ') || 'Contact details'}
          </p>
        </div>
      </div>

      <InteractionForm contactId={contact.id} />

      <Card>
        <h2 className="text-lg font-semibold text-white mb-5">Interaction history</h2>
        {interactionsQuery.isLoading ? (
          <div className="flex justify-center p-8">
            <LoadingSpinner size="md" />
          </div>
        ) : interactionsQuery.error ? (
          <ErrorMessage error={interactionsQuery.error.message} />
        ) : interactionsQuery.data?.length ? (
          <ol className="divide-y divide-dark-700">
            {interactionsQuery.data.map((interaction) => (
              <li key={interaction.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-white capitalize">{interaction.type}</p>
                  <time className="text-sm text-dark-400" dateTime={interaction.occurredAt}>
                    {new Date(interaction.occurredAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-dark-200">{interaction.summary}</p>
                {interaction.outcome && (
                  <p className="mt-2 text-sm text-dark-400">
                    <span className="text-dark-300">Outcome: </span>{interaction.outcome}
                  </p>
                )}
                {interaction.nextStep && (
                  <p className="mt-1 text-sm text-dark-400">
                    <span className="text-dark-300">Next step: </span>{interaction.nextStep}
                  </p>
                )}
                <p className="mt-3 text-xs text-dark-500">Recorded by {interaction.sellerName}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-dark-400">No interactions recorded yet.</p>
        )}
      </Card>

      <div className="text-sm">
        <Link to="/contacts" className="text-dark-400 hover:text-white">Back to contacts</Link>
      </div>
    </div>
  );
}
