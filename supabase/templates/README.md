# Auth email templates

Branded, table-based HTML that renders correctly in Gmail, Outlook, Apple Mail
and mobile clients. Paste each file into **Supabase Dashboard → Authentication →
Email Templates**, choosing the matching template and subject.

| Template (dashboard)   | File                    | Suggested subject                                  |
|------------------------|-------------------------|----------------------------------------------------|
| Confirm signup         | `confirm-signup.html`   | `Confirm your email for StockBit Pro`              |
| Reset password         | `reset-password.html`   | `Reset your StockBit Pro password`                 |
| Magic link             | `magic-link.html`       | `Your StockBit Pro sign-in link`                   |
| Invite user            | `invite-user.html`      | `You've been invited to StockBit Pro`              |
| Change email address   | `change-email.html`     | `Confirm your new email for StockBit Pro`          |
| Reauthentication       | `reauthentication.html` | `Your StockBit Pro verification code`              |

Variables used (all provided by Supabase): `{{ .ConfirmationURL }}`,
`{{ .Token }}`, `{{ .TokenHash }}`, `{{ .RedirectTo }}`, `{{ .Email }}`,
`{{ .NewEmail }}`, `{{ .SiteURL }}`.

## Confirm signup: code + device-independent link

`confirm-signup.html` deliberately does **not** use `{{ .ConfirmationURL }}`.
That URL completes a PKCE exchange, which only works in the browser that
submitted the sign-up form; opening it on a phone or in Gmail's in-app browser
fails silently. Instead the template offers two paths that work anywhere:

- the 6-digit `{{ .Token }}`, which the app's "Check your inbox" step accepts
  (`supabase.auth.verifyOtp({ email, token, type: 'email' })`), and
- a link of the form `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`,
  which `App.tsx` exchanges on load (`verifyOtp({ token_hash, type })`).

`{{ .RedirectTo }}` is the `emailRedirectTo` the app passed (`<origin>/`). It is
only honoured when that URL is on the **Redirect URLs** allow-list; otherwise
Supabase substitutes the Site URL. So in the dashboard:

- **Authentication → URL Configuration → Site URL**: `https://stockbitpro.netlify.app`
- **Redirect URLs**: `https://stockbitpro.netlify.app/**` and, for local dev,
  `http://localhost:3000/**`
- **Authentication → Providers → Email**: keep "Confirm email" ON; set the OTP
  expiry (default 1 hour) as you prefer. The same expiry applies to the link.

If you paste this template, also set the subject to
`Your StockBit Pro code: {{ .Token }}` so the code is visible from the inbox list.

`reset-password.html` (`type=recovery`) and `change-email.html`
(`type=email_change`) use the same token-hash link form, and the reset email's
`{{ .Token }}` is accepted by the "Reset code" field on the Forgot password
screen. `magic-link.html` and `invite-user.html` still use
`{{ .ConfirmationURL }}`; the app does not use those flows.

## Sending email without your own domain

Supabase's built-in sender only delivers to the project's own team members and
is capped at a few messages per hour, so a custom SMTP sender is required for
real users. Resend, Postmark and SES all require a **verified domain** before
they will deliver to anyone but you, and `*.netlify.app` cannot be verified
because you do not control its DNS. Until you own a domain:

- **Gmail SMTP** (needs 2-step verification + an App Password): host
  `smtp.gmail.com`, port `465`, user = your Gmail address, password = the app
  password, sender = the same address. Roughly 500 messages/day. Good enough
  for a pilot; some mail may land in Promotions.
- **Brevo free tier** with a verified single-sender address (no domain needed):
  300 messages/day, better reputation than a personal Gmail.

Once you have a domain, switch to Resend (or any provider), add the SPF/DKIM
records it gives you, and set the sender to something like
`no-reply@yourdomain.com`. Set the sender name to "StockBit Pro" in
Authentication → SMTP Settings either way.

Tip: for deliverability on a real domain, configure a custom SMTP sender
(Authentication → SMTP Settings) such as Resend or Postmark, and set the sender
name to "StockBit Pro".
