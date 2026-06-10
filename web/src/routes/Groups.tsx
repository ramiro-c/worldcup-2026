import { useAsync } from "../lib/useAsync";
import { getGroups, getTeams, getMatches } from "../lib/api";
import type { Group, Team } from "../lib/types";

interface GroupWithTeams {
  group: Group;
  teams: Team[];
  standings: TeamStanding[];
}

interface TeamStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

function computeStandings(teams: Team[], matches: Match[], groupId: string): TeamStanding[] {
  const groupTeams = teams.filter((team) => team.group === groupId);
  
  return groupTeams.map((team) => {
    const teamMatches = matches.filter(
      (match) =>
        (match.home_team === team.id || match.away_team === team.id) &&
        match.status === "finished"
    );

    let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;

    teamMatches.forEach((match) => {
      played++;
      const isHome = match.home_team === team.id;
      const teamScore = isHome ? match.home_score : match.away_score;
      const opponentScore = isHome ? match.away_score : match.home_score;

      if (teamScore !== undefined && opponentScore !== undefined) {
        gf += teamScore;
        ga += opponentScore;

        if (teamScore > opponentScore) won++;
        else if (teamScore === opponentScore) drawn++;
        else lost++;
      }
    });

    return {
      team,
      played,
      won,
      drawn,
      lost,
      gf,
      ga,
      gd: gf - ga,
      points: won * 3 + drawn,
    };
  });
}

export default function Groups() {
  const { data: groups, loading, error } = useAsync(async () => {
    const [groupsData, teamsData, matchesData] = await Promise.all([
      getGroups(),
      getTeams(),
      getMatches(),
    ]);

    return groupsData.map((group) => {
      const standings = computeStandings(teamsData, matchesData, group.id);
      standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });
      return {
        group,
        teams: teamsData.filter((team) => team.group === group.id),
        standings,
      };
    });
  }, []);

  if (loading) {
    return <div className="text-center text-zinc-400 py-12">Cargando grupos...</div>;
  }

  if (error) {
    return <div className="text-center text-red-400 py-12">Error: {error.message}</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Fase de Grupos</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        {groups!.map(({ group, standings }) => (
          <div
            key={group.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
          >
            <div className="border-b border-zinc-800 px-4 py-3 bg-zinc-900">
              <h3 className="font-semibold text-lg">{group.name}</h3>
            </div>

            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="text-left py-2 font-medium">#</th>
                    <th className="text-left py-2 font-medium">Equipo</th>
                    <th className="text-center py-2 font-medium">PJ</th>
                    <th className="text-center py-2 font-medium">G</th>
                    <th className="text-center py-2 font-medium">E</th>
                    <th className="text-center py-2 font-medium">P</th>
                    <th className="text-center py-2 font-medium hidden sm:table-cell">GF</th>
                    <th className="text-center py-2 font-medium hidden sm:table-cell">GC</th>
                    <th className="text-center py-2 font-medium hidden sm:table-cell">DG</th>
                    <th className="text-center py-2 font-medium">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((standing, index) => (
                    <tr
                      key={standing.team.id}
                      className={`border-zinc-800/50 ${
                        index < 2
                          ? "bg-emerald-500/5"
                          : index < 4
                          ? "bg-blue-500/5"
                          : ""
                      }`}
                    >
                      <td className="py-3 text-zinc-500">{index + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={standing.team.crest}
                            alt={standing.team.name}
                            className="w-6 h-6 object-contain"
                          />
                          <span className="font-medium">{standing.team.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 text-zinc-400">{standing.played}</td>
                      <td className="text-center py-3 text-zinc-400">{standing.won}</td>
                      <td className="text-center py-3 text-zinc-400">{standing.drawn}</td>
                      <td className="text-center py-3 text-zinc-400">{standing.lost}</td>
                      <td className="text-center py-3 text-zinc-400 hidden sm:table-cell">{standing.gf}</td>
                      <td className="text-center py-3 text-zinc-400 hidden sm:table-cell">{standing.ga}</td>
                      <td className="text-center py-3 text-zinc-400 hidden sm:table-cell">{standing.gd}</td>
                      <td className="text-center py-3 font-semibold">{standing.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-3 flex gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Clasifican
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Mejor 3°
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}