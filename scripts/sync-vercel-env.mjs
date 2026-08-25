/**
 * Sync local .env Firebase keys to Vercel (production + preview + development).
 * Does not print secret values.
 */
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const envText = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const vars = {}
for (const line of envText.split(/\r?\n/)) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i < 0) continue
  vars[t.slice(0, i)] = t.slice(i + 1)
}

const keys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_VILLAGE_ID',
  'VITE_USE_MOCK_DATA',
  'VITE_USE_FIREBASE_EMULATOR',
]

// Force cloud mode on Vercel
vars.VITE_USE_MOCK_DATA = 'false'
vars.VITE_USE_FIREBASE_EMULATOR = 'false'

function run(args) {
  const r = spawnSync('npx', ['--yes', 'vercel', ...args], {
    encoding: 'utf8',
    shell: true,
    env: process.env,
  })
  const redact = (s) => (s || '').replace(/[A-Za-z0-9_\-]{20,}/g, '[redacted]')
  return {
    status: r.status,
    stdout: redact(r.stdout),
    stderr: redact(r.stderr),
  }
}

for (const key of keys) {
  const value = vars[key]
  if (value == null || value === '') {
    console.log(`skip ${key} (missing)`)
    continue
  }
  const add = run([
    'env',
    'add',
    key,
    'production,preview,development',
    '--value',
    value,
    '--yes',
    '--force',
    '--no-sensitive',
    '--project',
    'nammakural',
    '--scope',
    'mylocalvoice',
  ])
  if (add.status !== 0) {
    console.error(`FAIL ${key}`)
    console.error(add.stderr || add.stdout)
    process.exit(1)
  }
  console.log(`OK ${key}`)
}

console.log('All Vercel env vars synced.')
