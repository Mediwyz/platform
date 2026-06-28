---
name: flutter-agentic-ui
description: Best practices for the MediWyz Flutter agentic chat app (mobile/) — thin client over the NestJS agent, message rendering, performance, animations, streaming, and store-build config. Use when changing the Flutter Wyzo app, adding rich message types, or preparing a store release.
---

# Flutter agentic chat app (mobile/)

The Flutter app is a **thin agentic client**: all intelligence (classify → resolve → route → compose) lives on NestJS; the app renders the response envelope and runs the deterministic booking sub-flow. Entry: `lib/main_agentic.dart` → `lib/agentic/wyzo_chat_screen.dart`; API in `lib/agentic/agent_api.dart`.

## Architecture (keep the layers clean)
- **Tool layer** — `agent_api.dart` (Dio) wraps endpoints: `/ai/agent-public`, `/bookings/available-slots`, `/providers/:id/services`, `/bookings`, `/auth/register`. One method per endpoint; return decoded maps.
- **UI layer** — the chat screen renders the envelope `{reply, providers, organisations, products, followUps, action, bookProviderId}`. Never put business logic here that belongs on the backend.
- **No client-side intent/RAG.** The app must not re-implement search/classification — send the message to `/ai/agent-public` and render.

## Message rendering
- Model a `_Msg` with optional rich fields (text, providers, organisations, products, followUps, days, services, confirm, booked). Render each field as a card/list/chips block under the bubble.
- Bot bubbles = translucent glass over the background; user bubbles = teal. Cards = solid white for legibility.
- Surface the agent's actions (provider cards, slot picker, follow-up chips) — transparency makes decisions reversible.

## Performance
- `ListView.builder` only (never a `Column` of all messages). For long histories use `reverse: true` and page older messages in chunks.
- Keep heavy work off the main thread; the backend does the heavy lifting, so the app stays light.
- Add the user message immediately, show a typing indicator, prevent parallel sends (`_loading` guard), then replace the typing bubble in place.

## Animations / graphics
- Hero background spans the WHOLE screen (a `Stack` with the animated image behind a scrim), not just a header. Cross-fade with `AnimatedSwitcher` + a Ken-Burns scale via `AnimationController`.
- Scrim opacity is a readability/visibility trade-off — dark enough for white text, light enough to see the image (~0.6–0.9 gradient). Give big text a `Shadow`.
- Auto-scroll to newest only; never yank the view while the user reads scrollback.

## Booking sub-flow (deterministic, client-side)
- Stages: slot → service → confirm. Drive by taps; also interpret typed answers in-step (yes/no at confirm) so free text doesn't restart it.
- Use `paymentMethod: 'pay_at_appointment'` so no wallet pre-funding is needed.
- Guest at confirm → in-chat signup (`/auth/register`, patient, auto-login) → resume the booking.

## Config & store build
- `AppConfig.apiBase` → `https://mediwyz.com/api` in release, or via `--dart-define=API_BASE=...`.
- Local web testing hits prod CORS (allowlisted origins + credentials) → run with `--web-browser-flag "--disable-web-security"`. For real web prod, add the app origin to backend `CORS_ALLOWED_ORIGINS`.
- Store release: `flutter build apk -t lib/main_agentic.dart --dart-define=API_BASE=https://mediwyz.com/api` (and `build ipa`). Set the launcher icon from `logo-icon.png`.

## Future (when needed)
- **Streaming**: switch the compose reply to SSE for word-by-word output (`/ai/agent` streaming). Update the latest bubble in place.
- **Generative UI**: Flutter's GenUI / A2UI lets the LLM emit declarative UI — consider for richer agent-driven layouts later.

## Sources
- flutter_gen_ai_chat_ui (streaming, in-place updates): https://pub.dev/packages/flutter_gen_ai_chat_ui
- AI chat the right way (add user msg, typing, prevent parallel sends): https://medium.com/@pranavdave.code/building-ai-chat-in-flutter-the-right-way-f70448469143
- Dio + Riverpod + Freezed API architecture: https://appsgemacht.de/en/insights/efficient-api-connection-flutter-dio-riverpod-freezed
- Flutter GenUI / A2UI (generative UI): https://docs.flutter.dev/ai/create-with-ai
- Flutter best practices 2026 (perf/architecture): https://startup-house.com/blog/flutter-app-best-practices
