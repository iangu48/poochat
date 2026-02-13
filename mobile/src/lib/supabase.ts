import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { assertEnv, env } from './env';

assertEnv();

const loggedFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method =
    init?.method ??
    (typeof input === 'string' || input instanceof URL ? 'GET' : input.method ?? 'GET');
  const isSqlRequest = url.includes('/rest/v1/') || url.includes('/rpc/');
  const startedAt = Date.now();

  if (isSqlRequest) {
    const bodyPreview = typeof init?.body === 'string' ? init.body.slice(0, 400) : '';
    console.log(`[supabase:sql:req] ${method} ${url}`);
    if (bodyPreview) console.log(`[supabase:sql:req:body] ${bodyPreview}`);
  }

  try {
    const response = await fetch(input, init);
    if (isSqlRequest) {
      console.log(
        `[supabase:sql:res] ${method} ${url} -> ${response.status} (${Date.now() - startedAt}ms)`
      );
      if (!response.ok) {
        try {
          const errorText = await response.clone().text();
          if (errorText) {
            console.error(`[supabase:sql:res:body] ${errorText.slice(0, 1200)}`);
          }
        } catch (cloneError) {
          console.error('[supabase:sql:res:body] failed to read response body', cloneError);
        }
      }
    }
    return response;
  } catch (error) {
    if (isSqlRequest) {
      console.error(`[supabase:sql:err] ${method} ${url} (${Date.now() - startedAt}ms)`, error);
    }
    throw error;
  }
};

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: loggedFetch,
  },
});
