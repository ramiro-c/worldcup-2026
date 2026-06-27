"""Group standings computation with FIFA 2026 H2H tiebreakers.

Implements the official FIFA 2026 tiebreaker cascade:
  1. Points (3 for a win, 1 for a draw)
  2. Goal difference
  3. Goals scored
  If tied on all three: H2H points → H2H goal difference → H2H goals for
  → overall goal difference → overall goals for → fair play → FIFA ranking
  → tiebreaker_exhausted
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Literal


QualificationStatus = Literal["qualified", "best_third", "eliminated", "pending"]


@dataclass
class TeamStanding:
    team_code: str
    played: int
    won: int
    drawn: int
    lost: int
    gf: int
    ga: int
    gd: int
    points: int
    position: int
    qualification: QualificationStatus = "pending"
    tiebreaker_exhausted: bool = False


def _extract_team_codes(matches: list[dict], group_id: str) -> set[str]:
    """Extract all unique team codes from group-stage matches."""
    teams: set[str] = set()
    for m in matches:
        if (m.get("group") or "").lower() != group_id.lower():
            continue
        if m.get("phase") not in (None, "group", ""):
            continue
        for key in ("home", "away"):
            code = m.get(key, "")
            if code:
                teams.add(code.lower())
    return teams


def _compute_base_stats(matches: list[dict], group_id: str) -> dict[str, dict]:
    """Compute base stats for all teams in a group."""
    all_teams = _extract_team_codes(matches, group_id)
    stats: dict[str, dict] = {
        code: {"played": 0, "won": 0, "drawn": 0, "lost": 0, "gf": 0, "ga": 0, "gd": 0, "points": 0}
        for code in all_teams
    }

    for m in matches:
        if (m.get("group") or "").lower() != group_id.lower():
            continue
        if m.get("status", "").lower() != "finished":
            continue
        if m.get("phase") not in (None, "group", ""):
            continue

        home = m.get("home", "").lower()
        away = m.get("away", "").lower()
        if not home or not away:
            continue

        hs = m.get("score_home")
        aws = m.get("score_away")
        if hs is None or aws is None:
            continue
        try:
            hg = int(hs)
            ag = int(aws)
        except (ValueError, TypeError):
            continue

        if home in stats:
            s = stats[home]
            s["played"] += 1
            s["gf"] += hg
            s["ga"] += ag
            if hg > ag:
                s["won"] += 1
            elif hg == ag:
                s["drawn"] += 1
            else:
                s["lost"] += 1

        if away in stats:
            s = stats[away]
            s["played"] += 1
            s["gf"] += ag
            s["ga"] += hg
            if ag > hg:
                s["won"] += 1
            elif ag == hg:
                s["drawn"] += 1
            else:
                s["lost"] += 1

    for code, s in stats.items():
        s["gd"] = s["gf"] - s["ga"]
        s["points"] = s["won"] * 3 + s["drawn"]

    return stats


def _compute_h2h_stats(cluster_codes: set[str], matches: list[dict], group_id: str) -> dict[str, dict]:
    """Compute head-to-head stats for a cluster of tied teams."""
    h2h: dict[str, dict] = {
        code: {"h2h_points": 0, "h2h_gf": 0, "h2h_ga": 0, "h2h_gd": 0}
        for code in cluster_codes
    }

    for m in matches:
        if (m.get("group") or "").lower() != group_id.lower():
            continue
        if m.get("status", "").lower() != "finished":
            continue
        if m.get("phase") not in (None, "group", ""):
            continue

        home = m.get("home", "").lower()
        away = m.get("away", "").lower()
        if home not in cluster_codes or away not in cluster_codes:
            continue

        hs = m.get("score_home")
        aws = m.get("score_away")
        if hs is None or aws is None:
            continue
        try:
            hg = int(hs)
            ag = int(aws)
        except (ValueError, TypeError):
            continue

        hs_home = h2h[home]
        hs_home["h2h_gf"] += hg
        hs_home["h2h_ga"] += ag

        hs_away = h2h[away]
        hs_away["h2h_gf"] += ag
        hs_away["h2h_ga"] += hg

        if hg > ag:
            hs_home["h2h_points"] += 3
        elif hg == ag:
            hs_home["h2h_points"] += 1
            hs_away["h2h_points"] += 1
        else:
            hs_away["h2h_points"] += 3

    for code, s in h2h.items():
        s["h2h_gd"] = s["h2h_gf"] - s["h2h_ga"]

    return h2h


def _resolve_cluster(
    cluster_codes: set[str],
    base_stats: dict[str, dict],
    matches: list[dict],
    group_id: str,
    fair_play: dict[str, int] | None,
    fifa_ranking: dict[str, int] | None,
) -> list[tuple[str, bool]]:
    """Resolve a tie cluster using H2H cascade followed by fallback tiebreakers.

    Returns a list of (code, tiebreaker_exhausted) ordered by rank.
    """
    if len(cluster_codes) <= 1:
        return [(code, False) for code in cluster_codes]

    h2h_stats = _compute_h2h_stats(cluster_codes, matches, group_id)

    # Sort by H2H cascade: h2h_points → h2h_gd → h2h_gf
    def h2h_sort_key(code: str) -> tuple:
        hs = h2h_stats.get(code, {})
        return (
            -hs.get("h2h_points", 0),
            -hs.get("h2h_gd", 0),
            -hs.get("h2h_gf", 0),
        )

    sorted_codes = sorted(cluster_codes, key=h2h_sort_key)

    # Group by H2H sort key to detect sub-clusters
    sub_clusters: dict[tuple, list[str]] = {}
    for code in sorted_codes:
        key = h2h_sort_key(code)
        if key not in sub_clusters:
            sub_clusters[key] = []
        sub_clusters[key].append(code)

    result: list[tuple[str, bool]] = []
    for codes in sub_clusters.values():
        if len(codes) == 1:
            result.append((codes[0], False))
        else:
            # Still tied after H2H — fall to overall GD → GF
            def overall_sort_key(code: str) -> tuple:
                bs = base_stats.get(code, {})
                return (
                    -bs.get("gd", 0),
                    -bs.get("gf", 0),
                )

            sub_sorted = sorted(codes, key=overall_sort_key)

            sub_sub: dict[tuple, list[str]] = {}
            for code in sub_sorted:
                key = overall_sort_key(code)
                if key not in sub_sub:
                    sub_sub[key] = []
                sub_sub[key].append(code)

            for codes2 in sub_sub.values():
                if len(codes2) == 1:
                    result.append((codes2[0], False))
                else:
                    # Still tied -> fair play -> fifa ranking -> exhausted
                    resolved_any = False

                    if fair_play:
                        fp_sorted = sorted(codes2, key=lambda c: fair_play.get(c.upper(), 0))
                        if fp_sorted[0] != fp_sorted[-1]:
                            # Fair play broke the tie
                            fp_keys: dict[int, list[str]] = {}
                            for code in fp_sorted:
                                fp = fair_play.get(code.upper(), 0)
                                if fp not in fp_keys:
                                    fp_keys[fp] = []
                                fp_keys[fp].append(code)
                            for codes3 in fp_keys.values():
                                if len(codes3) == 1:
                                    result.append((codes3[0], False))
                                else:
                                    result.extend((c, True) for c in codes3)
                            resolved_any = True

                    if not resolved_any and fifa_ranking:
                        rank_sorted = sorted(codes2, key=lambda c: fifa_ranking.get(c.upper(), 999))
                        if rank_sorted[0] != rank_sorted[-1]:
                            rank_keys: dict[int, list[str]] = {}
                            for code in rank_sorted:
                                rk = fifa_ranking.get(code.upper(), 999)
                                if rk not in rank_keys:
                                    rank_keys[rk] = []
                                rank_keys[rk].append(code)
                            for codes3 in rank_keys.values():
                                if len(codes3) == 1:
                                    result.append((codes3[0], False))
                                else:
                                    result.extend((c, True) for c in codes3)
                            resolved_any = True

                    if not resolved_any:
                        result.extend((c, True) for c in codes2)

    return result


def compute_group_standings(
    matches: list[dict],
    group_id: str,
    fair_play: dict[str, int] | None = None,
    fifa_ranking: dict[str, int] | None = None,
) -> list[TeamStanding]:
    """Compute ranked group standings with FIFA 2026 H2H tiebreakers.

    Args:
        matches: List of match dicts from wheniskickoff (must have home/away/score_home/score_away/group/status).
        group_id: Group letter (e.g. "a").
        fair_play: Optional dict mapping team codes to fair play points (lower is better).
        fifa_ranking: Optional dict mapping team codes to FIFA ranking (lower is better).

    Returns:
        Ordered list of TeamStanding dataclasses.
    """
    base_stats = _compute_base_stats(matches, group_id)
    all_codes = list(base_stats.keys())

    if not all_codes:
        return []

    # Step 1: sort by (pts desc, gd desc, gf desc)
    def base_sort_key(code: str) -> tuple:
        s = base_stats.get(code, {})
        return (-s.get("points", 0), -s.get("gd", 0), -s.get("gf", 0))

    sorted_codes = sorted(all_codes, key=base_sort_key)

    # Step 2: detect tie clusters (identical pts+gd+gf)
    clusters: list[list[str]] = []
    current_key = None
    current_cluster: list[str] = []

    for code in sorted_codes:
        key = base_sort_key(code)
        if key == current_key:
            current_cluster.append(code)
        else:
            if current_cluster:
                clusters.append(current_cluster)
            current_cluster = [code]
            current_key = key
    if current_cluster:
        clusters.append(current_cluster)

    # Step 3: resolve each cluster
    resolved: list[tuple[str, bool]] = []
    for cluster in clusters:
        if len(cluster) == 1:
            resolved.append((cluster[0], False))
        else:
            resolved.extend(
                _resolve_cluster(
                    set(cluster), base_stats, matches, group_id, fair_play, fifa_ranking
                )
            )

    # Step 4: assign qualification status
    total_teams = len(resolved)
    num_groups = max(1, total_teams)

    standings = []
    for pos, (code, exhausted) in enumerate(resolved, start=1):
        s = base_stats[code]

        # Determine qualification
        if total_teams >= 4:
            if pos <= 2:
                qual: QualificationStatus = "qualified"
            elif pos == 3:
                qual = "best_third"
            elif pos >= 4:
                qual = "eliminated"
            else:
                qual = "pending"
        else:
            qual = "pending"

        standings.append(
            TeamStanding(
                team_code=code,
                played=s["played"],
                won=s["won"],
                drawn=s["drawn"],
                lost=s["lost"],
                gf=s["gf"],
                ga=s["ga"],
                gd=s["gd"],
                points=s["points"],
                position=pos,
                qualification=qual,
                tiebreaker_exhausted=exhausted,
            )
        )

    return standings


def compute_best_third_ranking(
    all_standings: dict[str, list[TeamStanding]],
) -> list[dict]:
    """Rank all 3rd-placed teams across groups to determine best 8.

    Cascade: points → goal difference → goals for → fair play → FIFA ranking.

    Args:
        all_standings: Dict mapping group letter to list of TeamStanding.

    Returns:
        Ordered list of dicts with team_code, group, points, gd, gf, qualified,
        tiebreaker_exhausted, and position.
    """
    thirds = []
    for group_letter, standings in all_standings.items():
        for s in standings:
            if s.position == 3:
                thirds.append({
                    "team_code": s.team_code,
                    "group": group_letter,
                    "played": s.played,
                    "won": s.won,
                    "drawn": s.drawn,
                    "lost": s.lost,
                    "gf": s.gf,
                    "ga": s.ga,
                    "gd": s.gd,
                    "points": s.points,
                    "tiebreaker_exhausted": s.tiebreaker_exhausted,
                })

    # Sort by: points desc → gd desc → gf desc
    thirds.sort(key=lambda t: (-t["points"], -t["gd"], -t["gf"]))

    # Detect ties (identical points+gd+gf): mark tiebreaker_exhausted
    if thirds:
        # Group by sort key to find tied positions
        i = 0
        while i < len(thirds):
            j = i
            while j < len(thirds) and thirds[j]["points"] == thirds[i]["points"] and \
                  thirds[j]["gd"] == thirds[i]["gd"] and thirds[j]["gf"] == thirds[i]["gf"]:
                j += 1
            if j - i > 1:
                for k in range(i, j):
                    thirds[k]["tiebreaker_exhausted"] = True
            i = j

    # Assign positions and qualification
    for pos, t in enumerate(thirds, start=1):
        t["position"] = pos
        t["qualified"] = pos <= 8

    return thirds
