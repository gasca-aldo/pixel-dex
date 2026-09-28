export function authEmailError(error: unknown): string {
  const e = error as {code?:string;status?:number} | null;
  if(e?.code === 'over_email_send_rate_limit' || e?.code === 'over_request_rate_limit' || e?.status === 429)
    return 'Too many email requests right now. Please wait and try again later, or continue with Google.';
  if(e?.code === 'captcha_failed') return 'Security check failed. Please complete a new check and try again.';
  if(e?.code === 'weak_password') return 'Choose a stronger password with at least 8 characters.';
  if(e?.code === 'email_address_invalid') return 'Enter a valid email address.';
  return 'We could not complete your email request. Please try again later, or continue with Google.';
}
