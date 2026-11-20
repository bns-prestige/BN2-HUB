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
  const isAiAdmin = path.startsWith("/ai-admin");
  const isStaffArea = path.startsWith("/staff");
  const isProtected = path === "/" || path.startsWith("/client-builder") || isPortal || isAiAdmin || isStaffArea;

  if (isProtected && !user) {
    const target = request.nextUrl.clone();
    target.pathname = "/login";
    target.searchParams.set("next", path);
    return NextResponse.redirect(target);
  }

  if (user) {
    const role = user.app_metadata?.role;
    const isAdmin = role === "bn2_owner" || role === "bn2_admin";
    const isStaff = role === "bn2_staff" || role === "bn2_agent";
    if (isLogin) {
      return NextResponse.redirect(new URL(isAdmin ? "/" : isStaff ? "/staff" : "/portal", request.url));
    }
    if ((path === "/" || path.startsWith("/client-builder") || isAiAdmin) && !isAdmin) {
      return NextResponse.redirect(new URL(isStaff ? "/staff" : "/portal", request.url));
    }
    if (isStaffArea && isAdmin) return NextResponse.redirect(new URL("/", request.url));
    if (isStaffArea && !isStaff) return NextResponse.redirect(new URL("/portal", request.url));
    if (isPortal && isStaff && !isAdmin && path !== "/portal/assistant") return NextResponse.redirect(new URL("/staff", request.url));
    if (isPortal && !isAdmin && !isStaff) {
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
