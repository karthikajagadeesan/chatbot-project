import { NextResponse } from "next/server";
import { createServer, createAdmin } from "@/utils/supabase";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { first_name, last_name, phone_no, email, password } = body;

        if (!first_name || !email || !password || !phone_no) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        const supabaseAdmin = await createAdmin(cookies());
        const supabaseServer = await createServer(cookies());

        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                first_name,
                last_name,
                phone_no,
            },
        });

        if (authError || !authData.user) {
            return NextResponse.json({ success: false, message: authError?.message || "Failed to create account" }, { status: 400 });
        }

        // 2. Create user profile in 'users' table
        const { data: userData, error: userError } = await supabaseAdmin
            .from("users")
            .insert({
                auth_id: authData.user.id,
                first_name,
                last_name,
                phone_no,
                email,
            })
            .select("*")
            .maybeSingle();

        if (userError || !userData) {
            // Rollback auth user creation if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json({ success: false, message: userError?.message || "Failed to save user profile" }, { status: 500 });
        }

        // 3. Sign in the newly created user to establish session cookies
        const { error: signInError } = await supabaseServer.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            return NextResponse.json({ success: false, message: "Account created but failed to sign in automatically" }, { status: 500 });
        }


        return NextResponse.json({
            success: true,
            message: "Account created successfully",
            data: userData,
        }, { status: 201 });

    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
