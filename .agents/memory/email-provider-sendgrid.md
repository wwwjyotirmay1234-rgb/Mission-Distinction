---
name: Email provider is SendGrid, not Resend
description: This app's transactional email (verification, password reset) must go through SendGrid, not Resend — Resend was left in an unverified sandbox state.
---

`lib/email.ts`'s `sendEmail()` sends all transactional email (registration verification, password reset, admin test-email). It must use `@sendgrid/mail` with `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL`, not the `resend` package.

**Why:** At one point `sendEmail()` was implemented with Resend (`RESEND_API_KEY` + `onboarding@resend.dev` fallback sender). That Resend account was never upgraded past sandbox mode, so every send to a real recipient failed with `validation_error` / HTTP 403 ("You can only send testing emails to your own email address... verify a domain at resend.com/domains"). This failed silently in application flow (registration still succeeded with `emailSent: false`), so it went unnoticed for a while — surfaced only via deployment runtime logs showing repeated `[Email] Resend error` entries. Meanwhile `@sendgrid/mail` was already an installed dependency, `SENDGRID_API_KEY`/`SENDGRID_FROM_EMAIL` secrets were already configured and verified, and the admin `/api/auth/admin/test-email` route's copy still referenced "via SendGrid" — strong evidence SendGrid was the original, correctly-configured provider.

**How to apply:** If transactional email in this app is reported broken, or you see `[Email] Resend error` in logs, don't chase Resend domain verification — check whether `SENDGRID_API_KEY` + `SENDGRID_FROM_EMAIL` are already set (they likely are) and confirm `lib/email.ts` is calling SendGrid. If a future task reintroduces Resend, either fully migrate (verify a domain, set `RESEND_FROM_EMAIL`) or don't leave both providers half-wired — pick one and make the startup log / test-email endpoint copy match the actual provider in code.
