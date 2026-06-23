from __future__ import annotations
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from providers.interfaces import ITournamentDataProvider, IHeadToHeadProvider
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
    cca2 = FIFA_TO_CCA2.get(fifa_code, "xx")
    return f"https://flagcdn.com/{cca2}.svg"


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
        home = m.get("home") or m.get("home_code", "")
        away = m.get("away") or m.get("away_code", "")
        if not home or not away:
            continue
        
        home_normalized = home.upper()
        away_normalized = away.upper()
        if home_normalized == "URY":
            home_normalized = "URU"
        if away_normalized == "URY":
            away_normalized = "URU"
        
        score_home_raw = m.get("score_home")
        score_away_raw = m.get("score_away")
        try:
            home_score = int(score_home_raw) if score_home_raw is not None else None
        except (ValueError, TypeError):
            home_score = None
        try:
            away_score = int(score_away_raw) if score_away_raw is not None else None
        except (ValueError, TypeError):
            away_score = None

        mapped.append(
            {
                "id": m.get("slug", str(m.get("num", ""))),
                "home_team": home_normalized.lower(),
                "away_team": away_normalized.lower(),
                "home_team_name": m.get("home_name", home),
                "away_team_name": m.get("away_name", away),
                "venue": m.get("venue", ""),
                "venue_name": m.get("venue_name", ""),
                "venue_city": m.get("venue_city", ""),
                "datetime_utc": m.get("datetime_utc", ""),
                "date": m.get("date", ""),
                "time": m.get("time_utc", ""),
                "status": (m.get("status") or "scheduled").lower(),
                "home_score": home_score,
                "away_score": away_score,
                "phase": m.get("phase"),
                "group": m.get("group"),
                "round": m.get("round"),
            }
        )
    return mapped


def map_match(raw: dict | None) -> dict | None:
    if not raw:
        return None

    home = raw.get("home") or raw.get("home_code", "")
    away = raw.get("away") or raw.get("away_code", "")

    # Normalize codes (preserve empty string for TBD)
    home_normalized = home.upper() if home else ""
    away_normalized = away.upper() if away else ""
    if home_normalized == "URY":
        home_normalized = "URU"
    if away_normalized == "URY":
        away_normalized = "URU"

    score_home_raw = raw.get("score_home")
    score_away_raw = raw.get("score_away")
    try:
        home_score = int(score_home_raw) if score_home_raw is not None else None
    except (ValueError, TypeError):
        home_score = None
    try:
        away_score = int(score_away_raw) if score_away_raw is not None else None
    except (ValueError, TypeError):
        away_score = None

    return {
        "id": raw.get("slug", str(raw.get("num", ""))),
        "home_team": home_normalized.lower() if home else "",
        "away_team": away_normalized.lower() if away else "",
        "home_team_name": raw.get("home_name", home) if home else "",
        "away_team_name": raw.get("away_name", away) if away else "",
        "venue": raw.get("venue", ""),
        "venue_name": raw.get("venue_name", ""),
        "venue_city": raw.get("venue_city", ""),
        "datetime_utc": raw.get("datetime_utc", ""),
        "date": raw.get("date", ""),
        "time": raw.get("time_utc", ""),
        "status": (raw.get("status") or "scheduled").lower(),
        "home_score": home_score,
        "away_score": away_score,
        "phase": raw.get("phase"),
        "group": raw.get("group"),
        "round": raw.get("round"),
    }


def init_router(tournament_provider: ITournamentDataProvider, head_to_head_provider: IHeadToHeadProvider | None = None):
    global provider, h2h_provider
    provider = tournament_provider
    h2h_provider = head_to_head_provider


def summarize_h2h(matches: list[dict], team1: str, team2: str) -> dict:
    """Summarize raw head-to-head matches into a compact digest.

    Args:
        matches: Raw historical matches from get_head_to_head.
        team1: Home team name (canonical).
        team2: Away team name (canonical).

    Returns:
        Summary dict with total_matches, team1/team2 wins/draws/goals,
        last_meetings (up to 5), and last_meeting.
    """
    t1_lower = team1.strip().lower()
    t2_lower = team2.strip().lower()

    team1_wins = 0
    team2_wins = 0
    draws = 0
    team1_goals = 0
    team2_goals = 0

    for m in matches:
        mt1_name = m.get("team1", {}).get("name", "")
        mt2_name = m.get("team2", {}).get("name", "")
        score = m.get("score", "")
        parts = score.split("-")
        t1g = int(parts[0]) if len(parts) == 2 and parts[0].isdigit() else 0
        t2g = int(parts[1]) if len(parts) == 2 and parts[1].isdigit() else 0

        # Determine which side team1/team2 are on in this historical match
        if mt1_name.lower() == t1_lower:
            team1_goals += t1g
            team2_goals += t2g
        elif mt2_name.lower() == t1_lower:
            team1_goals += t2g
            team2_goals += t1g
        else:
            continue

        # Determine result from our perspective (team1 = first arg = home team)
        if m.get("penalty_score"):
            pen_parts = m["penalty_score"].split("-")
            pt1 = int(pen_parts[0]) if len(pen_parts) == 2 else 0
            pt2 = int(pen_parts[1]) if len(pen_parts) == 2 else 0
            # Penalty winner is the team that won on penalties
            pen_winner_is_team1 = (
                (mt1_name.lower() == t1_lower and pt1 > pt2) or
                (mt2_name.lower() == t1_lower and pt2 > pt1)
            )
            if pen_winner_is_team1:
                team1_wins += 1
            else:
                team2_wins += 1
        elif t1g > t2g:
            if mt1_name.lower() == t1_lower:
                team1_wins += 1
            else:
                team2_wins += 1
        elif t2g > t1g:
            if mt1_name.lower() == t2_lower:
                team1_wins += 1
            else:
                team2_wins += 1
        else:
            draws += 1

    # Sort by year desc (matches from get_head_to_head are chronological)
    sorted_matches = sorted(
        matches,
        key=lambda m: (
            m.get("date", "") or "",
        ),
        reverse=True,
    )

    last_meetings = []
    for m in sorted_matches[:5]:
        mt1_name = m.get("team1", {}).get("name", "")
        mt2_name = m.get("team2", {}).get("name", "")
        score = m.get("score", "")
        stage = m.get("stage", "")
        is_team1_side = mt1_name.lower() == t1_lower

        # Determine winner from enriched perspective
        winner = None
        if m.get("penalty_score"):
            pen_parts = m["penalty_score"].split("-")
            pt1 = int(pen_parts[0]) if len(pen_parts) == 2 else 0
            pt2 = int(pen_parts[1]) if len(pen_parts) == 2 else 0
            pen_winner_is_team1 = (
                (is_team1_side and pt1 > pt2) or
                (not is_team1_side and pt2 > pt1)
            )
            if pen_winner_is_team1:
                winner = team1
            else:
                winner = team2
        else:
            parts = score.split("-")
            t1g_val = int(parts[0]) if len(parts) == 2 and parts[0].isdigit() else 0
            t2g_val = int(parts[1]) if len(parts) == 2 and parts[1].isdigit() else 0
            if t1g_val > t2g_val:
                winner = mt1_name if is_team1_side else mt2_name
            elif t2g_val > t1g_val:
                winner = mt2_name if is_team1_side else mt1_name

        last_meetings.append({
            "year": None,
            "date": m.get("date"),
            "stage": stage,
            "score": score,
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