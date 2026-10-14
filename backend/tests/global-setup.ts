import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';

import { configureTestEnvironment } from './helpers/test-environment.js';

const backendDirectory = fileURLToPath(new URL('..', import.meta.url));

export default function globalSetup() { configureTestEnvironment();

if (process.platform === 'win32') { execFileSync( process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm run prisma:migrate:deploy'], { cwd: backendDirectory, env: process.env, stdio: 'inherit', }, ); } else { execFileSync('npm', ['run', 'prisma:migrate:deploy'], { cwd: backendDirectory, env: process.env, stdio: 'inherit', }); } }