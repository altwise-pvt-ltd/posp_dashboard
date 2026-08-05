/**
 * Highlight — the orange emphasis span used for brand words and key phrases.
 * Colour only: weight is inherited so it reads correctly inside both bold
 * headings and body copy.
 */
export default function Highlight({ className = "", children }) {
  return <span className={`text-brand ${className}`}>{children}</span>;
}
