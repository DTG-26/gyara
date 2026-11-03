import { useState, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ArtisansPage from "@/pages/artisans";
import BecomeArtisanPage from "@/pages/become-artisan";
import ArtisanProfilePage from "@/pages/artisan-profile";
import EditArtisanPage from "@/pages/edit-artisan";
import AboutPage from "@/pages/about";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import SettingsPage from "@/pages/settings";
import TermsAndConditionsPage from "@/pages/terms-and-conditions";
import ContactPage from "@/pages/contact";
import VerifyPage from "@/pages/verify";
import MessagesPage from "@/pages/messages";
import MessageThreadPage from "@/pages/message-thread";
import { ArtisansProvider } from "@/context/artisans-context";
import { CustomerProvider, useCustomer } from "@/context/customer-context";
import { MessagesProvider, useMessages } from "@/context/messages-context";
import { AuthModal } from "@/components/auth-modal";
import {
  Wrench, Zap, Hammer, Paintbrush, Wind, Flame, Cpu,
  Search, Phone, CheckCircle, Menu, X, ArrowRight, UserPlus, BadgeCheck, Star, Settings, LogIn, MessageSquare,
} from "lucide-react";
import { useArtisans } from "@/context/artisans-context";

const queryClient = new QueryClient();

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function FeaturedArtisansSection() {
  const [, setLocation] = useLocation();
  const { artisans } = useArtisans();

  const featured = artisans
    .filter((a) => a.isVerified)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  if (featured.length === 0) return null;

  return (
    <section className="py-12 sm:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <BadgeCheck size={18} className="text-blue-600" />
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Top Verified</p>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
            Trusted by Customers Across Nigeria
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Hand-picked, verified professionals with proven track records.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {featured.map((artisan, index) => (
            <FadeIn key={artisan.id} delay={index * 60}>
              <button
                onClick={() => setLocation(`/artisans/${artisan.id}`)}
                className="w-full bg-background border border-border rounded-2xl p-5 flex flex-col items-center text-center hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                data-testid={`featured-artisan-${artisan.id}`}
              >
                {artisan.photoUrl ? (
                  <img
                    src={artisan.photoUrl}
                    alt={artisan.name}
                    className="w-16 h-16 rounded-2xl object-cover mb-3 border border-border"
                  />
                ) : (
                  <div className={`${artisan.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-3`}>
                    {artisan.initials}
                  </div>
                )}
                <div className="flex items-center gap-1 mb-1">
                  <BadgeCheck size={13} className="text-blue-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-blue-600">Verified</span>
                </div>
                <p className="font-bold text-foreground text-sm leading-tight mb-0.5">{artisan.name}</p>
                <p className="text-xs text-muted-foreground mb-2">{artisan.category} · {artisan.location}</p>
                {artisan.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-semibold text-foreground">{artisan.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({(artisan.reviews ?? []).length})</span>
                  </div>
                )}
              </button>
            </FadeIn>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => setLocation("/artisans")}
            className="inline-flex items-center gap-2 border-2 border-border text-foreground px-6 py-3 rounded-full font-semibold text-sm hover:border-primary/40 hover:text-primary transition-all"
          >
            View All Artisans
            <Star size={14} className="text-primary" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const { customer, logout } = useCustomer();
  const { unreadTotal } = useMessages();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const categories = [
    { name: "Plumber", icon: Wrench },
    { name: "Electrician", icon: Zap },
    { name: "Carpenter", icon: Hammer },
    { name: "Painter", icon: Paintbrush },
    { name: "AC Technician", icon: Wind },
    { name: "Welder", icon: Flame },
    { name: "Generator Repair", icon: Cpu },
  ];

  const steps = [
    {
      title: "Search Artisan",
      description: "Browse our directory of verified local artisans or search by skill and location.",
      icon: Search,
    },
    {
      title: "Contact Artisan",
      description: "Get in touch directly to discuss your needs, agree on pricing, and schedule a visit.",
      icon: Phone,
    },
    {
      title: "Get The Job Done",
      description: "The artisan arrives, completes the work to your satisfaction, and you pay them directly.",
      icon: CheckCircle,
    },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            <span
              className="text-2xl font-extrabold text-primary tracking-tight cursor-pointer"
              data-testid="logo-text"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Gyara
            </span>

            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-foreground/80 hover:text-primary transition-colors font-medium text-sm"
                data-testid="nav-home"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("categories")}
                className="text-foreground/80 hover:text-primary transition-colors font-medium text-sm"
                data-testid="nav-categories"
              >
                Categories
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-foreground/80 hover:text-primary transition-colors font-medium text-sm"
                data-testid="nav-how-it-works"
              >
                How It Works
              </button>
              <button
                onClick={() => setLocation("/about")}
                className="text-foreground/80 hover:text-primary transition-colors font-medium text-sm"
                data-testid="nav-about"
              >
                About
              </button>
              <button
                onClick={() => setLocation("/become-artisan")}
                className="text-foreground/80 hover:text-primary transition-colors font-medium text-sm flex items-center gap-1.5"
                data-testid="button-nav-become-artisan"
              >
                <UserPlus size={14} />
                Become a Maigyara
              </button>
              <button
                onClick={() => setLocation("/artisans")}
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 transform"
                data-testid="button-nav-find-artisan"
              >
                Find Artisan
              </button>
              {customer ? (
                <div className="flex items-center gap-3 text-sm">
                  <button
                    onClick={() => setLocation("/messages")}
                    className="relative text-foreground/70 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-muted"
                    data-testid="nav-messages"
                    aria-label="Messages"
                  >
                    <MessageSquare size={18} />
                    {unreadTotal > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadTotal > 9 ? "9+" : unreadTotal}
                      </span>
                    )}
                  </button>
                  <span className="text-foreground/70 font-medium max-w-[120px] truncate">{customer.name}</span>
                  <button
                    onClick={() => void handleSignOut()}
                    disabled={signingOut}
                    className="text-primary hover:underline font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="nav-signout"
                  >
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setAuthModalMode("signin"); setShowAuthModal(true); }}
                    className="flex items-center gap-1.5 text-foreground/80 hover:text-primary transition-colors font-medium text-sm"
                    data-testid="nav-signin"
                  >
                    <LogIn size={14} />
                    Sign In
                  </button>
                  <button
                    onClick={() => { setAuthModalMode("signup"); setShowAuthModal(true); }}
                    className="flex items-center gap-1.5 text-foreground/80 hover:text-primary transition-colors font-medium text-sm"
                    data-testid="nav-signup"
                  >
                    <UserPlus size={14} />
                    Sign Up
                  </button>
                </div>
              )}
              <button
                onClick={() => setLocation("/settings")}
                className="text-foreground/70 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-muted"
                data-testid="nav-settings"
                aria-label="Settings"
              >
                <Settings size={18} />
              </button>
            </div>

            <div className="md:hidden flex items-center gap-1">
              <button
                onClick={() => setLocation("/settings")}
                className="text-foreground/70 hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
                data-testid="nav-settings-mobile"
                aria-label="Settings"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-foreground p-2 rounded-lg hover:bg-muted transition-colors"
                data-testid="button-mobile-menu"
              >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background border-b border-border px-4 py-4 space-y-2 shadow-lg">
            <button onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setIsMenuOpen(false); }} className="block w-full text-left font-medium px-3 py-2 rounded-lg text-foreground hover:bg-muted" data-testid="mobile-nav-home">Home</button>
            <button onClick={() => scrollToSection("categories")} className="block w-full text-left font-medium px-3 py-2 rounded-lg text-foreground hover:bg-muted" data-testid="mobile-nav-categories">Categories</button>
            <button onClick={() => scrollToSection("how-it-works")} className="block w-full text-left font-medium px-3 py-2 rounded-lg text-foreground hover:bg-muted" data-testid="mobile-nav-how-it-works">How It Works</button>
            <button onClick={() => { setLocation("/about"); setIsMenuOpen(false); }} className="block w-full text-left font-medium px-3 py-2 rounded-lg text-foreground hover:bg-muted" data-testid="mobile-nav-about">About</button>
            <button onClick={() => { setLocation("/artisans"); setIsMenuOpen(false); }} className="block w-full bg-primary text-primary-foreground text-center font-semibold px-3 py-3 rounded-xl mt-2" data-testid="mobile-nav-find-artisan">Find Artisan</button>
            <div className="border-t border-border pt-3 mt-2 space-y-2">
              {customer ? (
                <>
                <button
                  onClick={() => { setLocation("/messages"); setIsMenuOpen(false); }}
                  className="flex items-center justify-between w-full text-left font-medium px-3 py-2 rounded-lg text-foreground hover:bg-muted"
                  data-testid="mobile-nav-messages"
                >
                  <span className="flex items-center gap-2"><MessageSquare size={16} /> Messages</span>
                  {unreadTotal > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadTotal > 9 ? "9+" : unreadTotal}
                    </span>
                  )}
                </button>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-medium text-foreground truncate">{customer.name}</span>
                  <button
                    onClick={() => { void handleSignOut(); setIsMenuOpen(false); }}
                    disabled={signingOut}
                    className="text-sm text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setLocation("/become-artisan"); setIsMenuOpen(false); }}
                    className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-semibold px-3 py-3 rounded-xl"
                    data-testid="mobile-nav-become-artisan-cta"
                  >
                    <UserPlus size={15} />
                    Become a Maigyara
                  </button>
                  <button
                    onClick={() => { setAuthModalMode("signup"); setShowAuthModal(true); setIsMenuOpen(false); }}
                    className="flex items-center justify-center gap-2 w-full border-2 border-primary text-primary font-semibold px-3 py-3 rounded-xl hover:bg-primary/5 transition-colors"
                    data-testid="mobile-nav-signup"
                  >
                    <UserPlus size={15} />
                    Sign Up
                  </button>
                  <button
                    onClick={() => { setAuthModalMode("signin"); setShowAuthModal(true); setIsMenuOpen(false); }}
                    className="flex items-center justify-center gap-2 w-full text-primary font-semibold px-3 py-2.5 rounded-xl hover:bg-primary/5 transition-colors"
                    data-testid="mobile-nav-signin"
                  >
                    <LogIn size={15} />
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] sm:min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/6 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12 sm:py-24">
          <div
            className="inline-block bg-primary/10 text-primary text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-full mb-6 sm:mb-8 animate-fade-in"
            data-testid="hero-badge"
          >
            Trusted by thousands across Nigeria
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-5 sm:mb-6 animate-fade-in"
            data-testid="hero-heading"
            style={{ animationDelay: "100ms" }}
          >
            Find Trusted{" "}
            <span className="text-primary relative inline-block">
              Artisans
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0 6 Q100 0 200 6" stroke="hsl(var(--primary))" strokeWidth="2.5" fill="none" opacity="0.4" />
              </svg>
            </span>{" "}
            Near You
          </h1>

          <p
            className="text-base sm:text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10 animate-fade-in"
            data-testid="hero-subheading"
            style={{ animationDelay: "200ms" }}
          >
            Gyara connects you with verified, skilled local workers — from plumbing emergencies to electrical repairs. The dependable first call when something breaks.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = (e.currentTarget.elements.namedItem("hero-search") as HTMLInputElement).value.trim();
              if (q) sessionStorage.setItem("gyara_initial_query", q);
              setLocation("/artisans");
            }}
            className="flex flex-col items-center gap-3 animate-fade-in w-full max-w-xl mx-auto"
            style={{ animationDelay: "300ms" }}
            data-testid="hero-search-form"
          >
            <div className="flex w-full bg-background border-2 border-border rounded-full shadow-lg overflow-hidden focus-within:border-primary/50 transition-colors">
              <div className="pl-5 flex items-center text-muted-foreground flex-shrink-0">
                <Search size={18} />
              </div>
              <input
                name="hero-search"
                type="text"
                placeholder="Plumber, Electrician, Carpenter…"
                className="flex-1 px-4 py-4 text-base bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60"
                data-testid="input-hero-search"
              />
              <button
                type="submit"
                className="group bg-primary text-primary-foreground px-6 py-4 font-bold text-base hover:bg-primary/90 transition-all flex items-center gap-2 flex-shrink-0"
                data-testid="button-hero-search"
              >
                Find
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setLocation("/become-artisan")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-1.5"
              data-testid="button-hero-become-artisan"
            >
              <UserPlus size={14} />
              Are you an artisan? Join as a Maigyara
            </button>
          </form>

          {/* Trust indicators */}
          <div className="mt-10 sm:mt-16 flex flex-wrap justify-center gap-3 sm:gap-8 text-xs sm:text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "400ms" }}>
            {["Verified Professionals", "Fast Response", "Locally Based", "Fair Pricing"].map((item) => (
              <div key={item} className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle size={14} className="text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FeaturedArtisansSection />

      {/* Categories Section */}
      <section id="categories" className="py-12 sm:py-24 bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-8 sm:mb-16">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">What We Offer</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4" data-testid="categories-heading">
              Browse by Category
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              Find exactly the professional you need for any job, large or small.
            </p>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {categories.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <FadeIn key={cat.name} delay={index * 60}>
                  <button
                    onClick={() => {
                      sessionStorage.setItem("gyara_initial_category", cat.name);
                      setLocation("/artisans");
                    }}
                    className="w-full bg-background border border-border rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all group"
                    data-testid={`card-category-${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                      <Icon size={30} className="text-primary" />
                    </div>
                    <h3 className="font-semibold text-base text-foreground">{cat.name}</h3>
                  </button>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 sm:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-8 sm:mb-16">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4" data-testid="how-it-works-heading">
              How It Works
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              Getting your repairs done is as easy as three simple steps.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-14 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <FadeIn key={step.title} delay={index * 120}>
                  <div className="flex flex-col items-center text-center relative" data-testid={`step-${index + 1}`}>
                    <div className="relative mb-6">
                      <div className="w-28 h-28 bg-primary/10 rounded-3xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon size={36} className="text-primary" />
                      </div>
                      <div className="absolute -top-3 -right-3 w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm max-w-xs">{step.description}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Become an Artisan Banner */}
      <section className="py-12 sm:py-16 bg-muted/40 border-y border-border">
        <FadeIn className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">For Professionals</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Are you a skilled artisan?
          </h2>
          <p className="text-muted-foreground text-base mb-6 max-w-lg mx-auto">
            Join the Gyara directory and start getting hired by customers in your area today.
          </p>
          <button
            onClick={() => setLocation("/become-artisan")}
            className="bg-foreground text-background px-8 py-3.5 rounded-full font-bold text-base hover:bg-foreground/90 transition-all shadow-sm hover:-translate-y-0.5 transform flex items-center gap-2 mx-auto"
            data-testid="button-become-artisan-banner"
          >
            <UserPlus size={18} />
            Register as a Maigyara
          </button>
        </FadeIn>
      </section>

      {/* CTA Banner */}
      <section className="py-12 sm:py-20 bg-primary">
        <FadeIn className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to find your artisan?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8">
            Join thousands who have already discovered reliable local professionals through Gyara.
          </p>
          <button
            onClick={() => setLocation("/artisans")}
            className="bg-white text-primary font-bold px-8 py-4 rounded-full text-lg hover:bg-white/90 transition-all shadow-lg hover:-translate-y-1 transform"
            data-testid="button-cta-get-started"
          >
            Get Started Now
          </button>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <span className="text-2xl font-extrabold tracking-tight mb-4 block text-primary" data-testid="footer-logo">
                Gyara
              </span>
              <p className="text-background/60 text-sm max-w-sm leading-relaxed">
                The dependable neighborhood marketplace. Your trusted first call when something breaks — connecting real people with real professionals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-background text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => setLocation("/about")} className="text-background/60 hover:text-white transition-colors text-sm" data-testid="footer-link-about">
                    About
                  </button>
                </li>
                <li>
                  <button onClick={() => setLocation("/contact")} className="text-background/60 hover:text-white transition-colors text-sm" data-testid="footer-link-contact">
                    Contact
                  </button>
                </li>
                <li>
                  <button onClick={() => setLocation("/terms")} className="text-background/60 hover:text-white transition-colors text-sm" data-testid="footer-link-terms">
                    Terms &amp; Conditions
                  </button>
                </li>
                <li>
                  <button onClick={() => setLocation("/privacy")} className="text-background/60 hover:text-white transition-colors text-sm" data-testid="footer-link-privacy">
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-background text-sm uppercase tracking-wider">Services</h4>
              <ul className="space-y-3">
                {["Plumber", "Electrician", "Carpenter", "Generator Repair"].map((s) => (
                  <li key={s}>
                    <button
                      onClick={() => {
                        sessionStorage.setItem("gyara_initial_category", s);
                        setLocation("/artisans");
                      }}
                      className="text-background/60 hover:text-white transition-colors text-sm"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-background/50 gap-4">
            <p data-testid="footer-copyright">© 2026 Danmari Tech Group. All rights reserved.</p>
            <p className="text-background/40 text-xs">Gyara is a product of Danmari Tech Group</p>
          </div>
        </div>
      </footer>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} initialMode={authModalMode} />}
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/artisans" component={ArtisansPage} />
      <Route path="/artisans/:id" component={ArtisanProfilePage} />
      <Route path="/artisans/:id/edit" component={EditArtisanPage} />
      <Route path="/become-artisan" component={BecomeArtisanPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/terms" component={TermsAndConditionsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/verify" component={VerifyPage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/messages/:artisanId/:customerId" component={MessageThreadPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useCustomer();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CustomerProvider>
          <ArtisansProvider>
            <MessagesProvider>
              <AuthGate>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
              </AuthGate>
            </MessagesProvider>
          </ArtisansProvider>
        </CustomerProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
