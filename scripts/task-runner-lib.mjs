import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

export function commandForPlatform(command, platform = process.platform) {
  return platform === 'win32' && command === 'pnpm' ? 'pnpm.cmd' : command;
}

export function runChild(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandForPlatform(command), args, options);
    child.once('error', reject);
    child.once('close', code => resolve(code ?? 1));
  });
}

export function isPortAvailable(port, host = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.once('error', error => {
      if (error.code === 'EADDRINUSE' || error.code === 'EACCES') resolve(false);
      else reject(error);
    });
    probe.listen(port, host, () => probe.close(error => error ? reject(error) : resolve(true)));
  });
}
