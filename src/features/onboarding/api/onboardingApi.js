import { getDb, updateDb, isAllStepsCompleted, getBlockingReasons } from '@/shared/api/mockDb';
import { STEPS, REVIEW_INDEX, clampIndex, toStepIndex } from '../model/steps';

/**
 * Fold the server's step list into the wizard's own.
 */
function mergeSteps(rawSteps) {
  const byNumber = new Map();
  if (Array.isArray(rawSteps)) {
    for (const step of rawSteps) {
      if (Number.isFinite(step?.stepNumber)) byNumber.set(step.stepNumber, step);
    }
  }

  return STEPS.map((step, index) => {
    const raw = byNumber.get(index + 1);
    return {
      ...step,
      index,
      number: index + 1,
      title: raw?.name ?? step.title,
      description: raw?.description ?? null,
      isCompleted: raw?.isCompleted === true,
      isCurrent: raw?.isCurrent === true,
    };
  });
}

/**
 * Which step to drop the user on.
 */
function resolveStepIndex(data, steps) {
  const current = steps.findIndex((step) => step.isCurrent);
  if (current !== -1) return current;

  const fromNumber = toStepIndex(data.nextStep) ?? toStepIndex(data.currentStep);
  if (fromNumber !== null) return fromNumber;

  const firstOpen = steps.findIndex((step) => !step.isCompleted);
  return firstOpen === -1 ? REVIEW_INDEX : firstOpen;
}

/**
 * Wire shape → app shape.
 */
export function normalizeStatus(data = {}) {
  const steps = mergeSteps(data.steps);
  const isCompleted = data.isCompleted === true;

  return {
    applicationId: data.applicationId ?? null,
    mobile: data.mobileNumber ?? null,
    status: data.status ?? null,
    overallStatus: data.overallStatus ?? null,

    isCompleted,
    isEditingAllowed: data.isEditingAllowed !== false,
    isSubmissionAllowed: data.isSubmissionAllowed === true,
    blockingReasons: Array.isArray(data.blockingReasons) ? data.blockingReasons : [],

    pospId: data.pospId ?? null,
    kycStatus: data.kycStatus ?? null,

    steps,
    completedKeys: steps.filter((step) => step.isCompleted).map((step) => step.key),
    stepIndex: isCompleted ? REVIEW_INDEX : clampIndex(resolveStepIndex(data, steps)),
  };
}

/** Ask the server where this application stands. */
export async function fetchOnboardingStatus() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const db = getDb();
  
  const steps = [
    { stepNumber: 1, name: 'PAN Details', isCompleted: !!db.pan, isCurrent: !db.pan },
    { stepNumber: 2, name: 'Email Verify', isCompleted: !!db.email?.isVerified, isCurrent: !!db.pan && !db.email?.isVerified },
    { stepNumber: 3, name: 'Aadhaar', isCompleted: !!db.aadhaar, isCurrent: !!db.email?.isVerified && !db.aadhaar },
    { stepNumber: 4, name: 'Selfie', isCompleted: !!db.selfie, isCurrent: !!db.aadhaar && !db.selfie },
    { stepNumber: 5, name: 'Bank Account', isCompleted: !!db.bank, isCurrent: !!db.selfie && !db.bank },
    { stepNumber: 6, name: 'Education', isCompleted: !!db.education, isCurrent: !!db.bank && !db.education },
    { stepNumber: 7, name: 'Business', isCompleted: !!db.business, isCurrent: !!db.education && !db.business },
    { stepNumber: 8, name: 'Review & Submit', isCompleted: db.isCompleted, isCurrent: !!db.business && !db.isCompleted }
  ];

  const rawData = {
    applicationId: 'mock-app-id',
    mobileNumber: db.email?.email ? '9999999999' : null,
    status: db.isCompleted ? 'Submitted' : 'InProgress',
    overallStatus: db.overallStatus,
    isCompleted: db.isCompleted,
    isEditingAllowed: !db.isCompleted,
    isSubmissionAllowed: isAllStepsCompleted(db),
    blockingReasons: getBlockingReasons(db),
    pospId: db.isCompleted ? 'POSP-MOCK-12345' : null,
    kycStatus: db.isCompleted ? 'Submitted' : 'Pending',
    steps,
  };

  return normalizeStatus(rawData);
}

/* ── Step 1 · PAN ──────────────────────────────────────────────────────── */

function toApiDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value ?? '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

export async function submitPanDetails({
  panNumber,
  fullName,
  dateOfBirth,
  panFrontImage,
} = {}) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const panFrontImageKey = panFrontImage ? 'pan_front_key' : null;
  updateDb({
    pan: { panNumber, fullName, dateOfBirth, panFrontImageKey },
    overallStatus: 'EMAIL_PENDING'
  });
  return { success: true };
}

/* ── Step 2 · Email ────────────────────────────────────────────────────── */

export async function sendEmailOtp(email) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const db = getDb();
  updateDb({
    email: { ...db.email, email, isVerified: false }
  });
  return { message: 'OTP sent to email', expiresInSeconds: 300 };
}

export async function verifyEmailOtp(email, otp) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (otp !== '123456' && otp !== '000000') {
    throw new Error('Invalid OTP code. Try 123456 or 000000 for testing.');
  }
  updateDb({
    email: { email, isVerified: true },
    overallStatus: 'AADHAAR_PENDING'
  });
  return { isVerified: true, email, nextStep: 3, verifiedAt: new Date().toISOString() };
}

/* ── Step 3 · Aadhaar ──────────────────────────────────────────────────── */

export async function submitAadhaarDetails({
  aadhaar,
  fullName,
  aadhaarFrontImage,
  aadhaarBackImage,
} = {}) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const aadhaarFrontImageKey = aadhaarFrontImage ? 'aadhaar_front_key' : null;
  const aadhaarBackImageKey = aadhaarBackImage ? 'aadhaar_back_key' : null;
  updateDb({
    aadhaar: { aadhaarNumber: aadhaar, fullName, aadhaarFrontImageKey, aadhaarBackImageKey },
    overallStatus: 'SELFIE_PENDING'
  });
  return { success: true };
}

/* ── Step 4 · Selfie ───────────────────────────────────────────────────── */

export async function uploadSelfie(selfieImage, { onProgress } = {}) {
  if (onProgress) {
    onProgress(20);
    await new Promise((resolve) => setTimeout(resolve, 150));
    onProgress(50);
    await new Promise((resolve) => setTimeout(resolve, 150));
    onProgress(100);
    await new Promise((resolve) => setTimeout(resolve, 100));
  } else {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  updateDb({
    selfie: { selfieKey: 'selfie_key' },
    overallStatus: 'BANK_PENDING'
  });
  return { documentKey: 'selfie_key', isCompleted: true };
}

/* ── Step 5 · Bank ────────────────────────────────────────────────────── */

/* ── Masters ───────────────────────────────────────────────────────────── */

export async function fetchAccountTypes() {
  return [
    { value: 'SAVINGS', label: 'Savings' },
    { value: 'CURRENT', label: 'Current' }
  ];
}

export async function fetchQualifications() {
  return [
    { value: 'SSC', label: 'SSC / 10th' },
    { value: 'HSC', label: 'HSC / 12th' },
    { value: 'GRADUATE', label: 'Graduate' },
    { value: 'POST_GRADUATE', label: 'Post Graduate' }
  ];
}

export async function fetchBusinessTypes() {
  return [
    { value: 'INDIVIDUAL', label: 'Individual' },
    { value: 'PROPRIETORSHIP', label: 'Proprietorship' },
    { value: 'PARTNERSHIP', label: 'Partnership' },
    { value: 'PRIVATE_LIMITED', label: 'Private Limited' }
  ];
}

/* ── Geography ─────────────────────────────────────────────────────────── */

export async function fetchStates() {
  return [
    { value: 'Maharashtra', label: 'Maharashtra' },
    { value: 'Karnataka', label: 'Karnataka' },
    { value: 'Delhi', label: 'Delhi' },
    { value: 'Tamil Nadu', label: 'Tamil Nadu' }
  ];
}

export async function fetchDistricts(state) {
  if (!state) return [];
  if (state === 'Maharashtra') {
    return [
      { value: 'Mumbai', label: 'Mumbai' },
      { value: 'Pune', label: 'Pune' },
      { value: 'Nagpur', label: 'Nagpur' }
    ];
  }
  if (state === 'Karnataka') {
    return [
      { value: 'Bengaluru', label: 'Bengaluru' },
      { value: 'Mysuru', label: 'Mysuru' }
    ];
  }
  return [
    { value: 'District 1', label: 'District 1' },
    { value: 'District 2', label: 'District 2' }
  ];
}

export async function fetchPincodeDetails(pincode) {
  if (!pincode || pincode.length !== 6) return null;
  return {
    pincode,
    state: 'Maharashtra',
    district: 'Mumbai',
    areas: ['South Mumbai', 'North Mumbai', 'East Mumbai']
  };
}

const loosely = (value) =>
  String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function matchMasterValue(saved, options) {
  const target = loosely(saved);
  if (!target) return null;
  return options.find((option) => loosely(option.value) === target)?.value ?? null;
}

export async function saveBankDetails({
  accountNumber,
  accountHolder,
  ifsc,
  bankName,
  branchName,
  accountType,
  passbookImage,
  chequeImage,
} = {}) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const passbookImageKey = passbookImage ? 'passbook_key' : null;
  const chequeImageKey = chequeImage ? 'cheque_key' : null;
  updateDb({
    bank: { accountNumber, accountHolderName: accountHolder, ifscCode: ifsc, bankName, branchName, accountType, passbookImageKey, chequeImageKey },
    overallStatus: 'EDUCATION_PENDING'
  });
  return { success: true };
}

/* ── Step 6 · Education ────────────────────────────────────────────────── */

export async function saveEducationDetails({
  highestQualification,
  institutionName,
  boardOrUniversity,
  passingYear,
  certificateImage,
} = {}) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const certificateImageKey = certificateImage ? 'certificate_key' : null;
  updateDb({
    education: { highestQualification, institutionName, boardOrUniversity, passingYear, certificateImageKey },
    overallStatus: 'BUSINESS_PENDING'
  });
  return { success: true };
}

/* ── Step 7 · Business ─────────────────────────────────────────────────── */

export async function saveBusinessDetails({
  hasBusiness,
  businessType,
  businessName,
  addressLine1,
  addressLine2,
  city,
  state,
  pincode,
  hasGst,
  gstIn,
} = {}) {
  await new Promise((resolve) => setTimeout(resolve, 550));
  const owns = Boolean(hasBusiness);
  updateDb({
    business: {
      hasBusiness: owns,
      businessType: owns ? businessType || null : null,
      businessName: owns ? businessName || null : null,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      state,
      pincode,
      hasGst: owns && Boolean(hasGst),
      gstIn: owns && hasGst ? gstIn || null : null,
    },
    overallStatus: 'REVIEW_PENDING'
  });
  return { success: true };
}

/* ── Step 8 · Review ───────────────────────────────────────────────────── */

function toDisplayDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  if (!match) return null;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export function normalizeReview(data = {}) {
  const pan = data.pan ?? {};
  const aadhaar = data.aadhaar ?? {};
  const selfie = data.selfie ?? {};
  const bank = data.bank ?? {};
  const education = data.education ?? {};
  const business = data.business ?? {};

  return {
    applicationId: data.applicationId ?? null,
    mobile: data.mobileNumber ?? null,
    overallStatus: data.overallStatus ?? null,
    isSubmissionAllowed: data.isSubmissionAllowed === true,
    isEditingAllowed: data.isEditingAllowed !== false,
    blockingReasons: Array.isArray(data.blockingReasons) ? data.blockingReasons : [],

    completion: {
      pan: pan.isCompleted === true,
      email: Boolean(data.email),
      aadhaar: aadhaar.isCompleted === true,
      selfie: selfie.isCompleted === true,
      bank: bank.isCompleted === true,
      education: education.isCompleted === true,
      business: business.isCompleted === true,
    },

    sections: {
      pan: {
        panNumber: pan.panNumber ?? '',
        fullName: pan.fullName ?? '',
        dateOfBirth: toDisplayDate(pan.dateOfBirth) ?? '',
        panFrontImageKey: pan.frontDocumentKey ?? null,
        panBackImageKey: pan.backDocumentKey ?? null,
      },

      email: { email: data.email ?? '' },

      aadhaar: {
        aadhaar: aadhaar.aadhaarNumber ?? '',
        fullName: aadhaar.fullName ?? '',
        dateOfBirth: toDisplayDate(aadhaar.dateOfBirth) ?? '',
        gender: aadhaar.gender ?? '',
        address: aadhaar.address ?? '',
        aadhaarFrontImageKey: aadhaar.frontDocumentKey ?? null,
        aadhaarBackImageKey: aadhaar.backDocumentKey ?? null,
      },

      selfie: { selfieKey: selfie.documentKey ?? null },

      bank: {
        accountType: bank.accountType ?? '',
        accountHolder: bank.accountHolderName ?? '',
        accountNumber: bank.accountNumber ?? '',
        ifsc: bank.ifscCode ?? '',
        bankName: bank.bankName ?? '',
        branchName: bank.branchName ?? '',
        passbookImageKey: bank.passbookDocumentKey ?? null,
        chequeImageKey: bank.chequeDocumentKey ?? null,
      },

      education: {
        highestQualification: education.highestQualification ?? '',
        institutionName: education.institutionName ?? '',
        boardOrUniversity: education.boardOrUniversity ?? '',
        passingYear: education.passingYear ?? '',
        certificateImageKey: education.certificateDocumentKey ?? null,
      },

      business: {
        hasBusiness:
          typeof business.hasBusiness === 'boolean'
            ? business.hasBusiness
            : Boolean(business.businessName || business.businessType),
        businessType: business.businessType ?? '',
        businessName: business.businessName ?? '',
        addressLine1: business.addressLine1 ?? '',
        addressLine2: business.addressLine2 ?? '',
        city: business.city ?? '',
        state: business.state ?? '',
        pincode: business.pincode ?? '',
        hasGst: business.hasGst === true,
        gstIn: business.gstIn ?? '',
      },
    },
  };
}

export async function fetchReviewDetails() {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const db = getDb();
  const rawData = {
    applicationId: 'mock-app-id',
    mobileNumber: '9999999999',
    overallStatus: db.overallStatus,
    isSubmissionAllowed: isAllStepsCompleted(db),
    isEditingAllowed: !db.isCompleted,
    blockingReasons: getBlockingReasons(db),
    email: db.email?.email || null,
    pan: db.pan ? {
      isCompleted: true,
      panNumber: db.pan.panNumber,
      fullName: db.pan.fullName,
      dateOfBirth: toApiDate(db.pan.dateOfBirth),
      frontDocumentKey: db.pan.panFrontImageKey,
    } : null,
    aadhaar: db.aadhaar ? {
      isCompleted: true,
      aadhaarNumber: db.aadhaar.aadhaarNumber,
      fullName: db.aadhaar.fullName,
      frontDocumentKey: db.aadhaar.aadhaarFrontImageKey,
      backDocumentKey: db.aadhaar.aadhaarBackImageKey,
    } : null,
    selfie: db.selfie ? {
      isCompleted: true,
      documentKey: db.selfie.selfieKey,
    } : null,
    bank: db.bank ? {
      isCompleted: true,
      accountType: db.bank.accountType,
      accountHolderName: db.bank.accountHolderName,
      accountNumber: db.bank.accountNumber,
      ifscCode: db.bank.ifscCode,
      bankName: db.bank.bankName,
      branchName: db.bank.branchName,
      passbookDocumentKey: db.bank.passbookImageKey,
      chequeDocumentKey: db.bank.chequeImageKey,
    } : null,
    education: db.education ? {
      isCompleted: true,
      highestQualification: db.education.highestQualification,
      institutionName: db.education.institutionName,
      boardOrUniversity: db.education.boardOrUniversity,
      passingYear: db.education.passingYear,
      certificateDocumentKey: db.education.certificateImageKey,
    } : null,
    business: db.business ? {
      isCompleted: true,
      hasBusiness: db.business.hasBusiness,
      businessType: db.business.businessType,
      businessName: db.business.businessName,
      addressLine1: db.business.addressLine1,
      addressLine2: db.business.addressLine2,
      city: db.business.city,
      state: db.business.state,
      pincode: db.business.pincode,
      hasGst: db.business.hasGst,
      gstIn: db.business.gstIn,
    } : null,
  };

  return normalizeReview(rawData);
}

export async function fetchDocumentBlob(key) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const label = key ? key.replace(/_/g, ' ') : 'Document';
  const dummySvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#f1f5f9" rx="8"/>
    <rect x="10" y="10" width="180" height="180" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4 4" rx="6"/>
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="14" fill="#64748b">${label}</text>
    <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#94a3b8">Demo File Mock</text>
  </svg>
  `;
  return new Blob([dummySvg], { type: 'image/svg+xml' });
}

export async function submitApplication() {
  await new Promise((resolve) => setTimeout(resolve, 800));
  updateDb({
    isCompleted: true,
    overallStatus: 'UNDER_VERIFICATION'
  });
  try {
    localStorage.setItem('profileVerification', 'pending');
    localStorage.removeItem('profileVerificationSeen');
  } catch {
    // ignore
  }
  return {
    applicationId: 'mock-app-id',
    pospId: 'POSP-MOCK-12345',
    reference: 'REF-MOCK-' + Math.floor(100000 + Math.random() * 900000),
    status: 'Submitted',
    message: 'Application submitted successfully',
    submittedAt: new Date().toISOString(),
  };
}
