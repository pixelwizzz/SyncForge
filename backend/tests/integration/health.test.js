import request from 'supertest';
import app from '../../src/app.js';

describe('GET /api/v1/system/health', () => {
  it('should return 200 and a healthy status envelope', async () => {
    const res = await request(app)
      .get('/api/v1/system/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.service).toBe('syncforge-api');
    expect(res.body.error).toBeNull();
  });
});
