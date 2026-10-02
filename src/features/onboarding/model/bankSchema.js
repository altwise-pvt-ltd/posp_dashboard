import { z } from "zod";
import { fileField } from "@/shared/upload/schema";
import { bankNameField, personNameField } from "@/shared/validation/nameField";

/* Shared by the onboarding bank step and the profile's bank edit dialog. */
export const bankSchema = z
  .object({
    /**
     * A plain string, not an enum. The permitted values come from
     * `GET /onboarding/masters/account-types` at runtime, so a literal union
     * here would be a second, staler copy of the same list — and the one that
     * silently rejects a value the server had just offered. The selector
     * renders only server-supplied options, so the field cannot hold anything
     * else; this rule exists to catch "nothing chosen".
     */
    accountType: z.string().min(1, "Choose an account type."),
    accountHolder: personNameField({ label: "Account holder name" }),
    accountNumber: z.string().regex(/^[0-9]{9,18}$/, "Enter a valid account number (9–18 digits)."),
    confirmAccountNumber: z.string().min(1, "Please re-enter the account number."),
    // Real IFSC shape: 4 bank letters, a 0, then 6 branch alphanumerics.
    ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid 11-character IFSC code."),
    bankName: bankNameField({ label: "Bank name" }),
    /* Optional, matching the server. */
    branchName: bankNameField({ label: "Branch name", required: false }),
    passbookImage: fileField({ message: "Please upload your passbook photo." }),
    chequeImage: fileField({ message: "Please upload a cancelled cheque." }),
  })
  .refine((d) => d.accountNumber === d.confirmAccountNumber, {
    path: ["confirmAccountNumber"],
    message: "Account numbers don't match.",
  });
