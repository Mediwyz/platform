# Flutter parity backlog

Web changes that still need a matching Flutter implementation. See
`.claude/rules/web-mobile-parity.md`.

## Pending

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
