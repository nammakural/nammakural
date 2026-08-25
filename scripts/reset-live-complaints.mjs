/**
 * Hide existing live complaints and reset the ID counter so the next
 * public report is TP-2026-00001. Uses allowed Firestore updates (not delete).
 *
 *   node scripts/reset-live-complaints.mjs
 */
const PROJECT = 'mylocalvoice-a73f4'
const VILLAGE = 'thiruppair'
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/villages/${VILLAGE}`

const listRes = await fetch(`${BASE}/complaints?pageSize=200`)
if (!listRes.ok) {
  throw new Error(`List failed ${listRes.status}: ${await listRes.text()}`)
}
const listJson = await listRes.json()
const docs = listJson.documents || []
console.log(`Found ${docs.length} complaint documents`)

let hidden = 0
for (const doc of docs) {
  const name = String(doc.name || '')
  const url = name.startsWith('http') ? name : `https://firestore.googleapis.com/v1/${name}`
  const id = name.split('/').pop()
  const already = Boolean(doc.fields?.purged?.booleanValue)
  if (already) {
    console.log(`skip ${id} (already hidden)`)
    continue
  }
  const patch = await fetch(`${url}?updateMask.fieldPaths=purged`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { purged: { booleanValue: true } } }),
  })
  if (!patch.ok) {
    throw new Error(`Hide ${id} failed ${patch.status}: ${await patch.text()}`)
  }
  hidden += 1
  const cid = doc.fields?.complaintId?.stringValue || id
  console.log(`hidden ${cid}`)
}

const counter = await fetch(`${BASE}/meta/counters?updateMask.fieldPaths=complaintSeq`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fields: { complaintSeq: { integerValue: '0' } } }),
})
if (!counter.ok) {
  throw new Error(`Counter reset failed ${counter.status}: ${await counter.text()}`)
}

console.log(`Done. hidden=${hidden} next public ID=TP-${new Date().getFullYear()}-00001`)
