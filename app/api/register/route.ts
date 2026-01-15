import { NextResponse } from "next/server";

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

  return NextResponse.json({ message: "Registrierung erfolgreich." });
}
