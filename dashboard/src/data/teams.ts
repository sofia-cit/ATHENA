import type { Team } from '../types'

// 32 equipos de la NFL con la abreviatura oficial usada por el dataset 2021
// del NFL Big Data Bowl (ojo: Rams = "LA", Raiders = "LV", Packers = "GB").
// Ordenados por conferencia y division para que la cuadricula se agrupe bien.
// Los colores son aproximaciones oficiales (primario / secundario).
export const TEAMS: Team[] = [
  // ---- AFC East ----
  { abbr: 'BUF', nombre: 'Buffalo Bills', ciudad: 'Buffalo', conferencia: 'AFC', division: 'East', colores: { primary: '#00338D', secondary: '#C60C30' } },
  { abbr: 'MIA', nombre: 'Miami Dolphins', ciudad: 'Miami', conferencia: 'AFC', division: 'East', colores: { primary: '#008E97', secondary: '#FC4C02' } },
  { abbr: 'NE', nombre: 'New England Patriots', ciudad: 'Foxborough', conferencia: 'AFC', division: 'East', colores: { primary: '#002244', secondary: '#C60C30' } },
  { abbr: 'NYJ', nombre: 'New York Jets', ciudad: 'East Rutherford', conferencia: 'AFC', division: 'East', colores: { primary: '#125740', secondary: '#FFFFFF' } },
  // ---- AFC North ----
  { abbr: 'BAL', nombre: 'Baltimore Ravens', ciudad: 'Baltimore', conferencia: 'AFC', division: 'North', colores: { primary: '#241773', secondary: '#000000' } },
  { abbr: 'CIN', nombre: 'Cincinnati Bengals', ciudad: 'Cincinnati', conferencia: 'AFC', division: 'North', colores: { primary: '#FB4F14', secondary: '#000000' } },
  { abbr: 'CLE', nombre: 'Cleveland Browns', ciudad: 'Cleveland', conferencia: 'AFC', division: 'North', colores: { primary: '#311D00', secondary: '#FF3C00' } },
  { abbr: 'PIT', nombre: 'Pittsburgh Steelers', ciudad: 'Pittsburgh', conferencia: 'AFC', division: 'North', colores: { primary: '#000000', secondary: '#FFB612' } },
  // ---- AFC South ----
  { abbr: 'HOU', nombre: 'Houston Texans', ciudad: 'Houston', conferencia: 'AFC', division: 'South', colores: { primary: '#03202F', secondary: '#A71930' } },
  { abbr: 'IND', nombre: 'Indianapolis Colts', ciudad: 'Indianapolis', conferencia: 'AFC', division: 'South', colores: { primary: '#002C5F', secondary: '#A2AAAD' } },
  { abbr: 'JAX', nombre: 'Jacksonville Jaguars', ciudad: 'Jacksonville', conferencia: 'AFC', division: 'South', colores: { primary: '#006778', secondary: '#D7A229' } },
  { abbr: 'TEN', nombre: 'Tennessee Titans', ciudad: 'Nashville', conferencia: 'AFC', division: 'South', colores: { primary: '#0C2340', secondary: '#4B92DB' } },
  // ---- AFC West ----
  { abbr: 'KC', nombre: 'Kansas City Chiefs', ciudad: 'Kansas City', conferencia: 'AFC', division: 'West', colores: { primary: '#E31837', secondary: '#FFB81C' } },
  { abbr: 'LAC', nombre: 'Los Angeles Chargers', ciudad: 'Costa Mesa', conferencia: 'AFC', division: 'West', colores: { primary: '#0080C5', secondary: '#FFC20E' } },
  { abbr: 'LV', nombre: 'Las Vegas Raiders', ciudad: 'Las Vegas', conferencia: 'AFC', division: 'West', colores: { primary: '#000000', secondary: '#A5A5A5' } },
  { abbr: 'DEN', nombre: 'Denver Broncos', ciudad: 'Denver', conferencia: 'AFC', division: 'West', colores: { primary: '#FB4F14', secondary: '#002244' } },
  // ---- NFC East ----
  { abbr: 'DAL', nombre: 'Dallas Cowboys', ciudad: 'Arlington', conferencia: 'NFC', division: 'East', colores: { primary: '#00359D', secondary: '#869397' } },
  { abbr: 'NYG', nombre: 'New York Giants', ciudad: 'East Rutherford', conferencia: 'NFC', division: 'East', colores: { primary: '#0B226B', secondary: '#A71930' } },
  { abbr: 'PHI', nombre: 'Philadelphia Eagles', ciudad: 'Philadelphia', conferencia: 'NFC', division: 'East', colores: { primary: '#004C54', secondary: '#A5ACAF' } },
  { abbr: 'WAS', nombre: 'Washington Commanders', ciudad: 'Landover', conferencia: 'NFC', division: 'East', colores: { primary: '#5A1414', secondary: '#FFB612' } },
  // ---- NFC North ----
  { abbr: 'CHI', nombre: 'Chicago Bears', ciudad: 'Chicago', conferencia: 'NFC', division: 'North', colores: { primary: '#0B226B', secondary: '#C83803' } },
  { abbr: 'DET', nombre: 'Detroit Lions', ciudad: 'Detroit', conferencia: 'NFC', division: 'North', colores: { primary: '#0076B6', secondary: '#B0B7BC' } },
  { abbr: 'GB', nombre: 'Green Bay Packers', ciudad: 'Green Bay', conferencia: 'NFC', division: 'North', colores: { primary: '#203731', secondary: '#FFB612' } },
  { abbr: 'MIN', nombre: 'Minnesota Vikings', ciudad: 'Minneapolis', conferencia: 'NFC', division: 'North', colores: { primary: '#4F2683', secondary: '#FFC62F' } },
  // ---- NFC South ----
  { abbr: 'ATL', nombre: 'Atlanta Falcons', ciudad: 'Atlanta', conferencia: 'NFC', division: 'South', colores: { primary: '#A71930', secondary: '#000000' } },
  { abbr: 'CAR', nombre: 'Carolina Panthers', ciudad: 'Charlotte', conferencia: 'NFC', division: 'South', colores: { primary: '#0085CA', secondary: '#101820' } },
  { abbr: 'NO', nombre: 'New Orleans Saints', ciudad: 'New Orleans', conferencia: 'NFC', division: 'South', colores: { primary: '#D3BC8D', secondary: '#101820' } },
  { abbr: 'TB', nombre: 'Tampa Bay Buccaneers', ciudad: 'Tampa', conferencia: 'NFC', division: 'South', colores: { primary: '#D40914', secondary: '#34302B' } },
  // ---- NFC West ----
  { abbr: 'ARI', nombre: 'Arizona Cardinals', ciudad: 'Glendale', conferencia: 'NFC', division: 'West', colores: { primary: '#97233F', secondary: '#000000' } },
  { abbr: 'LA', nombre: 'Los Angeles Rams', ciudad: 'Inglewood', conferencia: 'NFC', division: 'West', colores: { primary: '#00359D', secondary: '#FFA300' } },
  { abbr: 'SEA', nombre: 'Seattle Seahawks', ciudad: 'Seattle', conferencia: 'NFC', division: 'West', colores: { primary: '#002244', secondary: '#69BE28' } },
  { abbr: 'SF', nombre: 'San Francisco 49ers', ciudad: 'San Francisco', conferencia: 'NFC', division: 'West', colores: { primary: '#AA0000', secondary: '#B3995D' } },
]

export const TEAM_POR_ABBR: Record<string, Team> = Object.fromEntries(
  TEAMS.map((t) => [t.abbr, t]),
)

export function buscarEquipos(query: string): Team[] {
  const q = query.trim().toLowerCase()
  if (!q) return TEAMS
  return TEAMS.filter(
    (t) =>
      t.nombre.toLowerCase().includes(q) ||
      t.abbr.toLowerCase().includes(q) ||
      t.ciudad.toLowerCase().includes(q),
  )
}
