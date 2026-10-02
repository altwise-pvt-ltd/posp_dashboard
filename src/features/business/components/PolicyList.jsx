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
 * Both layouts scroll inside their own box. The cards cap at 60vh and hand the
 * scroll back to the page at either end, so the gesture is never trapped.
 */
function PolicyList({ policies, now, onSelect }) {
  return (
    <>
      <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto md:hidden">
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
