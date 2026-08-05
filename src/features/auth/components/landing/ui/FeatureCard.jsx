import { ArrowRightCircle } from "lucide-react";
import IconCircle from "./IconCircle";

/* Two arrangements of the same card chrome:
   divided — a wide icon panel separated from the copy by a vertical rule
   inline  — a compact row that ends in a forward arrow */
const VARIANTS = {
  divided: {
    root: "items-stretch overflow-hidden",
    icon: "flex items-center px-5 py-6",
    body: "border-l border-gray-200 px-5 py-6",
    title: "text-lg",
    circle: "lg",
  },
  inline: {
    root: "items-center gap-4 p-5",
    icon: "flex items-center",
    body: "flex-1 min-w-0",
    title: "text-base",
    circle: "md",
  },
};

/**
 * FeatureCard — the orange-underlined gradient card shared by the "Why Become"
 * and "Who Can Become" sections.
 */
export default function FeatureCard({ icon, title, desc, variant = "inline" }) {
  const v = VARIANTS[variant];

  return (
    <div
      className={`flex rounded-xl border-b-4 border-brand bg-linear-to-br from-white to-orange-50/50 shadow-md ${v.root}`}
    >
      <div className={v.icon}>
        <IconCircle src={icon} size={v.circle} />
      </div>

      <div className={`flex flex-col justify-center ${v.body}`}>
        <h3 className={`font-medium text-gray-900 ${v.title}`}>{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{desc}</p>
      </div>

      {variant === "inline" && (
        <ArrowRightCircle className="size-5.5 shrink-0 text-brand" />
      )}
    </div>
  );
}
