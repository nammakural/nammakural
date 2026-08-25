/**
 * Permanently delete hidden (purged) complaints from live Firestore.
 * Keeps active reports such as TP-2026-00001.
 *
 *   node scripts/delete-purged-complaints.mjs
 */
const PROJECT = 'nammakural-b1878'
const VILLAGE = 'thiruppair'
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/villages/${VILLAGE}`

function docUrl(name) {
  const n = String(name || '')
  return n.startsWith('http') ? n : `https://firestore.googleapis.com/v1/${n}`
}

const listRes = await fetch(`${BASE}/complaints?pageSize=200`)
if (!listRes.ok) throw new Error(`List failed ${listRes.status}: ${await listRes.text()}`)
const docs = (await listRes.json()).documents || []

let deleted = 0
let kept = 0
const errors = []

for (const doc of docs) {
  const cid = doc.fields?.complaintId?.stringValue || String(doc.name).split('/').pop()
  const purged = Boolean(doc.fields?.purged?.booleanValue)
  if (!purged) {
    console.log(`keep ${cid}`)
    kept += 1
    continue
  }
  const res = await fetch(docUrl(doc.name), { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text()
    errors.push(`${cid} ${res.status} ${text.slice(0, 120)}`)
    console.log(`FAIL ${cid} ${res.status}`)
    continue
  }
  deleted += 1
  console.log(`deleted ${cid}`)
}

console.log(`Done. deleted=${deleted} kept=${kept} failed=${errors.length}`)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
