export function getHostUid(): number {
  if (typeof process.getuid !== 'function') {
    throw new Error('UID resolution is not available on this platform');
  }
  return process.getuid();
}
