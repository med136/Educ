import request from 'supertest'
import { app } from '../index'

describe('GET /health', () => {
  it('should return healthy status', async () => {
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'healthy')
    expect(res.body).toHaveProperty('environment')
    expect(res.body).toHaveProperty('timestamp')
  })
})
