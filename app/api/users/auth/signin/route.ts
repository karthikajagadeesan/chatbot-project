import { NextResponse } from "next/server";
import { createServer } from "@/utils/supabase";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 });
        }

        const supabase = await createServer(cookies());

        // 1. Authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            let errorMessage = authError.message;
            if (errorMessage.toLowerCase().includes("email not confirmed")) {
                errorMessage = "Please confirm your email before signing in. Check your inbox.";
            } else if (errorMessage.toLowerCase().includes("invalid login credentials")) {
                errorMessage = "Invalid email or password. Please try again.";
            }
            return NextResponse.json({ success: false, message: errorMessage }, { status: 401 });
        }

        if (!authData.user) {
            return NextResponse.json({ success: false, message: "Authentication failed. No user returned." }, { status: 500 });
        }

        // 2. Fetch user profile
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("auth_id", authData.user.id)
            .maybeSingle();

        if (userError || !userData) {
            await supabase.auth.signOut();
            return NextResponse.json({ success: false, message: userError?.message || "No user profile found. Please sign up first." }, { status: 404 });
        }

        if (!userData.status) {
            await supabase.auth.signOut();
            return NextResponse.json({ success: false, message: "Your account is disabled. Contact support for more details." }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            message: "Signed in successfully",
            data: userData,
        }, { status: 200 });

    } catch (error) {
        console.error("Signin error:", error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
