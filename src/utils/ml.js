import { mean, std, rmse, rSquared, mae, shuffle } from './stats.js'

// ─── Feature extraction ───────────────────────────────────────────────────────
const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'LW', 'RW', 'ST']
const POSITION_IDX = Object.fromEntries(POSITIONS.map((p, i) => [p, i]))

export const extractFeatures = (player) => [
  player.age / 39,
  player.overall_rating / 100,
  player.potential_rating / 100,
  (POSITION_IDX[player.position] ?? 4) / 8,
  player.injury_prone === 'Yes' ? 1 : 0,
  player.contract_years_left / 5,
]

export const extractTarget = (player) => player.market_value / 180

// ─── Neural Network ───────────────────────────────────────────────────────────
const relu = (x) => Math.max(0, x)
const reluD = (x) => (x > 0 ? 1 : 0)
const sigmoid = (x) => 1 / (1 + Math.exp(-x))
const sigmoidD = (x) => { const s = sigmoid(x); return s * (1 - s) }

const randW = (rows, cols) =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() - 0.5) * Math.sqrt(2 / cols))
  )

const zeros = (n) => Array(n).fill(0)

export class NeuralNetwork {
  constructor(inputSize = 6, hidden1 = 16, hidden2 = 8, outputSize = 1) {
    this.W1 = randW(hidden1, inputSize)
    this.b1 = zeros(hidden1)
    this.W2 = randW(hidden2, hidden1)
    this.b2 = zeros(hidden2)
    this.W3 = randW(outputSize, hidden2)
    this.b3 = zeros(outputSize)
    this.lossHistory = []
    this.trained = false

    // momentum
    this.vW1 = randW(hidden1, inputSize).map(r => r.map(() => 0))
    this.vb1 = zeros(hidden1)
    this.vW2 = randW(hidden2, hidden1).map(r => r.map(() => 0))
    this.vb2 = zeros(hidden2)
    this.vW3 = randW(outputSize, hidden2).map(r => r.map(() => 0))
    this.vb3 = zeros(outputSize)
  }

  _forward(x) {
    // Layer 1
    const z1 = this.W1.map((row, i) =>
      row.reduce((s, w, j) => s + w * x[j], 0) + this.b1[i]
    )
    const a1 = z1.map(relu)

    // Layer 2
    const z2 = this.W2.map((row, i) =>
      row.reduce((s, w, j) => s + w * a1[j], 0) + this.b2[i]
    )
    const a2 = z2.map(relu)

    // Output
    const z3 = this.W3.map((row, i) =>
      row.reduce((s, w, j) => s + w * a2[j], 0) + this.b3[i]
    )
    const out = z3[0]
    return { z1, a1, z2, a2, out }
  }

  predict(player) {
    const x = extractFeatures(player)
    const { out } = this._forward(x)
    return Math.max(0.5, Math.min(180, out * 180))
  }

  predictNormalized(x) {
    const { out } = this._forward(x)
    return Math.max(0, Math.min(1, out))
  }

  train(players, epochs = 120, lr = 0.01, momentum = 0.9) {
    this.lossHistory = []
    const data = players.map(p => ({
      x: extractFeatures(p),
      y: extractTarget(p),
    }))

    for (let ep = 0; ep < epochs; ep++) {
      const shuffled = shuffle(data)
      let totalLoss = 0

      for (const { x, y } of shuffled) {
        const { z1, a1, z2, a2, out } = this._forward(x)
        const loss = (out - y) ** 2
        totalLoss += loss

        // Backprop
        const dOut = 2 * (out - y)

        // Layer 3 gradients
        const dW3 = this.W3.map((row, i) => row.map((_, j) => dOut * a2[j]))
        const db3 = [dOut]
        const da2 = this.W3[0].map((_, j) => this.W3[0][j] * dOut)

        // Layer 2 gradients
        const dz2 = da2.map((d, i) => d * reluD(z2[i]))
        const dW2 = this.W2.map((row, i) => row.map((_, j) => dz2[i] * a1[j]))
        const db2 = dz2
        const da1 = this.W2[0].map((_, j) =>
          this.W2.reduce((s, row, i) => s + row[j] * dz2[i], 0)
        )

        // Layer 1 gradients
        const dz1 = da1.map((d, i) => d * reluD(z1[i]))
        const dW1 = this.W1.map((row, i) => row.map((_, j) => dz1[i] * x[j]))
        const db1 = dz1

        // Update with momentum
        const upd = (W, vW, dW, b, vb, db) => {
          W.forEach((row, i) => row.forEach((_, j) => {
            vW[i][j] = momentum * vW[i][j] - lr * dW[i][j]
            W[i][j] += vW[i][j]
          }))
          b.forEach((_, i) => {
            vb[i] = momentum * vb[i] - lr * db[i]
            b[i] += vb[i]
          })
        }
        upd(this.W1, this.vW1, dW1, this.b1, this.vb1, db1)
        upd(this.W2, this.vW2, dW2, this.b2, this.vb2, db2)
        upd(this.W3, this.vW3, dW3, this.b3, this.vb3, db3)
      }

      this.lossHistory.push({ epoch: ep + 1, loss: totalLoss / data.length })
    }
    this.trained = true
  }

  getMetrics(players) {
    const actual = players.map(p => p.market_value)
    const predicted = players.map(p => this.predict(p))
    return {
      rmse: rmse(actual, predicted).toFixed(2),
      r2: rSquared(actual, predicted).toFixed(3),
      mae: mae(actual, predicted).toFixed(2),
    }
  }
}

// ─── Standardize feature matrix (z-score per column) ─────────────────────────
const standardize = (data) => {
  const d = data[0].length
  const means = Array.from({ length: d }, (_, j) => mean(data.map(r => r[j])))
  const stds  = Array.from({ length: d }, (_, j) => {
    const s = std(data.map(r => r[j]))
    return s > 1e-9 ? s : 1
  })
  return { means, stds, scaled: data.map(r => r.map((v, j) => (v - means[j]) / stds[j])) }
}

// ─── K-Means ──────────────────────────────────────────────────────────────────
export class KMeans {
  constructor(k = 4) {
    this.k = k
    this.centroids = []
    this.labels = []
  }

  fit(players, maxIter = 50) {
    const raw = players.map(p => extractFeatures(p))
    const { scaled: data } = standardize(raw)

    // K-means++ initialization
    this.centroids = [data[Math.floor(Math.random() * data.length)]]
    while (this.centroids.length < this.k) {
      const dists = data.map(x => Math.min(...this.centroids.map(c => dist(x, c))))
      const total = dists.reduce((a, b) => a + b, 0)
      let r = Math.random() * total
      for (let i = 0; i < data.length; i++) {
        r -= dists[i]
        if (r <= 0) { this.centroids.push(data[i]); break }
      }
    }

    for (let iter = 0; iter < maxIter; iter++) {
      this.labels = data.map(x =>
        argmin(this.centroids.map(c => dist(x, c)))
      )
      const newCentroids = Array.from({ length: this.k }, (_, k) => {
        const pts = data.filter((_, i) => this.labels[i] === k)
        if (pts.length === 0) return this.centroids[k]
        return pts[0].map((_, j) => mean(pts.map(p => p[j])))
      })
      if (newCentroids.every((c, i) => dist(c, this.centroids[i]) < 1e-6)) break
      this.centroids = newCentroids
    }
    return this
  }

  getLabels() { return this.labels }
  getCentroids() { return this.centroids }

  getClusterName(idx) {
    const names = ['Elite', 'Star', 'Regular', 'Prospect']
    return names[idx] ?? `Cluster ${idx}`
  }
}

// ─── PCA ──────────────────────────────────────────────────────────────────────
export class PCA {
  constructor() {
    this.mean = []
    this.stds = []
    this.components = []
    this.varianceExplained = []
  }

  fit(players) {
    const raw = players.map(p => extractFeatures(p))
    const n = raw.length
    const d = raw[0].length

    const { means, stds, scaled: data } = standardize(raw)
    this.mean = means
    this.stds = stds
    const centered = data  // already mean-0, std-1

    // Covariance matrix
    const cov = Array.from({ length: d }, (_, i) =>
      Array.from({ length: d }, (_, j) =>
        centered.reduce((s, r) => s + r[i] * r[j], 0) / (n - 1)
      )
    )

    // Power iteration for top 2 components
    this.components = []
    const deflated = cov.map(r => [...r])
    for (let pc = 0; pc < 2; pc++) {
      let v = Array.from({ length: d }, () => Math.random())
      for (let iter = 0; iter < 100; iter++) {
        const mv = matVec(deflated, v)
        const norm = Math.sqrt(mv.reduce((s, x) => s + x * x, 0))
        v = mv.map(x => x / norm)
      }
      const eigenval = matVec(deflated, v).reduce((s, x, i) => s + x * v[i], 0)
      this.components.push({ vector: v, eigenvalue: eigenval })
      // Deflate
      for (let i = 0; i < d; i++)
        for (let j = 0; j < d; j++)
          deflated[i][j] -= eigenval * v[i] * v[j]
    }

    const totalVar = this.components.reduce((s, c) => s + Math.abs(c.eigenvalue), 0)
    this.varianceExplained = this.components.map(c =>
      totalVar > 0 ? ((Math.abs(c.eigenvalue) / totalVar) * 100).toFixed(1) : '0'
    )
    return this
  }

  transform(players) {
    return players.map(p => {
      const x = extractFeatures(p).map((v, j) => (v - this.mean[j]) / this.stds[j])
      return {
        pc1: dot(this.components[0].vector, x),
        pc2: dot(this.components[1].vector, x),
      }
    })
  }

  getVarianceExplained() { return this.varianceExplained }
}

// ─── Anomaly Detector (Undervalued/Overvalued) ────────────────────────────────
export class AnomalyDetector {
  analyze(players, nn) {
    const predictions = players.map(p => nn.predict(p))
    const residuals = players.map((p, i) => predictions[i] - p.market_value)
    const m = mean(residuals)
    const s = std(residuals)

    return players.map((p, i) => ({
      ...p,
      predictedValue: +predictions[i].toFixed(1),
      residual: +(residuals[i]).toFixed(1),
      zScore: s > 0 ? +((residuals[i] - m) / s).toFixed(2) : 0,
    })).sort((a, b) => a.zScore - b.zScore)
  }

  getUndervalued(analyzed, n = 15) {
    return analyzed.filter(p => p.zScore < -0.5).slice(0, n)
  }

  getOvervalued(analyzed, n = 15) {
    return [...analyzed].sort((a, b) => b.zScore - a.zScore)
      .filter(p => p.zScore > 0.5).slice(0, n)
  }
}

// ─── KNN Player Similarity ────────────────────────────────────────────────────
export class KNN {
  findSimilar(player, allPlayers, k = 5) {
    const x = extractFeatures(player)
    return allPlayers
      .filter(p => p.id !== player.id)
      .map(p => ({ ...p, distance: dist(x, extractFeatures(p)) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, k)
  }
}

// ─── Feature Importance (Permutation) ─────────────────────────────────────────
// Fisher-Yates shuffle in place
const fisherYates = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export const computeFeatureImportance = (nn, players) => {
  const featureNames = ['Age', 'Overall Rating', 'Potential', 'Position', 'Injury Prone', 'Contract Years']
  const actuals = players.map(p => p.market_value)
  const baseline = rmse(actuals, players.map(p => nn.predict(p)))

  const N_TRIALS = 8
  return featureNames.map((name, fi) => {
    let totalPermRmse = 0
    for (let t = 0; t < N_TRIALS; t++) {
      // Proper full-column shuffle
      const colValues = fisherYates(players.map(p => extractFeatures(p)[fi]))
      const preds = players.map((p, idx) => {
        const f = extractFeatures(p)
        f[fi] = colValues[idx]
        return nn.predictNormalized(f) * 180
      })
      totalPermRmse += rmse(actuals, preds)
    }
    const avgPermRmse = totalPermRmse / N_TRIALS
    return { name, importance: +(avgPermRmse - baseline).toFixed(2) }
  }).sort((a, b) => b.importance - a.importance)
}

// ─── Transfer Risk Classifier (Logistic Regression) ───────────────────────────
export class TransferRiskClassifier {
  constructor() {
    this.weights = Array(6).fill(0)
    this.bias = [0, 0, 0]
    this.classes = ['Low', 'Medium', 'High']
    this.accuracy = 0
    this.confusionMatrix = [[0,0,0],[0,0,0],[0,0,0]]
  }

  _softmax(logits) {
    const mx = Math.max(...logits)
    const exp = logits.map(l => Math.exp(l - mx))
    const sum = exp.reduce((a, b) => a + b, 0)
    return exp.map(e => e / sum)
  }

  _forward(x) {
    return this.classes.map((_, k) =>
      x.reduce((s, v, j) => s + this.weights[k * 6 + j] * v, 0) + this.bias[k]
    )
  }

  train(players, epochs = 200, lr = 0.05) {
    const nClasses = 3
    this.weights = Array(nClasses * 6).fill(0).map(() => (Math.random() - 0.5) * 0.1)
    this.bias = Array(nClasses).fill(0)

    const data = players.map(p => ({
      x: extractFeatures(p),
      y: this.classes.indexOf(p.transfer_risk),
    })).filter(d => d.y >= 0)

    for (let ep = 0; ep < epochs; ep++) {
      const shuffled = shuffle(data)
      for (const { x, y } of shuffled) {
        const logits = this._forward(x)
        const probs = this._softmax(logits)
        const dLogits = probs.map((p, k) => p - (k === y ? 1 : 0))
        dLogits.forEach((dl, k) => {
          x.forEach((xj, j) => { this.weights[k * 6 + j] -= lr * dl * xj })
          this.bias[k] -= lr * dl
        })
      }
    }

    // Evaluate
    let correct = 0
    const cm = Array.from({ length: 3 }, () => Array(3).fill(0))
    for (const { x, y } of data) {
      const pred = argmax(this._softmax(this._forward(x)))
      if (pred === y) correct++
      cm[y][pred]++
    }
    this.accuracy = +(correct / data.length * 100).toFixed(1)
    this.confusionMatrix = cm
  }

  predict(player) {
    const x = extractFeatures(player)
    const probs = this._softmax(this._forward(x))
    return { label: this.classes[argmax(probs)], probs }
  }

  getMetrics() {
    return {
      accuracy: this.accuracy,
      confusionMatrix: this.confusionMatrix,
      classes: this.classes,
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const dist = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0))
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0)
const argmin = (arr) => arr.indexOf(Math.min(...arr))
const argmax = (arr) => arr.indexOf(Math.max(...arr))
const matVec = (M, v) => M.map(row => dot(row, v))
