import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import test from 'node:test';
import { commandForPlatform, isPortAvailable, runChild } from './task-runner-lib.mjs';

test('platform command adds the Windows cmd suffix only where required', () => {
  assert.equal(commandForPlatform('pnpm', 'win32'), 'pnpm.cmd');
  assert.equal(commandForPlatform('node', 'win32'), 'node');
  assert.equal(commandForPlatform('pnpm', 'darwin'), 'pnpm');
});

test('port check detects an occupied port without terminating its owner', async () => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  assert.equal(await isPortAvailable(address.port), false);
  assert.equal(server.listening, true);
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test('child execution preserves non-zero exit codes', async () => {
  const code = await runChild(process.execPath, ['-e', 'process.exit(7)'], { stdio: 'ignore' });
  assert.equal(code, 7);
});
