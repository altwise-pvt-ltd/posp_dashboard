import PolicyCard from './PolicyCard';
import PolicyTable from './PolicyTable';

/**
 * Picks the layout for the viewport: cards below `md`, the table from `md` up.
 *
 * Both are rendered and one is hidden with a utility, rather than switching on
 * a matchMedia hook. The breakpoint then lives in the same place as every other
 * one in the app, resizing the window never hits a frame with neither layout
 * mounted, and there is no client-only branch to get wrong. Same reasoning as
 * `QuotationList`, and deliberately the same breakpoint — two record lists in
 * one dashboard that reflowed at different widths would read as a bug.
 *
 * The cost is that each row's text is in the DOM twice. That stays cheap
 * because what arrives here is one page of rows, not the whole book — see
 * `PAGE_SIZE` in `usePolicyList` and the pager in `PolicyPagination`.
 *
 * The scroll behaviour differs between the two on purpose. The table clips to
 * its own box with a sticky header (`PolicyTable`); the cards keep scrolling
 * the page. A phone has no room to spend on a nested scroller, the cards carry
 * their own labels so nothing goes missing off the top, and two scrollable
 * areas under one thumb is the pattern that traps the gesture in the wrong one.
 */
function PolicyList({ policies, now, onSelect }) {
  return (
    <>
      <div className="flex flex-col gap-2.5 md:hidden">
        {policies.map((policy) => (
          <PolicyCard
            key={policy.policyId}
            policy={policy}
            now={now}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="hidden md:block">
        <PolicyTable policies={policies} now={now} onSelect={onSelect} />
      </div>
    </>
  );
}

export default PolicyList;
