// A bare domain with an optional port and path, e.g. "rzp.io/l/abc" or "www.payu.in".
const BARE_DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#]|$)/i;

const parse = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
};

// Returns the URL only if it is an http(s) web address; a bare domain gets https://. Anything else gives null.
export const webLink = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return parse(trimmed) ?? (BARE_DOMAIN.test(trimmed) ? parse(`https://${trimmed}`) : null);
};
