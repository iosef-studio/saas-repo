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

  const { error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error) {
    return NextResponse.json(
      { message: error.message ?? "Login fehlgeschlagen." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    message: "Login erfolgreich. Willkommen zurück!",
  });
}
