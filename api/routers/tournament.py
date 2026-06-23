from __future__ import annotations
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from providers.interfaces import ITournamentDataProvider, IHeadToHeadProvider
from providers.aliases import resolve_team_name
from typing import Any

router = APIRouter(prefix="/tournament", tags=["tournament"])
provider: ITournamentDataProvider
h2h_provider: IHeadToHeadProvider | None = None

VENUE_REGIONS: dict[str, str] = {
    "metlife": "Eastern",
    "sofi": "Western",
    "att": "Central",
    "hardrock": "Eastern",
    "mercedes": "Eastern",
    "nrg": "Central",
    "lincoln": "Eastern",
    "lumen": "Western",
    "levis": "Western",
    "arrowhead": "Central",
    "gillette": "Eastern",
    "azteca": "Central",
    "akron": "Central",
    "bbva": "Central",
    "bmo": "Eastern",
    "bcplace": "Western",
}

FIFA_TO_CCA2: dict[str, str] = {
    "ARG": "ar",
    "AUS": "au",
    "AUT": "at",
    "BEL": "be",
    "BIH": "ba",
    "BRA": "br",
    "CAN": "ca",
    "CIV": "ci",
    "COD": "cd",
    "COL": "co",
    "CPV": "cv",
    "CRO": "hr",
    "CUW": "cw",
    "CZE": "cz",
    "DZA": "dz",
    "ECU": "ec",
    "EGY": "eg",
    "ENG": "gb-eng",
    "ESP": "es",
    "FRA": "fr",
    "GER": "de",
    "GHA": "gh",
    "HAI": "ht",
    "IRN": "ir",
    "IRQ": "iq",
    "JOR": "jo",
    "JPN": "jp",
    "KOR": "kr",
    "KSA": "sa",
    "MAR": "ma",
    "MEX": "mx",
    "NED": "nl",
    "NOR": "no",
    "NZL": "nz",
    "PAN": "pa",
    "PAR": "py",
    "POR": "pt",
    "QAT": "qa",
    "RSA": "za",
    "SCO": "gb-sct",
    "SEN": "sn",
    "SUI": "ch",
    "SWE": "se",
    "TUN": "tn",
    "TUR": "tr",
    "URU": "uy",
    "URY": "uy",
    "USA": "us",
    "UZB": "uz",
}


def get_flag_url(fifa_code: str) -> str:
    cca2 = FIFA_TO_CCA2.get(fifa_code.upper(), "xx")
    return f"https://flagcdn.com/{cca2}.svg"


BRACKET_ROUND_RANGES: dict[str, tuple[int, int, str]] = {
    "round_of_32": (73, 88, "R32"),
    "round_of_16": (89, 96, "R16"),
    "quarter_final": (97, 100, "QF"),
    "semi_final": (101, 102, "SF"),
    "final": (104, 104, "Final"),
}

ROUND_ORDER = ["round_of_32", "round_of_16", "quarter_final", "semi_final", "final"]


def _safe_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def _normalize_code(code: str) -> str:
    """Normalize FIFA team code. Handles URY→URU."""
    c = code.upper()
    return "URU" if c == "URY" else c


def _next_match_num(round_name: str, slot: int) -> int | None:
    """Compute the next-round match number for a given slot in the current round."""
    if round_name == "round_of_32":
        return 89 + (slot // 2)
    if round_name == "round_of_16":
        return 97 + (slot // 2)
    if round_name == "quarter_final":
        return 101 + (slot // 2)
    if round_name == "semi_final":
        return 104  # Final
    return None  # Final has no next match


def _get_team_code(raw_code: str | None) -> str | None:
    """Return normalized team code (lowercase) or None for TBD."""
    if not raw_code or raw_code.strip() == "":
        return None
    c = raw_code.strip().lower()
    if c == "ury":
        return "uru"
    return c


def build_bracket_tree(raw_matches: list[dict]) -> list[dict]:
    """Build a structured bracket tree from raw wheniskickoff match data.

    Filters matches #73–#104 (knockout phase), groups by round,
    and adds winner-to-next-slot pointers.
    """
    # Build num → match map for knockout matches
    num_map: dict[int, dict] = {}
    for m in raw_matches:
        num = m.get("num")
        if num is None:
            continue
        try:
            n = int(num)
        except (ValueError, TypeError):
            continue
        if 73 <= n <= 104:
            # Skip 3rd place match (match #103 in wheniskickoff)
            if n == 103:
                continue
            num_map[n] = m

    rounds = []
    for round_name in ROUND_ORDER:
        start, end, label = BRACKET_ROUND_RANGES[round_name]
        round_matches = []
        for num in range(start, end + 1):
            m = num_map.get(num)
            if m is None:
                continue

            slot = num - start

            # Resolve teams
            home_code = _get_team_code(m.get("home") or m.get("home_code"))
            away_code = _get_team_code(m.get("away") or m.get("away_code"))

            # Compute next match pointer
            next_num = _next_match_num(round_name, slot)
            next_match_id: str | None = None
            if next_num is not None:
                nm = num_map.get(next_num)
                if nm is not None:
                    next_match_id = nm.get("slug", str(next_num))

            round_matches.append({
                "id": m.get("slug", str(num)),
                "round": round_name,
                "slot": slot,
                "home_team": home_code,
                "away_team": away_code,
                "home_team_name": m.get("home_name") or None,
                "away_team_name": m.get("away_name") or None,
                "home_crest": get_flag_url(home_code) if home_code else None,
                "away_crest": get_flag_url(away_code) if away_code else None,
                "home_score": _safe_int(m.get("score_home")),
                "away_score": _safe_int(m.get("score_away")),
                "status": (m.get("status") or "scheduled").lower(),
                "next_match_id": next_match_id,
            })

        if round_matches:
            rounds.append({
                "name": round_name,
                "label": label,
                "matches": round_matches,
            })

    return rounds


def map_groups(raw: list[dict]) -> list[dict]:
    # Filtrar equipos duplicados por país (ej: URU y URY para Uruguay)
    # El código de país puede tener múltiples variantes (URY/URU), usar nombre normalizado
    result = []
    for g in raw:
        seen = set()
        unique_teams = []
        for team_code in g["teams"]:
            # Ya que no tenemos el nombre, asumimos que códigos diferentes son países diferentes
            # EXCEPTO cuando sabemos que son duplicados (ej: URU/URY)
            normalized = team_code.upper()
            if normalized == "URY":
                normalized = "URU"  # Normalizar a URU
            
            if normalized not in seen:
                seen.add(normalized)
                unique_teams.append(team_code)
        
        result.append({
            "id": g["group"].lower(),
            "name": f"Group {g['group']}",
            "teams": [t.lower() for t in unique_teams],
        })
    return result


def map_teams(raw: list[dict]) -> list[dict]:
    # Filtrar duplicados por país (ej: URU y URY para Uruguay)
    seen = set()
    unique = []
    for t in raw:
        country_name = t["name"].lower()
        if country_name not in seen:
            seen.add(country_name)
            unique.append(t)
    
    return [
        {
            "id": t["code"].lower(),
            "name": t["name"],
            "code": t["code"],
            "group": t["group"].lower(),
            "crest": get_flag_url(t["code"]),
        }
        for t in unique
    ]


def map_venues(raw: list[dict]) -> list[dict]:
    venue_coords: dict[str, tuple[float, float]] = {
        "metlife": (40.8128, -74.0742),
        "sofi": (33.9535, -118.3392),
        "att": (32.7473, -97.0945),
        "hardrock": (25.9580, -80.2309),
        "mercedes": (33.7550, -84.4006),
        "nrg": (29.6847, -95.4107),
        "lincoln": (39.9000, -75.1672),
        "statefarm": (31.5157, -106.6472),
        "bank_of_america": (32.7079, -97.3575),
        "arrowhead": (39.0489, -94.4840),
        "levi": (37.4032, -121.9698),
        "geodis_park": (36.1644, -86.7672),
        "bc_place": (49.2768, -123.1118),
        "azteca": (19.3029, -99.1308),
        "bbva_bancomer": (25.7217, -100.2696),
        "calgary": (51.0317, -114.0970),
    }

    mapped = []
    for v in raw:
        vid = v["id"]
        lat, lon = venue_coords.get(vid, (0.0, 0.0))
        mapped.append(
            {
                "id": vid,
                "name": v["name"],
                "city": v["city"].split(",")[0].strip(),
                "country": v["country"],
                "capacity": v["capacity"],
                "latitude": lat,
                "longitude": lon,
                "region": VENUE_REGIONS.get(vid, "Unknown"),
            }
        )
    return mapped


def map_matches(raw: list[dict]) -> list[dict]:
    mapped = []
    for m in raw:
        home = _normalize_code(m.get("home") or m.get("home_code", ""))
        away = _normalize_code(m.get("away") or m.get("away_code", ""))
        if not home or not away:
            continue

        mapped.append({
            "id": m.get("slug", str(m.get("num", ""))),
            "home_team": home.lower(),
            "away_team": away.lower(),
            "home_team_name": m.get("home_name", home),
            "away_team_name": m.get("away_name", away),
            "venue": m.get("venue", ""),
            "venue_name": m.get("venue_name", ""),
            "venue_city": m.get("venue_city", ""),
            "datetime_utc": m.get("datetime_utc", ""),
            "date": m.get("date", ""),
            "time": m.get("time_utc", ""),
            "status": (m.get("status") or "scheduled").lower(),
            "home_score": _safe_int(m.get("score_home")),
            "away_score": _safe_int(m.get("score_away")),
            "phase": m.get("phase"),
            "group": m.get("group"),
            "round": m.get("round"),
        })
    return mapped


def map_match(raw: dict | None) -> dict | None:
    if not raw:
        return None
    home = _normalize_code(raw.get("home") or raw.get("home_code", ""))
    away = _normalize_code(raw.get("away") or raw.get("away_code", ""))
    return {
        "id": raw.get("slug", str(raw.get("num", ""))),
        "home_team": home.lower() if home else "",
        "away_team": away.lower() if away else "",
        "home_team_name": raw.get("home_name", home) if home else "",
        "away_team_name": raw.get("away_name", away) if away else "",
        "venue": raw.get("venue", ""),
        "venue_name": raw.get("venue_name", ""),
        "venue_city": raw.get("venue_city", ""),
        "datetime_utc": raw.get("datetime_utc", ""),
        "date": raw.get("date", ""),
        "time": raw.get("time_utc", ""),
        "status": (raw.get("status") or "scheduled").lower(),
        "home_score": _safe_int(raw.get("score_home")),
        "away_score": _safe_int(raw.get("score_away")),
        "phase": raw.get("phase"),
        "group": raw.get("group"),
        "round": raw.get("round"),
    }


def init_router(tournament_provider: ITournamentDataProvider, head_to_head_provider: IHeadToHeadProvider | None = None):
    global provider, h2h_provider
    provider = tournament_provider
    h2h_provider = head_to_head_provider


import re

_MONTH_ABBR = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


def _parse_score(s: str) -> tuple[int, int]:
    """Split "3-1" → (3, 1). Returns (0, 0) on bad input."""
    parts = s.split("-")
    return (
        int(parts[0]) if len(parts) == 2 and parts[0].isdigit() else 0,
        int(parts[1]) if len(parts) == 2 and parts[1].isdigit() else 0,
    )


def _match_date_sort_key(match: dict) -> tuple:
    """Sort key descending: (year, month, day). Falls back to tournament_year when the
    date string omits the year (e.g. "Sat Jun 12"). Returns (0,0,0) on nothing."""
    date_str = match.get("date")
    ty = match.get("tournament_year")
    if date_str:
        m = re.match(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", str(date_str).strip())
        if m:
            return (int(m.group(3)), _MONTH_ABBR.get(m.group(2).lower()[:3], 0), int(m.group(1)))
        m = re.match(r"(?:(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+)?(\d{1,2})\s+([A-Za-z]+)", str(date_str).strip())
        if m and ty:
            return (int(ty), _MONTH_ABBR.get(m.group(2).lower()[:3], 0), int(m.group(1)))
    return (int(ty), 0, 0) if ty else (0, 0, 0)


def _winner_from_score(t1g: int, t2g: int, is_t1_side: bool, team1: str, team2: str, mt1_name: str, mt2_name: str) -> str | None:
    """Return winner name (or None on draw) from score values and perspective."""
    if t1g > t2g:
        return mt1_name if is_t1_side else mt2_name
    if t2g > t1g:
        return mt2_name if is_t1_side else mt1_name
    return None


def _penalty_winner(penalty_score: str, is_t1_side: bool, team1: str, team2: str) -> str | None:
    """Return penalty winner name, or None if tied/malformed."""
    pt1, pt2 = _parse_score(penalty_score)
    return team1 if (is_t1_side and pt1 > pt2) or (not is_t1_side and pt2 > pt1) else team2 if pt1 != pt2 else None


def summarize_h2h(matches: list[dict], team1: str, team2: str) -> dict:
    t1_lower = resolve_team_name(team1).lower()
    t2_lower = resolve_team_name(team2).lower()

    team1_wins = 0
    team2_wins = 0
    draws = 0
    team1_goals = 0
    team2_goals = 0

    for m in matches:
        mt1_name = resolve_team_name(m.get("team1", {}).get("name", ""))
        mt2_name = resolve_team_name(m.get("team2", {}).get("name", ""))
        t1g, t2g = _parse_score(m.get("score", ""))

        # Attribute goals to our perspective
        if mt1_name.lower() == t1_lower:
            team1_goals += t1g
            team2_goals += t2g
        elif mt2_name.lower() == t1_lower:
            team1_goals += t2g
            team2_goals += t1g
        else:
            continue

        # Persist result
        if m.get("penalty_score"):
            pen_is_t1 = (mt1_name.lower() == t1_lower)
            w = _penalty_winner(m["penalty_score"], pen_is_t1, team1, team2)
            if w == team1:
                team1_wins += 1
            elif w == team2:
                team2_wins += 1
            else:
                draws += 1
        elif t1g > t2g:
            team1_wins += 1 if mt1_name.lower() == t1_lower else 0
            team2_wins += 1 if mt1_name.lower() != t1_lower else 0
        elif t2g > t1g:
            team1_wins += 1 if mt1_name.lower() == t2_lower else 0
            team2_wins += 1 if mt1_name.lower() != t2_lower else 0
        else:
            draws += 1

    sorted_matches = sorted(matches, key=_match_date_sort_key, reverse=True)

    last_meetings = []
    for m in sorted_matches[:5]:
        mt1_name = resolve_team_name(m.get("team1", {}).get("name", ""))
        mt2_name = resolve_team_name(m.get("team2", {}).get("name", ""))
        is_t1_side = mt1_name.lower() == t1_lower
        t1g, t2g = _parse_score(m.get("score", ""))

        winner: str | None = None
        if m.get("penalty_score"):
            winner = _penalty_winner(m["penalty_score"], is_t1_side, team1, team2)
        else:
            winner = _winner_from_score(t1g, t2g, is_t1_side, team1, team2, mt1_name, mt2_name)

        last_meetings.append({
            "year": m.get("tournament_year"),
            "date": m.get("date"),
            "stage": m.get("stage", ""),
            "score": m.get("score", ""),
            "winner": winner,
        })

    return {
        "total_matches": len(matches),
        "team1_wins": team1_wins,
        "team2_wins": team2_wins,
        "draws": draws,
        "team1_goals": team1_goals,
        "team2_goals": team2_goals,
        "last_meetings": last_meetings,
        "last_meeting": last_meetings[0] if last_meetings else None,
    }


@router.get("/groups")
async def get_groups():
    raw = await provider.get_groups()
    return {"data": map_groups(raw)}


@router.get("/teams")
async def get_teams():
    raw = await provider.get_teams()
    return {"data": map_teams(raw)}


@router.get("/venues")
async def get_venues():
    raw = await provider.get_venues()
    return {"data": map_venues(raw)}


@router.get("/matches")
async def get_matches():
    raw = await provider.get_matches()
    return {"data": map_matches(raw)}


@router.get("/matches/{match_id}")
async def get_match(match_id: str):
    match = await provider.get_match(match_id)
    if match is None:
        return JSONResponse(
            status_code=404,
            content={"error": "Match not found", "match_id": match_id},
        )
    return {"data": map_match(match)}


@router.get("/bracket")
async def get_bracket():
    try:
        raw = await provider.get_matches()
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"error": "provider_unavailable"},
        )
    return {"data": build_bracket_tree(raw)}


@router.get("/matches/{match_id}/enriched")
async def get_enriched_match(match_id: str):
    match = await provider.get_match(match_id)
    if match is None:
        return JSONResponse(
            status_code=404,
            content={"error": "Match not found", "match_id": match_id},
        )
    mapped = map_match(match)

    head_to_head = None
    if h2h_provider is not None and mapped.get("home_team_name") and mapped.get("away_team_name"):
        try:
            raw_h2h = await h2h_provider.get_head_to_head(
                mapped["home_team_name"], mapped["away_team_name"]
            )
            head_to_head = summarize_h2h(raw_h2h, mapped["home_team_name"], mapped["away_team_name"])
        except Exception:
            head_to_head = None

    return {"data": {"match": mapped, "head_to_head": head_to_head}}


@router.get("/tv")
async def get_tv():
    return {"data": await provider.get_tv()}