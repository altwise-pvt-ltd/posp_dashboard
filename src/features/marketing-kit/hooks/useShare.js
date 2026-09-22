import { useCallback, useEffect, useRef, useState } from 'react';
import { openWhatsApp } from '../lib/whatsapp';

/**
 * The two things an agent can do with a card: send it on WhatsApp, or save it.
 *
 * WhatsApp is the only sharing medium this module offers — a product decision,
 * not a technical one. What *is* technical is that WhatsApp cannot be addressed
 * directly with a file: `wa.me` carries text only, and the OS share sheet is
 * the one route that puts an image into a WhatsApp thread. So "send on
 * WhatsApp" means the sheet on a phone, where WhatsApp is the target the agent
 * picks, and the wa.me link everywhere a file cannot travel:
 *
 *   1. The artefact itself through the share sheet — a phone. A banner goes as
 *      a branded image, a brochure as its PDF, and a banner with no profile
 *      loaded as the unsigned artwork. The customer receives the thing, not a
 *      pointer to it.
 *   2. wa.me with the caption and a link — the last resort, and only reached
 *      when no file could be produced at all: the uploads host unreachable, or
 *      a browser that will not take this file's type in a sheet. Every case
 *      that used to land here on purpose now builds a file instead.
 *
 * Saving is the separate action beside it, and the *only* one on desktop: a web
 * page cannot hand a file to another web page — WhatsApp Web is a tab, not an
 * app the OS can share into — so the card reaches it through the filesystem,
 * downloaded and attached by hand.
 */

/** A share sheet of any kind. Page-lifetime constant, hence module scope. */
const CAN_SHARE = typeof navigator !== 'undefined' && Boolean(navigator.share);

/**
 * Can this browser put a file into the share sheet?
 *
 * Probed once with a real one-byte `File`, because `navigator.canShare` answers
 * per payload and not per capability: `canShare({ url })` is true on desktop
 * Chrome, which cannot take files at all. Asking it the actual question is the
 * only honest test, and the answer cannot change for the life of the page.
 *
 * This is also what decides which buttons a card shows — see `CardActions`.
 */
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
 * Is this a phone?
 *
 * Asked *in addition to* `CAN_SHARE_FILES`, because that probe answers a
 * different question than the one the buttons need. Chrome and Edge on Windows
 * do support sharing files — they open the Windows share sheet — so the probe
 * is true on a desktop, and gating on it alone put a WhatsApp button on desktop
 * where the sheet lists Windows apps and not the browser tab the agent actually
 * has WhatsApp open in. Desktop gets one button by decision: Download.
 *
 * `userAgentData.mobile` where it exists — Chromium reports it honestly and it
 * survives the UA-string freeze. The regex is for Safari and Firefox, which
 * ship no `userAgentData` at all; `iPad` is listed even though modern iPadOS
 * claims to be a Mac, because when it does the share sheet still works and a
 * false negative there only costs a button we can live without.
 */
export const IS_MOBILE = (() => {
  if (typeof navigator === 'undefined') return false;
  if (typeof navigator.userAgentData?.mobile === 'boolean') return navigator.userAgentData.mobile;
  return /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(navigator.userAgent || '');
})();

/**
 * `navigator.share`, reduced to the outcomes the caller acts on, never throwing.
 *
 * A cancel is a user saying no, not a fault — that distinction is the whole
 * reason this exists, because the two arrive as the same rejected promise.
 */
async function trySheet(payload) {
  try {
    await navigator.share(payload);
    return 'done';
  } catch (err) {
    return err?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

/** Object URLs pin the blob in memory until revoked — hence the timer. */
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

/**
 * Which button the status belongs to, and what it is — one object, because a
 * status rendered against the wrong button is worse than showing none.
 */
const IDLE = { action: null, status: 'idle' };

export function useShare() {
  const [state, setState] = useState(IDLE);
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
   * the sheet is reached with nothing to await in between. The button says
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

  const flash = useCallback((action, status) => {
    setState({ action, status });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState(IDLE), 2000);
  }, []);

  const settle = useCallback(() => {
    clearTimeout(timer.current);
    setState(IDLE);
  }, []);

  /**
   * Send on WhatsApp.
   *
   * `prepareFile` is an async factory rather than a ready-made file: building
   * one means downloading ~3 MB of artwork and drawing it, and doing that for
   * every card in a category on mount would be far more expensive than the grid
   * it is decorating. It runs on the tap, for the one card tapped.
   */
  const share = useCallback(
    async ({ title, text, url, prepareFile }) => {
      /* The last resort, in one place because all three ways of reaching it end
       * the same: open WhatsApp on the caption and link, and report a failure if
       * even that will not open. */
      const sendLink = () => {
        if (openWhatsApp({ text, url })) settle();
        else flash('whatsapp', 'failed');
      };

      /* No file to build — a card whose artwork never arrived. Nothing is
       * awaited on the way here, which matters: anything that runs first, even
       * an already-resolved promise, spends the tap's activation and the popup
       * blocker eats the tab.
       *
       * There is no `CAN_SHARE_FILES` check beside it. `CardActions` only
       * renders this button where the sheet can take a file, so a device that
       * cannot share one never reaches this function with a file to share. */
      if (!prepareFile) {
        sendLink();
        return;
      }

      /* A card left over from a tap whose activation ran out. Taken rather than
       * rebuilt — that is the whole point — and cleared first, so a failure on
       * this attempt cannot leave a stale one armed. */
      const retry = Boolean(armed.current);
      let file = armed.current;
      armed.current = null;

      if (!file) {
        setState({ action: 'whatsapp', status: 'preparing' });
        try {
          file = await prepareFile();
        } catch (err) {
          /* Every route to a file is exhausted by the time this runs — the card
           * factories fall back to fetching the raw bytes before they throw —
           * so this really is the last resort rather than a shortcut past a
           * canvas that misbehaved. Logged because a throw here means the
           * uploads host is unreachable, which is worth seeing in a bug report.
           *
           * This open *is* past an await, so it can be blocked. Nothing can be
           * done about that from here — the file had to be attempted first —
           * and a blocked tab at least reports itself instead of going quiet. */
          console.warn('[useShare] no file could be produced, sending the link instead', err);
          sendLink();
          return;
        }
      }

      /* Asked again, of this file rather than of the probe. `CAN_SHARE_FILES`
       * answers for a JPEG, and a browser that takes an image is not obliged to
       * take the brochure's PDF — handing it one it will not accept rejects
       * with the same `NotAllowedError` as expired activation, which would arm
       * a "Send card" that could never succeed. */
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        sendLink();
        return;
      }

      /* No `text` alongside the file. The details are already in the pixels, so
       * a caption adds nothing here — and on iOS some targets take the text and
       * drop the attachment when handed both, which would lose the very thing
       * this feature exists to send. The caption is kept for the link path,
       * where it is the only carrier there is. */
      const outcome = await trySheet({ files: [file], title });
      if (outcome !== 'failed') {
        settle();
        return;
      }

      /* Almost always expired activation. Arm the built card and ask for the
       * second tap — but only once: if the retry fails too, this browser is
       * refusing for some other reason and looping on "Send card" would trap
       * the agent with no way out. The Download button beside it is that way
       * out, which is why this stops at a plain failure rather than inventing
       * another rung. */
      if (!retry) {
        armed.current = file;
        setState({ action: 'whatsapp', status: 'armed' });
        return;
      }

      flash('whatsapp', 'failed');
    },
    [flash, settle]
  );

  /**
   * Save the branded card.
   *
   * The same file the share sheet would have taken, so what lands in Downloads
   * is what a customer would have received — signature and all — and attaching
   * it by hand in WhatsApp Web costs the card none of its branding.
   */
  const download = useCallback(
    async ({ prepareFile }) => {
      if (!prepareFile) return;

      setState({ action: 'download', status: 'preparing' });
      try {
        const file = await prepareFile();
        saveFile(file);
        flash('download', 'saved');
      } catch (err) {
        /* Nothing to fall back to: this action *is* the file. Quietly sending a
         * link instead would be a different action than the one asked for. */
        console.warn('[useShare] could not build the card to save', err);
        flash('download', 'failed');
      }
    },
    [flash]
  );

  return { share, download, action: state.action, status: state.status };
}
