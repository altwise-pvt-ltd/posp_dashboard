import { useState } from "react";
import { Star } from "lucide-react";
import quoteIcon from "@/assets/landing/quote-icon.svg";
import priyaPhoto from "@/assets/landing/testimonial1.png";
import rahulPhoto from "@/assets/landing/testimonial2.png";
import anitaPhoto from "@/assets/landing/testimonial3.png";
import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";
import Highlight from "./ui/Highlight";

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    location: "Housewife, Mumbai",
    photo: priyaPhoto,
    quote:
      "LetsInsurance changed my life. As a homemaker, I never thought I could earn on my own. Now I earn over 40K every month from home!",
    earnings: "42,000/month",
  },
  {
    name: "Rahul Verma",
    location: "Student, Delhi",
    photo: rahulPhoto,
    quote:
      "I started selling insurance during college and now I have a steady side income. The app makes everything so easy — even my parents are impressed.",
    earnings: "28,000/month",
  },
  {
    name: "Anita Desai",
    location: "Retired Teacher, Pune",
    photo: anitaPhoto,
    quote:
      "After Retirement, I was looking for something meaningful. LetsInsurance gave me purpose and a great income. The training was excellent.",
    earnings: "35,000/month",
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function TestimonialCard({ name, location, photo, quote, earnings }) {
  return (
    <div className="relative flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
      <img
        src={quoteIcon}
        alt=""
        loading="lazy"
        className="absolute right-5 top-5 h-10 w-10"
      />

      <div className="mb-5 flex items-center gap-4">
        <img
          src={photo}
          alt={name}
          loading="lazy"
          className="h-20 w-20 rounded-full border-3 border-brand object-cover"
        />
        <div>
          <h3 className="text-base font-semibold text-gray-900">{name}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{location}</p>
          <div className="mt-1.5">
            <StarRating />
          </div>
        </div>
      </div>

      <p className="mb-5 flex-1 text-sm leading-relaxed text-gray-600">"{quote}"</p>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-xs text-gray-400">Monthly Earnings</span>
        <span className="text-base font-semibold text-brand">₹{earnings}</span>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);

  return (
    <Section tone="muted">
      <SectionHeading center className="mb-3">
        Hear From Our <Highlight>Successful Advisors</Highlight>
      </SectionHeading>
      <p className="mx-auto mb-12 max-w-xl text-center text-sm text-gray-500">
        Real stories from advisors who transformed their careers with{" "}
        <Highlight className="font-medium">LetsInsurance</Highlight>.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((testimonial) => (
          <TestimonialCard key={testimonial.name} {...testimonial} />
        ))}
      </div>

      {/* Dot indicators */}
      <div className="mt-10 flex items-center justify-center gap-2">
        {TESTIMONIALS.map((testimonial, i) => (
          <button
            key={testimonial.name}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Testimonial ${i + 1}: ${testimonial.name}`}
            aria-current={i === active}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === active ? "w-8 bg-brand" : "w-2.5 bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </Section>
  );
}
