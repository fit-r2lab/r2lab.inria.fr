// what the sidecar tells us about a node besides its live status
//
// - 'static' is a free-form record that comes from the inventory
//   (data_interface, usrp_type, usrp_duplexer, usrp_logo, images, images_wifi,
//   images_usrp, ...); we make no assumption on what it contains
// - 'availability' is {status: 'ok' | 'ko', reason, since}, it comes from r2lab-api
//
// when a node has no such record we fall back to the flat keys that used to
// carry the same data (usrp_type, available, ...); but once the record is
// there it wins, even for a key it does not have, so that a stale flat key
// left in an older sidecar database cannot show up

// one item of the static data of a node, undefined if unknown
export function static_value(node, key) {
  const record = node.static
  if (record && typeof record == 'object')
    return record[key]
  return node[key]
}

// true if the node is marked as unavailable; a missing record means OK
export function is_unavailable(node) {
  const record = node.availability
  if (record && typeof record == 'object')
    return record.status == 'ko'
  return node.available == 'ko'
}

// why a node is unavailable, as a short text; '' if we do not know
// (there is no such thing in the legacy data)
export function unavailable_details(node) {
  const record = node.availability
  if (!(record && typeof record == 'object') || record.status != 'ko')
    return ''
  let text = record.reason || ''
  const since = utc_minutes(record.since)
  if (since)
    text += ` (since ${since})`
  return text.trim()
}

// '2026-11-10T04:12:00.123456Z' -> '2026-11-10 04:12 UTC'
// a date without a timezone is deemed UTC; '' if we cannot make sense of it
function utc_minutes(iso) {
  if (!iso) return ''
  const date = new Date(/(Z|[+-]\d\d:?\d\d)$/.test(iso) ? iso : iso + 'Z')
  if (isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
}
