import { useLocation } from "wouter";
import { ArrowLeft, MessageCircle, Mail, MapPin, Clock, ExternalLink } from "lucide-react";

export default function ContactPage() {
  const [, setLocation] = useLocation();

  const whatsappUrl =
    "https://wa.me/2348000000000?text=Hello%20Gyara%20Support%2C%20I%20need%20help%20with...";

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <div className="w-px h-5 bg-border" />
            <span className="font-bold text-primary text-lg">Gyara</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Contact & Support</h1>
          <p className="text-muted-foreground text-sm">
            Have a question, complaint, or need help? We're here for you.
          </p>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-5 hover:bg-[#25D366]/20 transition-all group"
          data-testid="contact-whatsapp"
        >
          <div className="w-12 h-12 bg-[#25D366] rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageCircle size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground">WhatsApp Support</p>
            <p className="text-sm text-muted-foreground">Fastest response · usually within a few hours</p>
          </div>
          <ExternalLink size={16} className="text-muted-foreground group-hover:text-[#25D366] transition-colors flex-shrink-0" />
        </a>

        {/* Email */}
        <a
          href="mailto:hello@maigyara.com"
          className="flex items-center gap-4 bg-background border border-border rounded-2xl p-5 hover:border-primary/40 transition-all group"
          data-testid="contact-email"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Mail size={22} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground">Email Us</p>
            <p className="text-sm text-muted-foreground">hello@maigyara.com</p>
          </div>
          <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </a>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-background border border-border rounded-2xl p-5 flex items-start gap-3">
            <Clock size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-sm">Support Hours</p>
              <p className="text-xs text-muted-foreground mt-1">Monday – Friday<br />9 AM – 6 PM WAT</p>
            </div>
          </div>
          <div className="bg-background border border-border rounded-2xl p-5 flex items-start gap-3">
            <MapPin size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-sm">Headquarters</p>
              <p className="text-xs text-muted-foreground mt-1">Danmari Tech Group<br />Abuja, Nigeria</p>
            </div>
          </div>
        </div>

        {/* FAQ note */}
        <div className="bg-background border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-4">Common Questions</h2>
          <div className="flex flex-col gap-5">
            {[
              {
                q: "How do I report a fake artisan listing?",
                a: "Contact us on WhatsApp with the artisan's name and the issue. We'll investigate and remove the listing if it violates our guidelines.",
              },
              {
                q: "I hired an artisan but they didn't show up. What do I do?",
                a: "We're sorry to hear that. Please reach out via WhatsApp or email with details. We'll help resolve the dispute and flag the artisan if necessary.",
              },
              {
                q: "How do I get my artisan listing verified?",
                a: "Verification is currently done manually by Danmari Tech Group. Send us your trade credentials and we'll review your listing.",
              },
              {
                q: "Can I list my business on Gyara?",
                a: 'Yes! Click \u201cAre you an artisan?\u201d on the homepage or tap \u201cRegister\u201d in Settings to get started.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-border last:border-0 pb-5 last:pb-0">
                <p className="font-semibold text-foreground text-sm mb-1">{q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground pb-4">
          © 2026 Danmari Tech Group · Gyara
        </p>
      </div>
    </div>
  );
}
