import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dltkfjkodqpzmpuctnju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdGtmamtvZHFwem1wdWN0bmp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2ODMyMSwiZXhwIjoyMDc5NzQ0MzIxfQ.Vz6yapqHN7NlI83izQiFGIf2L_8vegNMpl99r_yQxDw';

/**
 * Serial-queue lock to replace Supabase's default Web Locks-based locking.
 *
 * Supabase uses navigator.locks with `steal: true` which throws
 * "Lock broken by another request with the 'steal' option." when multiple
 * concurrent auth operations compete (e.g. React StrictMode double-invoke,
 * or getSession() + onAuthStateChange firing simultaneously).
 *
 * This serial queue ensures auth operations run one after another
 * without the native Web Lock, preventing the error while staying safe.
 */
const queues = new Map<string, Promise<void>>();
function serialLock<T>(name: string, _acquireTimeout: number, fn: () => Promise<T>): Promise<T> {
  const prev = queues.get(name) ?? Promise.resolve();
  const next = prev.then(() => fn());
  queues.set(name, next.then(() => {}, () => {}));
  return next;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    lock: serialLock,
  },
});
