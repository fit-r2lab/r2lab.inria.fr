// which distribution do we illustrate for a node ?
//
// - when there is a container, the user runs in it, so we show the
//   container's distro (node.container.os_release; for data without the
//   metal / container sub-records, 'os_release' which then reports it)
// - otherwise we show the metal's distro
//
// a node can be loaded with a regular physical image (fedora, ubuntu, ...)
// or with a physical image that only has docker on board, in which case
// 'os_release' describes the container (e.g. alpine-3.24.4) and no longer the metal;
// 'image_radical' (e.g. ubuntu-26.04+docker-ssh2222) is what describes the metal
//
// to support a new distro with a logo, drop <name>-logo.(png|svg) in
// /assets/img and add it to the list below, nothing else is needed;
// distros without a logo get the generic 'other' one

// name -> suffix of the logo file; the logos are in /assets/img/<name>-logo.<suffix>
export const known_distros = {
  ubuntu: 'svg',
  debian: 'svg',
  fedora: 'svg',
  centos: 'svg',
  rocky: 'svg',
  alma: 'svg',
  opensuse: 'svg',
  arch: 'svg',
  alpine: 'svg',
  mint: 'svg',
  other: 'svg',
}

// image_radical / os_release may spell the distro differently
// (os-release IDs are e.g. 'linuxmint', 'arch', 'opensuse-leap', 'almalinux', 'rocky')
const aliases = {
  linuxmint: 'mint',
  almalinux: 'alma',
  archlinux: 'arch',
}

function distro_of(candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue
    const lowered = candidate.toLowerCase()
    for (const [prefix, name] of Object.entries({ ...aliases, ...Object.fromEntries(Object.keys(known_distros).map(k => [k, k])) })) {
      if (name != 'other' && lowered.startsWith(prefix))
        return name
    }
  }
  // something is there, but we do not know about it
  return (candidates.some(c => c)) ? 'other' : undefined
}

// the node info carries 2 sub-records, 'metal' (the bare machine) and
// 'container' (null or absent on a regular node); older data only has the
// flat keys, where os_release is about the container when docker_version is set
// the functions below use the sub-records and fall back to the flat keys

// the distro of the bare machine
export function metal_distro(node) {
  const { metal } = node
  if (metal)
    return distro_of([metal.image_radical, metal.os_release])
  const { image_radical, os_release, docker_version } = node
  return distro_of(docker_version ? [] : [image_radical, os_release])
}

// the distro of the container, undefined if there is none (or none known)
export function container_distro(node) {
  const { metal, container } = node
  if (metal)
    return container ? distro_of([container.os_release]) : undefined
  const { os_release, docker_version } = node
  return docker_version ? distro_of([os_release]) : undefined
}

// the distro that we illustrate for a node: the one the user runs in,
// i.e. the container's if there is one, otherwise the metal's
// returns the name of a distro (a key in known_distros), or undefined if
// nothing is known about that node
export function node_distro(node) {
  const { metal, container } = node
  if (metal && container)
    return container_distro(node) || metal_distro(node)
  if (!metal && node.docker_version)
    return container_distro(node)
  return metal_distro(node)
}

export function logo_name(distro) {
  return `${distro}-logo`
}

// is what we know about the metal current, as opposed to a record that was
// left behind by a node that is now off or away ?
// on a docker node, port 22 leads into the container, which may be stopped, so
// control_ssh alone does not tell: the monitor probes the docker host port, and
// refreshes the 'seen' of the metal record every few minutes while the host answers
const METAL_LIVE_SECONDS = 600
export function metal_is_live(node) {
  if (node.control_ssh == 'on')
    return true
  const { metal } = node
  if (!metal || !metal.seen)
    return false
  return node.cmc_on_off == 'on'
    && node.control_ping == 'on'
    && (Date.now() / 1000 - metal.seen) < METAL_LIVE_SECONDS
}
