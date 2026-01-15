import { NextResponse } from "next/server";
import {
  buildSupabaseAuthUrl,
  getSupabaseAuthHeaders,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/auth";

type AuthResponse = {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (!body.email || !body.password) {
    return NextResponse.json(
      { message: "Bitte E-Mail und Passwort angeben." },
      { status: 400 },
    );
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { message: "Supabase Konfiguration fehlt." },
      { status: 500 },
    );
  }

  const response = await fetch(buildSupabaseAuthUrl("signup"), {
    method: "POST",
    headers: getSupabaseAuthHeaders(),
    body: JSON.stringify({
      email: body.email,
      password: body.password,
    }),
  });

  const data = (await response.json()) as AuthResponse;

  if (!response.ok) {
    return NextResponse.json(
      { message: data.error_description ?? "Registrierung fehlgeschlagen." },
      { status: 400 },
    );
  }

  const secure = process.env.NODE_ENV === "production";
  const needsEmailConfirmation = !data.access_token || !data.refresh_token;
  const nextResponse = NextResponse.json({
    message: needsEmailConfirmation
      ? "Registrierung erfolgreich. Bitte bestätige deine E-Mail."
      : "Registrierung erfolgreich. Willkommen!",
    needsEmailConfirmation,
  });

  if (!needsEmailConfirmation && data.access_token && data.refresh_token) {
    nextResponse.cookies.set("sb-access-token", data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
    });
    nextResponse.cookies.set("sb-refresh-token", data.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
    });
  }

  return nextResponse;
}
