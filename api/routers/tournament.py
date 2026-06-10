from fastapi import APIRouter
from providers.wheniskickoff import WheniskickoffProvider

router = APIRouter(prefix="/tournament", tags=["tournament"])
provider = WheniskickoffProvider()


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
