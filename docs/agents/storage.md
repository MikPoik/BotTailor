# Storage & Uploads

Concise reference for how uploads, storage adapters, and public/embed assets are implemented and extended.

## Purpose
Explains the storage adapter surface, upload flows (direct, presigned, multipart), and operational/security caveats developers must know when changing or extending storage behavior.

## Core files
- `server/storage.ts` — the adapter layer and `IStorage`-style implementation(s).
- `server/upload-service.ts` — upload orchestration (presign, multipart completion, server-side streamed uploads).
- `server/routes/uploads.ts` — HTTP endpoints the client calls for upload initiation and callbacks.
- `public/` — static embed assets served to third-party sites (`embed.js`, `embed.css`).

## Contracts & surface area
- Upload endpoints return concise JSON objects: success/failure, server-side `fileId`, and either a public `url` or an `uploadUrl`/presigned data the client should use to PUT/POST the file.
- Supported upload modes:
	- Direct server upload (client POSTs file to the API — server streams to storage).
	- Presigned upload (server returns signed URL(s); client uploads directly to the provider).
	- Multipart/presigned multipart (for large files; server issues parts and completes the upload).
- Download/serve contract: public assets are either publicly readable or served via short-lived signed URLs for private content.

## Configuration
- The code selects an adapter at runtime (e.g. `s3`, `gcs`, `local`) via environment config. Provider-specific env vars are used (e.g. `S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`/`S3_BUCKET`, or equivalent GCS names). Check `server/storage.ts` for the exact names and selection logic.

## Operational guidance & edge cases
- Do not buffer entire uploads in memory — stream data from the request to the storage adapter (server code follows streaming patterns).
- Large files: prefer multipart/presigned flows. Ensure the server implements proper part completion and integrity checks.
- CORS and browser behavior: presigned uploads require CORS headers set on the storage bucket/provider. Signed-upload responses should contain any required headers the client must send.
- Signed URL lifetime: keep short-lived for private content; rotate/revoke by controlling object ACLs or using short expirations.
- Security: validate file size, MIME type, and extension server-side; run virus/content scanning for untrusted uploads before making them public.
- Bandwidth & cost: avoid proxying large files through the server unless necessary; prefer direct-to-provider uploads for cost/latency savings.

## Extending adapters
- To add a provider: implement the adapter interface in `server/storage.ts` (methods: `putStream`, `getSignedUrl`, `createMultipart`, `completeMultipart`, `delete`, etc.), then ensure `server/upload-service.ts` selects it based on env config.
- For local/dev: provide a filesystem adapter used when `STORAGE_PROVIDER=local` to simplify tests and CI.

## Testing recommendations
- Unit: mock the storage adapter interface and assert orchestration logic in `server/upload-service.ts`.
- Integration: use a local S3-compatible test server (MinIO, LocalStack) or the filesystem adapter to exercise presign and multipart flows.

## Examples & quick checks
- When changing adapter behavior, verify end-to-end in this order: presign response shape → client upload → server-complete callback (if multipart) → final public URL or DB record.
- Confirm `public/` assets remain backward-compatible for embeds; changing `embed.js` or CSS may break third-party integrations.

## Security checklist (short)
- Enforce upload size limits.
- Validate MIME type and file extension.
- Scan content for malware when exposing files publicly.
- Use short-lived signed URLs for private content; never embed secret keys in the frontend.

If you want, I can now scan `server/storage.ts` and `server/upload-service.ts` to make the doc even more exact (env var names, adapter method names, and the upload endpoint shapes).
