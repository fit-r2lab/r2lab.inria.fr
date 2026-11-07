// which distribution do we illustrate for a node ?
//
// - when docker is on (docker_version is set), the user runs in the container,
//   so we show the container's distro, which is what 'os_release' reports
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

// returns the name of a distro (a key in known_distros), or undefined if
// nothing is known about that node
export function node_distro(node) {
  const { image_radical, os_release, docker_version } = node
  // with docker on, os_release is about the container; image_radical about the metal
  const candidates = docker_version ? [os_release] : [image_radical, os_release]
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

export function logo_name(distro) {
  return `${distro}-logo`
}
