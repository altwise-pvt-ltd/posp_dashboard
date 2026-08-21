/**
 * One error shape for everything that can go wrong on the wire.
 *
 * Without this, every caller has to know axios: `err.response?.data?.message`
 * for a rejected request, `err.request` for a network drop, `err.message` for a
 * timeout — three different reads for what the UI treats as one thing ("tell
 * the user why it failed"). The response interceptor in `client.js` converts
 * every failure into an ApiError before it reaches a caller, so a `catch` block
 * only ever handles this class.
 *
 *   status      — HTTP status, or 0 when the request never reached the server
 *   code        — the backend's machine-readable code, when it sends one
 *                 (e.g. 'OTP_EXPIRED'); what you branch on, not the message
 *   message     — safe to show a user as-is
 *   errors      — every line the server sent in its `errors` list, unjoined,
 *                 for the rare caller that wants them one per row
 *   fieldErrors — { field: message } for 422-style validation replies, so a
 *                 form can mark the offending input instead of firing a toast
 *   retryAfter  — seconds, from a 429 or a throttled OTP resend
 */
export class ApiError extends Error {
  constructor({
    message,
    status = 0,
    code = null,
    errors = [],
    fieldErrors = null,
    retryAfter = null,
    envelopeFailure = false,
    cause = null,
  }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.fieldErrors = fieldErrors;
    this.retryAfter = retryAfter;
    this.envelopeFailure = envelopeFailure;
    this.cause = cause;
  }

  /** No response at all — offline, DNS failure, CORS block, server down. */
  get isNetwork() {
    return this.status === 0;
  }

  /** The bearer token is missing, expired or revoked. */
  get isUnauthorized() {
    return this.status === 401;
  }

  /**
   * The server understood the request and rejected the contents.
   *
   * `envelopeFailure` belongs here because the backend does not always pair
   * `success: false` with a 4xx — a wrong OTP can come back 200 with the reason
   * in `errors`. It is the same rejection wearing a status code that says
   * otherwise, and a form that puts validation messages on the field (see
   * LoginForm's `reportError`) would otherwise fire a toast for it.
   */
  get isValidation() {
    return this.status === 400 || this.status === 422 || this.envelopeFailure;
  }

  /**
   * Anything worth a retry button. 5xx is the server's problem, not the
   * payload's, so the same request may well succeed a moment later; a 4xx
   * won't, and offering a retry there just wastes the user's time.
   */
  get isRetryable() {
    return this.isNetwork || this.status >= 500;
  }

  /**
   * Build one from whatever axios threw.
   */
  static from(error) {
    // Already normalised — an interceptor that re-throws, or a manual throw.
    if (error instanceof ApiError) return error;

    const response = error?.response;

    // Never reached the server, so there is no status to report. Timeouts are
    // called out separately: "took too long" and "you're offline" prompt
    // different things from a user, and both otherwise read as a bare failure.
    if (!response) {
      const timedOut = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT';
      return new ApiError({
        message: timedOut
          ? 'The server took too long to respond. Please try again.'
          : 'Could not reach the server. Check your connection and try again.',
        status: 0,
        code: error?.code ?? null,
        cause: error,
      });
    }

    return ApiError.fromBody(response.data, response.status, {
      headers: response.headers,
      cause: error,
    });
  }

  /**
   * Build one from a body the server sent deliberately.
   *
   * Split out from `from` because a failure does not always arrive as a thrown
   * request: the backend also reports one inside a 2xx envelope, which axios
   * hands to the *success* path (see the response interceptor in `client.js`).
   * Both routes end up here, so the two are indistinguishable to a caller.
   *
   * The envelope is:
   *
   *   { success: false, message: null, data: null,
   *     errors: ['Invalid OTP. 4 attempt(s) remaining.'] }
   *
   * — the reason lives in `errors` and `message` is null, so reading `message`
   * alone costs the user the attempt count, which is the one part of the reply
   * they can act on. `message` is still read first: it is the field the
   * envelope nominates for prose, and some routes may fill it instead.
   */
  static fromBody(data, status, { headers = null, cause = null } = {}) {
    // A non-JSON error page (nginx 502, an HTML stack trace) arrives as a
    // string. Showing that to a user is worse than saying nothing, so it is
    // dropped in favour of the status-based fallback below.
    const body = data && typeof data === 'object' && !Array.isArray(data) ? data : {};

    const errors = toMessages(body.errors);

    return new ApiError({
      message:
        text(body.message) ??
        (errors.length ? errors.join(' ') : null) ??
        text(body.error) ??
        text(body.detail) ??
        statusFallback(status),
      status,
      code: body.code ?? body.errorCode ?? null,
      errors,
      // `errors` is checked last: on this backend it is a list of sentences,
      // not a field map, and an explicit map is the more specific answer when
      // both are present.
      fieldErrors: normaliseFieldErrors(body.fieldErrors ?? body.validation ?? body.errors),
      // Prefer the standard header — a proxy can throttle before the app is
      // ever reached, in which case there is no JSON body to read it from.
      retryAfter: toSeconds(headers?.['retry-after'] ?? body.retryAfter),
      // A 5xx that happens to carry the envelope is still a server fault, not
      // a rejected payload, so only a non-error status counts as one here.
      envelopeFailure: body.success === false && status < 400,
      cause,
    });
  }
}

/** A non-empty string, trimmed — or null, so it falls through a `??` chain. */
function text(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

/**
 * Flatten the `errors` list to the sentences inside it.
 *
 * Plain strings are what this backend sends; the object spellings are accepted
 * because the same key is what a validation reply would use, and picking the
 * message out of either costs one line.
 */
function toMessages(raw) {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list
    .map((item) => text(item) ?? text(item?.message) ?? text(item?.error))
    .filter(Boolean);
}

/**
 * What to say when the server rejects a request without explaining itself.
 * Deliberately vague about the cause and specific about what to do next —
 * "Something went wrong" leaves a user with no move to make.
 */
function statusFallback(status) {
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return 'That request went to an address the server does not recognise.';
  if (status === 409) return 'That conflicts with something already saved. Refresh and try again.';
  if (status === 413) return 'That file is too large to upload.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (status >= 500) return 'The server ran into a problem. Please try again shortly.';
  return 'That request could not be completed.';
}

/**
 * Flatten validation errors to { field: 'message' }, which is the shape
 * react-hook-form's `setError` wants.
 *
 * Backends disagree on this one more than any other part of an error body, so
 * the three common spellings are all accepted:
 *   { mobile: 'Already registered' }
 *   { mobile: ['Already registered', ...] }   → first message wins
 *   [{ field: 'mobile', message: '...' }]
 *
 * A list of bare strings — the `errors` this backend actually sends — names no
 * field, so it drops out here and stays in `message`/`errors` instead. That is
 * the wanted outcome, not a gap: inventing a field for it would mark an input
 * the server never blamed.
 */
function normaliseFieldErrors(raw) {
  if (!raw) return null;

  if (Array.isArray(raw)) {
    const entries = raw
      .map((item) => [item?.field ?? item?.name, item?.message ?? item?.error])
      .filter(([field, message]) => field && message);
    return entries.length ? Object.fromEntries(entries) : null;
  }

  if (typeof raw === 'object') {
    const entries = Object.entries(raw)
      .map(([field, value]) => [field, Array.isArray(value) ? value[0] : value])
      .filter(([, message]) => typeof message === 'string');
    return entries.length ? Object.fromEntries(entries) : null;
  }

  return null;
}

/**
 * `Retry-After` is either a delay in seconds or an HTTP date. Both are
 * converted to seconds-from-now so callers only ever handle a number.
 */
function toSeconds(value) {
  if (value == null) return null;

  const numeric = Number(value);
  if (Number.isFinite(numeric)) return Math.max(0, Math.round(numeric));

  const when = Date.parse(value);
  if (Number.isNaN(when)) return null;
  return Math.max(0, Math.round((when - Date.now()) / 1000));
}
