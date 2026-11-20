import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.redirect(new URL("/login?error=configuration", request.url));

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isLogin = path === "/login";
  const isPortal = path.startsWith("/portal");
  const isProtected = path === "/" || path.startsWith("/client-builder") || isPortal;

  if (isProtected && !user) {
    const target = request.nextUrl.clone();
    target.pathname = "/login";
    target.searchParams.set("next", path);
    return NextResponse.redirect(target);
  }

  if (user) {
    const role = user.app_metadata?.role;
    const isAdmin = role === "bn2_owner" || role === "bn2_admin";
    if (isLogin) {
      return NextResponse.redirect(new URL(isAdmin ? "/" : "/portal", request.url));
    }
    if ((path === "/" || path.startsWith("/client-builder")) && !isAdmin) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    if (isPortal && !isAdmin) {
      const { data: membership } = await supabase
        .from("organization_members")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (!membership) return NextResponse.redirect(new URL("/login?error=forbidden", request.url));
    }
  }

  return response;
}
