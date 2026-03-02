import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    const isAuthPage =
        request.nextUrl.pathname === "/login" ||
        request.nextUrl.pathname === "/signup";

    // Never block auth pages — let them load instantly
    if (isAuthPage) {
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
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
        }
    );

    const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

    try {
        // Add a 5-second timeout so the middleware doesn't hang forever
        const userPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
        const result = await Promise.race([userPromise, timeoutPromise]);

        const user = result && "data" in result ? result.data.user : null;

        if (!user && isDashboardPage) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
        }

        if (user && isAuthPage) {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }
    } catch {
        // If Supabase is down, let the request through — the client will handle errors
        if (isDashboardPage) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
