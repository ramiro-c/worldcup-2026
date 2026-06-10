import re
import time
from typing import Any
import httpx

CACHE_TTL = 300

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
                    name = stripped.replace("= ", "").strip()
                    host_match = re.search(r"# in (.+?)(?:,| – | — |$)", stripped)
                    if host_match:
                        host = host_match.group(1).strip()
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


class OpenfootballProvider:
    def __init__(self):
        self._cache: dict[str, tuple[float, str]] = {}
        self._parser = OpenfootballParser()

    async def _fetch(self, url: str) -> str | None:
        now = time.time()
        if url in self._cache:
            ts, data = self._cache[url]
            if now - ts < CACHE_TTL:
                return data

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(url, timeout=15)
                resp.raise_for_status()
                text = resp.text
                self._cache[url] = (now, text)
                return text
            except Exception:
                if url in self._cache:
                    return self._cache[url][1]
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

        return result

    async def get_head_to_head(self, team1: str, team2: str) -> list[dict]:
        matches: list[dict] = []
        t1_lower = team1.lower().strip()
        t2_lower = team2.lower().strip()
        for year in YEAR_DIR_MAP:
            try:
                tournament = await self.get_tournament(year)
                for match in tournament.get("matches", []):
                    mt1 = match["team1"]["name"].lower()
                    mt2 = match["team2"]["name"].lower()
                    if (mt1 == t1_lower and mt2 == t2_lower) or (
                        mt1 == t2_lower and mt2 == t1_lower
                    ):
                        matches.append(match)
            except Exception:
                continue
        return matches
