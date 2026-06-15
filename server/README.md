# SakayDavao — Server (AWS)

This folder is the **server** half of the repo. It is deployed **independently** of
the client (the Vite PWA in [`../client`](../client)). Two pieces make up the AWS setup:

1. **Contributions backend** (this folder) — API Gateway (HTTP API) → Lambda → S3,
   defined in [`template.yaml`](template.yaml). The browser POSTs contribution JSON to
   the API; the Lambda validates it and writes it to a private S3 bucket using its IAM
   role. **No AWS credentials ever ship in the client bundle.**
2. **Static hosting for the client** — Amplify Hosting, with its app root set to
   `client/` (see §3).

Free-tier friendly at testing scale (Lambda 1M req/mo permanent free; HTTP API 1M
req/mo free for 12 months, then ~$1/M; S3 pennies).

---

## Which env key lives where

| Key | Lives in | Set by | Notes |
| --- | --- | --- | --- |
| `AllowedOrigin` | **SAM parameter** (this stack) | `sam deploy --parameter-overrides` | The one browser origin allowed to POST. Required, must be `https://…`. |
| `ContributionRetentionDays` | **SAM parameter** (this stack) | `sam deploy` (default 365) | Days before raw S3 contributions auto-expire. |
| `CONTRIBUTIONS_BUCKET` | **Lambda runtime env** | injected by `template.yaml` | You never set this by hand. |
| `VITE_CONTRIBUTIONS_API_URL` | **Client** (`client/.env` or Amplify) | you, after deploy | = this stack's `ApiUrl` output. Inlined into the public bundle. |
| `VITE_ROUTES_URL`, `VITE_REALTIME_URL` | **Client** | you (optional) | Optional feeds. Never put secrets in `VITE_*`. |

Rule of thumb: **`VITE_*` = client, public, build-time.** Everything the Lambda needs
is provided by the stack itself or by its IAM role — there are no server secrets to manage.

---

## 1. Deploy the contributions backend

Prereqs: [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
configured (`aws configure`) and the
[SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).

```sh
cd server
sam build
sam deploy --guided
```

Guided prompts: stack name `sakaydavao-contributions`, region `ap-southeast-1`
(Singapore — closest to Davao). When asked for **`AllowedOrigin`**, give your site
origin, e.g. `https://main.d1234abcd.amplifyapp.com`. There is **no default** — the
deploy fails closed if you omit it. (Don't have the Amplify URL yet? Deploy the client
first per §3, or pass a placeholder origin now and re-run §2 later.)

The stack outputs:

- **ApiUrl** — set as `VITE_CONTRIBUTIONS_API_URL` in the client. When unset there,
  contributions stay in localStorage only.
- **BucketName** — objects land as `contributions/{routeNumber}/{YYYY-MM-DD}/{ts}-{id}.json`.

Smoke test (note: `curl` ignores CORS, so this works regardless of `AllowedOrigin` —
that's the point: CORS is a browser control, throttling is the real guard):

```sh
curl -X POST "<ApiUrl>" -H "Content-Type: application/json" \
  -d '{"id":"test-1","routeNumber":"R102","routeName":"Test","stopIndex":0,"stopName":"Stop","timestamp":1700000000000,"dayOfWeek":1,"hour":8,"minute":30}'
# -> {"ok":true}
aws s3 ls --recursive s3://<BucketName>/contributions/R102/
```

The handler is [`contributions/index.mjs`](contributions/index.mjs). It uses the AWS
SDK v3 bundled into the Node 20 Lambda runtime, so there is no install step.

### Security posture (what's hardened and why)

- **Throttling** (`DefaultRouteSettings`, 5 req/s, burst 10) + **reserved Lambda
  concurrency** (10) — the real defense against abuse / denial-of-wallet, since the
  endpoint is intentionally public (the app has no accounts).
- **CORS locked** to one `https://` origin — stops other websites driving the API.
- **S3**: public access blocked, encrypted at rest, **TLS-only** bucket policy, and a
  lifecycle rule that expires raw contributions.
- **Input validation**: id/route regex (blocks path traversal in the S3 key), size cap,
  and the handler re-serializes only known fields. Treat stored contributions as
  **untrusted** — aggregate and outlier-filter before using them to train/inform ETAs.

To change CORS later (e.g. once you know the Amplify URL):

```sh
sam deploy --parameter-overrides AllowedOrigin=https://<branch>.<id>.amplifyapp.com
```

---

## 2. Re-tighten CORS after the client is live

Once the client has a real URL, re-run the deploy above with the exact origin.

## 3. Host the client on Amplify

1. AWS Console → **Amplify** → **Create new app** → connect the GitHub repo, pick the
   branch (`main`).
2. **Set the app root / monorepo base directory to `client`.** (Amplify → app settings
   → "Monorepo" / "App root directory" = `client`.) This is the key step for the
   client/server split — Amplify only builds the client folder.
3. Build settings (Amplify detects Vite; confirm):
   - Build command: `pnpm run build`
   - Output directory: `dist` (relative to `client`)
4. Add environment variable `VITE_CONTRIBUTIONS_API_URL` = the `ApiUrl` output.
   (Vite inlines env vars at build time, so redeploy after changing it.)
5. Save & deploy → `https://<branch>.<id>.amplifyapp.com` over HTTPS (required for the
   PWA service worker). Then do §2 with this URL.

> Self-hosting instead of Amplify? The client also ships a Docker image
> (`client/Dockerfile` + `client/nginx.conf`); see the root README.

---

## Teardown

```sh
aws s3 rm s3://<BucketName> --recursive   # bucket must be empty first
sam delete --stack-name sakaydavao-contributions
```
