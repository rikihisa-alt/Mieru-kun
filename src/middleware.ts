import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(request: NextRequest) {
  // Supabase未設定時は認証チェックをスキップ（デモモード）
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // 公開パス（認証不要）
    const publicPaths = ["/", "/login", "/signup", "/auth"];
    const isPublic = publicPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    // 顧客ポータルパス
    const isCustomerPath = pathname.startsWith("/mypage");

    // 未認証ユーザーを認証ページへリダイレクト
    if (!user && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // 認証済みユーザーがauth系ページにアクセスしたらホームへ
    if (user && (pathname === "/login" || pathname === "/signup")) {
      const url = request.nextUrl.clone();
      // 顧客ユーザーはマイページへ、それ以外はスタッフホームへ
      url.pathname = isCustomerPath ? "/mypage" : "/home";
      return NextResponse.redirect(url);
    }
  } catch {
    // Supabase接続エラー時はそのまま通す
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
