# Infinite Express roster workflow

You collect Instagram usernames and a short destination/location line, then merge them into `passengers.json`. The app places riders; the public train does not reshuffle people who are already boarded.

## Passenger fields

| Field | Required | Meaning |
| --- | --- | --- |
| `h` | yes | Instagram handle (`@name` or `name`) |
| `dest` | no | Short “where I’m going” line (use place name, not raw GPS) |
| `coach` | no | Preferred coach number `1`–`10` |
| `seat` | no | Preferred seat number `1`–`10` inside that coach |

Aliases accepted: `handle` / `username` for `h`, `location` for `dest`, `coachNo` / `seatNo` for coach/seat.

## Placement rules

1. Rows with `coach` + `seat` go there if free; otherwise nearest free seat in that coach; otherwise next open coach.
2. Handles already on the train keep their seat across file updates (unless you give them a new `coach`/`seat`).
3. New rows without a preference fill the earliest empty seats from Coach 001 Seat 01 forward.
4. Removing a handle from the file frees that seat on the next refresh.

## Batch updates

1. Append new followers to the `passengers` array (do not reorder existing rows unless you intend a move).
2. To grant a requested seat (e.g. Coach 3 Seat 4), set `"coach": 3, "seat": 4` on that row.
3. To move someone who dislikes their place, change their `coach`/`seat` (target must be free after refresh).
4. Deploy / refresh the page. Coaches still unlock by follower/boarded count (`10` → one coach).

## Privacy

- Seat lists and browsing show **masked** handles.
- Full `@username`, destination, and ticket download appear only after a successful **search** for that handle.
- Downloaded PNG tickets include the full username for the rider who searched.

## Example

```json
{
  "h": "@friend",
  "dest": "Chennai coast",
  "coach": 3,
  "seat": 4
}
```
