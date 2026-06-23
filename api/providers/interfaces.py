from abc import ABC, abstractmethod
from typing import Any


class ITournamentDataProvider(ABC):
    """Interfaz para proveedores de datos del torneo actual"""

    @abstractmethod
    async def get_groups(self) -> list[dict]:
        """Retorna los grupos del torneo"""
        pass

    @abstractmethod
    async def get_teams(self) -> list[dict]:
        """Retorna todos los equipos"""
        pass

    @abstractmethod
    async def get_venues(self) -> list[dict]:
        """Retorna las sedes"""
        pass

    @abstractmethod
    async def get_matches(self) -> list[dict]:
        """Retorna todos los partidos"""
        pass

    @abstractmethod
    async def get_match(self, match_id: str) -> dict | None:
        """Retorna un partido específico por ID"""
        pass

    @abstractmethod
    async def get_tv(self) -> list[dict]:
        """Retorna la información de TV"""
        pass


class IHistoricalDataProvider(ABC):
    """Interfaz para proveedores de datos históricos"""

    @abstractmethod
    async def get_tournaments(self) -> list[dict]:
        """Retorna lista de torneos disponibles"""
        pass

    @abstractmethod
    async def get_tournament(self, year: int) -> dict:
        """Retorna datos de un torneo específico por año"""
        pass


class IHeadToHeadProvider(ABC):
    """Interfaz para proveedores de enfrentamientos históricos"""

    @abstractmethod
    async def get_head_to_head(self, team1: str, team2: str) -> list[dict]:
        """Retorna partidos históricos entre dos equipos"""
        pass


class ITeamDataProvider(ABC):
    """Interfaz para datos de un equipo histórico"""

    @abstractmethod
    async def get_team_matches(self, team_name: str) -> list[dict]:
        """Retorna todos los partidos históricos de un equipo"""
        pass


class IEventDataProvider(ABC):
    """Interfaz para proveedores de eventos y estadísticas detalladas"""

    @abstractmethod
    async def get_competitions(self) -> list[dict]:
        """Retorna competiciones disponibles"""
        pass

    @abstractmethod
    async def get_matches(
        self, competition_id: int, season_id: int
    ) -> list[dict]:
        """Retorna partidos de una competición y temporada"""
        pass

    @abstractmethod
    async def get_events(self, match_id: int) -> list[dict]:
        """Retorna eventos de un partido"""
        pass

    @abstractmethod
    async def get_lineups(self, match_id: int) -> list[dict]:
        """Retorna alineaciones de un partido"""
        pass

    @abstractmethod
    async def get_three_sixty(self, match_id: int) -> list[dict]:
        """Retorna datos 360 del partido"""
        pass


class ITournamentStatsProvider(ABC):
    """Interfaz para estadísticas agregadas históricas"""

    @abstractmethod
    async def get_tournament_stats(self) -> dict:
        """Retorna estadísticas agregadas de todos los mundiales.
        
        Returns:
            dict con champion_counts, biggest_wins, total_goals, host_records, top_scorers
        """
        pass