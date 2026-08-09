# NeoFit Stage 19 — YouTube Agent Tool + Coach/UI Polish

Status: code/schema/CI complete; Preview-only. Hosted YouTube/Gemini E2E remains open.

## Goal

Add YouTube as a real **read-only external Agent Tool** without turning it into an AI provider, reusing Gemini credentials incorrectly, scraping transcripts, adding an invisible classifier LLM call, or degrading the existing Google→AvalAI request path.

Stage 19 also closes several UI/data-truth/accessibility gaps discovered during the audit.

## Provider vs Integration boundary

NeoFit keeps three distinct concepts:

```text
AI providers
  Google Gemini
  AvalAI

External integrations/tools
  YouTube Data API v3
```

The user's Google AI Studio/Gemini key is never reused as the YouTube Data API credential.

The YouTube key is user-owned, independently encrypted and intended to be restricted in Google Cloud to YouTube Data API v3.

## YouTube request paths

### Normal Coach message

```text
message
  -> local Coach/domain routing
  -> no YouTube request
  -> one normal AI provider request
```

### Direct public YouTube URL

```text
message containing public YouTube URL
  -> local URL normalization
  -> zero YouTube Data API search calls
  -> Google Gemini receives the public YouTube URL as video input
  -> one Google model request
```

This capability is deliberately Google-only. NeoFit does not pretend AvalAI saw the video if its equivalent capability has not been proven.

### Explicit YouTube search intent

```text
"در یوتیوب یک ویدیوی آموزش اسکوات پیدا کن"
  -> local deterministic intent router
  -> atomic YouTube tool-budget reservation
  -> one YouTube search.list request
  -> one batched videos.list metadata request
  -> exact structured cards returned to UI
  -> one Coach AI request using metadata as untrusted external data
```

There is no hidden LLM classifier/tool-selection request in Stage 19. The local intent router is intentional request optimization for the first external tool.

## Why there is no transcript scraper

NeoFit does not scrape YouTube pages, run yt-dlp/youtube-dl, or use arbitrary caption-download workarounds.

For a direct public YouTube URL, Gemini's supported video-input path is used. YouTube Data API is limited to discovery/metadata.

This keeps the integration on official APIs, reduces brittle dependencies and avoids representing scraped text as authoritative video content.

## Search contract

`youtube-client.ts` enforces:

- query normalization and 120-character bound;
- max 4 results;
- `type=video`;
- `safeSearch=strict`;
- `relevanceLanguage=fa`;
- `videoEmbeddable=true`;
- `videoSyndicated=true`;
- exact video-id validation;
- one batched `videos.list(contentDetails)` request for duration metadata;
- no result descriptions in Coach context;
- fixed official YouTube API base;
- 10-second server timeout.

Keeping descriptions out of the LLM context reduces both token usage and external prompt-injection surface.

## Cheap key validation

Save/Test of the YouTube credential uses a low-cost `videos.list` request with a valid `part=snippet`, `chart=mostPopular`, `maxResults=1`.

It never calls `search.list`, so merely saving/testing a key does not burn search quota.

## Integration credential vault

Live table:

`public.encrypted_integration_credentials`

Current supported integration:

`youtube`

Stored:

- ciphertext
- iv
- auth tag
- key version
- non-secret key hint
- validation/failure/cooldown metadata

Never stored plaintext:

- YouTube API key

The same 32-byte server root encryption secret is reused only as key material; AAD has a separate integration domain:

```text
neofit:integration-credential:v1:<user_id>:youtube
```

This prevents provider ciphertext and integration ciphertext from being interchangeable.

Raw integration keys are never returned to the browser after save and are not stored in Browser storage.

## Agent Tool audit

Live table:

`public.agent_tool_audit`

Stored metadata:

- user id
- tool name (`youtube_search`)
- SHA-256 query fingerprint
- pending/success/failure status
- result count
- latency
- normalized failure code
- created/completed time

Never stored:

- raw search query
- result titles or result payload
- YouTube API key
- prompt
- Coach response

Audit rows are owner-RLS protected and authenticated write privileges are column-scoped. DELETE is not granted.

## Atomic YouTube search budget

YouTube search is separately bounded from the LLM budget because it consumes a different external quota.

Live function:

`public.reserve_agent_tool_call(tool_name, query_fingerprint)`

Current YouTube limits:

- max 3 search reservations in rolling 60 seconds per user;
- max 30 search reservations in rolling 24 hours per user.

The SECURITY INVOKER function:

- binds ownership to `auth.uid()`;
- validates the 64-char query fingerprint;
- uses a per-user/tool advisory transaction lock;
- counts pending/success/failure rows;
- inserts the pending audit row only if allowed;
- returns exact `retry_after_seconds` when denied.

A crash after reservation remains conservative: the request counts instead of becoming a quota-bypass.

A live DB QA proved:

```text
attempt 1 -> allowed
attempt 2 -> allowed
attempt 3 -> allowed
attempt 4 -> denied, retry_after=60
```

and all QA rows were removed afterward.

## Live migrations

- `20260809150638_youtube_integration_and_tool_audit`
- `20260809153742_reserve_youtube_agent_tool_budget`

Supabase Security Advisor reports no Stage 19 schema/RPC issue. The remaining project security warning is the unrelated plan-gated Auth leaked-password protection.

## Prompt-injection boundary

YouTube titles/channel names are not trusted instructions.

The Coach system prompt explicitly wraps external tool metadata under:

`EXTERNAL_TOOL_DATA_JSON`

and instructs the model that external text is untrusted data, never a system/user command.

Exact clickable cards are rendered from structured tool output returned by NeoFit, not invented from model prose.

If only search metadata exists, the Coach must not claim it watched the video.

## Coach UX improvements

Stage 19 adds:

- YouTube result cards with lazy thumbnails;
- duration/channel/title display;
- no automatic iframe or autoplay;
- direct source link after video analysis;
- explicit YouTube-not-configured CTA;
- explicit Google-required CTA for direct video understanding;
- 429 + `Retry-After` countdown and temporary submit lock;
- technical provider/model/latency/fallback/context moved under expandable details;
- auto-scroll;
- `aria-busy`;
- Ctrl/Command + Enter to send, Enter for newline;
- truthful copy that Coach history is not yet cross-device persisted.

## Integration Settings UX

Route:

`/profile/integrations`

Current YouTube actions:

- Save/replace API key;
- Test connection without search;
- Delete key;
- display non-secret key hint/validation/failure metadata.

The screen explains that YouTube Data API and Gemini credentials are separate and recommends API restriction to YouTube Data API v3.

## Profile data-truth fix

During Stage 19 audit, Profile still displayed `workoutPlan.length` from the Guest fixture as the account's "current weekly plan".

That was removed.

Profile no longer loads or presents the Guest workout fixture for account metrics and does not add a real Workout query just to create a decorative number. It links to the real Workout source instead.

## Accessibility/visual polish

`agent-tools-polish.css` adds:

- consistent `:focus-visible` for links/buttons/inputs/selects/textarea/summary/custom focusables;
- font inheritance for form controls;
- common 44px hit-target floor;
- improved disabled states;
- screen-reader-only utility;
- YouTube/Integration/Coach component polish;
- `prefers-reduced-motion: reduce` behavior that removes page animation/hover motion and collapses transitions.

## Request-efficiency summary

Normal Coach request:

- 0 YouTube requests
- 1 AI request

Direct YouTube URL:

- 0 YouTube Data API requests
- 1 Google AI request with video input

Explicit YouTube search:

- 1 atomic Postgres tool reservation
- 1 YouTube `search.list`
- 1 batched YouTube `videos.list`
- 1 AI request
- 1 best-effort audit completion update

Key Save/Test:

- 1 cheap `videos.list`
- 0 search calls
- 0 AI calls

No transcript request, hidden classifier LLM turn, per-video metadata request, service-role hop or automatic iframe.

## Validation

Green Stage 19 code run before this documentation sync:

`YouTube Agent Tools CI` run `31321927187`

Success:

- YouTube tool/security/request contracts;
- UI/accessibility contracts;
- Coach regression;
- full Supabase app regression;
- TypeScript;
- Next production build;
- secret/tool/UI boundary gate.

Earlier CI failures were useful gates and were fixed rather than bypassed: one stale Stage 15 literal-429 source assertion and one over-broad transcript-scraper grep.

## Hosted proof required

After the next single deployment to the existing Preview Lab:

1. save a real **separate** YouTube Data API v3 key in `/profile/integrations`;
2. test connection and verify no search is performed;
3. ask Coach for a YouTube tutorial and verify bounded result cards;
4. verify one metadata-only tool-audit row and no raw query/result content;
5. send a direct public YouTube URL with Google Gemini configured and verify Gemini analyzes the video;
6. verify no AvalAI fake fallback occurs for direct video input;
7. deliberately exercise the 3/min tool budget and verify countdown UI;
8. re-run Supabase/Coach runtime logs for errors.

## Release rule

Preview-only. YouTube remains read-only. Stage 19 does not authorize account-changing YouTube actions, unrestricted web browsing, autonomous plan mutations or Production promotion.
