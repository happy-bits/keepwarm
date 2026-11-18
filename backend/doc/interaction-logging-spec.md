# Contact Interaction Logging Spec

## Goal

Let sellers keep a useful record of conversations and other interactions with their contacts so they can maintain relationships and follow up consistently.

## User story

As a **seller**, I want to **record interactions with a contact** so that I can remember what we discussed and what needs to happen next.

## Requirements

- A seller can add an interaction from a contact's details.
- Each interaction is linked to one contact and records:
  - Date and time of the interaction (defaults to now; editable).
  - Type: call, email, meeting, or other.
  - Summary (required).
  - Optional outcome and next step.
  - The seller who recorded it and the creation timestamp.
- The contact's details show its interactions in reverse chronological order, with the type, date, summary, and seller visible.
- Sellers can see and add interactions only for contacts they are authorized to access. Admins can view interactions for any contact, consistent with their customer-management access.
- Saving an interaction persists it and immediately displays it in the contact's history. If required information is missing or saving fails, show a clear error and do not report success.

## Acceptance criteria

1. A seller can save a valid interaction for an accessible contact and see it in that contact's history after reload.
2. The interaction retains its entered date, type, summary, and optional outcome and next step.
3. Multiple interactions appear newest first; each is associated with its contact and recording seller.
4. A seller cannot view or add interactions for an inaccessible contact; an admin can view interactions across contacts.
5. A missing summary or failed save produces a clear error without creating a partial interaction.

## Out of scope

Editing, deleting, searching, and exporting interactions; reminders or automatic follow-up actions.
