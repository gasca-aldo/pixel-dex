// Compare JSON values independently of database object-key ordering; arrays retain order.
export function samePayload(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => samePayload(v, b[i]));
  }
  const left = a as Record<string, unknown>, right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every(k => Object.hasOwn(right, k) && samePayload(left[k], right[k]));
}

export function clearMatchingDraft(store: Pick<Storage, 'getItem' | 'removeItem'>, key: string, payload: unknown, revision: number): boolean {
  const raw = store.getItem(key);
  if (!raw) return true;
  try {
    const draft = JSON.parse(raw);
    if (draft.revision !== revision || !samePayload(draft.payload, payload)) return false;
  } catch { return false; }
  store.removeItem(key);
  return true;
}

// A lost response can leave a committed save looking unsaved. Accept only the exact
// stored payload; never retry by silently replacing the expected revision.
export async function reconcileConflict<T>(payload: T, load: () => Promise<{payload: T; revision: number} | null>): Promise<number> {
  const remote = await load();
  if (remote && samePayload(remote.payload, payload)) return remote.revision;
  throw new Error('This library changed on another device. Export your unsaved copy before loading the account version.');
}

export async function settleSave(save: () => Promise<number>, current: () => boolean, success: (revision: number) => void, failure: (error: unknown) => void): Promise<void> {
  try {
    const revision = await save();
    if (current()) success(revision);
  } catch (error) {
    if (current()) failure(error);
  }
}
