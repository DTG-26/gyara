import { useLocation } from "wouter";
import { ArrowLeft, MapPin, Target, Users, ShieldCheck, ArrowRight } from "lucide-react";

export default function AboutPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              <ArrowLeft size={16} />
              <span>Home</span>
            </button>
            <div className="w-px h-5 bg-border" />
            <span className="font-bold text-primary text-lg">Gyara</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

        {/* Page title */}
        <div className="mb-10 sm:mb-14">
          <p className="text-primary font-semibold text-xs uppercase tracking-widest mb-3">Who We Are</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
            About Gyara
          </h1>
        </div>

        {/* Mission */}
        <div className="bg-background border border-border rounded-2xl p-6 sm:p-8 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target size={18} className="text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Our Mission</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
            Gyara exists to make finding a trustworthy, skilled artisan as simple as sending a message. Across Nigerian cities and towns, millions of people struggle to find reliable workers for repairs and installations — and millions of talented tradespeople struggle to reach steady customers.
          </p>
          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base mt-4">
            We bridge that gap. Gyara is a transparent directory where verified artisans showcase their real work, customers confirm hires, and honest reviews reflect genuine experiences — no inflated ratings, no anonymous claims.
          </p>
        </div>

        {/* What Gyara means */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8 mb-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground text-base">"Gyara"</span> — from the Hausa word meaning <em>to fix</em> or <em>to repair</em>. It captures exactly what we do: connect people who need something fixed with the craftspeople who can fix it.
          </p>
        </div>

        {/* What makes us different */}
        <div className="bg-background border border-border rounded-2xl p-6 sm:p-8 mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={18} className="text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">What Makes Us Different</h2>
          </div>
          <ul className="space-y-4">
            {[
              {
                title: "Verified Hire Reviews",
                body: "Only customers who confirm they actually hired an artisan can leave a review. No fake feedback.",
              },
              {
                title: "Real Faces, Real Work",
                body: "Every artisan profile requires a photo and can showcase a portfolio of completed jobs.",
              },
              {
                title: "Direct Contact",
                body: "No middlemen or commissions. Call or message the artisan directly and pay them directly.",
              },
              {
                title: "Locally Based",
                body: "We focus on Nigerian communities — artisans are searchable by city and trade.",
              },
            ].map(({ title, body }) => (
              <li key={title} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Danmari Tech Group */}
        <div className="bg-background border border-border rounded-2xl p-6 sm:p-8 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users size={18} className="text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Danmari Tech Group</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
            Gyara is a product of <span className="font-semibold text-foreground">Danmari Tech Group</span>, a technology company building digital infrastructure for African markets. Danmari Tech Group believes that smart, practical technology can solve everyday challenges for everyday people — starting right in the neighbourhood.
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={14} className="text-primary flex-shrink-0" />
            <span>Nigeria</span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={() => setLocation("/artisans")}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
          >
            Browse Artisan Directory
            <ArrowRight size={15} />
          </button>
          <button
            onClick={() => setLocation("/become-artisan")}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-border text-foreground py-3.5 rounded-xl font-bold text-sm hover:border-primary/40 hover:bg-muted/50 transition-all"
          >
            Register as an Artisan
          </button>
        </div>

        {/* Footer line */}
        <p className="text-xs text-center text-muted-foreground mt-12">
          © 2026 Danmari Tech Group. All rights reserved.
        </p>
      </div>
    </div>
  );
}
