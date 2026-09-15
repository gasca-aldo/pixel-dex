// Only recovery sessions should land on the password form.
export function destinationAfterAuth(redirectType: string | null | undefined): '/' | '/login' {
  return redirectType === 'recovery' ? '/login' : '/';
}
