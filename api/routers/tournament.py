from fastapi import APIRouter
from providers.interfaces import ITournamentDataProvider

router = APIRouter(prefix="/tournament", tags=["tournament"])
provider: ITournamentDataProvider


def init_router(tournament_provider: ITournamentDataProvider):
    global provider
    provider = tournament_provider


@router.get("/groups")
async def get_groups():
    return {"data": await provider.get_groups()}


@router.get("/teams")
async def get_teams():
    return {"data": await provider.get_teams()}


@router.get("/venues")
async def get_venues():
    return {"data": await provider.get_venues()}


@router.get("/matches")
async def get_matches():
    return {"data": await provider.get_matches()}


@router.get("/tv")
async def get_tv():
    return {"data": await provider.get_tv()}