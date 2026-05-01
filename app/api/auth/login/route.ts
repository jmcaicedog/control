import { NextResponse } from "next/server";
import { authenticate, createSession, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    const forwardedFor = request.headers.get("x-forwarded-for") ?? undefined;
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || undefined;

    const user = await authenticate(parsed.data.email, parsed.data.password);
    if (!user) {
      return NextResponse.json({ message: "Credenciales incorrectas" }, { status: 401 });
    }

    const token = await createSession(
      user.id,
      ipAddress,
      request.headers.get("user-agent") ?? undefined
    );

    await setSessionCookie(token);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth/login] unexpected error", error);
    return NextResponse.json({ message: "Error interno de autenticación" }, { status: 500 });
  }
}
