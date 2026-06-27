"""R32 match resolution from group standings + Annex C combination table.

Takes group standings and best-third ranking, looks up the Annex C combination
table, and produces 16 resolved R32 match dicts ready for bracket injection.
"""

from __future__ import annotations
from providers.standings import TeamStanding
from providers.r32_combinations import SlotPattern, get_slot_pattern


def _get_winner(group_letter: str, standings: dict[str, list[TeamStanding]]) -> TeamStanding | None:
    """Get the group winner (position 1) from standings."""
    group_standings = standings.get(group_letter.lower(), [])
    for s in group_standings:
        if s.position == 1:
            return s
    return None


def _get_runner_up(group_letter: str, standings: dict[str, list[TeamStanding]]) -> TeamStanding | None:
    """Get the group runner-up (position 2) from standings."""
    group_standings = standings.get(group_letter.lower(), [])
    for s in group_standings:
        if s.position == 2:
            return s
    return None


def _get_third(group_letter: str, standings: dict[str, list[TeamStanding]]) -> TeamStanding | None:
    """Get the third-placed team from a specific group."""
    group_standings = standings.get(group_letter.lower(), [])
    for s in group_standings:
        if s.position == 3:
            return s
    return None


def _code_to_dict(s: TeamStanding | None) -> dict | None:
    """Convert a TeamStanding to a minimal match team dict."""
    if s is None:
        return None
    return {
        "code": s.team_code,
        "name": s.team_code.upper(),
    }


def resolve_r32_matches(
    standings: dict[str, list[TeamStanding]],
    best_thirds: list[dict],
    combination_table: dict[frozenset[str], list[SlotPattern]],
) -> list[dict]:
    """Resolve all 16 R32 matches from group standings and best-third ranking.

    Args:
        standings: Dict mapping group letters to list of TeamStanding (ordered).
        best_thirds: Best-third ranking from compute_best_third_ranking().
        combination_table: The ANNEX_C 495-row combination table.

    Returns:
        List of 16 match dicts, each with id, slot, home_team, away_team,
        home_team_name, away_team_name. Teams are None when unresolvable.
    """
    # Determine qualifying third-place groups (top 8)
    qualified_thirds = [t for t in best_thirds if t.get("qualified")]
    qualifying_groups = frozenset(t["group"].upper() for t in qualified_thirds)

    # Look up the slot pattern
    slot_pattern = get_slot_pattern(qualifying_groups)
    if slot_pattern is None:
        # No valid combination — return all nulls
        matches = []
        for slot in range(16):
            matches.append({
                "id": f"r32-{slot + 73}",
                "slot": slot,
                "home_team": None,
                "away_team": None,
                "home_team_name": None,
                "away_team_name": None,
            })
        return matches

    # Resolve each slot
    matches = []
    for slot, (home_src, away_src) in enumerate(slot_pattern):
        home_type, home_group = home_src
        away_type, away_group = away_src

        home_standings = None
        away_standings = None

        # Resolve home team
        if home_type == "winner":
            home_standings = _get_winner(home_group, standings)
        elif home_type == "runner_up":
            home_standings = _get_runner_up(home_group, standings)
        elif home_type == "third":
            # home_group is a frozenset in the table, but should resolve to a single group
            if isinstance(home_group, frozenset) and len(home_group) == 1:
                third_group = next(iter(home_group))
                home_standings = _get_third(third_group, standings)
            elif isinstance(home_group, str):
                home_standings = _get_third(home_group, standings)

        # Resolve away team
        if away_type == "winner":
            away_standings = _get_winner(away_group, standings)
        elif away_type == "runner_up":
            away_standings = _get_runner_up(away_group, standings)
        elif away_type == "third":
            if isinstance(away_group, frozenset) and len(away_group) == 1:
                third_group = next(iter(away_group))
                away_standings = _get_third(third_group, standings)
            elif isinstance(away_group, str):
                away_standings = _get_third(away_group, standings)

        home = _code_to_dict(home_standings)
        away = _code_to_dict(away_standings)

        matches.append({
            "id": f"r32-{slot + 73}",
            "slot": slot,
            "home_team": home["code"] if home else None,
            "away_team": away["code"] if away else None,
            "home_team_name": home["name"] if home else None,
            "away_team_name": away["name"] if away else None,
        })

    return matches
