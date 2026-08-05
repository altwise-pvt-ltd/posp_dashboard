import googlePlay from "@/assets/landing/google-play.png";
import appStore from "@/assets/landing/app-store.png";

const STORES = [
  { src: googlePlay, alt: "Get it on Google Play", href: "#" },
  { src: appStore, alt: "Download on the App Store", href: "#" },
];

/**
 * StoreBadges — the Google Play / App Store pair. `stretch` splits the row
 * evenly to fill a narrow column (the login card); the default sizes each
 * badge to its natural width.
 */
export default function StoreBadges({ stretch = false, className = "" }) {
  return (
    <div className={`flex items-center ${stretch ? "gap-3" : "gap-4"} ${className}`}>
      {STORES.map((store) => (
        <a
          key={store.alt}
          href={store.href}
          className={`rounded-lg transition-opacity hover:opacity-80 focus:outline-none focus:ring-4 focus:ring-brand/30 ${
            stretch ? "flex-1" : ""
          }`}
        >
          <img
            src={store.src}
            alt={store.alt}
            loading="lazy"
            className={`object-contain ${stretch ? "h-13 w-full" : "h-12 w-auto"}`}
          />
        </a>
      ))}
    </div>
  );
}
