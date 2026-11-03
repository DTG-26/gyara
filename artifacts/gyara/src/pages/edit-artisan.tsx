import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, User, Phone, MapPin,
  Briefcase, FileText, ChevronDown, Loader2, DollarSign, Clock, Camera, X, Plus, Images,
  Eye, Wrench, BadgeCheck, Star
} from "lucide-react";
import { useArtisans, type Availability, type ArtisanEditableFields } from "@/context/artisans-context";
import { useCustomer } from "@/context/customer-context";
import { CATEGORY_GROUPS, CATEGORY_ICONS, CATEGORY_COLORS } from "@/data/categories";
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

function deriveState(location: string): string {
  if (NIGERIAN_STATES.includes(location)) return location;
  for (const [state, lgas] of Object.entries(NIGERIA_LOCATIONS)) {
    if (lgas.includes(location)) return state;
  }
  return "";
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

const AVAILABILITY_STYLES: Record<Availability, string> = {
  "Available": "bg-green-100 text-green-700 border-green-200",
  "Busy": "bg-red-100 text-red-700 border-red-200",
  "By appointment": "bg-amber-100 text-amber-700 border-amber-200",
};

interface PreviewData {
  name: string;
  category: string;
  location: string;
  experience: number;
  bio: string;
  availability: Availability;
  pricing?: string;
  photoUrl?: string;
  portfolioPhotos: string[];
  initials: string;
  color: string;
  isVerified?: boolean;
}

function ProfilePreviewModal({
  preview,
  saving,
  onBack,
  onConfirm,
}: {
  preview: PreviewData;
  saving: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const Icon = CATEGORY_ICONS[preview.category] ?? Wrench;
  const categoryColor = CATEGORY_COLORS[preview.category] ?? "bg-gray-100 text-gray-700";
  const availStyle = AVAILABILITY_STYLES[preview.availability];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      data-testid="preview-modal"
    >
      <div className="bg-background w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh]">

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-bold text-foreground text-base">Listing Preview</h2>
            <p className="text-xs text-muted-foreground mt-0.5">This is how customers will see your profile</p>
          </div>
          <button
            onClick={onBack}
            aria-label="Close preview"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
            data-testid="preview-close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable profile card */}
        <div className="overflow-y-auto flex-1 px-5 py-5">

          {/* Avatar + name row */}
          <div className="flex items-start gap-4 mb-4">
            {preview.photoUrl ? (
              <img
                src={preview.photoUrl}
                alt={preview.name}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-border"
              />
            ) : (
              <div className={`${preview.color} w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0`}>
                {preview.initials}
              </div>
            )}
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-xl font-extrabold text-foreground leading-tight mb-2" data-testid="preview-name">
                {preview.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor}`}>
                  <Icon size={11} />
                  {preview.category}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${availStyle}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    preview.availability === "Available" ? "bg-green-500" : preview.availability === "Busy" ? "bg-red-500" : "bg-amber-500"
                  }`} />
                  {preview.availability}
                </span>
                {preview.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    <BadgeCheck size={11} />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rating placeholder */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} size={14} className="text-muted-foreground/30" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground italic">No rating yet</span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Location</p>
                <p className="text-sm font-semibold text-foreground" data-testid="preview-location">{preview.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Briefcase size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Experience</p>
                <p className="text-sm font-semibold text-foreground">{preview.experience} year{preview.experience !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {preview.pricing && (
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl sm:col-span-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Pricing / Rate</p>
                  <p className="text-sm font-semibold text-foreground">{preview.pricing}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl sm:col-span-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Availability</p>
                <p className="text-sm font-semibold text-foreground">{preview.availability}</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h2>
            <p className="text-sm text-foreground leading-relaxed" data-testid="preview-bio">{preview.bio}</p>
          </div>

          {/* Portfolio photos */}
          {preview.portfolioPhotos.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Work Portfolio</h2>
              <div className={`grid gap-2 ${preview.portfolioPhotos.length === 1 ? "grid-cols-1" : preview.portfolioPhotos.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
                {preview.portfolioPhotos.map((photo, i) => (
                  <div
                    key={i}
                    className={`overflow-hidden rounded-xl border border-border ${preview.portfolioPhotos.length === 1 ? "aspect-video" : "aspect-square"}`}
                  >
                    <img
                      src={photo}
                      alt={`Work sample ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 px-5 py-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 border border-border rounded-xl py-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition-all"
            data-testid="preview-back"
          >
            Back to Editing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            data-testid="preview-confirm-save"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : (
              "Confirm & Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotFoundState() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Artisan not found</h2>
        <p className="text-muted-foreground mb-6 text-sm">This listing may have been removed.</p>
        <button
          onClick={() => setLocation("/artisans")}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-all"
        >
          Back to Directory
        </button>
      </div>
    </div>
  );
}

export default function EditArtisanPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { artisans, loading: artisansLoading, updateArtisan } = useArtisans();
  const { customer, loading: customerLoading } = useCustomer();

  const artisan = artisans.find((a) => String(a.id) === id);

  const [form, setForm] = useState<FormData>(() => {
    if (!artisan) {
      return { name: "", phone: "", category: "", state: "", location: "", experience: "", bio: "", availability: "", pricing: "" };
    }
    const derivedState = deriveState(artisan.location);
    const isStateName = NIGERIAN_STATES.includes(artisan.location);
    return {
      name: artisan.name,
      phone: artisan.phone,
      category: artisan.category,
      state: derivedState,
      location: isStateName ? "" : artisan.location,
      experience: String(artisan.experience),
      bio: artisan.bio,
      availability: artisan.availability ?? "Available",
      pricing: artisan.pricing ?? "",
    };
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [showPreview, setShowPreview] = useState(false);

  const [photoUrl, setPhotoUrl] = useState<string | undefined>(() => artisan?.photoUrl);
  const [photoError, setPhotoError] = useState<string | undefined>();
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>(() => artisan?.portfolioPhotos ?? []);
  const [initializedId, setInitializedId] = useState<number | undefined>(() => artisan?.id);

  useEffect(() => {
    if (artisan && initializedId !== artisan.id) {
      const derivedState = deriveState(artisan.location);
      const isStateName = NIGERIAN_STATES.includes(artisan.location);
      setForm({
        name: artisan.name,
        phone: artisan.phone,
        category: artisan.category,
        state: derivedState,
        location: isStateName ? "" : artisan.location,
        experience: String(artisan.experience),
        bio: artisan.bio,
        availability: artisan.availability ?? "Available",
        pricing: artisan.pricing ?? "",
      });
      setPhotoUrl(artisan.photoUrl);
      setPortfolioPhotos(artisan.portfolioPhotos ?? []);
      setInitializedId(artisan.id);
    }
  }, [artisan, initializedId]);

  if (artisansLoading || customerLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!artisan) return <NotFoundState />;

  const isOwner = !!(customer && artisan.ownerCustomerId && customer.id === artisan.ownerCustomerId);
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-foreground mb-2">Not authorized</h2>
          <p className="text-muted-foreground mb-6 text-sm">Only the owner of this listing can edit it.</p>
          <button
            onClick={() => setLocation(`/artisans/${artisan.id}`)}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-all"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

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

  function validateAndTouch(): boolean {
    const allTouched = Object.fromEntries(
      (Object.keys(form) as (keyof FormData)[]).map((k) => [k, true])
    );
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (!photoUrl) {
      setPhotoError("A profile photo is required.");
    }
    return Object.keys(errs).length === 0 && !!photoUrl;
  }

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAndTouch()) {
      setShowPreview(true);
    }
  };

  const performSave = async () => {
    setSaving(true);
    try {
      const fields: ArtisanEditableFields = {
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
      };
      await updateArtisan(artisan.id, fields);
      setLocation(`/artisans/${artisan.id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAndTouch()) {
      setShowPreview(true);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => setLocation(`/artisans/${artisan.id}`)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
              data-testid="button-back-to-profile"
            >
              <ArrowLeft size={16} />
              <span>Back to Profile</span>
            </button>
            <div className="w-px h-5 bg-border" />
            <span className="font-bold text-primary text-lg">Gyara</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground" data-testid="page-heading">
            Edit Profile
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Update your listing details — changes are visible immediately.
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

          {/* Category + State + LGA */}
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
                rows={4}
                className={`${inputClass(!!errors.bio)} pl-10 resize-none`}
                data-testid="input-bio"
              />
            </div>
            <p className="text-xs text-muted-foreground">{form.bio.length}/200 — minimum 20 characters</p>
          </Field>

          {/* Availability + Pricing */}
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
              <p className="text-xs text-muted-foreground">Optional</p>
            </Field>
          </div>

          {/* Photos section */}
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
                    htmlFor="edit-profile-photo-input"
                    className="cursor-pointer inline-flex items-center gap-2 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/70 transition-all"
                  >
                    <Camera size={14} />
                    {photoUrl ? "Change Photo" : "Upload Photo"}
                  </label>
                  <input
                    id="edit-profile-photo-input"
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
                    htmlFor="edit-portfolio-photo-input"
                    className="aspect-square rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/70 transition-all gap-1"
                  >
                    <Plus size={20} className="text-muted-foreground/60" />
                    <span className="text-xs text-muted-foreground font-medium">Add photo</span>
                    <input
                      id="edit-portfolio-photo-input"
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

          {/* Action buttons */}
          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={handlePreview}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-primary/40 text-primary py-3.5 rounded-xl font-bold text-base hover:bg-primary/5 hover:border-primary/60 transition-all"
              data-testid="button-preview"
            >
              <Eye size={18} />
              Preview
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-base hover:bg-primary/90 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              data-testid="button-save"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Preview modal */}
      {showPreview && (
        <ProfilePreviewModal
          preview={{
            name: form.name.trim(),
            category: form.category,
            location: form.location.trim(),
            experience: parseInt(form.experience) || 0,
            bio: form.bio.trim(),
            availability: form.availability as Availability,
            pricing: form.pricing.trim() || undefined,
            photoUrl: photoUrl,
            portfolioPhotos: portfolioPhotos,
            initials: artisan.initials,
            color: artisan.color,
            isVerified: artisan.isVerified,
          }}
          saving={saving}
          onBack={() => setShowPreview(false)}
          onConfirm={() => void performSave()}
        />
      )}
    </div>
  );
}
