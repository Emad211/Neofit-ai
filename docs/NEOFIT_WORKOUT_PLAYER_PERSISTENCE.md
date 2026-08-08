# NeoFit Workout Player Persistence

**Status:** Stage 6 active slice  
**Branch:** `stage6/workout-player-persistence`  
**Stacked base:** `stage5/ai-provider-foundation`  
**Production:** prohibited

## Goal

Port the proven local Workout Player contract into the current Next.js/Supabase architecture without adding a workout-plan generator or agent dependency.

The plan catalog remains the deterministic fixture for this slice. The persistence authority becomes real completed session/set data.

## Minimal schema

Only two tables are introduced:

```text
workout_sessions
workout_sets
```

No separate personal-record table is introduced. History, volume and personal-record candidates can be derived from set-level source data. This avoids duplicate state and keeps future Coach tools grounded in raw workout evidence.

### workout_sessions

Stores one session lifecycle and final user feedback:

- workout identity/title;
- active/completed/cancelled state;
- start/completion timestamps;
- duration;
- RPE;
- pain scale;
- notes;
- TypeScript-derived total volume.

### workout_sets

Stores only set-level facts:

- parent session/user;
- actual exercise identity/name;
- exercise/set order;
- target rep text;
- actual reps/weight;
- completion timestamp.

A composite `(session_id, user_id)` foreign key prevents a set row from being attached to another user's session even if a session UUID is known.

## RLS and integrity

Both tables:

- use explicit authenticated CRUD grants;
- enable RLS;
- restrict SELECT/INSERT/UPDATE/DELETE to `(select auth.uid()) = user_id`;
- cascade on user/session deletion.

Only one active session per `(user_id, workout_id)` is allowed. A second-tab race reloads the existing session after the unique constraint rejects a duplicate insert.

## Request budget

New account session:

```text
1 session lookup
1 session insert only when no active row exists
```

Resume:

```text
1 active-session read
1 set read
```

During workout:

```text
1 workout_sets upsert per completed set
0 cursor/heartbeat writes
```

Completion:

```text
1 workout_sessions update
```

There is no background queue, event bus, IndexedDB or session-position heartbeat. Resume position is derived from completed set rows.

## Guest mode

Guest sessions remain browser-local and versioned. The parser validates workout identity, set count, bounds and timestamps and fails closed on corrupt storage. Completed guest sessions enter a bounded local history.

Authenticated active/private workout data is not mirrored into localStorage in this slice.

## Player UX

The Player is an immersive route outside the main AppShell:

```text
/workout-player/[id]
```

It includes:

- start/resume;
- set/reps/weight entry;
- per-set durable save;
- rest countdown with skip;
- completed-set history for the current exercise;
- completion summary;
- RPE, pain scale and notes;
- explicit cancel;
- safe retry behavior when remote persistence fails.

A failed remote set write never advances the player.

## AI boundary

No AI call is added to the Player. Stage 6 creates the trustworthy workout evidence future Coach tools need. Exercise alternatives, program adaptation and autonomous write tools come only after this session contract has real-account runtime evidence.

## Runtime evidence required

1. Preview Supabase/Auth environment is configured.
2. Sign into a temporary account.
3. Start a workout and verify an active `workout_sessions` row.
4. Complete several sets and reload; verify exact resume from `workout_sets`.
5. Complete session with RPE/pain/notes.
6. Verify session becomes completed and volume/set data survive sign-out/sign-in.
7. Verify a second tab cannot create a duplicate active session for the same workout.
8. Clean up temporary account/session rows.

Until this proof is recorded, Stage 6 remains Draft and Preview-only.
