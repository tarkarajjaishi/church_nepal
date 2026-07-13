import { Link } from "react-router";
import { MessageCircle, Phone, HandHeart } from "lucide-react";

export function FloatingButtons() {
  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col gap-3">
      <Link
        to="/prayer"
        className="group grid place-items-center size-12 rounded-full bg-gold text-church-blue shadow-lg hover:scale-105 transition-transform"
        aria-label="Request prayer"
        title="Request Prayer"
      >
        <HandHeart className="size-5" />
      </Link>
      <a
        href="https://wa.me/9771400000"
        className="grid place-items-center size-12 rounded-full bg-success text-white shadow-lg hover:scale-105 transition-transform"
        aria-label="WhatsApp"
        title="WhatsApp"
      >
        <MessageCircle className="size-5" />
      </a>
      <a
        href="tel:+97714000000"
        className="grid place-items-center size-12 rounded-full bg-church-blue text-white shadow-lg hover:scale-105 transition-transform"
        aria-label="Call us"
        title="Call"
      >
        <Phone className="size-5" />
      </a>
    </div>
  );
}
