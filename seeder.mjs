// seed.mjs xd
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const logsDir = path.resolve('data', 'logs');

const files = {
  'auth.log': 'INFO: User login\nERROR: Invalid credentials\nINFO: User logout\n',
  'api.log': 'INFO: GET /api/v1 200\nINFO: POST /api/v1 201\nERROR: 500 Internal Error\nERROR: Request timeout\n',
  'db.log': 'INFO: Connection established\nERROR: Query executed\n',
  'notes.txt': 'This file should be ignored by your script.'
};

await mkdir(logsDir, { recursive: true });

for (const [filename, content] of Object.entries(files)) {
  await writeFile(path.join(logsDir, filename), content, 'utf-8');
}

console.log('Fixtures written to data/logs/');
