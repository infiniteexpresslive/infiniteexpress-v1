---
name: Infinite Express Blueprint
overview: "First station is Unity Station — a boarding place for all regions, not a destination. 100 followers unlock 10 coaches × 10 seats. Local Pilot remains the mascot."
todos:
  - id: ten-coach-capacity
    content: "10 coaches × 10 seats = 100 seats aligned to 100-follower goal"
    status: completed
  - id: progressive-unlock
    content: "Unlock 1 coach per 10 followers; all 10 open at 100"
    status: completed
  - id: local-pilot
    content: "Local Pilot stays in engine as admin/mascot/Instagram lead"
    status: completed
  - id: name-unity
    content: "Name first station Unity Station; show on HUD (boarding place, not destination)"
    status: completed
isProject: false
---

# First Station Name — Unity Station

## Clarification

There is **no destination point**. The Express travels endlessly.

Station 1 is only a **station** — where the train waits and people board.

## Decision

**Name: Unity Station**

Why this name:
- For people from **all regions**
- Means gathering / boarding together, not arriving somewhere
- Fits the 100-follower launch (10 coaches, 100 seats)
- Clear on HUD and tickets: “Waiting at Unity Station”

## Naming rules going forward

- Station names = places to meet and board
- Do not frame early stations as final destinations
- Prefer universal names over local-only place names for Station 1

# Launch Capacity Plan — 100 Followers → 10 Coaches

## The mismatch (fixed)

100 followers cannot map to a single 10-seat coach.

Correct launch math:

| Item | Quantity |
|---|---:|
| Follower goal | 100 |
| Coaches | 10 |
| Seats per coach | 10 |
| Total seats | 100 |
| Engine Local Pilot | 1 (not a passenger seat) |

**Rule:** 1 follower goal unit ≈ 1 seat. 100 followers ≈ 100 seats ≈ 10 coaches.

## Unlock curve

Progressive unlock during the station wait:

| Followers | Coaches unlocked | Seats open |
|---:|---:|---:|
| 0–9 | 0 | 0 (preview only) |
| 10 | Coach 001 | 10 |
| 20 | Coaches 001–002 | 20 |
| … | … | … |
| 100 | Coaches 001–010 | 100 |

Formula: `coachesOpen = min(10, floor(followers / 10))`

At 100 followers, the full launch consist is boarded-capable.

## Consist

- 1 steam locomotive (Local Pilot / mascot in cab)
- 10 passenger coaches (001–010), empty until unlocked then claimable
- Train waits at station until 1 game-day departure (8× clock)

## Deferred

- Full blueprint 1,000 coaches / 10,000 seats
- Real Instagram API sync (manual follower count for now)
- Cabin interior social

## Long-term

After launch consist is proven, grow toward the master blueprint capacity without changing the Local Pilot or seat-identity rules.
