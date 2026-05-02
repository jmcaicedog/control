import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const projectSchema = z.object({
  name: z.string().trim().min(1, "El nombre del proyecto es obligatorio"),
  clientName: z.string().trim().min(1, "El nombre del cliente es obligatorio"),
  clientEmail: z.union([z.literal(""), z.string().email("Correo del cliente inválido")]),
  clientPhone: z.string().trim().optional(),
  description: z.string().trim().optional(),
  totalValue: z.coerce.number().nonnegative("El valor total debe ser mayor o igual a 0"),
  advanceValue: z.coerce.number().nonnegative("El anticipo debe ser mayor o igual a 0"),
  startDate: z.string().min(1, "Fecha de inicio obligatoria"),
  endDate: z.string().min(1, "Fecha de finalización obligatoria"),
}).superRefine((value, ctx) => {
  if (value.advanceValue > value.totalValue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El anticipo no puede ser mayor al valor total",
      path: ["advanceValue"],
    });
  }

  if (new Date(value.startDate) > new Date(value.endDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La fecha final debe ser mayor o igual a la fecha inicial",
      path: ["endDate"],
    });
  }
});

export const quoteSchema = z.object({
  name: z.string().trim().min(1, "El nombre de la cotización es obligatorio"),
  clientName: z.string().trim().min(1, "El nombre del cliente es obligatorio"),
  clientEmail: z.union([z.literal(""), z.string().email("Correo del cliente inválido")]),
  clientPhone: z.string().trim().optional(),
  description: z.string().trim().optional(),
  totalValue: z.coerce.number().nonnegative("El valor total debe ser mayor o igual a 0"),
  advanceValue: z.coerce.number().nonnegative("El anticipo debe ser mayor o igual a 0"),
}).superRefine((value, ctx) => {
  if (value.advanceValue > value.totalValue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El anticipo no puede ser mayor al valor total",
      path: ["advanceValue"],
    });
  }
});

export const convertQuoteSchema = projectSchema;

export const cardSchema = z.object({
  title: z.string().trim().min(1, "Título obligatorio"),
  description: z.string().trim().optional(),
  type: z.enum(["simple", "checklist"]),
  columnName: z.enum(["todo", "doing", "in_review", "done"]),
  checklistItems: z.array(z.string().trim().min(1)).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, "La contraseña actual es obligatoria"),
  newPassword: z
    .string()
    .min(12, "La nueva contraseña debe tener al menos 12 caracteres")
    .regex(/[A-Z]/, "Debe incluir al menos una letra mayúscula")
    .regex(/[a-z]/, "Debe incluir al menos una letra minúscula")
    .regex(/[0-9]/, "Debe incluir al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe incluir al menos un carácter especial"),
  confirmPassword: z.string().min(1, "Debes confirmar la nueva contraseña"),
}).superRefine((value, ctx) => {
  if (value.newPassword !== value.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La confirmación no coincide con la nueva contraseña",
      path: ["confirmPassword"],
    });
  }

  if (value.currentPassword === value.newPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La nueva contraseña debe ser diferente a la actual",
      path: ["newPassword"],
    });
  }
});
