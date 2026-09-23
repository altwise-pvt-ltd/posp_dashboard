import CardShell from './CardShell';

/**
 * One banner: the artwork and its title.
 *
 * `linkUrl` is null on every banner the service currently holds, so opening
 * falls through to the image itself. That is the more useful target anyway —
 * an agent wants to see the card full size.
 */
function BannerCard({ banner }) {
  const { title, imageUrl, linkUrl } = banner;

  return (
    <CardShell
      title={title}
      imageUrl={imageUrl}
      href={linkUrl || imageUrl}
      openLabel="View"
    />
  );
}

export default BannerCard;
