import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hand a card to whatever the device can actually do with it.
 *
 * Three rungs, tried in order, because each one is a strictly worse answer than
 * the one above and there is no device where a lower rung is preferable:
 *
 *   1. Share the branded image *as a file* — the share sheet on a phone, which
 *      is where an agent actually works. The customer receives the card itself.
 *   2. Save the branded image — desktop, where no browser can put a file into
 *      the share sheet. The agent gets the finished card to attach by hand.
 *   3. Share or copy the bare link — no branding possible at all: the profile
 *      has not loaded, the artwork would not draw, or this is a brochure PDF.
 *
 * Rung 3 is the previous behaviour of this hook, kept intact underneath rather
 * than replaced. Branding is the thing most likely to fail here — it depends on
 * a CORS header on someone else's static file server — and a failure to brand
 * must still send *something*, not nothing.
 */

/**
 * Can this browser put a file into the share sheet?
 *
 * Probed once with a real one-byte `File`, because `navigator.canShare` answers
 * per payload and not per capability: `canShare({ url })` is true on desktop
 * Chrome, which cannot take files at all. Asking it the actual question is the
 * only honest test, and the answer cannot change for the life of the page.
 */
/** A share sheet of any kind. Page-lifetime constant, so the button reads it
 *  from here rather than re-deriving it per card per render. */
export const CAN_SHARE = typeof navigator !== 'undefined' && Boolean(navigator.share);

export const CAN_SHARE_FILES = (() => {
  try {
    if (!CAN_SHARE || !navigator.canShare) return false;
    const probe = new File(['probe'], 'probe.jpg', { type: 'image/jpeg' });
    return navigator.canShare({ files: [probe] });
  } catch {
    /* Older Safari throws from the `File` constructor rather than returning
     * false, and a browser that cannot build a File certainly cannot share one. */
    return false;
  }
})();

/**
 * `navigator.share`, reduced to the three outcomes callers act on, and never
 * throwing.
 *
 * Both rungs that open a sheet need the same "was that a cancel or a failure?"
 * question answered, and deciding it in two places is how a change to cancel
 * handling ends up applied to only one of them. A cancel is a user saying no,
 * not a fault — the distinction is the whole reason this exists.
 */
async function trySheet(payload) {
  try {
    await navigator.share(payload);
    return 'done';
  } catch (err) {
    return err?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

/** Rung 2. Object URLs pin the blob in memory until revoked — hence the timer. */
function saveFile(file) {
  const href = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = href;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  /* Revoking synchronously cancels the download in Firefox — the fetch of the
   * object URL has not started when `click()` returns. */
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

export function useShare() {
  const [status, setStatus] = useState('idle');
  const timer = useRef(null);

  /**
   * A card that is built and waiting for a second tap.
   *
   * `navigator.share` needs *transient user activation*, which Chrome and
   * Safari expire about five seconds after the tap that granted it. Building a
   * branded card means fetching 1.3–3.7 MB of artwork, decoding it, and
   * re-encoding a canvas — on mobile data that routinely outlasts the five
   * seconds, and the sheet then refuses with `NotAllowedError` even though
   * nothing is wrong. It is worst on a slow connection, which is precisely when
   * an agent is out of the office and most needs this to work.
   *
   * There is no way to hold activation across an await, so the card is kept
   * here instead: the next tap is a fresh gesture, the file already exists, and
   * `share` is reached with nothing to await in between. The button says
   * "Send card" in the meantime, so the second tap is asked for rather than
   * hoped for.
   */
  const armed = useRef(null);

  /* A card can unmount while the flash is still pending — switching category,
   * or the tab. Clearing on unmount keeps that setState off a dead component,
   * and drops any parked card so a browsed-past category does not leave a
   * blob per tapped tile alive behind it. */
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      armed.current = null;
    },
    []
  );

  const flash = useCallback((next) => {
    setStatus(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('idle'), 2000);
  }, []);

  /**
   * `prepareFile` is an async factory rather than a ready-made file: building
   * one means downloading ~3 MB of artwork and drawing it, and doing that for
   * every card in a category on mount would be far more expensive than the
   * grid it is decorating. It runs on the tap, for the one card tapped.
   */
  const share = useCallback(
    async ({ title, text, url, prepareFile }) => {
      /* A card left over from a tap whose activation ran out. Taken rather than
       * rebuilt — that is the whole point — and cleared first, so a failure on
       * this attempt cannot leave a stale one armed. */
      const retry = Boolean(armed.current);
      let file = armed.current;
      armed.current = null;

      if (!file && prepareFile) {
        setStatus('preparing');
        try {
          file = await prepareFile();
        } catch (err) {
          /* Branding failed — a tainted canvas, a 404 on the artwork, a browser
           * without `toBlob`. Logged because it is a real fault worth seeing in
           * a bug report, then ignored: rung 3 still works and the agent gets a
           * link rather than an error. */
          console.warn('[useShare] could not brand the card, sharing the link instead', err);
        }
      }

      /* Rung 1.
       *
       * No `text` alongside the file. The details are already in the pixels, so
       * a caption adds nothing here — and on iOS some targets take the text and
       * drop the attachment when handed both, which would lose the very thing
       * this feature exists to send. The caption is kept for rung 3, where it is
       * the only carrier there is. */
      if (file && CAN_SHARE_FILES) {
        const outcome = await trySheet({ files: [file], title });
        if (outcome !== 'failed') {
          setStatus('idle');
          return;
        }

        /* Almost always expired activation. Arm the built card and ask for the
         * second tap — but only once: if the retry fails too, this browser is
         * refusing for some other reason and looping on "Send card" would trap
         * the agent with no way out. */
        if (!retry) {
          armed.current = file;
          setStatus('armed');
          return;
        }
      }

      /* Rung 2 — desktop only.
       *
       * Explicitly *not* a fallback for a phone whose share sheet refused:
       * silently downloading a file to a phone looks like nothing happened, and
       * the agent is left hunting through Downloads for a card they thought
       * they had sent. A phone that gets this far drops to the link instead. */
      if (file && !CAN_SHARE_FILES) {
        try {
          saveFile(file);
          flash('saved');
          return;
        } catch {
          /* Fall through to the link. */
        }
      }

      /* Rung 3 — unchanged from before branding existed. */
      if (!url) {
        flash('failed');
        return;
      }

      if (CAN_SHARE) {
        const outcome = await trySheet({ title, text, url });
        if (outcome !== 'failed') {
          setStatus('idle');
          return;
        }
      }

      try {
        await navigator.clipboard.writeText(url);
        flash('copied');
      } catch {
        /* `navigator.clipboard` is undefined outside a secure context, so this
         * is also what a plain-http LAN test hits. */
        flash('failed');
      }
    },
    [flash]
  );

  return { share, status };
}
