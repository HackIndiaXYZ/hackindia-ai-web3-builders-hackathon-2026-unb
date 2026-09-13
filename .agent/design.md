# Anveshana UI/UX Design Contract

Use this document for every React web, dashboard, landing page, and Expo farmer-app change. The product is a public dairy traceability service for farmers, collection agents, QC officers, FSSAI auditors, and consumers. It should feel trustworthy, calm, official, and easy to operate in the field.

## Design direction

- Use a modern Indian government-service visual language: clear utility bars, plain-language headings, service-first navigation, visible status, searchable/inspectable records, help paths, and role-based actions.
- Keep the experience light by default. Avoid black, charcoal, dark navy, glassmorphism, neon glow, crypto-terminal styling, decorative orbs, heavy gradients, and AI-looking visual effects.
- Use information hierarchy and spacing to create interest. Do not use oversized marketing heroes, excessive rounded cards, or animation as decoration.
- Prefer direct labels such as `Online services`, `Verify a product`, `Report a grievance`, `Quality checks`, and `Track collection`.
- Preserve the existing bilingual English/Hindi capability. Text must remain readable when Hindi labels expand.

## Shared visual tokens

Use these values on web and map them to the nearest React Native color:

- Canvas: `#F8FAFC`
- Surface: `#FFFFFF`
- Subtle surface: `#F1F5F9`
- Primary text: `#0F172A`
- Secondary text: `#475569`
- Muted text: `#64748B`
- Border: `#E2E8F0`
- Primary action: `#15803D`
- Primary action hover/pressed: `#166534`
- Positive surface: `#ECFDF5`
- Information action: `#0284C7`
- Warning text/action: `#C2410C`
- Warning surface: `#FFF7ED`
- Error text/action: `#BE123C`
- Error surface: `#FFF1F2`

Do not introduce a new color family without a functional reason. Never use white text on a pale surface. Keep status colors paired with a text label, not color alone.

## Typography

- Web uses the existing public-service stack: `Noto Sans`, `Segoe UI`, `Arial`, sans-serif.
- Expo uses the platform sans-serif. Do not add a display font for dashboards or forms.
- Use sentence case for user-facing labels. Reserve uppercase for short status tags and system IDs.
- Use monospace only for IDs, hashes, timestamps, and machine telemetry. Never use it for normal explanatory copy.
- Keep body text at a comfortable readable size. Do not make important actions smaller than 14px web or 14pt mobile.
- Support the existing accessibility text sizes: normal, large, and extra-large. Layouts must wrap instead of clipping.

## Components and layout

- Use white surfaces with thin slate borders and restrained shadows. Cards should usually be 8-12px radius; avoid nested cards.
- Keep page sections unframed where possible. Use cards for repeated records, individual tools, modals, and genuinely grouped content.
- Buttons must express one clear action. Use an icon plus text for primary actions; use an icon-only button only for a familiar action and provide an accessible label/tooltip.
- Minimum interactive target: 44x44px web and mobile.
- Use stable dimensions for tabs, toolbars, metric tiles, and data rows so content changes do not shift the layout.
- Use tabs for portal views, segmented controls for modes, toggles for binary settings, and menus for long option sets.
- Every data-heavy view needs a clear title, current scope/filter, visible status, and a useful empty/loading/error state.
- Prefer progressive disclosure for technical details. Show the decision first, then evidence such as rolling mean, confidence bound, timestamp, receipt hash, or audit trail.

## Navigation and service UX

- The first screen should expose real services and roles, not a marketing explanation.
- Keep global navigation predictable: Home, Online services, Portals, Help/FAQ, Accessibility, and language.
- Role portals should clearly identify the active role and current identity/session.
- Put high-frequency actions near the top: log milk, verify a product, review quality, dispatch an inspection, report a grievance.
- Explain failures in plain language and provide the next action. Do not expose raw stack traces or unexplained error codes.
- For offline mobile use, show whether a submission is local, queued, syncing, or confirmed by the server.

## Icons and imagery

- Do not use emoji anywhere in UI labels, data objects rendered as UI, status messages, buttons, badges, navigation, or empty states.
- Use Lucide icons on the web when an icon improves recognition. Use semantic icons such as `MapPin`, `Clock`, `ShieldCheck`, `AlertTriangle`, `Landmark`, `Sprout`, `Factory`, `Milk`, `QrCode`, and `FileText`.
- In Expo, use the project-approved icon library when available; add `lucide-react-native` only when needed and keep icon names consistent with the web.
- Decorative icons are optional. Never replace a clear label with an ambiguous icon.
- Do not use gradients, glow blobs, stock imagery, or decorative illustrations to compensate for weak hierarchy.

## Accessibility

- Preserve the accessibility settings for light/dark theme and normal/large/extra-large text.
- Use semantic HTML, visible keyboard focus, `aria-label`, `aria-expanded`, and `aria-controls` on web controls.
- Use accessible labels and roles for Expo touchables and form inputs.
- Maintain WCAG-friendly contrast for text, borders, focus states, and status colors.
- Never communicate status through color alone. Pair it with text and, when useful, a Lucide icon.
- Support keyboard, touch, small screens, Hindi text expansion, reduced motion, and screen-reader navigation.
- Respect safe areas and avoid placing important mobile actions behind system UI.

## Motion and realtime

- Motion should communicate state changes only: loading, syncing, confirmation, or a newly received record.
- Prefer short fades or subtle transitions. Avoid pulsing, bouncing, spinning, and auto-moving content unless it represents live telemetry and can be paused.
- Realtime events must update the existing state model without duplicating records. Show a human-readable incident/status entry when a remote milk log or grievance arrives.
- Always provide a connection state and an offline fallback for the farmer app.

## Data and security presentation

- Treat the web dashboard and farmer app as clients of the shared Express API; do not invent separate payload shapes for the same action.
- Display server-confirmed receipt IDs, timestamps, source node, status, and evidence hashes consistently.
- Never display secrets, JWT values, private keys, or full sensitive account numbers.
- Use the shared live-demo environment variables for API and Socket.IO URLs. Do not hard-code a developer's LAN IP into source files.

## Review checklist

Before completing a UI change, verify:

- Light theme has no unintended black or dark tint.
- No emoji or decorative symbol glyphs were introduced.
- Web and Expo use the same label, status, color meaning, and action hierarchy.
- Primary task is obvious within the first viewport.
- Text wraps at desktop, mobile, and large-text settings.
- Loading, empty, error, offline, and success states are handled.
- Buttons and controls have accessible names and touch targets.
- The change preserves bilingual English/Hindi content.
- The relevant web build and Expo bundle/export pass.
