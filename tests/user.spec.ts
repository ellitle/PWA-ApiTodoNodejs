import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../server'; // super test démarre le serveur pour nous par magie! (<3)

describe('PATCH /api/todo/:id', () => {
  it('retourne 404 si le todo est introuvable', async () => {
    const response = await request(app)
      .patch('/api/todo/00000000-0000-4000-8000-000000000000')
      .send({ text: 'Nouveau texte', isCompleted: true })
      .expect(404);

    assert.equal(response.body.error, 'Invalid todo ID');
  });
});