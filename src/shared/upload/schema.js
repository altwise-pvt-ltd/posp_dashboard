/**
 * The zod side of the upload policy.
 *
 * Every step used to spell its own file rule out by hand, and every one of them
 * spelled the same weak rule: `z.any().refine(f => f instanceof File)`. That
 * accepts a renamed archive as readily as a photo. Worse, the education
 * certificate didn't even have that — it was a bare `z.any().optional()`, so it
 * had no validation at all.
 *
 * Routing them all through one helper means the submit-time gate is the same
 * rule as the selection-time gate, and a change to the policy reaches the form
 * layer without anyone remembering to update six files.
 */

import { z } from "zod";
import { DOCUMENT } from "./policy";
import { checkPreparedFile } from "./validate";

/**
 * A form field holding an uploaded file.
 *
 * `message` is the copy for a missing required file, and is the only part worth
 * writing per field — "Please upload the back of your Aadhaar" is worth saying
 * precisely. Every other message comes from the policy, so the ceiling quoted at
 * submit always matches the ceiling quoted under the drop zone.
 *
 * Optional fields validate only when something is actually there: an untouched
 * certificate upload passes, a certificate upload holding a PDF does not.
 */
export function fileField({ profile = DOCUMENT, required = true, message } = {}) {
  const field = z.any().superRefine((value, ctx) => {
    const absent = value == null || value === "";

    if (absent) {
      if (required) {
        ctx.addIssue({
          code: "custom",
          message: message ?? "Please upload a file.",
        });
      }
      return;
    }

    const result = checkPreparedFile(value, profile);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: result.message });
    }
  });

  // zod 4 treats a missing object key as a value the schema has to accept
  // rather than one it can ignore, so an un-wrapped `z.any()` reports the key
  // as required even though the refinement above is happy to let it go. The
  // explicit `.optional()` is what actually lets an untouched certificate
  // upload through; the refinement still runs whenever a file is present.
  return required ? field : field.optional();
}
