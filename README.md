# FIFA Player Analytics Dashboard

An interactive analytics dashboard for exploring FIFA player performance and market value data. Built with React and Recharts, it provides real-time filtering, visualizations, and predictive modeling across 2,800 player records.

## Features

- **Overview** — KPI cards, value by age group, transfer risk distribution, and club performance comparisons
- **Market Analysis** — scatter plots, position-based breakdowns, and correlation analysis (age, rating, value)
- **Value Predictor** — estimate a player's market value using age, rating, potential, position, and injury history
- **Player Comparison** — side-by-side radar charts comparing multiple players across 5 key metrics
- **Clustering** — segments players into Elite, Star, Regular, and Prospect tiers with scatter plot visualization
- **Global Filters** — filter by club, position, and age range; all charts update instantly

## Dataset

`fifa_player_performance_market_value.csv` — 2,800 players with 16 attributes:

| Field | Description |
|---|---|
| `player_id` | Unique identifier |
| `player_name` | Player name |
| `age` | Age (17–39) |
| `nationality` | Country of origin |
| `club` | Club affiliation |
| `position` | ST, LW, RW, CM, CDM, CB, LB, RB, GK |
| `overall_rating` | Current skill rating (60–94) |
| `potential_rating` | Future potential (65–98) |
| `matches_played` | Career matches |
| `goals` / `assists` | Career goals and assists |
| `minutes_played` | Total career minutes |
| `market_value_million_eur` | Market value in millions (€0.5M–€180M) |
| `contract_years_left` | Remaining contract years (0–5) |
| `injury_prone` | Yes / No |
| `transfer_risk_level` | Low / Medium / High |

## Tech Stack

- **React** (hooks: useState, useMemo, useEffect)
- **Recharts** — LineChart, BarChart, ScatterChart, RadarChart, ComposedChart
- **Lodash** — groupBy, countBy, sumBy, meanBy
- Custom statistics utilities (mean, std, percentile, Pearson correlation)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## Project Structure

```
fifa/
├── src/
│   └── App.jsx                              # Main dashboard component
└── fifa_player_performance_market_value.csv # Player dataset
```
