export interface Team {
  id: string;
  name: string;
  code: string;
  crest: string;
  group: string;
}

export interface Group {
  id: string;
  name: string;
  teams: string[];
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  latitude: number;
  longitude: number;
  region: string;
}

export interface Match {
  id: string;
  home_team: string;
  away_team: string;
  venue: string;
  date: string;
  time: string;
  status: string;
  home_score?: number;
  away_score?: number;
  group?: string;
  round?: string;
  phase?: string;
  venue_city?: string;
  datetime_utc?: string;
  home_team_name?: string;
  away_team_name?: string;
  venue_name?: string;
  home_crest?: string;
  away_crest?: string;
}

export interface TvChannel {
  id: string;
  name: string;
  country: string;
}

export interface HistoricalTournamentSummary {
  year: number;
  name: string;
  host: string;
}

export interface HistoricalTeam {
  name: string;
  is_winner: boolean;
}

export interface HistoricalScorer {
  player: string;
  minute: number;
  penalty: boolean;
  team: string;
}

export interface HistoricalMatch {
  id: string;
  date: string | null;
  time: string | null;
  team1: HistoricalTeam;
  team2: HistoricalTeam;
  score: string;
  ht_score: string | null;
  has_extra_time: boolean;
  penalty_score: string | null;
  venue: string;
  scorers: HistoricalScorer[];
  stage: string;
  group_name: string | null;
}

export interface HistoricalGroup {
  name: string;
  teams: string[];
}

export interface HistoricalTeamMatch extends HistoricalMatch {
  tournament_year: number;
  tournament_name: string;
}

export interface BracketMatch {
  id: string;
  round: string;
  slot: number;
  home_team: string | null;
  away_team: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  home_crest: string | null;
  away_crest: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  next_match_id: string | null;
  datetime_utc?: string;
  date?: string;
}

export interface BracketRound {
  name: string;
  label: string;
  matches: BracketMatch[];
}

export interface HistoricalTournament {
  year: number;
  host: string;
  name: string;
  groups: HistoricalGroup[];
  matches: HistoricalMatch[];
}

export interface HeadToHeadMeeting {
  year: number | null;
  date: string | null;
  stage: string;
  score: string;
  winner: string | null;
}

export interface HeadToHeadSummary {
  total_matches: number;
  team1_wins: number;
  team2_wins: number;
  draws: number;
  team1_goals: number;
  team2_goals: number;
  last_meetings: HeadToHeadMeeting[];
  last_meeting: HeadToHeadMeeting | null;
}

export interface EnrichedMatchResponse {
  match: Match;
  head_to_head: HeadToHeadSummary | null;
}

// StatsBomb data types
export interface StatsBombCompetition {
  competition_id: number;
  season_id: number;
  competition_name: string;
  season_name: string;
}

export interface StatsBombTimelineEvent {
  minute: number;
  type: "goal" | "card" | "substitution";
  team: string;
  player: string;
  cardType?: "yellow" | "red";
  substitution?: {
    playerOff: string;
    playerOn: string;
  };
}

export interface StatsBombShot {
  x: number;
  y: number;
  outcome: "goal" | "saved" | "blocked" | "off_target" | "wayward";
}

export interface StatsBombLineupPlayer {
  player: string;
  jerseyNumber: number;
  position?: string;
}

export interface StatsBombLineup {
  team: string;
  startingXI: StatsBombLineupPlayer[];
  substitutes: StatsBombLineupPlayer[];
}

export interface ChampionCount {
  country: string;
  count: number;
}

export interface BiggestWin {
  year: number;
  team1: string;
  team2: string;
  score: string;
  margin: number;
  stage: string;
}

export interface HostRecord {
  year: number;
  host: string;
  champion: string;
}

export interface TopScorer {
  player: string;
  team: string;
  goals: number;
  tournaments: number[];
}

// Group standings with qualification (World Cup 2026)
export type QualificationStatus =
  | "qualified"
  | "best_third"
  | "eliminated"
  | "pending";

export interface GroupStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  position: number;
  qualification: QualificationStatus;
  tiebreaker_exhausted?: boolean;
}

export interface GroupWithStandings {
  group: Group;
  standings: GroupStanding[];
  complete: boolean;
}

export interface BestThirdRanking {
  team: Team;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  position: number;
  qualified: boolean;
  tiebreaker_exhausted?: boolean;
}

export interface TournamentStats {
  champion_counts: ChampionCount[];
  biggest_wins: BiggestWin[];
  total_goals: {
    overall: number;
    avg_per_tournament: number;
  };
  host_records: HostRecord[];
  top_scorers: TopScorer[];
  skipped_tournaments?: number[];
}