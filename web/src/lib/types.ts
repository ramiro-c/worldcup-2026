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
}

export interface TvChannel {
  id: string;
  name: string;
  country: string;
}