from __future__ import annotations
from fastapi import APIRouter, Query
from providers.interfaces import IHistoricalDataProvider, IHeadToHeadProvider, ITeamDataProvider, IEventDataProvider

router = APIRouter(prefix="/historical", tags=["historical"])
historical_provider: IHistoricalDataProvider & IHeadToHeadProvider & ITeamDataProvider
event_provider: IEventDataProvider


def init_router(historical: IHistoricalDataProvider & IHeadToHeadProvider & ITeamDataProvider, events: IEventDataProvider):
    global historical_provider, event_provider
    historical_provider = historical
    event_provider = events


@router.get("/tournaments")
async def get_tournaments():
    return {"data": await historical_provider.get_tournaments()}


@router.get("/tournaments/{year}")
async def get_tournament(year: int):
    return {"data": await historical_provider.get_tournament(year)}


@router.get("/head-to-head")
async def get_head_to_head(team1: str = Query(...), team2: str = Query(...)):
    return {"data": await historical_provider.get_head_to_head(team1, team2)}


@router.get("/competitions")
async def get_competitions():
    return {"data": await event_provider.get_competitions()}


@router.get("/matches")
async def get_matches(
    competition_id: int = Query(...), season_id: int = Query(...)
):
    return {"data": await event_provider.get_matches(competition_id, season_id)}


@router.get("/matches/{match_id}/events")
async def get_match_events(match_id: int):
    return {"data": await event_provider.get_events(match_id)}


@router.get("/teams/{team_name}/matches")
async def get_team_matches(team_name: str):
    return {"data": await historical_provider.get_team_matches(team_name)}


@router.get("/matches/{match_id}/lineups")
async def get_match_lineups(match_id: int):
    return {"data": await event_provider.get_lineups(match_id)}