import client from 'prom-client'

// Enregistreur principal
export const register = new client.Registry()

// Exposer quelques métriques par défaut (CPU, mémoire, event loop, etc.)
client.collectDefaultMetrics({ register })

// Histogramme pour la durée des requêtes HTTP
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
})

register.registerMetric(httpRequestDurationSeconds)

export const metricsEnabled = process.env.METRICS_ENABLED === 'true'
