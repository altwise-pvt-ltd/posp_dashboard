/**
 * The footprint every Marketing Kit list uses.
 *
 * One card per row on a phone, three at desktop. A 16:9 card wants width — two
 * across a phone would leave each preview about 160px wide, which is not enough
 * to recognise a greeting card from.
 *
 * One constant rather than one per list, because both lists are landscape cards
 * and there is no reason for them to differ — and because `KitSkeleton` has to
 * match whichever grid it stands in for. The whole point of the skeleton is
 * that nothing moves when the data swaps in, and two constants that must stay
 * equal are two constants that can stop being equal.
 */
export const KIT_COLUMNS = 'sm:grid-cols-2 lg:grid-cols-3';
