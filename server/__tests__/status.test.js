import request from 'supertest';
import { app, startServer } from '../server.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let server;

beforeAll(async () => {
  server = await startServer();
});

afterAll((done) => {
  server.close(done);
});

describe('GET /api/status', () => {
  const lockFilePath = path.join(path.dirname(__dirname), 'installer.lock');

  afterEach(() => {
    // Clean up the mock lock file after each test
    if (fs.existsSync(lockFilePath)) {
      fs.unlinkSync(lockFilePath);
    }
  });

  it('should return { installed: true } when installer.lock exists', async () => {
    // Create a mock lock file
    fs.writeFileSync(lockFilePath, '');

    const res = await request(app).get('/api/status');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ installed: true });
  });

  it('should return { installed: false } when installer.lock does not exist', async () => {
    const res = await request(app).get('/api/status');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ installed: false });
  });
});
