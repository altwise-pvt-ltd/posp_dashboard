import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Check, Copy, ExternalLink, Landmark, Link2, TriangleAlert } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';
import { PAYMENT_METHODS } from '../api/paymentInstructionApi';
import QuoteDrawer from './QuoteDrawer';

/** Paise are kept when present — this is the exact sum to pay. */
const AMOUNT = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatAmount = (value) => (Number.isFinite(value) ? AMOUNT.format(value) : '—');

const formatDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const METHOD_LABEL = {
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Bank transfer',
  [PAYMENT_METHODS.PAYMENT_LINK]: 'Payment link',
};

/** `UpiTransfer` → "Upi transfer", for a method this file doesn't name yet. */
const methodLabel = (method) =>
  METHOD_LABEL[method] ??
  (method
    ? method
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/^./, (c) => c.toUpperCase())
        .replace(/ (\S)/g, (_, c) => ` ${c.toLowerCase()}`)
    : 'Payment');

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Fallback for browsers or contexts without the async clipboard API.
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

/** Tracks which value was copied last, cleared after a moment. */
function useCopied() {
  const [copied, setCopied] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async (key, value) => {
    if (!value) return;
    const ok = await copyText(value);
    if (!ok) return;

    setCopied(key);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1800);
  };

  return { copied, copy };
}

function CopyIconButton({ label, done, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={done ? `${label} copied` : `Copy ${label}`}
      title={done ? 'Copied' : 'Copy'}
      className={`shrink-0 rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
        done ? 'bg-orange-50 text-orange-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      {done ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
    </button>
  );
}

function Label({ children }) {
  return (
    <p className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">
      {children}
    </p>
  );
}

function DetailRow({ label, value, mono = false, copyKey, copied, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <Label>{label}</Label>
        <p
          className={`mt-0.5 break-words text-on-surface ${
            mono ? 'font-data-mono text-body-lg font-semibold' : 'font-body-lg text-body-lg'
          }`}
        >
          {value}
        </p>
      </div>
      {copyKey && (
        <CopyIconButton
          label={label.toLowerCase()}
          done={copied === copyKey}
          onClick={() => onCopy(copyKey, value)}
        />
      )}
    </div>
  );
}

/** Plain-text version of the instruction, for copying or sharing with the customer. */
const shareText = (instruction, reference) => {
  const { bank } = instruction;
  const lines = [`Payment details${reference ? ` for ${reference}` : ''}`];

  lines.push(`Amount: ${formatAmount(instruction.amount)}`);

  if (bank.accountName) lines.push(`Account name: ${bank.accountName}`);
  if (bank.bankName) lines.push(`Bank: ${bank.bankName}`);
  if (bank.accountNumber) lines.push(`Account number: ${bank.accountNumber}`);
  if (bank.ifscCode) lines.push(`IFSC: ${bank.ifscCode}`);
  if (bank.branch) lines.push(`Branch: ${bank.branch}`);

  if (instruction.paymentLink) {
    lines.push(`Payment link: ${instruction.paymentLink}`);
    const expires = formatDateTime(instruction.linkExpiresAt);
    if (expires) lines.push(`Link valid until: ${expires}`);
  }

  return lines.join('\n');
};

function DrawerContent({ instruction, reference, onClose, onMarkPayment }) {
  const { copied, copy } = useCopied();

  // Read once when the drawer opens, for the link expiry check.
  const [openedAt] = useState(() => Date.now());

  const { bank, method } = instruction;
  const MethodIcon = method === PAYMENT_METHODS.PAYMENT_LINK ? Link2 : Landmark;

  const bankRows = [
    { key: 'accountName', label: 'Account name', value: bank.accountName, copy: true },
    { key: 'bankName', label: 'Bank', value: bank.bankName },
    { key: 'accountNumber', label: 'Account number', value: bank.accountNumber, mono: true, copy: true },
    { key: 'ifscCode', label: 'IFSC code', value: bank.ifscCode, mono: true, copy: true },
    { key: 'branch', label: 'Branch', value: bank.branch },
  ].filter((row) => row.value);

  const expiresAt = instruction.linkExpiresAt ? new Date(instruction.linkExpiresAt) : null;
  const expiryValid = expiresAt && !Number.isNaN(expiresAt.getTime());
  const linkExpired = expiryValid && expiresAt.getTime() < openedAt;

  const published = formatDateTime(instruction.publishedAt);
  const details = shareText(instruction, reference);

  return (
    <QuoteDrawer
      title="Payment instruction"
      reference={reference}
      onClose={onClose}
      labelId="payment-instruction-title"
      footer={
        <>
          <CustomButton
            variant="secondary"
            size="md"
            fullWidth
            leftIcon={copied === 'all' ? <Check /> : <Copy />}
            onClick={() => copy('all', details)}
          >
            {copied === 'all' ? 'Copied' : 'Copy all details'}
          </CustomButton>
          <CustomButton variant="primary" size="md" fullWidth onClick={onMarkPayment}>
            Mark Payment
          </CustomButton>
        </>
      }
    >
    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-gutter">
      <div className="rounded-xl border border-gray-200 bg-surface-dim/40 p-3.5">
        <div className="flex items-start justify-between gap-3">
          <Label>Amount payable</Label>
          <span className="font-body-md text-body-md inline-flex items-center gap-1.5 text-on-surface-variant">
            <MethodIcon aria-hidden="true" className="size-4" />
            {methodLabel(method)}
          </span>
        </div>
        <p className="font-data-currency text-headline-lg mt-0.5 text-on-surface">
          {formatAmount(instruction.amount)}
        </p>
        {published && (
          <p className="font-body-md text-body-md text-on-surface-variant">
            Shared by your RM on {published}
          </p>
        )}
      </div>

      {bankRows.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="font-body-lg text-body-lg mb-3 font-semibold text-on-surface">
            Bank account details
          </h3>
          <div className="divide-y divide-slate-100">
            {bankRows.map((row) => (
              <DetailRow
                key={row.key}
                label={row.label}
                value={row.value}
                mono={row.mono}
                copyKey={row.copy ? row.key : null}
                copied={copied}
                onCopy={copy}
              />
            ))}
          </div>
        </section>
      )}

      {instruction.paymentLink && (
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="font-body-lg text-body-lg mb-3 font-semibold text-on-surface">
            Payment link
          </h3>

          <div className="flex items-start justify-between gap-2 rounded-lg bg-well px-3 py-2">
            <p className="font-data-mono text-data-mono min-w-0 break-all text-on-surface">
              {instruction.paymentLink}
            </p>
            <CopyIconButton
              label="payment link"
              done={copied === 'paymentLink'}
              onClick={() => copy('paymentLink', instruction.paymentLink)}
            />
          </div>

          {expiryValid &&
            (linkExpired ? (
              <p className="font-body-md text-body-md mt-3 flex items-start gap-2 rounded-lg border border-warning-outline bg-warning-container px-3 py-2 text-on-warning-container">
                <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                This link expired on {formatDateTime(instruction.linkExpiresAt)}. Ask your RM to
                share a new one.
              </p>
            ) : (
              <p className="font-body-md text-body-md mt-2 text-on-surface-variant">
                Valid until {formatDateTime(instruction.linkExpiresAt)}
              </p>
            ))}

          <a
            href={instruction.paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body-md text-body-md mt-3 inline-flex items-center gap-1.5 rounded-lg font-medium text-orange-700 transition-colors hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
          >
            <ExternalLink aria-hidden="true" className="size-4" />
            Open payment link
          </a>
        </section>
      )}

      {instruction.notes && (
        <div>
          <Label>Note from your RM</Label>
          <p className="font-body-md text-body-md mt-1 whitespace-pre-line rounded-lg bg-well px-3 py-2 text-on-surface">
            {instruction.notes}
          </p>
        </div>
      )}
    </div>
    </QuoteDrawer>
  );
}

function PaymentInstructionDrawer({ open, instruction, reference, onClose, onMarkPayment }) {
  return (
    <AnimatePresence>
      {open && instruction && (
        <DrawerContent
          instruction={instruction}
          reference={reference}
          onClose={onClose}
          onMarkPayment={onMarkPayment}
        />
      )}
    </AnimatePresence>
  );
}

export default PaymentInstructionDrawer;
