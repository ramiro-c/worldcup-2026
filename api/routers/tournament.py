from fastapi import APIRouter
from fastapi.responses import JSONResponse
from providers.interfaces import ITournamentDataProvider
from typing import Any

router = APIRouter(prefix="/tournament", tags=["tournament"])
provider: ITournamentDataProvider

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


def init_router(tournament_provider: ITournamentDataProvider):
    global provider
    provider = tournament_provider


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


@router.get("/tv")
async def get_tv():
    return {"data": await provider.get_tv()}