import { useState } from "react";
import { Star } from "lucide-react";
import quoteIcon from "@/assets/landing/quote-icon.png";

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    location: "Housewife, Mumbai",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    quote:
      "LetsInsurance changed my life. As a homemaker, I never thought I could earn on my own. Now I earn over 40K every month from home!",
    earnings: "42,000/month",
  },
  {
    name: "Rahul Verma",
    location: "Student, Delhi",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    quote:
      "I started selling insurance during college and now I have a steady side income. The app makes everything so easy — even my parents are impressed.",
    earnings: "28,000/month",
  },
  {
    name: "Anita Desai",
    location: "Retired Teacher, Pune",
    photo: "https://randomuser.me/api/portraits/women/68.jpg",
    quote:
      "After retirement, I was looking for something meaningful. LetsInsurance gave me purpose and a great income. The training was excellent.",
    earnings: "35,000/month",
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);

  return (
    <section className="bg-gray-50 py-16 lg:py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        {/* Heading */}
        <h2 className="text-center text-3xl lg:text-[40px] lg:leading-[48px] font-bold text-gray-900 mb-3">
          Hear From Our{" "}
          <span className="text-[#f47c3c]">Successful Advisors</span>
        </h2>
        <p className="text-center text-sm text-gray-500 mb-12 max-w-xl mx-auto">
          Real stories from advisors who transformed their careers with{" "}
          <span className="text-[#f47c3c] font-medium">LetsInsurance</span>.
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className="relative flex flex-col rounded-2xl bg-white p-6 shadow-md border border-gray-100"
            >
              {/* Quote icon */}
              <img
                src={quoteIcon}
                alt=""
                className="absolute top-5 right-5 h-8 w-8 opacity-20"
              />

              {/* Profile */}
              <div className="flex items-center gap-4 mb-5">
                <img
                  src={t.photo}
                  alt={t.name}
                  className="h-20 w-20 rounded-full border-3 border-[#f47c3c] object-cover"
                />
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {t.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{t.location}</p>
                  <div className="mt-1.5">
                    <StarRating />
                  </div>
                </div>
              </div>

              {/* Quote */}
              <p className="flex-1 text-sm text-gray-600 leading-relaxed mb-5">
                "{t.quote}"
              </p>

              {/* Divider + earnings */}
              <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                <span className="text-xs text-gray-400">Monthly Earnings</span>
                <span className="text-base font-semibold text-[#f47c3c]">
                  ₹{t.earnings}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-10">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Testimonial ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === active
                  ? "h-2.5 w-8 bg-[#f47c3c]"
                  : "h-2.5 w-2.5 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
