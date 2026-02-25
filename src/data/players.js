const nationalities = ['Germany','England','France','Portugal','Brazil','Argentina','Netherlands','Spain','Italy','Belgium','Uruguay','Croatia','Colombia','Senegal','Morocco']
const clubs = ['Liverpool','FC Barcelona','Juventus','Manchester City','PSG','Bayern Munich','Real Madrid','Chelsea','Arsenal','Manchester United','Atletico Madrid','Borussia Dortmund','Inter Milan','AC Milan','Tottenham']
const positions = ['ST','LW','RW','CM','CDM','CB','LB','RB','GK']
const riskLevels = ['Low','Medium','High']

const seededRandom = (seed) => {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

export const generatePlayers = (n = 500) => {
  const rng = seededRandom(42)
  return Array.from({ length: n }, (_, i) => {
    const overall = Math.round(60 + rng() * 34)
    const potential = Math.round(Math.min(99, overall + rng() * 15))
    const age = Math.round(17 + rng() * 22)
    const matches = Math.round(rng() * 55)
    const goals = Math.round(rng() * 39)
    const assists = Math.round(rng() * 25)
    const position = positions[Math.floor(rng() * positions.length)]
    const injuryProne = rng() > 0.7 ? 'Yes' : 'No'
    const contractYears = Math.round(rng() * 5)

    // Realistic market value formula with some noise
    const ratingFactor = ((overall - 60) / 34) ** 2
    const agePeak = age >= 24 && age <= 29 ? 1.2 : age < 24 ? 0.7 + age * 0.02 : Math.max(0.3, 1.4 - (age - 29) * 0.08)
    const posFactor = ['ST','LW','RW'].includes(position) ? 1.3 : ['CM','CDM'].includes(position) ? 1.0 : 0.85
    const injuryFactor = injuryProne === 'Yes' ? 0.75 : 1.0
    const noise = 0.8 + rng() * 0.4
    const value = +(Math.max(0.5, Math.min(180, 180 * ratingFactor * agePeak * posFactor * injuryFactor * noise))).toFixed(1)

    const riskIdx = value > 80 ? 0 : value > 30 ? 1 : 2
    const transferRisk = riskLevels[(riskIdx + (rng() > 0.8 ? 1 : 0)) % 3]

    return {
      id: i + 1,
      name: `Player_${i + 1}`,
      age,
      nationality: nationalities[Math.floor(rng() * nationalities.length)],
      club: clubs[Math.floor(rng() * clubs.length)],
      position,
      overall_rating: overall,
      potential_rating: potential,
      matches_played: matches,
      goals,
      assists,
      minutes_played: matches * Math.round(60 + rng() * 30),
      market_value: value,
      contract_years_left: contractYears,
      injury_prone: injuryProne,
      transfer_risk: transferRisk,
    }
  })
}

export const players = generatePlayers(500)
