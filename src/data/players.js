import rawCsv from '../../fifa_player_performance_market_value.csv?raw'

// Deterministic pseudo-random [0, 1) based on integer seed
function seededRand(seed) {
  const x = Math.sin(seed * 9301 + 49297)
  return x - Math.floor(x)
}

// Derive goals from overall_rating, position, and matches_played.
function computeGoals(overall_rating, position, matches_played, id) {
  const positionFactor =
    ['ST', 'CF'].includes(position) ? 0.55 :
    ['LW', 'RW', 'SS'].includes(position) ? 0.32 :
    ['CAM', 'AM'].includes(position) ? 0.20 :
    ['CM', 'LM', 'RM'].includes(position) ? 0.12 :
    ['CDM', 'LB', 'RB'].includes(position) ? 0.06 :
    ['CB', 'GK'].includes(position) ? 0.025 : 0.10
  const ratingScale = 0.45 + Math.max(0, (overall_rating - 55) / 70)
  const rawGoals = Math.max(0, positionFactor * ratingScale) * matches_played
  const noise = 0.4 + seededRand(id * 7 + 2) * 1.2
  return Math.max(0, Math.round(rawGoals * noise))
}

// Derive assists from overall_rating, position, and matches_played.
function computeAssists(overall_rating, position, matches_played, id) {
  const positionFactor =
    ['CAM', 'AM', 'SS'].includes(position) ? 0.40 :
    ['LW', 'RW', 'LM', 'RM'].includes(position) ? 0.35 :
    ['CM'].includes(position) ? 0.28 :
    ['ST', 'CF'].includes(position) ? 0.18 :
    ['CDM', 'LB', 'RB'].includes(position) ? 0.14 :
    ['CB', 'GK'].includes(position) ? 0.05 : 0.18
  const ratingScale = 0.45 + Math.max(0, (overall_rating - 55) / 70)
  const rawAssists = Math.max(0, positionFactor * ratingScale) * matches_played
  const noise = 0.4 + seededRand(id * 13 + 5) * 1.2
  return Math.max(0, Math.round(rawAssists * noise))
}

// Derive a realistic market_value (€M) from player attributes.
// Overall rating is the dominant driver; age peaks at ~26; high potential on
// young players adds a premium; short contracts and injury-prone reduce value.
function computeMarketValue(age, overall_rating, potential_rating, contract_years_left, injury_prone, id) {
  // Exponential rating base: 90-rated ≈ €135M, 80-rated ≈ €45M, 70-rated ≈ €15M, 65-rated ≈ €9M
  const ratingBase = 15 * Math.exp((overall_rating - 70) * 0.11)

  // Age factor: peaks at 26, declines symmetrically
  const ageFactor = Math.max(0.25, 1.0 - Math.pow((age - 26) / 13, 2))

  // Young-player potential premium
  const potGap = Math.max(0, potential_rating - overall_rating)
  const youthPremium = age <= 23 ? 1 + potGap * 0.022 : age <= 27 ? 1 + potGap * 0.009 : 1

  // Contract: 0–5 years mapped to a 0.65–1.0 multiplier
  const contractFactor = 0.65 + Math.min(contract_years_left, 5) * 0.07

  // Injury-prone discount
  const injuryFactor = injury_prone === 'Yes' ? 0.78 : 1.0

  // Deterministic noise ±22% so individual players vary realistically
  const noise = 0.78 + seededRand(id) * 0.44

  return Math.min(170, Math.max(0.5,
    Math.round(ratingBase * ageFactor * youthPremium * contractFactor * injuryFactor * noise * 10) / 10
  ))
}

const rows = rawCsv.trim().split('\n')

export const players = rows.slice(1).map(line => {
  const cols = line.trim().split(',')
  const id                  = +cols[0]
  const age                 = +cols[2]
  const overall_rating      = +cols[6]
  const potential_rating    = +cols[7]
  const contract_years_left = +cols[13]
  const injury_prone        = cols[14].trim()

  return {
    id,
    name:                 cols[1].trim(),
    age,
    nationality:          cols[3].trim(),
    club:                 cols[4].trim(),
    position:             cols[5].trim(),
    overall_rating,
    potential_rating,
    matches_played:      +cols[8],
    goals:               computeGoals(overall_rating, cols[5].trim(), +cols[8], id),
    assists:             computeAssists(overall_rating, cols[5].trim(), +cols[8], id),
    minutes_played:      +cols[11],
    market_value:        computeMarketValue(age, overall_rating, potential_rating, contract_years_left, injury_prone, id),
    contract_years_left,
    injury_prone,
    transfer_risk:        cols[15].trim(),
  }
})
