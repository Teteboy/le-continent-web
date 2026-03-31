/**
 * Resilient fetch utility with offline detection and automatic retry.
 * Designed for unreliable mobile networks (e.g. Cameroon).
 */

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

const DEFAULT_TIMEOUT = 15000; // 15s — generous for 3G networks
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000; // 1s base delay

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Throws a descriptive error if the browser reports offline.
 */
function assertOnline(): void {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('Hors connexion — vérifiez votre connexion internet.');
  }
}

/**
 * Wraps fetch with timeout, offline detection, and exponential-backoff retry.
 *
 * Retries on:
 *  - Browser offline (navigator.onLine)
 *  - Network errors (TypeError: Failed to fetch)
 *  - AbortError from timeout
 *
 * Does NOT retry on HTTP 4xx/5xx (those are valid responses).
 */
export async function resilientFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const maxRetries = options.retries ?? DEFAULT_RETRIES;
  const baseDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check connectivity before each attempt
    assertOnline();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));

      const isAbort = lastError.name === 'AbortError';
      const isNetwork =
        lastError instanceof TypeError ||
        lastError.message === 'Failed to fetch' ||
        lastError.message === 'NetworkError when attempting to fetch resource.' ||
        lastError.message === 'Load failed';

      // Only retry on network/abort errors — NOT on user-initiated aborts
      const shouldRetry = (isAbort || isNetwork) && attempt < maxRetries;

      if (!shouldRetry) {
        // Provide a friendly message
        if (isAbort) {
          throw new Error('La connexion a expiré. Réessayez.');
        }
        if (isNetwork) {
          throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion internet.');
        }
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s …
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(
        `[resilientFetch] Attempt ${attempt + 1}/${maxRetries + 1} failed (${lastError.message}), retrying in ${delay}ms…`
      );
      await sleep(delay);

      // Re-check online status after delay
      assertOnline();
    }
  }

  // Should not reach here, but just in case
  throw lastError ?? new Error('La requête a échoué après plusieurs tentatives.');
}
