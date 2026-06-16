# Flutter parity backlog

Web changes that still need a matching Flutter implementation. See
`.claude/rules/web-mobile-parity.md`.

## Pending

- **My Organisations overview** (My Company screen) — web added a grouped
  overview of all healthcare entities the user owns or belongs to (clinics,
  hospitals, labs, pharmacies, self-employed), each with a create form and a
  per-org member invite. Backed by `GET /api/organizations/mine` plus the
  existing `POST /api/organizations` and `POST /api/organizations/:id/invite`.
  Mirror on the mobile My Company screen.
