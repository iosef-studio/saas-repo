import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secure = process.env.NODE_ENV === "production";
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set("sb-access-token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("sb-refresh-token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });

  return response;
}
