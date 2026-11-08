// compare 2 values coming from the sidecar
//
// the node info may carry sub-records (metal, container), which are
// objects: != would tell they differ each time, even if their contents are
// the same, so compare those through their JSON representation

export function same_value(a, b) {
  if (a === b) return true
  if (a && b && typeof a == 'object' && typeof b == 'object')
    return JSON.stringify(a) == JSON.stringify(b)
  // historical behavior, with loose comparison
  return a == b
}
