# Classic Live Session Contract

This document defines the boundary between Classic Live gameplay and the future shared Teach Arcade live-session service.

## Goal

Classic Live should not own networking, join codes, authentication, roster persistence, reconnect handling, or result storage. It consumes a session adapter. The current prototype can use `LocalClassicSession`; a future Supabase-backed adapter should implement the same behaviors.

## Required responsibilities

A session adapter must provide:

- session identity and join code
- player roster
- connected/disconnected state
- rejoin by stable player ID
- current phase
- current round metadata
- one answer per player per round
- pause/resume state
- ranked player snapshots
- durable end-game result export
- subscription/events so teacher and student clients can react to changes

## Canonical phases

- `lobby`
- `question`
- `reveal`
- `leaderboard`
- `results`

## Player record

```js
{
  id,
  name,
  connected,
  score,
  streak,
  longestStreak,
  correct,
  answered,
  metadata
}
```

The backend should treat `id` as stable for the life of the session. A reconnect must restore the same player record instead of creating a new score entry.

## Round record

```js
{
  id,
  index,
  questionId,
  redemption,
  event,
  startedAt,
  deadlineAt,
  paused
}
```

The game engine remains responsible for question content and scoring rules. The session service stores and synchronizes the resulting state.

## Answer record

```js
{
  playerId,
  choice,
  correct,
  elapsedMs,
  submittedAt
}
```

Only the first accepted answer for a player/round combination is valid.

## Advance rule

The active question ends when the first of these happens:

1. all connected players have answered;
2. the teacher-selected question timer expires;
3. the teacher presses Skip.

The reveal screen has a short automatic transition. The leaderboard has no timer and remains visible until the teacher advances.

## Reconnect behavior

A disconnected student should be able to reconnect with the same session/player identity and recover:

- current score
- streak
- correct/answered counts
- current phase
- current question/round state where appropriate

A disconnected player should not block the `all connected players answered` rule.

## Future backend adapter

A Supabase-backed implementation can replace `LocalClassicSession` without changing Classic Live UI/game rules. Likely backend responsibilities:

- session row
- participant rows
- live round state
- answer submissions
- realtime subscriptions
- reconnect token/player mapping
- completed game summary/results

The shared service should ultimately be reusable by Classic Live and other Review Lab modes rather than creating game-specific multiplayer infrastructure.

## Result export schema

`exportResults()` currently targets:

```js
{
  schemaVersion: 1,
  mode: 'classic-live',
  sessionId,
  joinCode,
  completedAt,
  players: [
    {
      id,
      name,
      score,
      correct,
      answered,
      accuracy,
      longestStreak
    }
  ]
}
```

Additional class-level metrics can be appended without changing the player contract.
