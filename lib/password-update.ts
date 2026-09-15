type Identity = { id: string };
type Auth = {
  getSession(): Promise<{ data: { session: { access_token: string; user: Identity } | null }; error: unknown }>;
  getUser(token: string): Promise<{ data: { user: Identity | null }; error: unknown }>;
};
export async function updatePasswordForOwner(auth: Auth, owner: string, password: string, current: () => boolean, send: (token: string, password: string) => Promise<void>) {
  const changed = () => new Error('Your session changed. Please sign in again before updating your password.');
  const {data: {session}, error} = await auth.getSession();
  if(error || !session || session.user.id !== owner || !current()) throw changed();
  // Verify and pin this exact token: the shared SDK may switch accounts while awaiting a request.
  const {data: {user}, error: verificationError} = await auth.getUser(session.access_token);
  if(verificationError || user?.id !== owner || !current()) throw changed();
  await send(session.access_token, password);
  if(!current()) throw changed();
}
