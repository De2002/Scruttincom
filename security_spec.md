# Security Specification

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be created or written by the authenticated user whose `request.auth.uid == userId`. Users cannot set or escalate `is_admin` to true.
2. **Conversation Invariant**: A conversation starter at `/conversations/{conversationId}` must have `user_id == request.auth.uid`. Platform questions can only be generated or modified by administrators.
3. **Rut (Scrut) Invariant**: A response at `/scruts/{scrutId}` must have `user_id == request.auth.uid`. If referencing a `conversation_id`, the parent conversation must exist.
4. **Resonance Invariant**: A resonance at `/resonates/{resonateId}` must be authored by `request.auth.uid`.
5. **Report Invariant**: Moderation flags at `/reports/{reportId}` must be created with `user_id == request.auth.uid` and default `reviewed: false, actioned: false`. Only admins can review or action reports.
6. **Path Variable Hardening**: Document IDs must not exceed 128 characters and must match `^[a-zA-Z0-9_\-]+$`.
7. **Default Deny Catch-all**: Any unmatched paths default to `allow read, write: if false;`.

## 2. The "Dirty Dozen" Payloads
1. **Payload 1 (Self-Assigned Admin)**: A non-admin user attempts to create or update `/users/{uid}` with `is_admin: true`.
2. **Payload 2 (Ghost Field Injection)**: A user creates a user profile with an undeclared ghost field `shadowRole: 'superuser'`.
3. **Payload 3 (ID Poisoning Attack)**: An attacker attempts to write to `/users/{1.5kb_long_malformed_string}`.
4. **Payload 4 (Identity Spoofing - Scrut)**: Authenticated user A attempts to create a Scrut with `user_id: 'userB'`.
5. **Payload 5 (Unauthenticated Write)**: An unauthenticated client attempts to create a Scrut in `/scruts/{scrutId}`.
6. **Payload 6 (Conversation Hijack)**: User B attempts to edit or delete a conversation created by User A.
7. **Payload 7 (Report Self-Resolution)**: Standard user attempts to update a report with `reviewed: true, actioned: true`.
8. **Payload 8 (Resonance Impersonation)**: User A creates a resonate record with `user_id: 'userB'`.
9. **Payload 9 (Oversized Payload - DOS attack)**: User sends a text body exceeding 5,000 characters to `/scruts/{scrutId}`.
10. **Payload 10 (Direct Modification of Catch-All Document)**: Writing to `/internal_config/keys` or any unmapped collection.
11. **Payload 11 (Non-existent Topic Modification)**: Non-admin attempting to create or delete topics in `/topics/{topicId}`.
12. **Payload 12 (Blanket Query Scraping)**: Attempting to query `/reports` without administrator authorization.
