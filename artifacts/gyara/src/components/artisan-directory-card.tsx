import { useLocation } from "wouter";
import {
  Phone, MessageCircle, MapPin, Briefcase, Star,
  Wrench, Bookmark, BookmarkCheck, BadgeCheck, Sparkles,
} from "lucide-react";
import { type Artisan, type Availability } from "@/context/artisans-context";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/data/categories";
import { normalizeNigerianPhone } from "@/lib/phone";

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  if (reviewCount === 0 && rating <= 0) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-xs text-muted-foreground italic">No rating</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-1">
        <Star size={13} className="text-yellow-400 fill-yellow-400" />
        <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
      </div>
      {reviewCount > 0 && (
        <span className="text-xs text-muted-foreground">
          {reviewCount} review{reviewCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

const AVAILABILITY_BADGE: Record<Availability, string> = {
  "Available": "bg-green-100 text-green-700",
  "Busy": "bg-red-100 text-red-700",
  "By appointment": "bg-amber-100 text-amber-700",
};

export function ArtisanDirectoryCard({
  artisan,
  isSaved,
  onToggleSaved,
  isPreview = false,
}: {
  artisan: Artisan;
  isSaved: boolean;
  onToggleSaved: () => void;
  isPreview?: boolean;
}) {
  const [, setLocation] = useLocation();
  const Icon = CATEGORY_ICONS[artisan.category] ?? Wrench;
  const categoryColor = CATEGORY_COLORS[artisan.category] ?? "bg-gray-100 text-gray-700";
  const whatsappDigits = normalizeNigerianPhone(artisan.phone) ?? artisan.phone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Hi ${artisan.name}, I found you on Gyara and I'd like to hire you for ${artisan.category} services.`)}`;
  const availability = artisan.availability ?? "Available";

  return (
    <div
      className={`bg-background border rounded-2xl p-5 flex flex-col gap-4 ${
        artisan.isNew ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
      } ${!isPreview ? "hover:shadow-lg hover:-translate-y-0.5 transition-all" : ""}`}
      data-testid={`card-artisan-${artisan.id}`}
    >
      <div className="flex items-center justify-between min-h-[20px]">
        <div className="flex items-center gap-1.5">
          {artisan.isVerified && (
            <div className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-100">
              <BadgeCheck size={11} />
              Verified
            </div>
          )}
          {artisan.isNew && (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
              <Sparkles size={11} />
              New
            </div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); if (!isPreview) onToggleSaved(); }}
          className={`p-1.5 rounded-lg transition-all ${
            isSaved
              ? "text-primary bg-primary/10 hover:bg-primary/20"
              : "text-muted-foreground hover:text-primary hover:bg-muted"
          } ${isPreview ? "pointer-events-none" : ""}`}
          aria-label={isSaved ? "Remove from saved" : "Save artisan"}
          data-testid={`button-save-${artisan.id}`}
          tabIndex={isPreview ? -1 : 0}
        >
          {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      </div>

      <div className="flex items-start gap-4">
        {artisan.photoUrl ? (
          <img
            src={artisan.photoUrl}
            alt={artisan.name}
            className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border border-border"
          />
        ) : (
          <div className={`${artisan.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
            {artisan.initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-base leading-tight truncate">{artisan.name}</h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor}`}>
              <Icon size={11} />
              {artisan.category}
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${AVAILABILITY_BADGE[availability]}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                availability === "Available" ? "bg-green-500" : availability === "Busy" ? "bg-red-500" : "bg-amber-500"
              }`} />
              {availability}
            </span>
          </div>
        </div>
        <StarRating rating={artisan.rating} reviewCount={(artisan.reviews ?? []).length} />
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{artisan.bio}</p>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin size={12} className="text-primary/70" />
          {artisan.location}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase size={12} className="text-primary/70" />
          {artisan.experience} yrs experience
        </span>
        <span className="flex items-center gap-1 text-muted-foreground/70">
          {artisan.jobs} jobs done
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-foreground/80">
        <Phone size={13} className="text-primary/70" />
        <span>{artisan.phone}</span>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => { if (!isPreview) setLocation(`/artisans/${artisan.id}`); }}
          className={`flex-1 flex items-center justify-center gap-1.5 border border-border rounded-xl py-2.5 text-sm font-semibold text-foreground hover:border-primary/40 hover:bg-muted/50 transition-all ${isPreview ? "pointer-events-none" : ""}`}
          data-testid={`button-view-profile-${artisan.id}`}
          tabIndex={isPreview ? -1 : 0}
        >
          View Profile
        </button>
        <a
          href={isPreview ? undefined : whatsappUrl}
          target={isPreview ? undefined : "_blank"}
          rel="noopener noreferrer"
          onClick={isPreview ? (e) => e.preventDefault() : undefined}
          className={`flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#1ebe5d] transition-all ${isPreview ? "pointer-events-none" : ""}`}
          data-testid={`button-whatsapp-${artisan.id}`}
        >
          <MessageCircle size={14} />
          WhatsApp
        </a>
        <a
          href={isPreview ? undefined : `tel:${artisan.phone}`}
          onClick={isPreview ? (e) => e.preventDefault() : undefined}
          className={`flex items-center justify-center border border-border rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40 hover:bg-muted/50 transition-all ${isPreview ? "pointer-events-none" : ""}`}
          data-testid={`button-call-${artisan.id}`}
          title={`Call ${artisan.name}`}
        >
          <Phone size={14} />
        </a>
      </div>
    </div>
  );
}
