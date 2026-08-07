import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isSupabaseReady(): boolean {
  return !!(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes("placeholder") &&
    supabaseUrl.startsWith("https://") &&
    supabaseKey.length > 30
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // デモモードcookieがある → 全ルートを通す
  if (request.cookies.get("demo_mode")?.value === "true") {
    return NextResponse.next();
  }

  // Supabase未接続 → 全ルートを通す
  if (!isSupabaseReady()) {
    return NextResponse.next();
  }

  // 公開パス
  const publicPaths = ["/", "/login", "/signup", "/auth", "/u3j5ny"];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && (pathname === "/login" || pathname === "/signup")) {
      const url = request.nextUrl.clone();
      // 新管理画面のベースへ。旧 /h7p2kx (旧ダッシュボード) は next.config の
      // redirects で /k4z8qm3x へ飛ぶが、ログイン後の行き先は直接新ベースを指す。
      url.pathname = "/k4z8qm3x";
      return NextResponse.redirect(url);
    }
  } catch {
    // エラー時はそのまま通す
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
