from fastapi import APIRouter, Query
from providers.openfootball import OpenfootballProvider
from providers.statsbomb import StatsBombProvider

router = APIRouter(prefix="/historical", tags=["historical"])
openfootball = OpenfootballProvider()
statsbomb = StatsBombProvider()


@router.get("/tournaments")
async def get_tournaments():
    return {"data": await openfootball.get_tournaments()}


@router.get("/tournaments/{year}")
async def get_tournament(year: int):
    return {"data": await openfootball.get_tournament(year)}


@router.get("/head-to-head")
async def get_head_to_head(team1: str = Query(...), team2: str = Query(...)):
    return {"data": await openfootball.get_head_to_head(team1, team2)}


@router.get("/competitions")
async def get_competitions():
    return {"data": await statsbomb.get_competitions()}


@router.get("/matches")
async def get_matches(
    competition_id: int = Query(...), season_id: int = Query(...)
):
    return {"data": await statsbomb.get_matches(competition_id, season_id)}


@router.get("/matches/{match_id}/events")
async def get_match_events(match_id: int):
    return {"data": await statsbomb.get_events(match_id)}


@router.get("/matches/{match_id}/lineups")
async def get_match_lineups(match_id: int):
    return {"data": await statsbomb.get_lineups(match_id)}
