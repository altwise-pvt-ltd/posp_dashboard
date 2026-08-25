const DB_KEY = 'posp_demo_onboarding_db';

const DEFAULT_DB = {
  pan: null,
  email: null,
  aadhaar: null,
  selfie: null,
  bank: null,
  education: null,
  business: null,
  isCompleted: false,
  status: 'InProgress',
  overallStatus: 'PAN_PENDING',
};

export function getDb() {
  if (typeof window === 'undefined') return DEFAULT_DB;
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) {
      window.localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
      return DEFAULT_DB;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DB;
  }
}

export function updateDb(updates) {
  if (typeof window === 'undefined') return DEFAULT_DB;
  try {
    const db = getDb();
    const newDb = { ...db, ...updates };
    window.localStorage.setItem(DB_KEY, JSON.stringify(newDb));
    return newDb;
  } catch {
    return DEFAULT_DB;
  }
}

export function resetDb() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
  } catch {
    // ignore
  }
}

export function isStepCompleted(db, stepKey) {
  switch (stepKey) {
    case 'pan':
      return !!db.pan;
    case 'email':
      return !!db.email && db.email.isVerified === true;
    case 'aadhaar':
      return !!db.aadhaar;
    case 'selfie':
      return !!db.selfie;
    case 'bank':
      return !!db.bank;
    case 'education':
      return !!db.education;
    case 'business':
      return !!db.business;
    default:
      return false;
  }
}

export function isAllStepsCompleted(db) {
  return (
    isStepCompleted(db, 'pan') &&
    isStepCompleted(db, 'email') &&
    isStepCompleted(db, 'aadhaar') &&
    isStepCompleted(db, 'selfie') &&
    isStepCompleted(db, 'bank') &&
    isStepCompleted(db, 'education') &&
    isStepCompleted(db, 'business')
  );
}

export function getBlockingReasons(db) {
  const reasons = [];
  if (!isStepCompleted(db, 'pan')) reasons.push('PAN details are missing or incomplete.');
  if (!isStepCompleted(db, 'email')) reasons.push('Email address is not verified.');
  if (!isStepCompleted(db, 'aadhaar')) reasons.push('Aadhaar details are missing or incomplete.');
  if (!isStepCompleted(db, 'selfie')) reasons.push('Selfie photograph has not been uploaded.');
  if (!isStepCompleted(db, 'bank')) reasons.push('Bank account details or documents are incomplete.');
  if (!isStepCompleted(db, 'education')) reasons.push('Education qualification details or certificate are missing.');
  if (!isStepCompleted(db, 'business')) reasons.push('Business and communication address details are incomplete.');
  return reasons;
}
