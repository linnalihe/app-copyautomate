import { z } from "zod";

export const submissionSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address.")
    .max(255, "Email is too long."),
  message: z
    .string()
    .min(1, "Message is required.")
    .max(5000, "Message must be 5000 characters or fewer."),
  first_name: z
    .string()
    .max(100, "First name is too long.")
    .optional()
    .default("anonymous"),
  last_name: z
    .string()
    .max(100, "Last name is too long.")
    .optional()
    .default("anonymous"),
  honeypot: z.string().optional(),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
