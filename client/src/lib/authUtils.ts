export function isUnauthorizedError(error: Error | null | undefined): boolean {
  if (!error || !error.message) {
    return false;
  }
  return /^401: .*Unauthorized/.test(error.message);
}