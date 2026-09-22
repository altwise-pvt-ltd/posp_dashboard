/**
 * Stand-in policies, so the book of business can be designed and reviewed
 * before there is anything to read.
 *
 * ⚠ There is no policy endpoint. `onboarding-endpoints.md` documents the
 * onboarding, quote and certificate services; nothing hands back policies
 * already issued. So this file is the data source, and it is the only one:
 * every component takes its rows as props and knows nothing about where they
 * came from.
 *
 * Replacing it is a one-function change in `hooks/usePolicyList.js`. Keep the
 * fields `build` produces as the shape to ask the backend for. In particular
 * `policyId` and `policyNumber` are two distinct identifiers — the uuid an API
 * is addressed with and the human reference printed on the document — the same
 * split `quoteDraftApi.js` already maintains for quotes. Collapsing them is the
 * confusion that split exists to prevent.
 *
 * ── Why the dates are computed, when mockQuotations hardcodes its own ───────
 *
 * This module has two features that list does not: "expiring soon", derived
 * from `endDate` against today, and a twelve-month premium trend keyed on
 * `issuedAt`. Hardcoded dates would mean both demo correctly this week and
 * silently show nothing next month — the module's two most load-bearing
 * behaviours rotting into empty states that look deliberate. So every row is
 * anchored to now, and the fixture keeps proving the logic on any day it is
 * opened.
 *
 * ── Why a row declares a term, not two dates ───────────────────────────────
 *
 * `issuedAt`, `startDate` and `endDate` are not three independent facts: cover
 * runs for a term from the day it is written. Hand-setting all three is how a
 * fixture ends up with a policy that expires before it starts. So a row gives
 * the day it was written and a term in days, and the dates derive.
 *
 * The worklist and the trend then fall out of one honest number and cannot
 * contradict each other: the rows written eleven months ago are exactly the
 * rows now coming up for renewal.
 *
 * ── Why the month is declared, not counted back in days ───────────────────
 *
 * Because counting in days does not survive contact with a calendar. The first
 * version of this file placed rows with day offsets — `-172` meant "about six
 * months ago" — and the arithmetic drifted: `-172` is April, not March, so the
 * comments grouping the rows into months were quietly wrong and the month the
 * fixture claimed was quiet had two policies in it. `monthsAgo(6, 14)` cannot
 * drift, and the grouping comments below are checkable against it.
 */

import { POLICY_STATUS } from '../lib/policyStatus';

const DAY = 86_400_000;

/** Midday, so a row is never pushed across a date boundary by the local clock. */
const noon = (date) => {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d;
};

/**
 * The same day-of-month, `m` months back. Days are kept at 28 or below so no
 * row rolls into the following month in February.
 */
const monthsAgo = (m, day) => {
  const now = new Date();
  return noon(new Date(now.getFullYear(), now.getMonth() - m, day));
};

/** Exactly `n` days back — for the rows whose expiry has to land on a known day. */
const daysAgo = (n) => noon(new Date(Date.now() - n * DAY));

/**
 * One row's declared fields into the record the app reads.
 *
 * `term: null` means no end date was recorded — an open-ended cover. The list,
 * the expiry filter and the sort each have to survive it, so one row carries it.
 */
const build = ({
  id,
  num,
  product,
  sub = null,
  insurer,
  name,
  mobile = null,
  si,
  premium,
  status = POLICY_STATUS.ACTIVE,
  on,
  term = 365,
}) => ({
  policyId: id,
  policyNumber: num,
  product,
  subProduct: sub,
  insurer,
  customerName: name,
  customerMobile: mobile,
  sumInsured: si,
  premium,
  status,
  issuedAt: on.toISOString(),
  startDate: on.toISOString(),
  endDate: term === null ? null : new Date(on.getTime() + term * DAY).toISOString(),
});

/**
 * Twenty-six rows, shaping two things at once.
 *
 * `on` drives the trend: one to three a month across the last twelve, with
 * month 6 a deliberate peak and **month 5 deliberately empty** — a month in
 * which nothing was written is the case the chart has to draw as a labelled
 * zero rather than a missing column, and a fixture where every month has
 * business never exercises it. The current month is partial, because a month
 * in progress is.
 *
 * `on + term` drives the renewal worklist, and needs no separate tuning: the
 * rows written eleven and twelve months back are the ones now coming due.
 *
 * The rows are deliberately not uniform: one expiring today and one tomorrow
 * (the two labels with their own wording), one with no end date at all, one
 * with no mobile, two with no sub-product, an over-long name, and three out of
 * force for three different reasons. A list that only ever renders tidy data
 * hides exactly the cases the layout has to survive.
 */
const ROWS = [
  // ── This month — partial, as a month in progress should be ──
  { id: 'a41d7e02-93c5-4f18-8b6a-1e0c7d4f9b23', num: 'POL-2026-000412', product: 'Motor',  sub: 'Private Car',    insurer: 'HDFC ERGO',    name: 'Rohan Deshmukh', mobile: '9822014477', si: 820000,  premium: 14250, on: monthsAgo(0, 4) },
  { id: 'c7b90a34-5d61-4e2f-9a08-3f5b1c8d6e47', num: 'POL-2026-000418', product: 'Health', sub: 'Family Floater', insurer: 'Star Health',  name: 'Kavita Menon',   mobile: '9930556612', si: 1000000, premium: 24400, on: monthsAgo(0, 17) },

  // ── 1 month back. The first row has no contact on file, so the table and
  //    card must drop that line rather than render an empty one that makes the
  //    row taller. The third has a line of business with nothing under it, so
  //    `formatProduct` must not leave a dangling separator.
  { id: '18e4f6b7-2a09-4c53-b7d1-6e9024af35c8', num: 'POL-2026-000389', product: 'Motor',  sub: 'Two Wheeler',    insurer: 'ICICI Lombard', name: 'Sameer Kulkarni', si: 74000,  premium: 1980,  on: monthsAgo(1, 6) },
  { id: '5d2c8f91-7b40-4a6e-8c13-9f07b2e5d184', num: 'POL-2026-000397', product: 'Health', sub: 'Individual',     insurer: 'Niva Bupa',     name: 'Arjun Pillai',   mobile: '9004471123', si: 500000, premium: 11400, on: monthsAgo(1, 19) },
  { id: '9a6b3c07-1e58-42d9-b04f-7c8e5109fa62', num: 'POL-2026-000401', product: 'Personal Accident',            insurer: 'Bajaj Allianz', name: 'Priya Nair',     mobile: '9741230098', si: 1500000, premium: 3600, on: monthsAgo(1, 27) },

  // ── 2 back. The travel cover is open-ended — no end date recorded — so
  //    `isExpiringSoon` must return false rather than throw, and the expiry
  //    sort must park it last rather than at the epoch.
  { id: '3f81d5a6-4c72-4b90-a6e3-2d15f7c08b49', num: 'POL-2026-000361', product: 'Motor',  sub: 'Private Car',    insurer: 'TATA AIG', name: 'Deepak Sharma',  mobile: '9845120076', si: 690000,  premium: 13100, on: monthsAgo(2, 9) },
  { id: 'd6402b18-9c37-4ea5-b812-70fc95a3e2d1', num: 'POL-2026-000372', product: 'Travel', sub: 'International — Single Trip', insurer: 'TATA AIG', name: 'Meera Krishnan', mobile: '9845120076', si: 4200000, premium: 7450, on: monthsAgo(2, 23), term: null },

  // ── 3 back ──
  { id: '7c1e93af-04d8-4b26-95f0-1a83e6c7b502', num: 'POL-2026-000334', product: 'Health', sub: 'Family Floater', insurer: 'Care Health',      name: 'Sunita Raghavan', mobile: '9711268840', si: 900000,  premium: 26800, on: monthsAgo(3, 5) },
  { id: 'b28f5c74-6a19-4d03-8e57-c41b90d2f6a3', num: 'POL-2026-000345', product: 'Motor',  sub: 'Commercial Vehicle', insurer: 'Reliance General', name: 'Imran Qureshi', mobile: '9820337715', si: 1450000, premium: 31200, on: monthsAgo(3, 21) },

  // ── 4 back ──
  { id: 'e5a071d9-38b4-42fc-a06e-95d7c318b4f2', num: 'POL-2026-000309', product: 'Life',   sub: 'Term',           insurer: 'HDFC Life',     name: 'Joseph Mathew', mobile: '9663401182', si: 10000000, premium: 18600, on: monthsAgo(4, 12) },
  { id: '4b96d2e8-7f50-41a7-b3c9-08e5147a9d61', num: 'POL-2026-000318', product: 'Motor',  sub: 'Two Wheeler',    insurer: 'ICICI Lombard', name: 'Nikhil Bose',   mobile: '9836004512', si: 68000,    premium: 2140,  on: monthsAgo(4, 26) },

  // ── 5 back — deliberately empty. This is the zero-height bar: the chart has
  //    to draw a labelled month with nothing in it, and the only way that path
  //    is ever exercised is for the fixture to contain such a month. ──

  // ── 6 back — the peak: three policies and the two largest premiums. The
  //    first carries the over-long name, which must not push the table's other
  //    columns around.
  { id: 'f2385a90-51c6-4e7b-8d04-3b9e6a1c7f58', num: 'POL-2026-000241', product: 'Health', sub: 'Family Floater', insurer: 'Niva Bupa',      name: 'Anuradha Venkataraman Iyer', mobile: '9930556612', si: 1500000, premium: 42600, on: monthsAgo(6, 3) },
  { id: '6e19b7d4-c802-45a3-91f7-2d64085be3c1', num: 'POL-2026-000252', product: 'Life',   sub: 'Term',           insurer: 'ICICI Pru Life', name: 'Gaurav Malhotra', mobile: '9769118834', si: 15000000, premium: 34800, on: monthsAgo(6, 14) },
  { id: '8a50c3f6-1d47-4926-b58e-0f7c42a9e6b3', num: 'POL-2026-000263', product: 'Motor',  sub: 'Private Car',    insurer: 'HDFC ERGO',      name: 'Lakshmi Iyer',    mobile: '9741556230', si: 540000,   premium: 10900, on: monthsAgo(6, 25) },

  // ── 7 back ──
  { id: '1c8e6047-93a5-4b1d-8f26-57d0c9b3e482', num: 'POL-2026-000198', product: 'Motor',  sub: 'Private Car',    insurer: 'Bajaj Allianz', name: 'Harpreet Singh', mobile: '9878452019', si: 730000, premium: 15600, on: monthsAgo(7, 17) },

  // ── 8 back ──
  { id: '9f43b5c1-2e78-40d6-a95b-83c17e0d4a69', num: 'POL-2026-000154', product: 'Health', sub: 'Individual',     insurer: 'Care Health', name: 'Tanvi Shah',    mobile: '9925117744', si: 600000,  premium: 12750, on: monthsAgo(8, 8) },
  { id: '2b7d90e5-4c13-4f8a-b026-91e5a7c48d30', num: 'POL-2026-000167', product: 'Personal Accident',            insurer: 'TATA AIG',    name: 'Suresh Pillai', mobile: '9847002211', si: 2000000, premium: 4200,  on: monthsAgo(8, 22) },

  // ── 9 back ──
  { id: '5e0a28c7-b641-49f3-8d15-7a92c604fb18', num: 'POL-2025-001098', product: 'Motor',  sub: 'Two Wheeler',    insurer: 'Reliance General', name: 'Vikram Rathore', mobile: '9820337715', si: 82000, premium: 2380, on: monthsAgo(9, 11) },

  // ── 10 back ──
  { id: 'c3961f42-08d5-4a7e-b6c8-2f0794e15da6', num: 'POL-2025-001041', product: 'Health', sub: 'Family Floater', insurer: 'Star Health', name: 'Shalini Gupta', mobile: '9711268840', si: 700000, premium: 22150, on: monthsAgo(10, 19) },

  // ── 11 back — a year on, these two are the renewals now inside the window ──
  { id: '7d2c85b0-6e39-4154-9af7-c81b0329e64d', num: 'POL-2025-000987', product: 'Motor',  sub: 'Private Car', insurer: 'HDFC ERGO', name: 'Farhan Ahmed',      mobile: '9004471123', si: 610000, premium: 12400, on: monthsAgo(11, 6) },
  { id: 'a08e17d3-95c4-4b62-8e01-3d76f2a5c9b4', num: 'POL-2025-000995', product: 'Health', sub: 'Individual',  insurer: 'Niva Bupa', name: 'Divya Ranganathan', mobile: '9663401182', si: 450000, premium: 10800, on: monthsAgo(11, 18) },

  // ── Just outside the trend window, and the two most urgent rows in the book.
  //    Placed in days rather than months because their expiry has to land on a
  //    known day: a 365-day term written exactly 365 and 364 days ago ends
  //    today and tomorrow. They prove the two special wordings, and that the
  //    chart's twelve-month window and the renewal worklist are separate
  //    questions — a policy can be the most pressing thing you own and still
  //    belong to no bar on the chart.
  { id: 'b41f7e29-3c06-48d5-9b7a-51e8d0c26fa7', num: 'POL-2025-000941', product: 'Motor',  sub: 'Private Car',    insurer: 'ICICI Lombard', name: 'Rakesh Chandran', mobile: '9846127700', si: 580000, premium: 11900, on: daysAgo(365) },
  { id: 'e97b06a5-4d18-42e7-a0c3-96b5f81d4037', num: 'POL-2025-000948', product: 'Health', sub: 'Family Floater', insurer: 'Care Health',   name: 'Nandini Rao',     mobile: '9892217705', si: 800000, premium: 23400, on: daysAgo(364) },

  // ── Out of force, three different reasons, all written more than a year ago
  //    — so they sit in the list but outside the trend window. The lapsed one
  //    is the only out-of-force state worth a phone call, which is why the
  //    status table gives it rose and cancelled a neutral grey.
  { id: '3a6d51c8-0b97-4e24-85f1-c7092b4ed638', num: 'POL-2024-000772', product: 'Motor',  sub: 'Private Car', insurer: 'Reliance General', name: 'Mahesh Naidu',        mobile: '9880443316', si: 640000,  premium: 12800, status: POLICY_STATUS.EXPIRED,   on: monthsAgo(14, 12) },
  { id: 'd85c2907-6f43-41b8-9e05-2a7c3d10b6e9', num: 'POL-2024-000689', product: 'Life',   sub: 'Term',        insurer: 'HDFC Life',        name: 'Ananya Bhattacharya', mobile: '9836004512', si: 8000000, premium: 16400, status: POLICY_STATUS.LAPSED,    on: monthsAgo(17, 5) },
  { id: '6f0b4a13-c72e-4d59-8036-b1e94578c2a0', num: 'POL-2024-000603', product: 'Health', sub: 'Individual',  insurer: 'Star Health',      name: 'Rajesh Kumar',        mobile: '9925117744', si: 350000,  premium: 8900,  status: POLICY_STATUS.CANCELLED, on: monthsAgo(20, 22) },
];

export const MOCK_POLICIES = ROWS.map(build);
