import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, CheckCircle, User, Phone, MapPin,
  Briefcase, FileText, ChevronDown, Loader2, DollarSign, Clock, Camera, X, Plus, Images
} from "lucide-react";
import { useArtisans, type Availability } from "@/context/artisans-context";
import { useCustomer } from "@/context/customer-context";
import { AuthModal } from "@/components/auth-modal";

import { CATEGORY_GROUPS } from "@/data/categories";
import { NIGERIAN_STATES, NIGERIA_LOCATIONS } from "@/data/locations";
import { compressImage } from "@/utils/image";
import { isValidNigerianPhone } from "@/lib/phone";

const AVAILABILITY_OPTIONS: Availability[] = ["Available", "Busy", "By appointment"];

interface FormData {
  name: string;
  phone: string;
  category: string;
  state: string;
  location: string;
  experience: string;
  bio: string;
  availability: string;
  pricing: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  category?: string;
  state?: string;
  location?: string;
  experience?: string;
  bio?: string;
  availability?: string;
  pricing?: string;
}

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = "Full name is required.";
  if (!data.phone.trim()) errors.phone = "Phone number is required.";
  else if (!isValidNigerianPhone(data.phone))
    errors.phone = "Enter a valid Nigerian mobile number (e.g. +2348031234567 or 08031234567).";
  if (!data.category) errors.category = "Select a trade category.";
  if (!data.state) errors.state = "Select your state.";
  if (!data.location.trim()) errors.location = "Select your local government area.";
  const exp = parseInt(data.experience);
  if (!data.experience.trim()) errors.experience = "Years of experience is required.";
  else if (isNaN(exp) || exp < 0 || exp > 60)
    errors.experience = "Enter a valid number of years (0–60).";
  if (!data.bio.trim()) errors.bio = "A short description is required.";
  else if (data.bio.trim().length < 20)
    errors.bio = "Description must be at least 20 characters.";
  if (!data.availability) errors.availability = "Select your current availability.";
  return errors;
}

function Field({
  label, error, required = true, children,
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-destructive font-medium flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (hasError: boolean) =>
  `w-full bg-muted/40 border rounded-xl px-4 py-3 text-sm outline-none transition-all ${
    hasError
      ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/10"
      : "border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
  }`;

function NotSignedIn() {
  const [showAuth, setShowAuth] = useState(false);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <User size={28} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-foreground mb-1">Sign in first</h2>
          <p className="text-muted-foreground text-sm">You need to be signed in to register as a Maigyara.</p>
        </div>
        <button
          onClick={() => setShowAuth(true)}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold text-sm hover:bg-primary/90 transition-all"
        >
          Sign In / Create Account
        </button>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

export default function BecomeArtisanPage() {
  const [, setLocation] = useLocation();
  const { addArtisan } = useArtisans();
  const { customer, loading } = useCustomer();

  const [form, setForm] = useState<FormData>({
    name: customer?.name ?? "", phone: "", category: "",
    state: "", location: "", experience: "", bio: "",
    availability: "", pricing: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [photoError, setPhotoError] = useState<string | undefined>();
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([]);

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validate({ ...form, [field]: val })[field] }));
    }
  };

  const blur = (field: keyof FormData) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validate(form)[field] }));
  };

  const handleProfilePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const compressed = await compressImage(file, 400, 400, 0.85);
      setPhotoUrl(compressed);
      setPhotoError(undefined);
    } catch {}
  };

  const handlePortfolioPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const compressed = await compressImage(file, 900, 900, 0.80);
      setPortfolioPhotos((prev) => [...prev, compressed].slice(0, 4));
    } catch {}
  };

  const removePortfolioPhoto = (index: number) => {
    setPortfolioPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (!customer) return <NotSignedIn />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(
      (Object.keys(form) as (keyof FormData)[]).map((k) => [k, true])
    );
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (!photoUrl) {
      setPhotoError("A profile photo is required.");
    }
    if (Object.keys(errs).length > 0 || !photoUrl) return;

    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const err = await addArtisan({
        name: form.name.trim(),
        phone: form.phone.trim(),
        category: form.category,
        location: form.location.trim(),
        experience: parseInt(form.experience),
        bio: form.bio.trim(),
        availability: form.availability as Availability,
        pricing: form.pricing.trim() || undefined,
        photoUrl: photoUrl || undefined,
        portfolioPhotos: portfolioPhotos.length > 0 ? portfolioPhotos : undefined,
        ownerCustomerId: customer.id,
      });
      if (err) {
        setSubmitError("Listing could not be saved — please try again. (" + err + ")");
      } else {
        setSubmitted(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center flex flex-col items-center gap-5 animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Welcome to Maigyara!</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your listing is now live in the Gyara directory. Customers can find and contact you right away.
            </p>
          </div>
          <button
            onClick={() => setLocation("/artisans")}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold text-sm hover:bg-primary/90 transition-all"
          >
            View Artisan Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
              data-testid="button-back"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <div className="w-px h-5 bg-border" />
            <span className="font-bold text-primary text-lg">Gyara</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground" data-testid="page-heading">
              Become a Maigyara
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">
            Join thousands of professionals on Gyara and start getting hired today.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-background border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-5">

          {/* Full Name */}
          <Field label="Full Name" error={errors.name}>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                onBlur={blur("name")}
                placeholder="e.g. Emeka Okafor"
                className={`${inputClass(!!errors.name)} pl-10`}
                data-testid="input-name"
              />
            </div>
          </Field>

          {/* Phone */}
          <Field label="Phone Number" error={errors.phone}>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                onBlur={blur("phone")}
                placeholder="+2348031234567"
                className={`${inputClass(!!errors.phone)} pl-10`}
                data-testid="input-phone"
              />
            </div>
          </Field>

          {/* Category + Location side by side on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Trade Category" error={errors.category}>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={set("category")}
                  onBlur={blur("category")}
                  className={`${inputClass(!!errors.category)} appearance-none pr-8 cursor-pointer`}
                  data-testid="select-category"
                >
                  <option value="">Select trade / category…</option>
                  {CATEGORY_GROUPS.map((group) => (
                    <optgroup key={group.name} label={group.name}>
                      {group.categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </Field>
            <Field label="State" error={errors.state}>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <select
                  value={form.state}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({ ...prev, state: val, location: "" }));
                    if (touched.state) {
                      setErrors((prev) => ({ ...prev, state: val ? undefined : "Select your state." }));
                    }
                    if (touched.location) {
                      setErrors((prev) => ({ ...prev, location: "Select your local government area." }));
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, state: true }));
                    setErrors((prev) => ({ ...prev, state: validate(form).state }));
                  }}
                  className={`${inputClass(!!errors.state)} pl-10 appearance-none`}
                  data-testid="select-state"
                >
                  <option value="">Select a state…</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </Field>
            {form.state && (
              <Field label="Local Government Area" error={errors.location}>
                <div className="relative">
                  <select
                    value={form.location}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => ({ ...prev, location: val }));
                      if (touched.location) {
                        setErrors((prev) => ({ ...prev, location: val ? undefined : "Select your local government area." }));
                      }
                    }}
                    onBlur={blur("location")}
                    className={`${inputClass(!!errors.location)} appearance-none`}
                    data-testid="select-location"
                  >
                    <option value="">Select LGA in {form.state}…</option>
                    {(NIGERIA_LOCATIONS[form.state] ?? []).map((lga) => (
                      <option key={lga} value={lga}>{lga}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </Field>
            )}
          </div>

          {/* Experience */}
          <Field label="Years of Experience" error={errors.experience}>
            <div className="relative">
              <Briefcase size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="number"
                min="0"
                max="60"
                value={form.experience}
                onChange={set("experience")}
                onBlur={blur("experience")}
                placeholder="e.g. 5"
                className={`${inputClass(!!errors.experience)} pl-10`}
                data-testid="input-experience"
              />
            </div>
          </Field>

          {/* Bio */}
          <Field label="Short Description" error={errors.bio}>
            <div className="relative">
              <FileText size={15} className="absolute left-3.5 top-3.5 text-muted-foreground" />
              <textarea
                value={form.bio}
                onChange={set("bio")}
                onBlur={blur("bio")}
                placeholder="Describe your skills, specializations, and what makes you stand out…"
                rows={4}
                className={`${inputClass(!!errors.bio)} pl-10 resize-none`}
                data-testid="input-bio"
              />
            </div>
            <p className="text-xs text-muted-foreground">{form.bio.length}/200 — minimum 20 characters</p>
          </Field>

          {/* Availability + Pricing side by side on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Current Availability" error={errors.availability}>
              <div className="relative">
                <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={form.availability}
                  onChange={set("availability")}
                  onBlur={blur("availability")}
                  className={`${inputClass(!!errors.availability)} appearance-none pl-10 pr-8 cursor-pointer`}
                  data-testid="select-availability"
                >
                  <option value="">Select availability…</option>
                  {AVAILABILITY_OPTIONS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </Field>

            <Field label="Pricing / Rate Hint" error={undefined} required={false}>
              <div className="relative">
                <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={form.pricing}
                  onChange={set("pricing")}
                  onBlur={blur("pricing")}
                  placeholder="e.g. ₦5,000 per visit"
                  className={`${inputClass(false)} pl-10`}
                  data-testid="input-pricing"
                />
              </div>
              <p className="text-xs text-muted-foreground">Optional — gives customers a rough idea</p>
            </Field>
          </div>

          {/* Divider */}
          <div className="border-t border-border pt-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                <Camera size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Photos</p>
                <p className="text-xs text-muted-foreground">Help customers verify your identity and see your work</p>
              </div>
            </div>

            {/* Profile Photo */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-foreground mb-3">
                Profile Photo <span className="text-primary">*</span>
              </p>
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Profile preview"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-border"
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-2xl bg-muted border-2 border-dashed flex items-center justify-center ${photoError ? "border-destructive" : "border-border"}`}>
                      <Camera size={24} className="text-muted-foreground/50" />
                    </div>
                  )}
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(undefined)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center shadow-sm hover:bg-destructive/90 transition-colors"
                      aria-label="Remove photo"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="profile-photo-input"
                    className="cursor-pointer inline-flex items-center gap-2 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/70 transition-all"
                  >
                    <Camera size={14} />
                    {photoUrl ? "Change Photo" : "Upload Photo"}
                  </label>
                  <input
                    id="profile-photo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePhoto}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Your face — builds trust with customers</p>
                  {photoError && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                      <span>⚠</span> {photoError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Portfolio Photos */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Images size={14} className="text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">
                  Work Portfolio <span className="text-muted-foreground font-normal text-xs">(optional — up to 4 photos)</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Show examples of past jobs — tiling, plumbing, carpentry, etc.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {portfolioPhotos.map((photo, i) => (
                  <div key={i} className="relative aspect-square">
                    <img
                      src={photo}
                      alt={`Work sample ${i + 1}`}
                      className="w-full h-full rounded-xl object-cover border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removePortfolioPhoto(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center shadow-sm hover:bg-destructive/90 transition-colors"
                      aria-label="Remove photo"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
                {portfolioPhotos.length < 4 && (
                  <label
                    htmlFor="portfolio-photo-input"
                    className="aspect-square rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/70 transition-all gap-1"
                  >
                    <Plus size={20} className="text-muted-foreground/60" />
                    <span className="text-xs text-muted-foreground font-medium">Add photo</span>
                    <input
                      id="portfolio-photo-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePortfolioPhoto}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {submitError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive font-medium">
              {submitError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-base hover:bg-primary/90 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-1"
            data-testid="button-submit"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit Application"
            )}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            By submitting, you agree to be listed publicly in the Gyara directory.
          </p>
        </div>
      </form>
    </div>
  );
}
