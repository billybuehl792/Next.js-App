"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DeleteInvoice } from "../ui/invoices/buttons";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

/**
 * Server action to create an `Invoice`.
 * @param formData - Form data submitted by user
 */
const createInvoice = async (formData: FormData) => {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
`;

  // Clear cache and trigger new server request with fresh data
  revalidatePath("/dashboard/invoices");

  // Redirect
  redirect("/dashboard/invoices");
};

/**
 * Server action to update an `Invoice`.
 * @param id - Invoice id
 * @param formData - Form data submitted by user
 */
const updateInvoice = async (id: string, formData: FormData) => {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  // Clear cache and trigger new server request with fresh data
  revalidatePath("/dashboard/invoices");

  // Redirect
  redirect("/dashboard/invoices");
};

/**
 * Server action to delete an `Invoice`.
 * @param id - Invoice id
 */
const deleteInvoice = async (id: string) => {
  await sql`DELETE FROM invoices WHERE id = ${id}`;

  // Clear cache and trigger new server request with fresh data
  revalidatePath("/dashboard/invoices");
};

export { createInvoice, updateInvoice, deleteInvoice };
