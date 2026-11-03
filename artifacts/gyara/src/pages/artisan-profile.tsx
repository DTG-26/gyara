import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Phone, MapPin, Briefcase,
  Star, Wrench, BadgeCheck,
  DollarSign, Clock, UserPlus, Send, Pencil, Trash2, AlertTriangle, Share2, Check, ShieldCheck, CheckCircle, Loader2,
  MessageSquare, Camera, X as XIcon, Eye,
} from "lucide-react";
import { useArtisans, fetchArtisanDetail, type Artisan, type Availability, type Review, type ArtisanHire } from "@/context/artisans-context";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/data/categories";
import { useCustomer } from "@/context/customer-context";
import { useMessages } from "@/context/messages-context";
import { VERIFY_EMAIL_SENTINEL } from "@/lib/supabase";
import { compressImage } from "@/utils/image";
import { sendReviewNotification } from "@/lib/notifications";
import { ArtisanDirectoryCard } from "@/components/artisan-directory-card";

const AVAILABILITY_STYLES: Record<Availability, string> = {
  "Available": "bg-green-100 text-green-700 border-green-200",
  "Busy": "bg-red-100 text-red-700 border-red-200",
  "By appointment": "bg-amber-100 text-amber-700 border-amber-200",
};

function AvailabilityBadge({ status }: { status: Availability }) {
  const style = AVAILABILITY_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === "Available" ? "bg-green-500" : status === "Busy" ? "bg-red-500" : "bg-amber-500"
      }`} />
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? "s" : ""} ago`;
  return d.toLocaleDateString("en-NG", { month: "short", year: "numeric" });
}

function ReviewItem({ review }: { review: Review }) {
  const initials = review.reviewerName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const [lightbox, setLightbox] = useState(false);
  return (
    <div className="flex gap-3 py-4 border-b border-border last:border-0 last:pb-0">
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{review.reviewerName}</span>
            {review.isVerifiedHire && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 font-semibold px-2 py-0.5 rounded-full">
                <ShieldCheck size={10} />
                Verified Hire
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(review.createdAt)}</span>
        </div>
        <div className="flex items-center gap-0.5 mb-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={12}
              className={i <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}
            />
          ))}
        </div>
        {review.comment && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">{review.comment}</p>
        )}
        {review.photoUrl && (
          <>
            <button
              onClick={() => setLightbox(true)}
              className="block w-20 h-20 rounded-lg overflow-hidden border border-border"
              data-testid={`review-photo-${review.id}`}
            >
              <img src={review.photoUrl} alt="Review attachment" className="w-full h-full object-cover hover:scale-105 transition-transform" />
            </button>
            {lightbox && (
              <div
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                onClick={() => setLightbox(false)}
              >
                <img src={review.photoUrl} alt="Review attachment" className="max-w-full max-h-full rounded-xl" />
                <button
                  onClick={() => setLightbox(false)}
                  className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2"
                  aria-label="Close"
                >
                  <XIcon size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ReviewSection({
  artisanId,
  artisanName,
  reviews,
  hires,
  ownerCustomerId,
  onHired,
  onReviewAdded,
}: {
  artisanId: number;
  artisanName: string;
  reviews: Review[];
  hires: ArtisanHire[];
  ownerCustomerId?: string;
  onHired: (customerId: string) => void;
  onReviewAdded: (review: Review) => void;
}) {
  const { customer, login, signup, logout } = useCustomer();
  const { addReview, markAsHired } = useArtisans();

  const isOwner = !!(customer && ownerCustomerId && customer.id === ownerCustomerId);
  const isHired = customer ? hires.some((h) => h.customerId === customer.id) : false;
  const alreadyReviewed = customer
    ? reviews.some((r) => r.customerId === customer.id)
    : false;

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState(false);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewPhoto, setReviewPhoto] = useState<string | undefined>(undefined);
  const [reviewError, setReviewError] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleReviewPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const compressed = await compressImage(file, 800, 800, 0.8);
      setReviewPhoto(compressed);
    } catch {}
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const err =
        authMode === "signin"
          ? await login(authForm.email, authForm.password)
          : await signup(authForm.name, authForm.email, authForm.password);
      if (err === VERIFY_EMAIL_SENTINEL) {
        setVerifyEmail(true);
      } else if (err) {
        setAuthError(err);
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewError("");
    if (rating === 0) { setReviewError("Please select a star rating."); return; }
    if (!comment.trim()) { setReviewError("Please write a short comment."); return; }
    setReviewLoading(true);
    try {
      const reviewId = await addReview(artisanId, {
        reviewerName: customer!.name,
        customerId: customer!.id,
        isVerifiedHire: true,
        rating,
        comment: comment.trim(),
        photoUrl: reviewPhoto,
      });
      setSubmitted(true);
      if (reviewId) {
        sendReviewNotification({ artisanId, reviewId });
        onReviewAdded({
          id: reviewId,
          reviewerName: customer!.name,
          customerId: customer!.id,
          isVerifiedHire: true,
          rating,
          comment: comment.trim(),
          photoUrl: reviewPhoto,
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setReviewLoading(false);
    }
  }

  const inputClass =
    `w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10`;

  return (
    <div className="mt-5 pt-5 border-t border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Leave a Review</h3>
        {customer && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              Signed in as{" "}
              <span className="font-semibold text-foreground">{customer.name}</span>
            </span>
            <button onClick={logout} className="text-primary hover:underline font-medium">
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Step 1: Not logged in */}
      {!customer && (
        <div className="bg-muted/40 border border-border rounded-2xl p-5" data-testid="auth-gate">
          {verifyEmail ? (
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={28} className="text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm mb-1">Check your inbox</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We sent a verification link to{" "}
                  <span className="font-semibold text-foreground">{authForm.email}</span>.
                  Click it to activate your account, then come back to sign in.
                </p>
              </div>
              <p className="text-xs text-muted-foreground bg-muted/60 border border-border rounded-xl px-4 py-2.5 w-full text-left leading-relaxed">
                <span className="font-semibold text-foreground">Didn't receive it?</span> Check your spam folder. The link expires in 24 hours.
              </p>
              <button
                onClick={() => { setVerifyEmail(false); setAuthMode("signin"); }}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                You need a customer account to leave a review and rating.
              </p>
              <div className="flex border border-border rounded-xl overflow-hidden mb-4 w-fit">
                <button
                  onClick={() => { setAuthMode("signin"); setAuthError(""); }}
                  className={`px-4 py-2 text-sm font-semibold transition-all ${authMode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid="tab-signin"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthMode("signup"); setAuthError(""); }}
                  className={`px-4 py-2 text-sm font-semibold transition-all ${authMode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid="tab-signup"
                >
                  Create Account
                </button>
              </div>
              <form onSubmit={handleAuth} noValidate className="space-y-3" data-testid="auth-form">
                {authMode === "signup" && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={authForm.name}
                    onChange={(e) => setAuthForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputClass}
                    data-testid="input-auth-name"
                  />
                )}
                <input
                  type="email"
                  placeholder="Email address"
                  value={authForm.email}
                  onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputClass}
                  data-testid="input-auth-email"
                />
                <input
                  type="password"
                  placeholder={authMode === "signup" ? "Password (min 6 characters)" : "Password"}
                  value={authForm.password}
                  onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                  className={inputClass}
                  data-testid="input-auth-password"
                />
                {authError && <p className="text-xs text-destructive font-medium">⚠ {authError}</p>}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  data-testid="button-auth-submit"
                >
                  {authLoading ? "Please wait…" : authMode === "signin" ? "Sign In" : "Create Account"}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Owner — cannot hire or review themselves */}
      {isOwner && (
        <div className="border border-border rounded-2xl p-5 bg-muted/30" data-testid="owner-gate">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldCheck size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm mb-1">This is your listing</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You can't hire or review yourself. Go to your profile to make edits.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Logged in but not hired */}
      {customer && !isOwner && !isHired && !alreadyReviewed && (
        <div className="border border-border rounded-2xl p-5 bg-muted/30" data-testid="hire-gate">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldCheck size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm mb-1">
                Did you hire {artisanName}?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Only customers who have actually worked with this artisan can leave a review.
                Confirming your hire unlocks the review form.
              </p>
              <button
                onClick={() => void markAsHired(artisanId, customer.id).then((ok) => { if (ok) onHired(customer.id); })}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all"
                data-testid="button-mark-hired"
              >
                <Check size={14} />
                Yes, I hired this artisan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Already reviewed */}
      {customer && !isOwner && alreadyReviewed && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3" data-testid="already-reviewed">
          <ShieldCheck size={16} className="text-green-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-800">
            You've already reviewed this artisan. Thank you!
          </p>
        </div>
      )}

      {/* Success after submit */}
      {customer && !isOwner && isHired && !alreadyReviewed && submitted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3" data-testid="review-success">
          <ShieldCheck size={16} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Verified review submitted — thank you!</p>
            <p className="text-xs text-green-700">Your feedback helps others find great artisans.</p>
          </div>
        </div>
      )}

      {/* Step 3: Hired — show review form */}
      {customer && !isOwner && isHired && !alreadyReviewed && !submitted && (
        <form onSubmit={(e) => void handleReview(e)} noValidate className="space-y-4" data-testid="review-form">
          <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
            <ShieldCheck size={14} className="text-green-600 flex-shrink-0" />
            <span className="text-green-800 font-medium">Verified hire · reviewing as</span>
            <span className="font-bold text-green-900">{customer.name}</span>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-2">
              Your Rating <span className="text-primary">*</span>
            </label>
            <div className="flex items-center gap-1" data-testid="star-picker">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setRating(i); setReviewError(""); }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                  data-testid={`star-${i}`}
                >
                  <Star
                    size={28}
                    className={
                      (hover || rating) >= i
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground/30"
                    }
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-semibold text-foreground">
                  {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">
              Comment <span className="text-primary">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => { setComment(e.target.value); setReviewError(""); }}
              placeholder="How was their work? Were they punctual? Would you recommend them?"
              rows={3}
              className={`${inputClass} resize-none`}
              data-testid="input-review-comment"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">
              Photo <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            {reviewPhoto ? (
              <div className="relative w-24 h-24">
                <img src={reviewPhoto} alt="Review attachment preview" className="w-full h-full object-cover rounded-xl border border-border" />
                <button
                  type="button"
                  onClick={() => setReviewPhoto(undefined)}
                  className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1 shadow-sm hover:bg-muted"
                  aria-label="Remove photo"
                  data-testid="button-remove-review-photo"
                >
                  <XIcon size={12} />
                </button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 border border-dashed border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground cursor-pointer hover:border-primary/40 hover:text-primary transition-all">
                <Camera size={16} />
                Add a photo of the work
                <input type="file" accept="image/*" className="hidden" onChange={(e) => void handleReviewPhoto(e)} data-testid="input-review-photo" />
              </label>
            )}
          </div>

          {reviewError && <p className="text-xs text-destructive font-medium">⚠ {reviewError}</p>}

          <button
            type="submit"
            disabled={reviewLoading}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            data-testid="button-submit-review"
          >
            <Send size={14} />
            {reviewLoading ? "Submitting…" : "Submit Verified Review"}
          </button>
        </form>
      )}
    </div>
  );
}

function NotFoundState() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus size={32} className="text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Artisan not found</h2>
        <p className="text-muted-foreground mb-6 text-sm">This artisan may have removed their listing.</p>
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

function useShareProfile(artisan: Artisan) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function share() {
    const url = window.location.href;
    const title = `${artisan.name} — ${artisan.category} on Gyara`;
    const text = `Check out ${artisan.name}, a ${artisan.category} on Gyara.`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // clipboard unavailable — silently ignore
    }
  }

  return { share, copied };
}

export default function ArtisanProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { artisans, loading: artisansLoading, deleteArtisan } = useArtisans();
  const { customer } = useCustomer();
  const { unreadTotal } = useMessages();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const artisan: Artisan | undefined = artisans.find((a) => String(a.id) === id);
  const { share, copied } = useShareProfile(artisan ?? ({} as Artisan));

  const [reviews, setReviews] = useState<Review[]>([]);
  const [hires, setHires] = useState<ArtisanHire[]>([]);
  const [detailLoading, setDetailLoading] = useState(true);

  useEffect(() => {
    if (!artisan) return;
    setDetailLoading(true);
    fetchArtisanDetail(artisan.id).then(({ reviews: r, hires: h }) => {
      setReviews(r);
      setHires(h);
      setDetailLoading(false);
    });
  }, [artisan?.id]);

  if (!artisan) {
    if (artisansLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return <NotFoundState />;
  }

  const isOwner = !!(customer && artisan.ownerCustomerId && customer.id === artisan.ownerCustomerId);

  const Icon = CATEGORY_ICONS[artisan.category] ?? Wrench;
  const categoryColor = CATEGORY_COLORS[artisan.category] ?? "bg-gray-100 text-gray-700";
  const availability = artisan.availability ?? "Available";
  const reviewCount = reviews.length;
  const computedRating =
    reviewCount === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / reviewCount;

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => setLocation("/artisans")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
              data-testid="button-back-to-directory"
            >
              <ArrowLeft size={16} />
              <span>Artisans</span>
            </button>
            <div className="w-px h-5 bg-border" />
            <span className="font-bold text-primary text-lg">Gyara</span>
            <div className="flex-1" />
            {customer && (
              <button
                onClick={() => setLocation("/messages")}
                title="Messages"
                className="relative w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all flex-shrink-0"
                data-testid="button-messages-nav"
              >
                <MessageSquare size={15} />
                {unreadTotal > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadTotal > 9 ? "9+" : unreadTotal}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Profile card */}
        <div className="bg-background border border-border rounded-2xl p-6 sm:p-8 mb-5">

          {/* Avatar + name row */}
          <div className="flex items-start gap-5 mb-5">
            {artisan.photoUrl ? (
              <img
                src={artisan.photoUrl}
                alt={artisan.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover flex-shrink-0 border border-border"
              />
            ) : (
              <div className={`${artisan.color} w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white font-bold text-2xl sm:text-3xl flex-shrink-0`}>
                {artisan.initials}
              </div>
            )}
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight mb-2" data-testid="profile-name">
                {artisan.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor}`}>
                  <Icon size={11} />
                  {artisan.category}
                </span>
                <AvailabilityBadge status={availability} />
                {artisan.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    <BadgeCheck size={11} />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rating row */}
          <div className="flex items-center gap-2 mb-5 pb-5 border-b border-border flex-wrap">
            {reviewCount > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i <= Math.round(computedRating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}
                    />
                  ))}
                </div>
                <span className="font-semibold text-foreground">{computedRating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  · {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground italic">No rating yet</span>
            )}
            <span className="text-muted-foreground/50">·</span>
            <span className="text-sm text-muted-foreground">{artisan.jobs} jobs done</span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="flex items-center gap-3 p-3.5 bg-muted/40 rounded-xl">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Location</p>
                <p className="text-sm font-semibold text-foreground">{artisan.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-muted/40 rounded-xl">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Briefcase size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Experience</p>
                <p className="text-sm font-semibold text-foreground">{artisan.experience} year{artisan.experience !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {artisan.pricing && (
              <div className="flex items-center gap-3 p-3.5 bg-muted/40 rounded-xl sm:col-span-2">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Pricing / Rate</p>
                  <p className="text-sm font-semibold text-foreground">{artisan.pricing}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3.5 bg-muted/40 rounded-xl sm:col-span-2">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Availability</p>
                <p className="text-sm font-semibold text-foreground">{availability}</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h2>
            <p className="text-sm text-foreground leading-relaxed">{artisan.bio}</p>
          </div>

          {/* Portfolio photos */}
          {artisan.portfolioPhotos && artisan.portfolioPhotos.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Work Portfolio</h2>
              <div className={`grid gap-2 ${artisan.portfolioPhotos.length === 1 ? "grid-cols-1" : artisan.portfolioPhotos.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
                {artisan.portfolioPhotos.map((photo, i) => (
                  <div
                    key={i}
                    className={`overflow-hidden rounded-xl border border-border ${artisan.portfolioPhotos!.length === 1 ? "aspect-video" : "aspect-square"}`}
                  >
                    <img
                      src={photo}
                      alt={`${artisan.name} work sample ${i + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact buttons */}
          <div className="flex gap-3 mb-3">
            <a
              href={`tel:${artisan.phone}`}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-border rounded-xl py-3 text-sm font-bold text-foreground hover:border-primary/40 hover:bg-muted/50 transition-all"
              data-testid="button-call"
            >
              <Phone size={16} />
              Call {artisan.name.split(" ")[0]}
            </a>
            {customer && customer.id !== artisan.ownerCustomerId && (
              <button
                onClick={() => setLocation(`/messages/${artisan.id}/${customer.id}`)}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold hover:bg-primary/90 transition-all"
                data-testid="button-message-artisan"
              >
                <MessageSquare size={16} />
                Message {artisan.name.split(" ")[0]}
              </button>
            )}
          </div>

          {/* Share button */}
          <button
            onClick={share}
            className="w-full flex items-center justify-center gap-2 border-2 border-primary/30 text-primary rounded-xl py-3 text-sm font-bold hover:bg-primary/5 hover:border-primary/60 transition-all mb-3"
            data-testid="button-share-profile"
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            {copied ? "Link copied!" : "Share Profile"}
          </button>

          {/* Artisan management actions — visible to listing owner only */}
          {isOwner && (
            <>
              <div className="flex gap-3 pt-3 border-t border-border">
                <button
                  onClick={() => setLocation(`/artisans/${artisan.id}/edit`)}
                  className="flex-1 flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-sm font-semibold text-foreground hover:border-primary/50 hover:bg-muted/50 transition-all"
                  data-testid="button-edit-profile"
                >
                  <Pencil size={14} />
                  Edit Profile
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 flex items-center justify-center gap-2 border border-red-200 rounded-xl py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
                  data-testid="button-remove-listing"
                >
                  <Trash2 size={14} />
                  Remove Listing
                </button>
              </div>

              {/* Delete confirmation panel */}
              {showDeleteConfirm && (
                <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-xl" data-testid="delete-confirm-panel">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle size={14} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-900">Remove this listing?</p>
                      <p className="text-xs text-red-700 mt-0.5">
                        This will permanently remove <strong>{artisan.name}</strong> from the Gyara directory. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await deleteArtisan(artisan.id);
                        setLocation("/artisans");
                      }}
                      className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                      data-testid="button-confirm-delete"
                    >
                      Yes, Remove
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 bg-white border border-red-200 text-red-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
                      data-testid="button-cancel-delete"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Directory card preview — visible to listing owner only */}
        {isOwner && (
          <div className="mb-5" data-testid="directory-card-preview">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={15} className="text-primary" />
              <h2 className="font-semibold text-foreground text-sm">How customers see you in search</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              This is your card on the artisan directory. It updates automatically when you save changes.
            </p>
            <ArtisanDirectoryCard
              artisan={artisan}
              isSaved={false}
              onToggleSaved={() => {}}
              isPreview
            />
          </div>
        )}

        {/* Reviews section */}
        <div className="bg-background border border-border rounded-2xl p-6 sm:p-8 mb-5" data-testid="reviews-section">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-foreground text-lg">
              Reviews {reviewCount > 0 && <span className="text-muted-foreground font-normal text-base">({reviewCount})</span>}
            </h2>
            {reviewCount > 0 && (
              <div className="flex items-center gap-1.5">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-foreground text-sm">{computedRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {detailLoading ? (
            <div className="flex items-center gap-2 py-4 text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading reviews…</span>
            </div>
          ) : (
            <>
              {reviewCount === 0 && (
                <p className="text-sm text-muted-foreground mb-0">No reviews yet — be the first!</p>
              )}
              {reviewCount > 0 && (
                <div className="mt-4">
                  {reviews.map((review) => (
                    <ReviewItem key={review.id} review={review} />
                  ))}
                </div>
              )}
            </>
          )}

          <ReviewSection
            artisanId={artisan.id}
            artisanName={artisan.name}
            reviews={reviews}
            hires={hires}
            ownerCustomerId={artisan.ownerCustomerId}
            onHired={(customerId) =>
              setHires((prev) => [...prev, { customerId, hiredAt: new Date().toISOString() }])
            }
            onReviewAdded={(review) => setReviews((prev) => [review, ...prev])}
          />
        </div>

        {/* Back link */}
        <button
          onClick={() => setLocation("/artisans")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft size={15} />
          Back to artisan directory
        </button>
      </div>
    </div>
  );
}
