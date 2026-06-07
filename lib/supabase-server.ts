import { createServerClient } from "@supabase/ssr";

export function createSupabaseServerClient(
  request: any,
  response: any,
  supabaseUrl: string,
  supabaseAnonKey: string
) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: any[]) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });
}