from __future__ import annotations
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import routers.tournament as tournament_module
import routers.historical as historical_module
from providers.interfaces import (
    ITournamentDataProvider,
    IHistoricalDataProvider,
    IHeadToHeadProvider,
    ITournamentStatsProvider,
    IEventDataProvider,
)
from providers.wheniskickoff import WheniskickoffProvider
from providers.openfootball import OpenfootballProvider
from providers.statsbomb import StatsBombProvider

tournament_provider: ITournamentDataProvider = WheniskickoffProvider()
historical_provider: IHistoricalDataProvider & IHeadToHeadProvider & ITournamentStatsProvider = OpenfootballProvider()
event_provider: IEventDataProvider = StatsBombProvider()

app = FastAPI(
    title="Mundial 2026 API",
    description="World Cup 2026 companion API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://worldcup-2026.rami992009.workers.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tournament_module.init_router(tournament_provider, historical_provider)
historical_module.init_router(historical_provider, event_provider)

app.include_router(tournament_module.router)
app.include_router(historical_module.router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)