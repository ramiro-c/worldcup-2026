import re
from typing import Any
import httpx
from providers.aliases import resolve_player_name, resolve_team_name
from providers.interfaces import IHistoricalDataProvider, IHeadToHeadProvider, ITeamDataProvider, ITournamentStatsProvider
from providers.cache import MemoryCache

# Limpiar comentarios de YAML/txt (# al final)
COMMENT_RE = re.compile(r'\s*#.*$')

def clean_yaml_text(text: str) -> str:
    """Eliminar comentarios inline de archivos YAML/txt"""
    lines = text.split('\n')
    cleaned = [COMMENT_RE.sub('', line).rstrip() for line in lines]
    return '\n'.join(cleaned)

YEAR_DIR_MAP: dict[int, str] = {
    1930: "1930--uruguay",
    1934: "1934--italy",
    1938: "1938--france",
    1950: "1950--brazil",
    1954: "1954--switzerland",
    1958: "1958--sweden",
    1962: "1962--chile",
    1966: "1966--england",
    1970: "1970--mexico",
    1974: "1974--west-germany",
    1978: "1978--argentina",
    1982: "1982--spain",
    1986: "1986--mexico",
    1990: "1990--italy",
    1994: "1994--usa",
    1998: "1998--france",
    2002: "2002--south-korea-n-japan",
    2006: "2006--germany",
    2010: "2010--south-africa",
    2014: "2014--brazil",
    2018: "2018--russia",
    2022: "2022--qatar",
    2026: "2026--usa",
}

# Scorer data for tournaments where openfootball source lacks goal annotations.
# Source: FIFA / RSSSF official records. Covers 1954–2010 (14 tournaments).
# Team names use historical forms — resolve_team_name() normalizes them at runtime
# (e.g. "West Germany" → "Germany", "Soviet Union" → "Russia").
STATIC_SCORER_PATCHES: dict[int, list[dict]] = {
    1954: [
        {"player": "Sándor Kocsis",    "team": "Hungary",      "goals": 11},
        {"player": "Erich Probst",     "team": "Austria",      "goals": 6},
        {"player": "Max Morlock",      "team": "West Germany", "goals": 6},
        {"player": "Josef Hugi",       "team": "Switzerland",  "goals": 6},
        {"player": "Nándor Hidegkuti", "team": "Hungary",      "goals": 4},
        {"player": "Ferenc Puskás",    "team": "Hungary",      "goals": 4},
        {"player": "Helmut Rahn",      "team": "West Germany", "goals": 4},
    ],
    1958: [
        {"player": "Just Fontaine",   "team": "France",           "goals": 13},
        {"player": "Pelé",            "team": "Brazil",           "goals": 6},
        {"player": "Helmut Rahn",     "team": "West Germany",     "goals": 6},
        {"player": "Vavá",            "team": "Brazil",           "goals": 5},
        {"player": "Peter McParland", "team": "Northern Ireland", "goals": 5},
    ],
    1962: [
        {"player": "Garrincha",       "team": "Brazil",       "goals": 4},
        {"player": "Vavá",            "team": "Brazil",       "goals": 4},
        {"player": "Leonel Sánchez",  "team": "Chile",        "goals": 4},
        {"player": "Flórián Albert",  "team": "Hungary",      "goals": 4},
        {"player": "Valentin Ivanov", "team": "Soviet Union", "goals": 4},
        {"player": "Dražan Jerković", "team": "Yugoslavia",   "goals": 4},
        {"player": "Pelé",            "team": "Brazil",       "goals": 1},  # lesionado, jugó 2 partidos
    ],
    1966: [
        {"player": "Eusébio",           "team": "Portugal",     "goals": 9},
        {"player": "Helmut Haller",     "team": "West Germany", "goals": 6},
        {"player": "Geoff Hurst",       "team": "England",      "goals": 4},
        {"player": "Franz Beckenbauer", "team": "West Germany", "goals": 4},
        {"player": "Ferenc Bene",       "team": "Hungary",      "goals": 4},
        {"player": "Valery Porkujan",   "team": "Soviet Union", "goals": 4},
        {"player": "Pelé",              "team": "Brazil",       "goals": 1},  # vs Bulgaria
    ],
    1970: [
        {"player": "Gerd Müller",       "team": "West Germany", "goals": 10},
        {"player": "Jairzinho",         "team": "Brazil",       "goals": 7},
        {"player": "Teófilo Cubillas",  "team": "Peru",         "goals": 5},
        {"player": "Pelé",              "team": "Brazil",       "goals": 4},
        {"player": "Anatoly Byshovets", "team": "Soviet Union", "goals": 4},
    ],
    1974: [
        {"player": "Grzegorz Lato",    "team": "Poland",       "goals": 7},
        {"player": "Johan Neeskens",   "team": "Netherlands",  "goals": 5},
        {"player": "Andrzej Szarmach", "team": "Poland",       "goals": 5},
        {"player": "Gerd Müller",      "team": "West Germany", "goals": 4},
        {"player": "Ralf Edström",     "team": "Sweden",       "goals": 4},
        {"player": "Johnny Rep",       "team": "Netherlands",  "goals": 4},
    ],
    1978: [
        {"player": "Mario Kempes",    "team": "Argentina",  "goals": 6},
        {"player": "Teófilo Cubillas","team": "Peru",        "goals": 5},
        {"player": "Rob Rensenbrink", "team": "Netherlands", "goals": 5},
        {"player": "Hans Krankl",     "team": "Austria",     "goals": 4},
        {"player": "Leopoldo Luque",  "team": "Argentina",   "goals": 4},
    ],
    1982: [
        {"player": "Paolo Rossi",              "team": "Italy",        "goals": 6},
        {"player": "Karl-Heinz Rummenigge",    "team": "West Germany", "goals": 5},
        {"player": "Zbigniew Bońek",           "team": "Poland",       "goals": 4},
        {"player": "Zico",                     "team": "Brazil",       "goals": 4},
    ],
    1986: [
        {"player": "Gary Lineker",         "team": "England",   "goals": 6},
        {"player": "Emilio Butragueño",    "team": "Spain",     "goals": 5},
        {"player": "Careca",               "team": "Brazil",    "goals": 5},
        {"player": "Diego Maradona",       "team": "Argentina", "goals": 5},
        {"player": "Alessandro Altobelli", "team": "Italy",     "goals": 4},
        {"player": "Jorge Valdano",        "team": "Argentina", "goals": 4},
    ],
    1990: [
        {"player": "Salvatore Schillaci", "team": "Italy",          "goals": 6},
        {"player": "Tomáš Skuhravý",      "team": "Czechoslovakia", "goals": 5},
        {"player": "Gary Lineker",        "team": "England",        "goals": 4},
        {"player": "Lothar Matthäus",     "team": "West Germany",   "goals": 4},
        {"player": "Míchel",              "team": "Spain",          "goals": 4},
        {"player": "Roger Milla",         "team": "Cameroon",       "goals": 4},
    ],
    1994: [
        {"player": "Hristo Stoichkov",  "team": "Bulgaria",  "goals": 6},
        {"player": "Oleg Salenko",      "team": "Russia",    "goals": 6},
        {"player": "Romário",           "team": "Brazil",    "goals": 5},
        {"player": "Jürgen Klinsmann", "team": "Germany",   "goals": 5},
        {"player": "Roberto Baggio",    "team": "Italy",     "goals": 5},
        {"player": "Kennet Andersson",  "team": "Sweden",    "goals": 5},
        {"player": "Gabriel Batistuta", "team": "Argentina", "goals": 4},
    ],
    1998: [
        {"player": "Davor Šuker",       "team": "Croatia",   "goals": 6},
        {"player": "Gabriel Batistuta", "team": "Argentina", "goals": 5},
        {"player": "Christian Vieri",   "team": "Italy",     "goals": 5},
        {"player": "Luis Hernández",    "team": "Mexico",    "goals": 4},
        {"player": "Ronaldo",           "team": "Brazil",    "goals": 4},
        {"player": "Marcelo Salas",     "team": "Chile",     "goals": 4},
    ],
    2002: [
        {"player": "Ronaldo",             "team": "Brazil",  "goals": 8},
        {"player": "Miroslav Klose",      "team": "Germany", "goals": 5},
        {"player": "Rivaldo",             "team": "Brazil",  "goals": 5},
        {"player": "Jon Dahl Tomasson",   "team": "Denmark", "goals": 4},
        {"player": "Christian Vieri",     "team": "Italy",   "goals": 4},
    ],
    2006: [
        {"player": "Miroslav Klose", "team": "Germany",   "goals": 5},
        {"player": "Ronaldo",        "team": "Brazil",    "goals": 3},
        {"player": "Lionel Messi",   "team": "Argentina", "goals": 1},  # 74' vs SRB-MNE
    ],
    2010: [
        {"player": "Thomas Müller",   "team": "Germany",     "goals": 5},
        {"player": "David Villa",     "team": "Spain",       "goals": 5},
        {"player": "Wesley Sneijder", "team": "Netherlands", "goals": 5},
        {"player": "Diego Forlán",    "team": "Uruguay",     "goals": 5},
        {"player": "Miroslav Klose",  "team": "Germany",     "goals": 4},
        {"player": "Asamoah Gyan",    "team": "Ghana",       "goals": 3},
        {"player": "Gonzalo Higuaín", "team": "Argentina",   "goals": 3},
    ],
}

STAGE_MAP: dict[str, str] = {
    "Round of 16": "round_of_16",
    "Round of 32": "round_of_32",
    "Quarter-finals": "quarter_final",
    "Quarter-final": "quarter_final",
    "Semi-finals": "semi_final",
    "Semi-final": "semi_final",
    "Match for third place": "third_place",
    "Third place match": "third_place",
    "Final": "final",
}

MONTH_NAMES = (
    r"Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|"
    r"Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|"
    r"Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?"
)


class OpenfootballParser:
    DATE_SUFFIX = re.compile(
        r"(?:,\s*)?"
        r"(?:"
        r"\d{1,2}\s*[-–]\s*\d{1,2}\s+"
        r"|"
        r"\d{1,2}\s+"
        r")?"
        r"(?:"
        r"Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|"
        r"Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|"
        r"Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?"
        r").*$",
    )

    def _strip_dates(self, text: str) -> str:
        return self.DATE_SUFFIX.sub("", text).strip()

    def parse(self, text: str) -> dict:
        lines = text.split("\n")

        year = 0
        host = "Unknown"
        name = ""

        for line in lines:
            stripped = line.strip()
            if stripped.startswith("= World Cup "):
                year_match = re.search(r"= World Cup (\d{4})", stripped)
                if year_match:
                    year = int(year_match.group(1))
                    full = stripped.replace("= ", "").strip()
                    name = re.sub(r"\s*#.*$", "", full).strip()
                    host_match = re.search(r"# in (.+)", full)
                    if host_match:
                        host = self._strip_dates(host_match.group(1).strip())
                break

        groups: list[dict] = []
        for line in lines:
            stripped = line.strip()
            m = re.match(r"^Group ([A-Z0-9]+)\s*\|\s*(.+)$", stripped)
            if m:
                group_id = m.group(1)
                teams = re.split(r"\s{2,}", m.group(2).strip())
                teams = [t.strip() for t in teams if t.strip()]
                groups.append({"name": group_id, "teams": teams})

        matches: list[dict] = []
        current_date: str | None = None
        current_stage: str | None = None
        current_group: str | None = None

        for i, line in enumerate(lines):
            stripped = line.strip()

            if not stripped or stripped.startswith("#") or stripped.startswith("= "):
                continue

            if stripped.startswith(("▪", "•")):
                round_raw = stripped[1:].strip()
                round_parts = round_raw.split("|", 1)
                round_name = round_parts[0].strip()
                current_stage = round_name
                current_group = None
                current_date = None
                group_round = re.match(r"^Group ([A-Z0-9]+)$", round_name)
                if group_round:
                    current_group = group_round.group(1)
                    current_stage = "group"
                continue

            date_match = re.match(
                r"^(?:(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+)?"
                rf"(?:{MONTH_NAMES})\s+\d+$",
                stripped,
            )
            if date_match:
                current_date = stripped
                continue

            if self._looks_like_match(stripped):
                match = self._parse_match_line(line, current_date)
                if match:
                    stage = current_stage if current_stage else "unknown"
                    if stage in STAGE_MAP:
                        stage = STAGE_MAP[stage]
                    match["stage"] = stage
                    match["group_name"] = current_group
                    match["_raw_index"] = i
                    matches.append(match)

        for match in matches:
            idx = match.pop("_raw_index")
            scorer_lines: list[str] = []
            for j in range(idx + 1, min(idx + 10, len(lines))):
                orig = lines[j]
                text = orig.strip()
                if not text:
                    continue
                if self._looks_like_match(text):
                    break
                is_indented = not text.startswith("(") and (
                    orig[: len(orig) - len(text.lstrip())] != ""
                )
                if text.startswith("(") or is_indented:
                    if "'" in text:
                        scorer_lines.append(text)
                        continue
                break
            if scorer_lines:
                full_text = " ".join(scorer_lines)
                if full_text.startswith("("):
                    match["scorers"] = self._parse_scorers(
                        full_text,
                        match["score"],
                        match["team1"]["name"],
                        match["team2"]["name"],
                    )

        return {
            "year": year,
            "host": host,
            "name": name,
            "groups": groups,
            "matches": matches,
        }

    def _looks_like_match(self, text: str) -> bool:
        return bool(re.search(r"\d+-\d+", text)) and "@" in text

    def _parse_match_line(self, line: str, current_date: str | None) -> dict | None:
        stripped = line.strip()

        at_pos = stripped.rfind(" @ ")
        if at_pos == -1:
            return None
        venue = stripped[at_pos + 3 :].strip()
        before_at = stripped[:at_pos].rstrip()

        time_val: str | None = None
        m = re.match(r"^(\d{1,2}:\d{2})(?:\s+UTC[+-]\d+)?\s+", before_at)
        if m:
            time_val = m.group(1)
            before_at = before_at[m.end() :]

        date_val: str | None = current_date
        for date_pat in [
            rf"^((?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(?:{MONTH_NAMES})\s+\d+)\s+",
            rf"^(\d{{1,2}}\s+(?:{MONTH_NAMES}))\s+",
        ]:
            m = re.match(date_pat, before_at)
            if m:
                date_val = m.group(1)
                before_at = before_at[m.end() :]
                break

        v_pos = before_at.find(" v ")
        if v_pos != -1:
            team1 = before_at[:v_pos].strip()
            rest = before_at[v_pos + 3 :].strip()
            score_match = re.search(r"(\d+)-(\d+)", rest)
            if not score_match:
                return None
            team2 = rest[: score_match.start()].strip()
            score_str = score_match.group()
            extras = rest[score_match.end() :].strip()
        else:
            score_match = re.search(r"(\d+)-(\d+)", before_at)
            if not score_match:
                return None
            team1 = before_at[: score_match.start()].strip()
            score_str = score_match.group()
            after_score = before_at[score_match.end() :].strip()

            extras, team2 = self._strip_extras(after_score)

        ht_score: str | None = None
        has_extra_time = False
        penalty_score: str | None = None

        if "a.e.t." in extras:
            has_extra_time = True

        pen_match = re.search(r"(\d+)-(\d+)\s+pen\.", extras)
        if pen_match:
            penalty_score = f"{pen_match.group(1)}-{pen_match.group(2)}"

        ht_match = re.search(r"\((\d+)-(\d+)\)", extras)
        if ht_match:
            ht_score = f"{ht_match.group(1)}-{ht_match.group(2)}"

        t1g, t2g = int(score_str.split("-")[0]), int(score_str.split("-")[1])
        team1_is_winner = False
        team2_is_winner = False

        if penalty_score:
            pt1, pt2 = map(int, penalty_score.split("-"))
            if pt1 > pt2:
                team1_is_winner = True
            else:
                team2_is_winner = True
        elif t1g > t2g:
            team1_is_winner = True
        elif t2g > t1g:
            team2_is_winner = True

        return {
            "date": date_val,
            "time": time_val,
            "team1": {"name": team1, "is_winner": team1_is_winner},
            "team2": {"name": team2, "is_winner": team2_is_winner},
            "score": score_str,
            "ht_score": ht_score,
            "has_extra_time": has_extra_time,
            "penalty_score": penalty_score,
            "venue": venue,
            "scorers": [],
        }

    def _strip_extras(self, text: str) -> tuple[str, str]:
        extras_parts: list[str] = []
        remaining = text

        while remaining:
            matched = False
            for pattern in [
                r"^\(\d+-\d+(?:,\s*\d+-\d+)?\)\s*,?\s*",
                r"^a\.e\.t\.(?:/g\.g\.)?\s*",
                r"^\d+-\d+\s+pen\.\s*",
            ]:
                m = re.match(pattern, remaining)
                if m:
                    extras_parts.append(m.group().strip())
                    remaining = remaining[m.end() :]
                    matched = True
                    break
            if not matched:
                break

        return " ".join(extras_parts), remaining.strip()

    def _parse_scorers(
        self, text: str, score: str, team1_name: str, team2_name: str
    ) -> list[dict]:
        text = text.strip().strip("()")
        if not text:
            return []

        t1g = int(score.split("-")[0])
        t2g = int(score.split("-")[1])
        team_parts = re.split(r"\s*;\s*", text)
        result: list[dict] = []

        if len(team_parts) >= 2:
            for ti, tp in enumerate(team_parts):
                tn = team1_name if ti == 0 else team2_name
                for s in self._parse_scorer_group(tp):
                    s["team"] = tn
                    result.append(s)
        else:
            scorers = self._parse_scorer_group(team_parts[0])
            if len(scorers) == t1g and t2g == 0:
                team = team1_name
            else:
                team = team2_name
            for s in scorers:
                s["team"] = team
                result.append(s)

        return result

    def _parse_scorer_group(self, text: str) -> list[dict]:
        last_name: str | None = None
        result: list[dict] = []
        last_end = 0

        for m in re.finditer(r"(\d+)(?:\+(\d+)|'\+(\d+))?", text):
            pre = text[last_end : m.start()].strip(" ,;\t\n'")

            if pre and any(c.isalpha() for c in pre):
                last_name = pre

            minute = int(m.group(1))

            after = text[m.end() :]
            penalty = False
            suf_match = re.match(r"'?\s*(?:\((p|pen\.?|og|o\.g\.)\))", after)
            if suf_match:
                penalty = suf_match.group(1) in ("p", "pen", "pen.")
                last_end = m.end() + suf_match.end()
            else:
                last_end = m.end()

            if last_name:
                result.append(
                    {"player": last_name, "minute": minute, "penalty": penalty}
                )

        return result


class OpenfootballProvider(IHistoricalDataProvider, IHeadToHeadProvider, ITeamDataProvider, ITournamentStatsProvider):
    def __init__(self):
        self._fetch_cache = MemoryCache(default_ttl=300)
        self._parsed_cache = MemoryCache(default_ttl=300)
        self._parser = OpenfootballParser()

    async def _fetch(self, url: str) -> str | None:
        is_fresh, cached = self._fetch_cache.get(url)
        if is_fresh:
            return cached

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(url, timeout=15)
                resp.raise_for_status()
                text = resp.text
                self._fetch_cache.set(url, text)
                return text
            except Exception:
                if cached is not None:
                    return cached
                return None

    async def get_tournaments(self) -> list[dict[str, Any]]:
        tournaments: list[dict] = []
        for year in sorted(YEAR_DIR_MAP):
            try:
                data = await self.get_tournament(year)
                tournaments.append(
                    {"year": data["year"], "name": data["name"], "host": data["host"]}
                )
            except Exception:
                continue
        return tournaments

    async def get_tournament(self, year: int) -> dict[str, Any]:
        cache_key = f"tournament:{year}"
        is_fresh, cached = self._parsed_cache.get(cache_key)
        if is_fresh:
            return cached

        directory = YEAR_DIR_MAP.get(year)
        if not directory:
            return {}

        base = "https://raw.githubusercontent.com/openfootball/worldcup/master"
        cup_text = await self._fetch(f"{base}/{directory}/cup.txt")
        if cup_text is None:
            return {}

        result = self._parser.parse(cup_text)

        finals_text = await self._fetch(f"{base}/{directory}/cup_finals.txt")
        if finals_text:
            finals_data = self._parser.parse(finals_text)
            result["matches"].extend(finals_data["matches"])

        self._parsed_cache.set(cache_key, result)
        return result

    async def get_head_to_head(self, team1: str, team2: str) -> list[dict]:
        matches: list[dict] = []
        t1_canon = resolve_team_name(team1)
        t2_canon = resolve_team_name(team2)
        t1_lower = t1_canon.lower()
        t2_lower = t2_canon.lower()
        for year in YEAR_DIR_MAP:
            try:
                tournament = await self.get_tournament(year)
                for match in tournament.get("matches", []):
                    mt1 = resolve_team_name(match["team1"]["name"]).lower()
                    mt2 = resolve_team_name(match["team2"]["name"]).lower()
                    if (mt1 == t1_lower and mt2 == t2_lower) or (
                        mt1 == t2_lower and mt2 == t1_lower
                    ):
                        enriched = dict(match)
                        enriched["tournament_year"] = year
                        enriched["tournament_name"] = tournament.get("name", "")
                        matches.append(enriched)
            except Exception:
                continue
        return matches

    async def get_team_matches(self, team_name: str) -> list[dict]:
        matches: list[dict] = []
        team_canon = resolve_team_name(team_name)
        team_lower = team_canon.lower()
        for year in YEAR_DIR_MAP:
            try:
                tournament = await self.get_tournament(year)
                for match in tournament.get("matches", []):
                    mt1 = resolve_team_name(match["team1"]["name"]).lower()
                    mt2 = resolve_team_name(match["team2"]["name"]).lower()
                    if mt1 == team_lower or mt2 == team_lower:
                        enriched = dict(match)
                        enriched["tournament_year"] = year
                        enriched["tournament_name"] = tournament.get("name", "")
                        matches.append(enriched)
            except Exception:
                continue
        return matches

    async def get_tournament_stats(self) -> dict:
        """Aggregate stats across all tournaments: champion counts, biggest wins,
        total goals, host records, top scorers. Cached with 5-min TTL."""
        cache_key = "tournament_stats"
        is_fresh, cached = self._parsed_cache.get(cache_key)
        if is_fresh:
            return cached

        try:
            result = await self._compute_tournament_stats()
        except Exception:
            if cached is not None:
                return cached
            raise

        self._parsed_cache.set(cache_key, result)
        return result

    async def _compute_tournament_stats(self) -> dict:
        champion_counts: dict[str, int] = {}
        biggest_wins: list[dict] = []
        total_goals = 0
        host_records: list[dict] = []
        scorer_totals: dict[str, dict] = {}
        tournament_count = 0
        skipped_years: list[int] = []

        for year in sorted(YEAR_DIR_MAP):
            try:
                tournament = await self.get_tournament(year)
                if not tournament.get("matches"):
                    skipped_years.append(year)
                    continue

                tournament_count += 1

                # Champion detection
                champion = self._detect_champion(tournament)
                if champion:
                    canon = resolve_team_name(champion)
                    champion_counts[canon] = champion_counts.get(canon, 0) + 1

                # Host record
                host = tournament.get("host", "Unknown")
                host_records.append({
                    "year": year,
                    "host": host,
                    "champion": champion or "—",
                })

                # Biggest wins + total goals + top scorers
                for match in tournament.get("matches", []):
                    t1g, t2g = self._parse_score(match.get("score", "0-0"))
                    total_goals += t1g + t2g
                    margin = abs(t1g - t2g)

                    if margin >= 4:
                        biggest_wins.append({
                            "year": year,
                            "team1": match["team1"]["name"],
                            "team2": match["team2"]["name"],
                            "score": match["score"],
                            "margin": margin,
                            "stage": match.get("stage", "unknown"),
                        })

                    # Scorers aggregation
                    # Key on (player, team) to prevent cross-team collisions
                    # (e.g. "Silva" from Brazil vs Portugal).
                    # The parser preserves the full name when available
                    # (e.g. "Gerd Müller" not "Müller"), so players sharing
                    # a last name within the same team will still be merged
                    # — the source data doesn't carry enough disambiguation.
                    for scorer in match.get("scorers", []):
                        player = scorer.get("player", "").strip()
                        if not player:
                            continue
                        team = resolve_team_name(scorer.get("team", "").strip() or "Unknown")
                        player = resolve_player_name(player, team)
                        key = (player, team)
                        if key not in scorer_totals:
                            scorer_totals[key] = {"goals": 0, "tournaments": set()}
                        scorer_totals[key]["goals"] += 1
                        scorer_totals[key]["tournaments"].add(year)

                # Inject static scorer data for tournaments without annotations
                for patch in STATIC_SCORER_PATCHES.get(year, []):
                    p_team = resolve_team_name(patch["team"])
                    p_name = resolve_player_name(patch["player"], p_team)
                    key = (p_name, p_team)
                    if key not in scorer_totals:
                        scorer_totals[key] = {"goals": 0, "tournaments": set()}
                    scorer_totals[key]["goals"] += patch["goals"]
                    scorer_totals[key]["tournaments"].add(year)

            except Exception:
                skipped_years.append(year)
                continue

        # Sort champion counts descending
        sorted_champions = sorted(
            [{"country": c, "count": n} for c, n in champion_counts.items()],
            key=lambda x: (-x["count"], x["country"]),
        )

        # Sort biggest wins by margin desc, then year desc
        biggest_wins.sort(key=lambda x: (-x["margin"], -x["year"]))
        top_biggest = biggest_wins[:10]

        # Sort top scorers by goals desc, then name asc
        top_scorers_list = sorted(
            [
                {
                    "player": player,
                    "team": team,
                    "goals": d["goals"],
                    "tournaments": sorted(list(d["tournaments"])),
                }
                for (player, team), d in scorer_totals.items()
            ],
            key=lambda x: (-x["goals"], x["player"]),
        )[:30]

        result = {
            "champion_counts": sorted_champions,
            "biggest_wins": top_biggest,
            "total_goals": {
                "overall": total_goals,
                "avg_per_tournament": round(total_goals / tournament_count, 1) if tournament_count else 0,
            },
            "host_records": host_records,
            "top_scorers": top_scorers_list,
        }

        if skipped_years:
            result["skipped_tournaments"] = skipped_years

        return result

    def _detect_champion(self, tournament: dict) -> str | None:
        """Detect the tournament champion. Tries match with stage 'final',
        falls back to special cases like 1950."""
        matches = tournament.get("matches", [])
        year = tournament.get("year", 0)

        # Try official final match
        for match in matches:
            if match.get("stage") == "final":
                if match["team1"]["is_winner"]:
                    return match["team1"]["name"]
                elif match["team2"]["is_winner"]:
                    return match["team2"]["name"]

        # 1950: no final match — final round-robin, Uruguay champion
        if year == 1950:
            return "Uruguay"

        return None

    def _parse_score(self, score: str) -> tuple[int, int]:
        """Parse a score string like '3-1' into (3, 1)."""
        parts = score.split("-")
        if len(parts) == 2:
            try:
                return int(parts[0]), int(parts[1])
            except ValueError:
                pass
        return 0, 0
