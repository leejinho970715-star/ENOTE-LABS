import {spawn} from 'node:child_process';
import {isAbsolute} from 'node:path';
import {statSync} from 'node:fs';

const origin = new URL(process.env.APP_ORIGIN ?? '');
if (origin.protocol !== 'https:' || origin.origin !== process.env.APP_ORIGIN ||
    !/^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(process.env.CEO_PASSWORD_HASH ?? '') ||
    (process.env.SESSION_SECRET?.length ?? 0) < 32) {
  throw new Error('Set an HTTPS APP_ORIGIN, CEO_PASSWORD_HASH and SESSION_SECRET before starting.');
}
const dbPath = process.env.AI_UNIVERSE_DB ?? '';
if (!isAbsolute(dbPath) || !statSync(dbPath).isFile()) {
  throw new Error('Mount the private persistent volume and restore the CEO database before starting.');
}
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');

const children = [
  spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '0.0.0.0', '--port', String(port)], {stdio:'inherit'}),
  spawn(process.execPath, ['--import', 'tsx', 'src/workflows/worker.ts'], {stdio:'inherit'}),
];

let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill('SIGTERM');
  const deadline = setTimeout(() => {
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }
  }, 8000);
  deadline.unref();
}
for (const child of children) {
  child.on('error', error => {console.error(error.message); stop(1);});
  child.on('exit', () => stop(1));
}
process.once('SIGINT', () => stop(0));
process.once('SIGTERM', () => stop(0));
