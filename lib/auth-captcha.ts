export function authCaptchaToken(value: unknown, required: boolean): string | undefined {
  if(value === undefined || value === '') {
    if(required) throw new Error('Complete the security check before continuing.');
    return undefined;
  }
  if(typeof value !== 'string' || value.length > 2048 || !value.trim()) throw new Error('Complete a new security check and try again.');
  return value;
}
