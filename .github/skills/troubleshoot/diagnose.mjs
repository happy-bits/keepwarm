import net from 'node:net';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../../..');
const backendDir = resolve(repoRoot, 'backend');
const frontendDir = resolve(repoRoot, 'frontend');

function checkExists(path) {
  return existsSync(path);
}

function portInUse(port) {
  return new Promise((resolvePromise) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });

    socket.once('connect', () => {
      socket.destroy();
      resolvePromise(true);
    });

    socket.once('error', () => {
      socket.destroy();
      resolvePromise(false);
    });

    socket.setTimeout(500);
    socket.once('timeout', () => {
      socket.destroy();
      resolvePromise(false);
    });
  });
}

async function main() {
  const backendNodeModules = resolve(backendDir, 'node_modules');
  const frontendNodeModules = resolve(frontendDir, 'node_modules');
  const backendPackageJson = resolve(backendDir, 'package.json');
  const frontendPackageJson = resolve(frontendDir, 'package.json');
  const backendDbPath = resolve(backendDir, 'keepwarm.db');

  const backendPort = 3000;
  const frontendPort = 5173;

  const backendPortBusy = await portInUse(backendPort);
  const frontendPortBusy = await portInUse(frontendPort);

  const checks = {
    node: {
      ok: true,
      details: process.version,
    },
    backendPackage: {
      ok: checkExists(backendPackageJson),
      details: checkExists(backendPackageJson)
        ? 'Backend package manifest found'
        : 'Missing backend/package.json',
    },
    frontendPackage: {
      ok: checkExists(frontendPackageJson),
      details: checkExists(frontendPackageJson)
        ? 'Frontend package manifest found'
        : 'Missing frontend/package.json',
    },
    backendDependencies: {
      ok: checkExists(backendNodeModules),
      details: checkExists(backendNodeModules)
        ? 'Backend dependencies installed'
        : 'Backend dependencies are not installed; run npm install in backend/',
    },
    frontendDependencies: {
      ok: checkExists(frontendNodeModules),
      details: checkExists(frontendNodeModules)
        ? 'Frontend dependencies installed'
        : 'Frontend dependencies are not installed; run npm install in frontend/',
    },
    backendPort: {
      ok: !backendPortBusy,
      details: backendPortBusy
        ? `Port ${backendPort} is already in use`
        : `Port ${backendPort} is free`,
    },
    frontendPort: {
      ok: !frontendPortBusy,
      details: frontendPortBusy
        ? `Port ${frontendPort} is already in use`
        : `Port ${frontendPort} is free`,
    },
    databaseFile: {
      ok: checkExists(backendDbPath),
      details: checkExists(backendDbPath)
        ? `SQLite database found at ${backendDbPath}`
        : `No SQLite DB found at ${backendDbPath}`,
    },
  };

  let seededAdmin = false;
  let seededSeller = false;
  let dbDetails = 'No database seed check performed';

  if (checkExists(backendDbPath) && checkExists(resolve(backendDir, 'node_modules'))) {
    try {
      const sqliteModulePath = require.resolve('better-sqlite3', { paths: [backendDir] });
      const { default: Database } = await import(pathToFileURL(sqliteModulePath).href);
      const db = new Database(backendDbPath);
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        .get();

      if (tables) {
        const users = db
          .prepare("SELECT email, role FROM users ORDER BY id ASC")
          .all();

        seededAdmin = users.some((row) => row.role === 'admin');
        seededSeller = users.some((row) => row.role === 'seller');

        dbDetails = users.length
          ? `Seeded users detected: ${users.map((row) => `${row.email} (${row.role})`).join(', ')}`
          : 'Database exists but no users are present';
      } else {
        dbDetails = 'Database file exists but the users table is missing';
      }

      db.close();
    } catch (error) {
      dbDetails = `Database seed check could not run: ${String(error)}`;
    }
  } else if (checkExists(backendDbPath)) {
    dbDetails = 'Database seed check skipped because backend dependencies are not installed';
  }

  checks.seededUsers = {
    ok: seededAdmin && seededSeller,
    details: seededAdmin && seededSeller
      ? 'Expected admin/seller seed data appears to be present'
      : `Expected seeded admin/seller data is missing. ${dbDetails}`,
  };

  const problems = [];

  if (!checks.backendDependencies.ok) problems.push('Backend dependencies are not installed.');
  if (!checks.frontendDependencies.ok) problems.push('Frontend dependencies are not installed.');
  if (checks.backendPort.ok === false) problems.push(`Backend port ${backendPort} is already in use.`);
  if (checks.frontendPort.ok === false) problems.push(`Frontend port ${frontendPort} is already in use.`);
  if (!checks.databaseFile.ok) problems.push('SQLite database file is missing.');
  if (!checks.seededUsers.ok) problems.push('Database seed data for the expected admin/seller users is missing or incomplete.');

  const status = problems.length === 0 ? 'ok' : problems.length < 3 ? 'warning' : 'error';

  const result = {
    status,
    summary:
      problems.length === 0
        ? 'No obvious startup or database problems were detected.'
        : problems.length < 3
          ? 'Some startup or setup checks failed; investigate before continuing.'
          : 'Multiple critical issues were detected that likely explain the broken app state.',
    checks,
    problems,
    ask: 'Would you like me to fix this issue?',
  };

  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.log(
    JSON.stringify({
      status: 'error',
      summary: 'The diagnostic script itself failed while checking the project.',
      checks: {},
      problems: [String(error)],
      ask: 'Would you like me to fix this issue?',
    }),
  );
});
