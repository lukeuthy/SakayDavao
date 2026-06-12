# SakayDavao on AWS

Two pieces:

1. **Contributions backend** — API Gateway (HTTP API) → Lambda → S3, defined in
   [`template.yaml`](template.yaml). The browser POSTs contribution JSON to the API;
   the Lambda validates it and writes it to the S3 bucket using its IAM role.
   No AWS credentials ever ship in the frontend bundle.
2. **Static hosting** — Amplify Hosting (build + deploy on every push).

Both fit comfortably in the AWS free tier at testing scale
(Lambda: 1M req/month permanent free; HTTP API: 1M req/month free for 12 months,
then ~$1/M; S3: pennies).

## 1. Deploy the contributions backend

Prereqs: [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
configured (`aws configure`) and [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).

```sh
cd aws
sam deploy --guided
```

Answers for the guided prompts: stack name `sakaydavao-contributions`, region
`ap-southeast-1` (Singapore — closest to Davao), accept the defaults elsewhere.
For a public deployment, set the `AllowedOrigin` parameter to your site origin
instead of the default `*`.

The stack outputs:

- **ApiUrl** — set this as `VITE_CONTRIBUTIONS_API_URL` in `.env` (local) or in
  Amplify's environment variables (hosted). When unset, the app skips uploads
  entirely and contributions stay in localStorage.
- **BucketName** — where contribution files land, as
  `contributions/{routeNumber}/{id}.json`.

Smoke test:

```sh
curl -X POST "<ApiUrl>" -H "Content-Type: application/json" \
  -d '{"id":"test-1","routeNumber":"R102","routeName":"Test","stopIndex":0,"stopName":"Stop","timestamp":1700000000000,"dayOfWeek":1,"hour":8,"minute":30}'
# -> {"ok":true}
aws s3 ls s3://<BucketName>/contributions/R102/
```

The Lambda handler lives in [`contributions/index.mjs`](contributions/index.mjs).
It uses the AWS SDK v3 bundled into the Node 20 Lambda runtime, so there is no
`package.json`/install step for it.

## 2. Host the app on Amplify

1. AWS Console → **Amplify** → **Create new app** → connect the GitHub repo,
   pick the branch (`main`).
2. Build settings (Amplify usually detects Vite; confirm):
   - Build command: `pnpm run build`
   - Output directory: `dist`
3. Add environment variable `VITE_CONTRIBUTIONS_API_URL` = the `ApiUrl` output.
   (Vite inlines env vars at build time, so redeploy after changing it.)
4. Save & deploy. Amplify gives you `https://<branch>.<id>.amplifyapp.com`
   with HTTPS — required for the PWA service worker.

Then go back and tighten CORS:

```sh
sam deploy --parameter-overrides AllowedOrigin=https://<branch>.<id>.amplifyapp.com
```

## Teardown

```sh
aws s3 rm s3://<BucketName> --recursive   # bucket must be empty first
sam delete --stack-name sakaydavao-contributions
```
