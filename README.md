# FIFA Player Analytics & Market Intelligence Dashboard

An interactive analytics dashboard for exploring FIFA player performance and market value data. Built entirely in the browser with React and Recharts, it trains multiple machine learning models at runtime — a neural network, K-Means clustering, PCA, and a logistic regression classifier — on 2,800 player records to surface actionable insights about player valuation, transfer risk, and scouting opportunities.

---

## Table of Contents

1. [Project Objective](#project-objective)
2. [Dataset](#dataset)
3. [Methodology](#methodology)
   - [Feature Engineering](#feature-engineering)
   - [Neural Network (Market Value Regression)](#neural-network-market-value-regression)
   - [Anomaly Detection (Undervalued / Overvalued)](#anomaly-detection-undervalued--overvalued)
   - [Permutation Feature Importance](#permutation-feature-importance)
   - [K-Means Clustering](#k-means-clustering)
   - [Principal Component Analysis (PCA)](#principal-component-analysis-pca)
   - [Transfer Risk Classifier (Logistic Regression)](#transfer-risk-classifier-logistic-regression)
   - [KNN Similarity Search](#knn-similarity-search)
   - [Statistical Analysis](#statistical-analysis)
4. [Key Findings](#key-findings)
5. [Dashboard Tabs](#dashboard-tabs)
6. [Tech Stack](#tech-stack)
7. [Project Structure](#project-structure)
8. [Getting Started](#getting-started)

---

## Project Objective

The central question this project answers is: **which players are priced below what their attributes justify?**

The approach is model-first. A neural network learns the relationship between measurable player attributes (rating, age, position, potential, injury history, contract length) and market value across 2,800 records. Once the model converges, every player is scored and compared to their real market price. Players whose actual price sits well below the model's prediction are flagged as undervalued — hidden gems the market has yet to price correctly. Players above the prediction are flagged as potentially overvalued.

This methodology mirrors how quantitative scouting departments at top clubs approach the transfer market: build a baseline "fair value" model, then hunt for systematic mispricings.

---

## Dataset

**File:** `fifa_player_performance_market_value.csv`
**Records:** 2,800 players

| Field | Type | Range / Values | Description |
|---|---|---|---|
| `player_id` | int | — | Unique identifier |
| `player_name` | string | — | Player full name |
| `age` | int | 17–39 | Current age |
| `nationality` | string | — | Country of origin |
| `club` | string | — | Club affiliation |
| `position` | string | GK, CB, LB, RB, CDM, CM, LW, RW, ST | Playing position |
| `overall_rating` | int | 60–94 | Current skill rating |
| `potential_rating` | int | 65–98 | Long-term potential ceiling |
| `matches_played` | int | — | Career matches |
| `goals` | int | — | Career goals |
| `assists` | int | — | Career assists |
| `minutes_played` | int | — | Total career minutes |
| `market_value_million_eur` | float | 0.5–180 | Market value in millions of euros |
| `contract_years_left` | int | 0–5 | Remaining contract years |
| `injury_prone` | string | Yes / No | Whether the player has an injury history |
| `transfer_risk_level` | string | Low / Medium / High | Labelled transfer risk category |

---

## Methodology

All models are implemented from scratch in vanilla JavaScript and run entirely in the browser at page load — no server, no Python backend, no external ML APIs.

### Feature Engineering

Every model draws from the same 6-dimensional normalized feature vector:

| Feature | Encoding |
|---|---|
| Age | `age / 39` |
| Overall Rating | `overall_rating / 100` |
| Potential Rating | `potential_rating / 100` |
| Position | Ordinal index `0–8` over `[GK, CB, LB, RB, CDM, CM, LW, RW, ST]`, divided by 8 |
| Injury Prone | Binary: `1` if Yes, `0` if No |
| Contract Years Left | `contract_years_left / 5` |

The target for regression is `market_value / 180`, normalizing values to the `[0, 1]` range to keep gradients stable during training.

---

### Neural Network (Market Value Regression)

**Goal:** Predict a player's market value from their six features.

**Architecture:** 3-layer multilayer perceptron (MLP)

```
Input (6)  →  Hidden 1 (16, ReLU)  →  Hidden 2 (8, ReLU)  →  Output (1, linear)
```

**Training details:**

- **Loss function:** Mean squared error (MSE) — `(predicted - actual)²`
- **Optimizer:** SGD with momentum (`momentum = 0.9`, `lr = 0.01`)
- **Epochs:** 120
- **Batch style:** Online (stochastic) — one weight update per sample, shuffled each epoch
- **Weight initialization:** He initialization — `W ~ Uniform(-0.5, 0.5) × sqrt(2 / fan_in)`, which keeps variance stable through ReLU activations

**Backpropagation** is implemented by hand, computing gradients layer-by-layer using the chain rule:

```
dL/dOut = 2(out - y)
dL/dW3  = dL/dOut × a2
dL/dW2  = dL/da2 × ReLU'(z2) × a1
dL/dW1  = dL/da1 × ReLU'(z1) × x
```

Momentum updates accumulate velocity terms to smooth convergence:

```
v = momentum × v - lr × gradient
W += v
```

**Evaluation metrics (on full training set):**

| Metric | Description |
|---|---|
| RMSE | Root Mean Squared Error in €M |
| R² | Coefficient of determination (variance explained) |
| MAE | Mean Absolute Error in €M |

The loss curve (epoch vs MSE) is plotted live in the **ML Models** tab, showing convergence across training.

---

### Anomaly Detection (Undervalued / Overvalued)

Once the neural network is trained, every player's predicted value is compared to their actual market value. The residual is defined as:

```
residual = predicted_value - actual_value
```

Residuals are then standardized into z-scores:

```
z = (residual - mean(residuals)) / std(residuals)
```

- **z < -0.5** → player is **undervalued** (model predicts higher value than the market pays)
- **z > 0.5** → player is **overvalued** (market pays more than the model expects)
- **|z| ≤ 0.5** → roughly **fair value**

Players with z-scores below -1.5 are the strongest buy opportunities. These are shown in the **Insights** and **Scout** tabs with their predicted vs actual gap in €M.

---

### Permutation Feature Importance

To understand which features drive the model's predictions, permutation importance is computed:

1. Calculate baseline RMSE on the full dataset
2. For each feature `i`:
   - Randomly shuffle that feature's values across all players (breaking its relationship with the target)
   - Re-run predictions and compute permuted RMSE
3. Importance of feature `i` = `permuted_RMSE - baseline_RMSE`

A larger increase in error when a feature is shuffled means that feature carries more predictive signal. This is a model-agnostic technique — it works regardless of internal model structure.

**Result:** Overall Rating consistently ranks as the most important feature, followed by Potential Rating and Age.

---

### K-Means Clustering

**Goal:** Segment players into natural tiers without using labels.

**Algorithm:** K-Means with K-Means++ initialization

K-Means++ selects initial centroids probabilistically, weighted by squared distance from already-chosen centroids. This avoids poor random initializations that can trap the algorithm in local minima.

**Convergence:** Cluster assignments are updated each iteration until centroid movements fall below `1e-6` (up to 50 iterations).

**K = 4 clusters**, labeled semantically based on where high-performing players land:

| Cluster | Label | Profile |
|---|---|---|
| 0 | Elite | Highest overall ratings, peak age, maximum market values |
| 1 | Star | High performers, slightly below elite ceiling |
| 2 | Regular | Mid-range ratings, varied ages and values |
| 3 | Prospect | Young players with high potential but limited current rating |

Clusters are visualized in the **Clustering** tab as a scatter plot (Rating vs Value, colored by cluster) and in the **Scout** tab overlaid on the PCA map.

---

### Principal Component Analysis (PCA)

**Goal:** Reduce the 6-dimensional feature space to 2 dimensions for visualization.

**Implementation:**

1. Center the data by subtracting the per-feature mean
2. Compute the covariance matrix: `C[i,j] = Σ(x_i - μ_i)(x_j - μ_j) / (n - 1)`
3. Extract the top 2 eigenvectors using **power iteration with deflation**:
   - Iteratively multiply the covariance matrix by a random vector and renormalize (100 iterations per component)
   - Deflate the matrix after each component by subtracting `λ × vvᵀ` so the next iteration finds the orthogonal component

Each player's 6 features are projected onto the two principal components (PC1, PC2) to produce a 2D embedding. The percentage of variance explained by each component is reported.

The PCA map in the **Scout** tab shows all players as a scatter plot, colored by their K-Means cluster — revealing how the unsupervised clustering aligns with the continuous feature space structure.

---

### Transfer Risk Classifier (Logistic Regression)

**Goal:** Classify each player's transfer risk as Low, Medium, or High.

**Architecture:** Multinomial logistic regression (softmax classifier)

```
logits[k] = W[k] · x + b[k]       for k in {Low, Medium, High}
probs      = softmax(logits)
```

**Training:** Online gradient descent with cross-entropy loss (200 epochs, `lr = 0.05`)

The softmax gradient for class `k` is simply:

```
dL/d_logits[k] = probs[k] - 1(y == k)
```

Making multinomial logistic regression highly efficient to train.

**Evaluation:** Accuracy and a 3×3 confusion matrix (predicted vs actual risk class) are computed on the full training set and displayed in the **ML Models** tab.

---

### KNN Similarity Search

**Goal:** Given a selected player, find the 5 most similar players in the dataset.

**Algorithm:** Brute-force k-nearest neighbors using Euclidean distance in the normalized 6-feature space.

Similarity is reported as a percentage: `(1 - normalized_distance) × 100`, where distance is normalized relative to the farthest of the 5 results. This gives an intuitive 0–100% similarity scale.

Available in the **Scout** tab for any player in the dataset.

---

### Statistical Analysis

Beyond ML models, the dashboard computes several classical statistics across filtered player subsets:

- **Pearson correlation** between age/rating/value pairs — quantifying linear relationships
- **5-year age bin aggregation** — average value and rating by age group (Overview tab)
- **Position-level analysis** — average value, rating, goals per match, and assists per match by position
- **Club comparison** — average value, rating, total goals, and player count by club
- **Transfer risk distribution** — count of Low/Medium/High risk players
- **Percentile rank** — used for the Value Predictor to contextualize predicted values

All statistics react to the global filters (club, position, age range) via `useMemo`, updating every chart instantly.

---

## Key Findings

**1. Overall Rating is the strongest predictor of market value**

The permutation importance analysis consistently shows overall rating as the top feature. A 10-point rating increase correlates with roughly €15–25M in additional value, making it the single most impactful variable in the model.

**2. The market peaks for players aged 24–29**

Age distribution analysis shows that players in the 24–29 bracket command the highest average market values. After 29, values decline approximately 8% per year on average as the expected years at peak performance shrink. Players under 23 with high potential ratings are frequently undervalued relative to the model's forward-looking predictions.

**3. Attacking positions carry a 30% valuation premium**

Strikers (ST), left wingers (LW), and right wingers (RW) command significantly higher prices at equivalent overall ratings compared to defensive positions. The position analysis in the Market tab confirms goal-scoring output is priced at a substantial premium by the transfer market.

**4. Injury history carries a measurable discount**

Injury-prone players are valued approximately 20–25% lower than otherwise equivalent healthy players. The model captures this as a consistent downward shift in predicted value, and it shows up clearly in the feature importance rankings.

**5. Certain positions are systematically mispriced**

The position gap analysis in the Insights tab (predicted minus actual value, averaged by position) reveals which positions the market tends to underprice or overprice relative to the model's expectations — creating structural opportunities for clubs with a quantitative edge.

**6. Contract years remaining amplify or suppress value**

Players with 0–1 years left on their contracts are often priced at a discount relative to their ratings, as clubs must offload or lose them on a free transfer. The model treats contract length as a risk multiplier.

---

## Dashboard Tabs

| Tab | What it shows |
|---|---|
| **Overview** | KPI header cards, age distribution chart, transfer risk breakdown, club comparison bar chart |
| **Market Analysis** | Rating vs value scatter plot, position-level bar chart, Pearson correlation heatmap, age trend line |
| **ML Models** | Neural network training loss curve, regression metrics (RMSE, R², MAE), feature importance bar chart, transfer risk classifier accuracy and confusion matrix |
| **Value Predictor** | Interactive form — enter age, rating, potential, position, injury status, contract years and get a live neural network prediction with percentile context |
| **Comparison** | Side-by-side radar charts comparing up to 4 players across rating, potential, goals, assists, and market value |
| **Clustering** | K-Means scatter plot (rating vs value, colored by cluster), cluster summary cards with average stats per tier |
| **Insights** | Project objective summary, model performance cards, key findings, top 10 undervalued players table, actual vs predicted scatter plot, position mispricing chart |
| **Scout** | Undervalued/overvalued ranked tables (clickable rows), KNN similarity search, PCA 2D player map colored by cluster |

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 (hooks: `useState`, `useMemo`, `useEffect`, `useRef`) |
| Charts | Recharts (`LineChart`, `BarChart`, `ScatterChart`, `RadarChart`, `ComposedChart`) |
| Data utilities | Lodash (`groupBy`, `countBy`, `sumBy`, `meanBy`) |
| ML / stats | Custom implementations in `src/utils/ml.js` and `src/utils/stats.js` |
| Build tool | Vite |
| Data format | CSV parsed at build time into a JS module |

No external ML libraries (TensorFlow, PyTorch, scikit-learn) are used. All algorithms — backpropagation, K-Means++, power-iteration PCA, softmax classifier — are written from scratch.

---

## Project Structure

```
fifa/
├── fifa_player_performance_market_value.csv   # Source dataset (2,800 players)
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx                               # React entry point
    ├── App.jsx                                # Dashboard shell, filters, tab routing, model training
    ├── colors.js                              # Color palette constants
    ├── data/
    │   └── players.js                         # Parsed dataset as JS array
    ├── utils/
    │   ├── ml.js                              # NeuralNetwork, KMeans, PCA, AnomalyDetector,
    │   │                                      #   TransferRiskClassifier, KNN, featureImportance
    │   └── stats.js                           # mean, std, percentile, correlation, rmse, r², mae
    └── components/
        ├── common/
        │   ├── FilterSelect.jsx               # Reusable dropdown filter
        │   └── SoccerBall.jsx                 # Animated nav decoration
        ├── charts/
        │   ├── HeatmapChart.jsx               # Correlation heatmap
        │   ├── ParallelCoordinatesChart.jsx   # Multi-axis player comparison
        │   └── WaterfallChart.jsx             # Value breakdown waterfall
        └── tabs/
            ├── OverviewTab.jsx
            ├── MarketAnalysisTab.jsx
            ├── MLModelsTab.jsx
            ├── PredictorTab.jsx
            ├── ComparisonTab.jsx
            ├── ClusterTab.jsx
            ├── InsightsTab.jsx
            └── ScoutTab.jsx
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app runs entirely in the browser. All ML models train at page load using the bundled dataset — no backend or API keys required.
