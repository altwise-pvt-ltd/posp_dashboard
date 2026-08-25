import { VERIFICATION } from '@/shared/store/verificationStore';
import { getDb } from '@/shared/api/mockDb';

/**
 * The POSP record — `GET /posp/me`, as the app sees it.
 */

const CLEARED = /VERIFIED|APPROVED|ACTIVE|COMPLETED/;
const SENT_BACK = /REJECT/;

const normalise = (value) =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';

export function deriveVerification({ status, kycStatus, overallStatus } = {}) {
  const signals = [status, kycStatus, overallStatus].map(normalise).filter(Boolean);

  if (signals.some((signal) => SENT_BACK.test(signal))) return VERIFICATION.REJECTED;
  if (signals.some((signal) => CLEARED.test(signal))) return VERIFICATION.VERIFIED;
  return VERIFICATION.PENDING;
}

export function normalizeProfile(data = {}) {
  return {
    id: data.id ?? null,
    userId: data.userId ?? null,
    pospCode: data.pospCode ?? null,

    fullName: data.fullName ?? null,
    email: data.email ?? null,
    mobile: data.mobile ?? null,
    gender: data.gender ?? null,
    dateOfBirth: data.dateOfBirth ?? null,

    address1: data.address1 ?? null,
    address2: data.address2 ?? null,
    address3: data.address3 ?? null,
    pincode: data.pincode ?? null,
    state: data.state ?? null,
    city: data.city ?? null,

    bankName: data.bankName ?? null,
    branchName: data.branchName ?? null,
    accountType: data.accountType ?? null,
    accountNumber: data.accountNumber ?? null,
    ifscCode: data.ifscCode ?? null,

    aadhaarNumber: data.aadhaarNumber ?? null,
    pancardNumber: data.pancardNumber ?? null,

    profileImagePath: data.profileImagePath ?? null,

    rmName: data.rmName ?? null,
    rmCode: data.rmCode ?? null,
    rmMobile: data.rmMobile ?? null,
    rmEmail: data.rmEmail ?? null,

    supportName: data.supportName ?? null,
    supportMobile: data.supportMobile ?? null,
    supportEmail: data.supportEmail ?? null,

    kycStatus: data.kycStatus ?? null,
    status: data.status ?? null,

    referralCode: data.referralCode ?? null,

    verification: deriveVerification(data),
  };
}

function toApiDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value ?? '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

/** Ask the server about the POSP behind the token. */
export async function fetchPospProfile() {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const db = getDb();
  
  // Read verification status from localStorage
  const verificationStatus = localStorage.getItem('profileVerification') || 'pending';
  
  let status = 'KycPending';
  let kycStatus = 'Submitted';
  if (verificationStatus === 'verified') {
    status = 'KycApproved';
    kycStatus = 'Approved';
  } else if (verificationStatus === 'rejected') {
    status = 'KycRejected';
    kycStatus = 'Rejected';
  }

  const rawProfile = {
    id: 'mock-posp-id',
    userId: 'mock-user-id',
    pospCode: verificationStatus === 'verified' ? 'POSP-MOCK-12345' : null,
    
    fullName: db.pan?.fullName || 'John Doe',
    email: db.email?.email || 'john.doe@example.com',
    mobile: db.email?.email ? '9999999999' : '9999999999',
    gender: 'Male',
    dateOfBirth: db.pan?.dateOfBirth ? toApiDate(db.pan.dateOfBirth) : null,

    address1: db.business?.addressLine1 || null,
    address2: db.business?.addressLine2 || null,
    address3: null,
    pincode: db.business?.pincode || null,
    state: db.business?.state || null,
    city: db.business?.city || null,

    bankName: db.bank?.bankName || null,
    branchName: db.bank?.branchName || null,
    accountType: db.bank?.accountType || null,
    accountNumber: db.bank?.accountNumber || null,
    ifscCode: db.bank?.ifscCode || null,

    aadhaarNumber: db.aadhaar?.aadhaarNumber || null,
    pancardNumber: db.pan?.panNumber || null,

    profileImagePath: 'selfie_key',

    rmName: 'RM Rajesh Kumar',
    rmCode: 'RM1024',
    rmMobile: '9876543210',
    rmEmail: 'rajesh.kumar@letsinsurance.in',

    supportName: 'Lets Support Desk',
    supportMobile: '1800-123-4567',
    supportEmail: 'support@letsinsurance.in',

    kycStatus,
    status,
    referralCode: 'REF-DEMO',
  };

  return normalizeProfile(rawProfile);
}
