# Bester FC Stats

Football statistics dashboard built with Next.js App Router, TailwindCSS, and Google Sheets as the data source (Service Account OAuth).

## Stack
- Next.js (App Router)
- React + TypeScript
- TailwindCSS
- pnpm
- Google Sheets (Service Account OAuth via `googleapis`)

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local` with the following values:

```
NEXT_PUBLIC_USE_GOOGLE_SHEETS=true
GOOGLE_SHEETS_META_RANGE=Meta!A1:B6
GOOGLE_SHEETS_PLAYERS_RANGE=Players!A1:D100

GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","token_uri":"https://oauth2.googleapis.com/token"}
```

Notes:
- `GOOGLE_SERVICE_ACCOUNT_JSON` must be **one line** and must escape newlines in the private key with `\n`.
- Share the Google Sheet with the service account email (`client_email`) as **Viewer**.
- The spreadsheet ID is currently **hard-coded** in `src/lib/google-sheets.ts`.

## Google Sheet Format

### Tab: `Meta`
| A (Key)        | B (Value)                    |
|---------------|------------------------------|
| Club          | Bester Football Club         |
| RecordedAt    | 2026-01-18T11:29:00+07:00     |
| MatchesPlayed | 2                            |
| Wins          | 1                            |
| Draws         | 1                            |
| Losses        | 0                            |

### Tab: `Players`
| Name | Goals | Assists | CleanSheets |
|------|-------|---------|-------------|
| พี่โต้ง | 2 | 0 | 0 |
| พี่กี้  | 2 | 0 | 0 |

Headers are case-insensitive; spaces are trimmed.

## Troubleshooting

**Error: `Requested entity was not found`**
- Share the sheet with the service account email.
- Confirm the tab names match the configured ranges.

**Error: `invalid_grant: Invalid JWT Signature`**
- Use a fresh key and ensure `private_key` is correctly escaped with `\n`.

**Error: `SyntaxError: Expected double-quoted property name in JSON`**
- `GOOGLE_SERVICE_ACCOUNT_JSON` is invalid JSON. Use double quotes and no trailing commas.

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```
