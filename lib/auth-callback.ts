export const invalidAuthLink = 'This link is invalid, expired, or already used. Please request a new link.';
export function readAuthCallback(search: string, hash: string) {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  if(query.has('error') || fragment.has('error')) throw new Error(invalidAuthLink);
  if(fragment.has('token_hash')) {
    const token = fragment.get('token_hash');
    if(!token || fragment.getAll('token_hash').length !== 1 || fragment.getAll('type').length !== 1 || fragment.get('type') !== 'recovery' || query.has('code')) throw new Error(invalidAuthLink);
    return {kind: 'recovery' as const, token};
  }
  const code = query.get('code');
  if(!code || query.getAll('code').length !== 1) throw new Error(invalidAuthLink);
  return {kind: 'code' as const, code};
}
