import { z } from "zod";

// Valida o corpo recebido do n8n/Telegram antes de salvar.
export const expenseSchema = z.object({
  telegramId: z.string().min(1),
  descricao: z.string().min(1).max(200),
  valorCentavos: z.number().int().positive(),
  categoria: z.string().min(1).max(60).optional(),
  dataGasto: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
