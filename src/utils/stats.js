export const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length

export const std = (arr) => {
  const m = mean(arr)
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length)
}

export const percentile = (arr, p) => {
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.floor((p / 100) * sorted.length)
  return sorted[Math.min(idx, sorted.length - 1)]
}

export const correlation = (x, y) => {
  const mx = mean(x), my = mean(y)
  const num = x.reduce((a, xi, i) => a + (xi - mx) * (y[i] - my), 0)
  const den = Math.sqrt(
    x.reduce((a, xi) => a + (xi - mx) ** 2, 0) *
    y.reduce((a, yi) => a + (yi - my) ** 2, 0)
  )
  return den === 0 ? 0 : num / den
}

export const normalize = (arr) => {
  const mn = Math.min(...arr)
  const mx = Math.max(...arr)
  const range = mx - mn
  return range === 0 ? arr.map(() => 0) : arr.map(v => (v - mn) / range)
}

export const normalizeToScore = (value, min, max) => {
  if (max === min) return 0
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
}

export const mae = (actual, predicted) =>
  mean(actual.map((a, i) => Math.abs(a - predicted[i])))

export const rmse = (actual, predicted) =>
  Math.sqrt(mean(actual.map((a, i) => (a - predicted[i]) ** 2)))

export const rSquared = (actual, predicted) => {
  const m = mean(actual)
  const ssTot = actual.reduce((a, v) => a + (v - m) ** 2, 0)
  const ssRes = actual.reduce((a, v, i) => a + (v - predicted[i]) ** 2, 0)
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot
}

export const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
