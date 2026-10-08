import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';


const normalizeCertificate = (data = {}) => ({
  id: data.certificateId ?? null,
  pospId: data.pospId ?? null,
  insuranceTypeId: data.insuranceTypeId ?? null,

  
  issuedAt: data.issuedDate ? Date.parse(data.issuedDate) : null,
  expiresAt: data.expiryDate ? Date.parse(data.expiryDate) : null,


  fileUrl: data.certificateUrl || null,
  qrCodeUrl: data.qrCodeUrl || null,

  active: Boolean(data.isActive),
  expired: Boolean(data.isExpired),
});


export async function fetchMyCertificate() {
  try {
    const response = await api.get(ENDPOINTS.certificate.me);
    const data = unwrap(response);
    return data ? normalizeCertificate(data) : null;
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

const KIND_BY_EXTENSION = {
  pdf: 'pdf',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
};

const kindFromPath = (value) => {
  const extension = value.split(/[?#]/)[0].split('.').pop()?.toLowerCase();
  return KIND_BY_EXTENSION[extension] ?? 'pdf';
};


/* The blob document inherits the app's CSP, so no script runs inside it and a
   <base> is refused. Fitting and printing are driven from the parent instead
   (fitCertificateFrame), and relative paths are made absolute here. */
const PRINT_CSS = `
  @media print { body { zoom: 1 !important; } }
`;

function absolutizeUrls(doc, origin) {
  doc.querySelectorAll('[src], [href]').forEach((el) => {
    ['src', 'href'].forEach((attr) => {
      const value = el.getAttribute(attr);
      if (!value || value.startsWith('#') || value.startsWith('/api/')) return;
      el.setAttribute(attr, new URL(value, `${origin}/`).href);
    });
  });
}

async function prepareHtml(blob, fileUrl) {
  const origin = new URL(fileUrl, api.defaults.baseURL).origin;
  const doc = new DOMParser().parseFromString(await blob.text(), 'text/html');

  absolutizeUrls(doc, origin);

  const printStyle = doc.createElement('style');
  printStyle.textContent = PRINT_CSS;
  doc.head.append(printStyle);

  const urls = [];
  const images = [...doc.querySelectorAll('img[src^="/api/"]')];

  await Promise.allSettled(
    images.map(async (img) => {
      const response = await api.get(`${origin}${img.getAttribute('src')}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      urls.push(url);
      img.setAttribute('src', url);
    })
  );

  const html = `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
  urls.push(URL.createObjectURL(new Blob([html], { type: 'text/html' })));

  return { src: urls.at(-1), urls };
}

/**
 * Shrink the certificate sheet to the frame's width and hook up its print
 * button. Runs from the parent, since the frame's own scripts are blocked.
 */
export function fitCertificateFrame(frame) {
  const doc = frame?.contentDocument;
  const body = doc?.body;
  if (!body) return;

  body.style.zoom = '';
  let widest = 0;
  for (const el of body.children) {
    if (doc.defaultView.getComputedStyle(el).position === 'fixed') continue;
    widest = Math.max(widest, el.offsetWidth, el.scrollWidth);
  }
  body.style.zoom = String(widest ? Math.min(1, (frame.clientWidth - 16) / widest) : 1);

  doc.querySelectorAll('[onclick*="print"]').forEach((button) => {
    if (button.dataset.printWired) return;
    button.dataset.printWired = 'true';
    button.addEventListener('click', () => frame.contentWindow.print());
  });
}


export async function fetchCertificateFile(fileUrl) {
  const response = await api.get(fileUrl, { responseType: 'blob' });
  const blob = response.data;

  if (blob.type?.includes('text/html')) {
    const { src, urls } = await prepareHtml(blob, fileUrl);
    return { src, kind: 'html', revoke: () => urls.forEach((url) => URL.revokeObjectURL(url)) };
  }

  const src = URL.createObjectURL(blob);

  let kind = kindFromPath(fileUrl);
  if (blob.type?.startsWith('image/')) kind = 'image';
  else if (blob.type === 'application/pdf') kind = 'pdf';

  return { src, kind, revoke: () => URL.revokeObjectURL(src) };
}
