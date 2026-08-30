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
`{{ .Token }}` (shown as a fallback one-time code), `{{ .Email }}`,
`{{ .NewEmail }}`, `{{ .SiteURL }}`.

Also set **Authentication → URL Configuration → Site URL** to your production
origin (e.g. `https://stockbitpro.netlify.app`) so `{{ .SiteURL }}` links resolve.

Tip: for deliverability on a real domain, configure a custom SMTP sender
(Authentication → SMTP Settings) such as Resend or Postmark, and set the sender
name to "StockBit Pro".
