from fastapi import APIRouter
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
    "statefarm": "Western",
    "bank_of_america": "Western",
    "arrowhead": "Central",
    "levi": "Western",
    "geodis_park": "Central",
    "bc_place": "Western",
    "azteca": "Central",
    "bbva_bancomer": "Central",
    "calgary": "Western",
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
    return [
        {
            "id": g["group"].lower(),
            "name": f"Group {g['group']}",
            "teams": [t.lower() for t in g["teams"]],
        }
        for g in raw
    ]


def map_teams(raw: list[dict]) -> list[dict]:
    return [
        {
            "id": t["code"].lower(),
            "name": t["name"],
            "code": t["code"],
            "group": t["group"].lower(),
            "crest": get_flag_url(t["code"]),
        }
        for t in raw
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
        mapped.append(
            {
                "id": m.get("slug", str(m.get("num", ""))),
                "home_team": home.lower(),
                "away_team": away.lower(),
                "home_team_name": m.get("home_name", home),
                "away_team_name": m.get("away_name", away),
                "venue": m.get("venue", ""),
                "venue_name": m.get("venue_name", ""),
                "date": m.get("date", ""),
                "time": m.get("time_utc", ""),
                "status": "scheduled",
                "group": m.get("group"),
                "round": m.get("round"),
            }
        )
    return mapped


def map_match(raw: dict | None) -> dict | None:
    if not raw:
        return None
    return map_matches([raw])[0]


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
    matches = await provider.get_matches()
    for match in matches:
        if match.get("slug") == match_id or str(match.get("num")) == match_id:
            return {"data": map_match(match)}
    return {"data": None}


@router.get("/tv")
async def get_tv():
    return {"data": await provider.get_tv()}