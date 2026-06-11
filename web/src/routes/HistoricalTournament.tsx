import { useParams, Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync";
import { getHistoricalTournament } from "../lib/api";
import type { HistoricalMatch } from "../lib/types";

const STAGE_LABELS: Record<string, string> = {
  group: "Fase de Grupos",
  round_of_16: "Octavos de Final",
  round_of_32: "Dieciseisavos de Final",
  quarter_final: "Cuartos de Final",
  semi_final: "Semifinales",
  third_place: "Tercer Puesto",
  final: "Final",
};

const FLAGS: Record<number, string> = {
  1930: "🇺🇾", 1934: "🇮🇹", 1938: "🇫🇷", 1950: "🇧🇷",
  1954: "🇨🇭", 1958: "🇸🇪", 1962: "🇨🇱", 1966: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  1970: "🇲🇽", 1974: "🇩🇪", 1978: "🇦🇷", 1982: "🇪🇸",
  1986: "🇲🇽", 1990: "🇮🇹", 1994: "🇺🇸", 1998: "🇫🇷",
  2002: "🇰🇷", 2006: "🇩🇪", 2010: "🇿🇦", 2014: "🇧🇷",
  2018: "🇷🇺", 2022: "🇶🇦", 2026: "🇺🇸",
};

export default function HistoricalTournament() {
  const { year } = useParams<{ year: string }>();
  const { data: tournament, loading, error } = useAsync(
    () => getHistoricalTournament(Number(year)),
    [year]
  );

  if (loading) {
    return <div className="text-center text-zinc-400 py-12">Cargando torneo...</div>;
  }

  if (error || !tournament || !tournament.year) {
    return (
      <div className="text-center py-20 space-y-6">
        <h1 className="text-4xl font-bold text-zinc-700">Torneo no encontrado</h1>
        <Link
          to="/historical"
          className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-900 font-semibold rounded-lg transition-colors"
        >
          Volver al historial
        </Link>
      </div>
    );
  }

  const groupMatches = tournament.matches.filter((m) => m.stage === "group");
  const knockoutMatches = tournament.matches.filter((m) => m.stage !== "group" && m.stage !== "unknown");
  const unknownMatches = tournament.matches.filter((m) => m.stage === "unknown");

  const matchesByStage = knockoutMatches.reduce((acc, m) => {
    if (!acc[m.stage]) acc[m.stage] = [];
    acc[m.stage].push(m);
    return acc;
  }, {} as Record<string, HistoricalMatch[]>);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <span className="text-4xl">{FLAGS[tournament.year] || "🏆"}</span>
        <div>
          <h2 className="text-2xl font-bold">{tournament.name}</h2>
          <p className="text-zinc-400">{tournament.host}</p>
        </div>
      </div>

      {tournament.groups.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">Grupos</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tournament.groups.map((g) => (
              <div
                key={g.name}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <h4 className="font-semibold text-emerald-400 mb-2">
                  Grupo {g.name}
                </h4>
                <ol className="space-y-1">
                  {g.teams.map((team, i) => (
                    <li key={team} className="text-sm text-zinc-300 flex items-center gap-2">
                      <span className="text-zinc-600 w-5 tabular-nums">{i + 1}.</span>
                      {team}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Partidos</h3>

        {groupMatches.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-zinc-400">Fase de Grupos</h4>
            <div className="space-y-2">
              {groupMatches.map((match, i) => (
                <MatchCard key={i} match={match} />
              ))}
            </div>
          </div>
        )}

        {Object.entries(matchesByStage).map(([stage, matches]) => (
          <div key={stage} className="space-y-3">
            <h4 className="text-lg font-medium text-zinc-400">
              {STAGE_LABELS[stage] || stage}
            </h4>
            <div className="space-y-2">
              {matches.map((match, i) => (
                <MatchCard key={i} match={match} />
              ))}
            </div>
          </div>
        ))}

        {unknownMatches.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-zinc-400">Otros</h4>
            <div className="space-y-2">
              {unknownMatches.map((match, i) => (
                <MatchCard key={i} match={match} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function MatchCard({ match }: { match: HistoricalMatch }) {
  const winnerClass = (isWinner: boolean) =>
    isWinner ? "font-bold text-emerald-400" : "text-zinc-400";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-right">
          <span className={`text-sm ${winnerClass(match.team1.is_winner)}`}>
            {match.team1.name}
          </span>
        </div>

        <div className="text-center">
          <div className="text-xl font-bold tabular-nums text-zinc-100">
            {match.score}
          </div>
          {match.penalty_score && (
            <div className="text-xs text-zinc-500">
              ({match.penalty_score} pen.)
            </div>
          )}
          {match.ht_score && (
            <div className="text-xs text-zinc-600">PT {match.ht_score}</div>
          )}
          {match.has_extra_time && (
            <div className="text-xs text-zinc-600">t.e.</div>
          )}
        </div>

        <div className="flex-1">
          <span className={`text-sm ${winnerClass(match.team2.is_winner)}`}>
            {match.team2.name}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
        {match.venue && <span>{match.venue}</span>}
        {match.date && <span>{match.date}</span>}
      </div>

      {match.scorers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
          {match.scorers.map((s, i) => (
            <span key={i}>
              {s.player} {s.minute}{s.penalty ? " (p)" : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
