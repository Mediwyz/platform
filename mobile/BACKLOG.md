# Flutter parity backlog

Web changes that still need a matching Flutter implementation. See
`.claude/rules/web-mobile-parity.md`.

## Pending

- **Self-serve service creation wizard** — web: creating a custom service is now
  a 2-step flow (details → 8-step appointment-type wizard) that generates +
  publishes + links a provider-owned workflow in one `POST /api/services/custom`
  call (body includes `workflow`). No regional-admin pre-authoring needed.
  Mirror the wizard-driven service creation on mobile.

- **Reset credit control (Billing)** — web billing wallet card now has a "Reset
  credit" panel (Restore trial / preset amounts / custom) calling
  `POST /api/users/:id/wallet/reset` (gateway-free). Mirror on the mobile
  billing/wallet screen.

- **Inventory "Sell as" selector** — web My Inventory now lets a provider sell a
  Health Shop item under a pharmacy/organisation they belong to or as
  themselves (`healthcareEntityId` on the item; options from
  `GET /api/organizations/mine`). The Health Shop card shows "Sold by <seller>".
  Mirror the selector + the seller label on mobile.

- **Provider card service modes** — web provider search cards now show the real
  modes a provider offers (At Office / At Home / Video / …) derived from
  `GET /api/search/providers` `serviceModes[]`, and the profile Services tab
  shows per-service modes. Mirror both on mobile (replace any hardcoded badges).

- **My Organisations overview** (My Company screen) — web added a grouped
  overview of all healthcare entities the user owns or belongs to (clinics,
  hospitals, labs, pharmacies, self-employed), each with a create form and a
  per-org member invite. Backed by `GET /api/organizations/mine` plus the
  existing `POST /api/organizations` and `POST /api/organizations/:id/invite`.
  Mirror on the mobile My Company screen.
