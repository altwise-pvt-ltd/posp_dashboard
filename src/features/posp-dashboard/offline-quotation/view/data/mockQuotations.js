/**
 * Five stand-in quotations, so the list screen can be designed and reviewed
 * before there is anything to read.
 *
 * ⚠ There is no list endpoint. `onboarding-endpoints.md` §8 documents
 * `GET /quote/catalog`, `GET /quote/metadata`, `GET /quote/lookup` and
 * `POST /quote/draft` — nothing that hands back quotes already raised. So this
 * file is the data source, and it is the only one: every component below it
 * takes its rows as props and knows nothing about where they came from.
 *
 * Replacing it is a one-function change in `hooks/useQuotationList.js`. Keep
 * the field names here as the shape to ask the backend for — `quoteNumber` and
 * `quoteId` in particular are the two distinct identifiers `quoteDraftApi.js`
 * already distinguishes (the human reference vs. the uuid the API addresses),
 * and collapsing them would repeat a confusion that file exists to prevent.
 *
 * The rows are deliberately not uniform: one draft with no premium and no
 * customer contact, one expired, one converted, a long customer name, and a
 * product with no sub-product. A list that only ever renders tidy data hides
 * exactly the cases the layout has to survive.
 */

import { QUOTE_STATUS } from '../lib/quotationStatus';

export const MOCK_QUOTATIONS = [
  {
    quoteId: '6f3b8c21-4d0a-4b1e-9a77-2c5e8f0d1a44',
    quoteNumber: 'QT-2026-000012',
    product: 'Motor',
    subProduct: 'Private Car',
    customerName: 'Rohan Deshmukh',
    customerMobile: '9822014477',
    premium: 14250,
    status: QUOTE_STATUS.QUOTED,
    createdAt: '2026-09-09T10:24:00+05:30',
    validTill: '2026-09-23T23:59:00+05:30',
  },
  {
    quoteId: 'b1c47d90-8e52-4a03-bb6f-71d9a3e2c018',
    quoteNumber: 'QT-2026-000011',
    product: 'Health',
    subProduct: 'Family Floater',
    customerName: 'Anuradha Venkataraman Iyer',
    customerMobile: '9930556612',
    premium: 28990,
    status: QUOTE_STATUS.CONVERTED,
    createdAt: '2026-09-04T16:02:00+05:30',
    validTill: '2026-09-18T23:59:00+05:30',
  },
  {
    // Saved from the wizard and never priced — no premium, no contact yet.
    quoteId: 'c8a02e13-5f77-4c8b-90d4-3ab6e5107f92',
    quoteNumber: 'QT-2026-000010',
    product: 'Motor',
    subProduct: 'Two Wheeler',
    customerName: 'Sameer Kulkarni',
    customerMobile: null,
    premium: null,
    status: QUOTE_STATUS.DRAFT,
    createdAt: '2026-09-02T09:15:00+05:30',
    validTill: null,
  },
  {
    // A line of business with nothing under it — formatProduct must not leave
    // a dangling separator.
    quoteId: '2d59f4a7-6b31-42de-8c05-9e7f1b40d6c3',
    quoteNumber: 'QT-2026-000009',
    product: 'Personal Accident',
    subProduct: null,
    customerName: 'Priya Nair',
    customerMobile: '9741230098',
    premium: 3600,
    status: QUOTE_STATUS.QUOTED,
    createdAt: '2026-08-27T13:41:00+05:30',
    validTill: '2026-09-10T23:59:00+05:30',
  },
  {
    quoteId: '9e7c1a58-30bf-4d62-a1e9-5c8042b7fd36',
    quoteNumber: 'QT-2026-000008',
    product: 'Travel',
    subProduct: 'International — Single Trip',
    customerName: 'Faisal Ahmed',
    customerMobile: '9004471123',
    premium: 7450,
    status: QUOTE_STATUS.EXPIRED,
    createdAt: '2026-08-14T11:08:00+05:30',
    validTill: '2026-08-28T23:59:00+05:30',
  },
];
