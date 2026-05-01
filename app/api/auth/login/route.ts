import { NextResponse } from "next/server";
import { authenticate, createSession, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
  }

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    return NextResponse.json({ message: "Credenciales incorrectas" }, { status: 401 });
  }

  const token = await createSession(
    user.id,
    request.headers.get("x-forwarded-for") ?? undefined,
    request.headers.get("user-agent") ?? undefined
  );

  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
