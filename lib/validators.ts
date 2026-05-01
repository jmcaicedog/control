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

export const cardSchema = z.object({
  title: z.string().trim().min(1, "Título obligatorio"),
  description: z.string().trim().optional(),
  type: z.enum(["simple", "checklist"]),
  columnName: z.enum(["todo", "doing", "in_review", "done"]),
  checklistItems: z.array(z.string().trim().min(1)).optional(),
});
