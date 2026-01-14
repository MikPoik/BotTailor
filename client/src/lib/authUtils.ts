/**
 * Client-side auth utility functions.
 *
 * Responsibilities:
 * - Detects 401 Unauthorized errors for auth flows.
 * - Used by client hooks and error handlers to surface auth state.
 *
 * Constraints & Edge Cases:
 * - Must match server error message format for 401 detection.
 */
export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}