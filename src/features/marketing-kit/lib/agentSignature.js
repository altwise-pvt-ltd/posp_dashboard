import { formatMobile } from '@/features/profile/lib/profileFields';

/**
 * The agent's signature, in one vocabulary.
 *
 * Two things render it and they render it differently: the canvas strip draws
 * four styled lines with the POSP code and mobile sharing one row, and the
 * share caption writes one labelled field per line. Those *layouts* have no
 * business being shared — the strip is fighting for width and shrinks its type
 * to fit, the caption is plain text in a chat box.
 *
 * What they must never disagree on is the wording, because the caption is the
 * fallback carrier for what the strip says. When the two were built separately
 * they drifted inside a day: the strip drew a bare mobile, the caption labelled
 * it, and nothing failed — the disagreement only showed on a real phone, on a
 * card already sent to a customer. So the labels live here once and both
 * renderers read them.
 *
 * Numbers go through `formatMobile`, the same helper the profile and support
 * cards use, so the number printed on a card a customer receives matches the
 * one the agent sees on their own screen.
 */
export function signatureParts(agent) {
  /* `|| {}` and not a default parameter: `useAgentSignature` returns *null* for
   * an agent still in onboarding, and a default only fires on `undefined`. */
  const { name, pospCode, mobile, rmName, rmMobile, supportMobile } = agent || {};
  const rm = [rmName, formatMobile(rmMobile)].filter(Boolean).join(' · ');

  return {
    name: name || null,
    posp: pospCode ? `POSP ID: ${pospCode}` : null,
    mobile: formatMobile(mobile),
    rm: rm || null,
    helpline: formatMobile(supportMobile),
  };
}

/**
 * The strip's lines, in drawing order, keyed so the renderer can style them.
 *
 * Carries no sizes or colours: those are typography and belong with the canvas
 * that draws them, not with the agent's record. Absent fields drop their line
 * rather than drawing a label with nothing after it — `pospCode` in particular
 * is null until the back office allocates one, which is a normal state for a
 * freshly cleared agent.
 */
export function signatureLines(agent) {
  const part = signatureParts(agent);

  return [
    { key: 'name', text: part.name },
    /* Wider separator than the RM line's: these are two distinct facts sharing
       a row, not one fact with a number after it. */
    { key: 'identity', text: [part.posp, part.mobile].filter(Boolean).join('   ·   ') },
    { key: 'rm', text: part.rm && `RM: ${part.rm}` },
    { key: 'support', text: part.helpline && `Helpline: ${part.helpline}` },
  ].filter((line) => Boolean(line.text));
}

/**
 * The same details as a caption, for the share targets that keep one.
 *
 * Never the only carrier on a branded card — the details are in the pixels, and
 * the file path drops this deliberately because some iOS targets take the text
 * and discard the attachment. It is the whole payload for a brochure, though,
 * where there is nothing to draw on.
 */
export function shareCaption(title, agent) {
  if (!agent) return title || undefined;

  const part = signatureParts(agent);

  return (
    [
      title,
      /* A blank line, kept deliberately: it separates the card's own name from
         the agent's block. Hence the explicit null/undefined test below rather
         than `filter(Boolean)`, which would drop it. */
      '',
      part.name,
      part.posp,
      part.mobile && `Mobile: ${part.mobile}`,
      part.rm && `RM: ${part.rm}`,
      part.helpline && `Helpline: ${part.helpline}`,
    ]
      .filter((line) => line !== null && line !== undefined && line !== false)
      .join('\n')
      .trim() || undefined
  );
}
