// A result from an older session must never replace the current account.
export function createIdentityGuard() {
  let generation = 0;
  return {
    invalidate: () => { generation++; },
    capture: () => { const captured = generation; return () => generation === captured; },
  };
}
