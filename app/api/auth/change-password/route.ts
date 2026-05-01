import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookieName, changePasswordForUser, getCurrentUser } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Sesión no válida" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const currentToken = cookieStore.get(authCookieName)?.value;

    const result = await changePasswordForUser(
      user.id,
      parsed.data.currentPassword,
      parsed.data.newPassword,
      currentToken
    );

    if (!result.ok) {
      if (result.reason === "invalid_current_password") {
        return NextResponse.json({ message: "La contraseña actual es incorrecta" }, { status: 401 });
      }

      return NextResponse.json({ message: "No hay credenciales locales para este usuario" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth/change-password] unexpected error", error);
    return NextResponse.json({ message: "No fue posible cambiar la contraseña" }, { status: 500 });
  }
}
