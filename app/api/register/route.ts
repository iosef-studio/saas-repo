import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/auth";

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

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
  });

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "Registrierung fehlgeschlagen." },
      { status: 400 },
    );
  }

  // Supabase returns a user without a session when email confirmation is required
  const needsEmailConfirmation = !data.session;

  return NextResponse.json({
    message: needsEmailConfirmation
      ? "Registrierung erfolgreich. Bitte bestätige deine E-Mail."
      : "Registrierung erfolgreich. Willkommen!",
    needsEmailConfirmation,
  });
}
