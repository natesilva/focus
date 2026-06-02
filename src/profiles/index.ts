import type { Profile } from './types.ts';
import { loadBuiltinProfiles } from './catalog.ts';
import { loadCustomProfiles } from './custom.ts';

export type { Profile };

async function resolveAll(configDir: string): Promise<Map<string, Profile>> {
  const [builtins, custom] = await Promise.all([
    loadBuiltinProfiles(),
    loadCustomProfiles(configDir),
  ]);
  const merged = new Map(builtins);
  for (const [name, profile] of custom) {
    merged.set(name, profile);
  }
  return merged;
}

function lookupProfile(name: string, map: Map<string, Profile>): Profile {
  const profile = map.get(name);
  if (profile === undefined) {
    throw new Error(`Unknown tool profile: "${name}". Check your .focus.yaml tools list.`);
  }
  return profile;
}

export async function getProfile(name: string, configDir: string): Promise<Profile> {
  return lookupProfile(name, await resolveAll(configDir));
}

export async function resolveProfiles(names: string[], configDir: string): Promise<Profile[]> {
  const map = await resolveAll(configDir);

  // Validate all explicitly requested names exist up front.
  for (const name of names) {
    lookupProfile(name, map);
  }

  const requested = new Set(names);

  // BFS transitive closure: expand to include all transitive prerequisites.
  // Missing prerequisites are caught here at expansion time.
  const resolved = new Set<string>(names);
  const queue: string[] = [...names];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const profile = map.get(current)!;
    for (const prereq of profile.prerequisites) {
      if (!map.has(prereq)) {
        throw new Error(`Profile "${current}" declares prerequisite "${prereq}", but no such profile exists.`);
      }
      if (!resolved.has(prereq)) {
        resolved.add(prereq);
        queue.push(prereq);
        if (!requested.has(prereq)) {
          process.stderr.write(`note: adding "${prereq}" (required by ${current})\n`);
        }
      }
    }
  }

  // Kahn's algorithm: topological sort over the resolved set.
  // Build in-degree counts and a reverse adjacency list (prereq → its dependents).
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const name of resolved) {
    if (!inDegree.has(name)) inDegree.set(name, 0);
    if (!dependents.has(name)) dependents.set(name, []);
  }
  for (const name of resolved) {
    for (const prereq of map.get(name)!.prerequisites) {
      if (!resolved.has(prereq)) continue;
      inDegree.set(name, (inDegree.get(name) ?? 0) + 1);
      dependents.get(prereq)!.push(name);
    }
  }

  // Seed frontier with zero-in-degree nodes, sorted alphabetically for determinism.
  const frontier: string[] = [...resolved]
    .filter(n => inDegree.get(n) === 0)
    .sort();

  const sorted: string[] = [];
  while (frontier.length > 0) {
    const name = frontier.shift()!;
    sorted.push(name);
    const newly: string[] = [];
    for (const dep of dependents.get(name) ?? []) {
      const deg = (inDegree.get(dep) ?? 0) - 1;
      inDegree.set(dep, deg);
      if (deg === 0) newly.push(dep);
    }
    // Sort newly unblocked nodes before adding to frontier.
    frontier.push(...newly.sort());
  }

  // Any remaining nodes with in-degree > 0 form a cycle.
  if (sorted.length !== resolved.size) {
    const cycleNodeSet = new Set([...resolved].filter(n => !sorted.includes(n)));
    // Walk the cycle to reconstruct the directed path for the error message.
    const start = [...cycleNodeSet].sort()[0];
    const cyclePath: string[] = [start];
    const inPath = new Set([start]);
    let cur = start;
    for (;;) {
      const next = map.get(cur)!.prerequisites.find(p => cycleNodeSet.has(p) && !inPath.has(p));
      if (next !== undefined) {
        cyclePath.push(next);
        inPath.add(next);
        cur = next;
      } else {
        // Close the loop back to the entry point.
        const loopBack = map.get(cur)!.prerequisites.find(p => cycleNodeSet.has(p));
        if (loopBack !== undefined) cyclePath.push(loopBack);
        break;
      }
    }
    throw new Error(`Circular prerequisite chain detected: ${cyclePath.join(' → ')}`);
  }

  return sorted.map(name => map.get(name)!);
}
