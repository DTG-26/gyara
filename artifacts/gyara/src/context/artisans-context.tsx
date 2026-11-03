import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type Availability = "Available" | "Busy" | "By appointment";

export interface Review {
  id: number;
  reviewerName: string;
  customerId?: string;
  isVerifiedHire?: boolean;
  rating: number;
  comment: string;
  photoUrl?: string;
  createdAt: string;
}

export interface ArtisanHire {
  customerId: string;
  hiredAt: string;
}

export interface Artisan {
  id: number;
  name: string;
  category: string;
  location: string;
  experience: number;
  phone: string;
  rating: number;
  jobs: number;
  initials: string;
  color: string;
  bio: string;
  availability?: Availability;
  pricing?: string;
  photoUrl?: string;
  portfolioPhotos?: string[];
  reviews?: Review[];
  hires?: ArtisanHire[];
  isNew?: boolean;
  isDemo?: boolean;
  isVerified?: boolean;
  ownerCustomerId?: string;
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-indigo-500", "bg-yellow-500", "bg-amber-500",
  "bg-amber-700", "bg-orange-600", "bg-purple-500", "bg-pink-500",
  "bg-cyan-500", "bg-teal-500", "bg-orange-500", "bg-red-500",
  "bg-green-600", "bg-emerald-500", "bg-violet-500", "bg-rose-500",
];

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function pickColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const SAVED_KEY = "gyara_saved";

function loadSavedIds(): number[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as number[];
  } catch {
    return [];
  }
}

interface DbReview {
  id: number;
  reviewer_name: string;
  customer_id: string | null;
  is_verified_hire: boolean | null;
  rating: number;
  comment: string;
  photo_url: string | null;
  created_at: string;
}

interface DbHire {
  customer_id: string;
  hired_at: string;
}

interface DbArtisan {
  id: number;
  name: string;
  category: string;
  location: string;
  experience: number;
  phone: string;
  rating: number;
  jobs: number;
  initials: string;
  color: string;
  bio: string;
  availability: string | null;
  pricing: string | null;
  photo_url: string | null;
  portfolio_photos: string[] | null;
  is_new: boolean | null;
  is_demo: boolean | null;
  is_verified: boolean | null;
  owner_customer_id: string | null;
  reviews?: DbReview[];
  hires?: DbHire[];
}

function mapReview(r: DbReview): Review {
  return {
    id: r.id,
    reviewerName: r.reviewer_name,
    customerId: r.customer_id ?? undefined,
    isVerifiedHire: r.is_verified_hire ?? undefined,
    rating: r.rating,
    comment: r.comment,
    photoUrl: r.photo_url ?? undefined,
    createdAt: r.created_at,
  };
}

function mapHire(h: DbHire): ArtisanHire {
  return { customerId: h.customer_id, hiredAt: h.hired_at };
}

function mapArtisan(a: DbArtisan): Artisan {
  return {
    id: a.id,
    name: a.name,
    category: a.category,
    location: a.location,
    experience: a.experience,
    phone: a.phone,
    rating: Number(a.rating),
    jobs: a.jobs,
    initials: a.initials,
    color: a.color,
    bio: a.bio,
    availability: (a.availability as Availability) ?? undefined,
    pricing: a.pricing ?? undefined,
    photoUrl: a.photo_url ?? undefined,
    portfolioPhotos: a.portfolio_photos ?? undefined,
    isNew: a.is_new ?? undefined,
    isDemo: a.is_demo ?? undefined,
    isVerified: a.is_verified ?? undefined,
    ownerCustomerId: a.owner_customer_id ?? undefined,
    reviews: (a.reviews ?? []).map(mapReview),
    hires: (a.hires ?? []).map(mapHire),
  };
}

async function fetchArtisans(): Promise<Artisan[]> {
  const { data, error } = await supabase
    .from("artisans")
    .select("*, reviews(*), hires(*)")
    .order("is_verified", { ascending: false })
    .order("rating", { ascending: false });
  if (!error && data) {
    return (data as DbArtisan[]).map(mapArtisan);
  }
  const fallback = await supabase
    .from("artisans")
    .select("*")
    .order("is_verified", { ascending: false })
    .order("rating", { ascending: false });
  if (fallback.error || !fallback.data) return [];
  return (fallback.data as DbArtisan[]).map(mapArtisan);
}

export async function fetchArtisanDetail(id: number): Promise<{ reviews: Review[]; hires: ArtisanHire[] }> {
  const { data, error } = await supabase
    .from("artisans")
    .select("reviews(*), hires(*)")
    .eq("id", id)
    .single();
  if (error || !data) return { reviews: [], hires: [] };
  const row = data as { reviews: DbReview[]; hires: DbHire[] };
  return {
    reviews: (row.reviews ?? []).map(mapReview),
    hires: (row.hires ?? []).map(mapHire),
  };
}

export type ArtisanEditableFields = Pick<
  Artisan,
  "name" | "phone" | "category" | "location" | "experience" | "bio" | "availability" | "pricing" | "photoUrl" | "portfolioPhotos"
>;

interface ArtisansContextValue {
  artisans: Artisan[];
  loading: boolean;
  addArtisan: (data: Omit<Artisan, "id" | "initials" | "color" | "rating" | "jobs" | "isNew" | "reviews" | "isDemo">) => Promise<string | null>;
  addReview: (artisanId: number, review: Omit<Review, "id" | "createdAt">) => Promise<number | null>;
  markAsHired: (artisanId: number, customerId: string) => Promise<boolean>;
  updateArtisan: (id: number, fields: ArtisanEditableFields) => Promise<void>;
  deleteArtisan: (id: number) => Promise<void>;
  savedIds: number[];
  toggleSaved: (id: number) => void;
  resetToDemo: () => Promise<void>;
}

const ArtisansContext = createContext<ArtisansContextValue>({
  artisans: [],
  loading: true,
  addArtisan: async () => null,
  addReview: async () => null,
  markAsHired: async () => false,
  updateArtisan: async () => {},
  deleteArtisan: async () => {},
  savedIds: [],
  toggleSaved: () => {},
  resetToDemo: async () => {},
});

export function ArtisansProvider({ children }: { children: ReactNode }) {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<number[]>(loadSavedIds);

  useEffect(() => {
    fetchArtisans().then((data) => {
      setArtisans(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(savedIds));
    } catch {}
  }, [savedIds]);

  const addArtisan = async (
    data: Omit<Artisan, "id" | "initials" | "color" | "rating" | "jobs" | "isNew" | "reviews" | "isDemo">
  ): Promise<string | null> => {
    const { data: inserted, error } = await supabase
      .from("artisans")
      .insert({
        name: data.name,
        category: data.category,
        location: data.location,
        experience: data.experience,
        phone: data.phone,
        rating: 0,
        jobs: 0,
        initials: getInitials(data.name),
        color: pickColor(data.name),
        bio: data.bio,
        availability: data.availability ?? "Available",
        pricing: data.pricing ?? null,
        photo_url: data.photoUrl ?? null,
        portfolio_photos: data.portfolioPhotos ?? null,
        is_new: true,
        is_demo: false,
        is_verified: false,
        owner_customer_id: data.ownerCustomerId ?? null,
      })
      .select("id, name, category, location, experience, phone, rating, jobs, initials, color, bio, availability, pricing, photo_url, portfolio_photos, is_new, is_demo, is_verified, owner_customer_id")
      .single();

    if (error) return error.message;
    if (inserted) {
      setArtisans((prev) => [
        mapArtisan({ ...(inserted as DbArtisan), reviews: [], hires: [] }),
        ...prev,
      ]);
    }
    return null;
  };

  const addReview = async (artisanId: number, review: Omit<Review, "id" | "createdAt">): Promise<number | null> => {
    const { data: newReview, error } = await supabase
      .from("reviews")
      .insert({
        artisan_id: artisanId,
        reviewer_name: review.reviewerName,
        customer_id: review.customerId ?? null,
        is_verified_hire: review.isVerifiedHire ?? false,
        rating: review.rating,
        comment: review.comment,
        photo_url: review.photoUrl ?? null,
      })
      .select()
      .single();

    if (error || !newReview) return null;

    const { data: allReviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("artisan_id", artisanId);

    const ratings = (allReviews ?? []).map((r) => r.rating as number);
    const newRating =
      ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;

    await supabase.from("artisans").update({ rating: newRating }).eq("id", artisanId);

    setArtisans((prev) =>
      prev.map((a) => {
        if (a.id !== artisanId) return a;
        const mapped = mapReview(newReview as DbReview);
        const updatedReviews = [mapped, ...(a.reviews ?? [])];
        return { ...a, reviews: updatedReviews, rating: newRating };
      })
    );

    return (newReview as DbReview).id;
  };

  const markAsHired = async (artisanId: number, customerId: string): Promise<boolean> => {
    const artisan = artisans.find((a) => a.id === artisanId);
    if (!artisan) return false;
    const alreadyHired = (artisan.hires ?? []).some((h) => h.customerId === customerId);
    if (alreadyHired) return false;

    const { error } = await supabase
      .from("hires")
      .insert({ artisan_id: artisanId, customer_id: customerId });

    if (error) return false;

    const newJobs = artisan.jobs + 1;
    await supabase.from("artisans").update({ jobs: newJobs }).eq("id", artisanId);

    setArtisans((prev) =>
      prev.map((a) =>
        a.id !== artisanId
          ? a
          : {
              ...a,
              hires: [...(a.hires ?? []), { customerId, hiredAt: new Date().toISOString() }],
              jobs: newJobs,
            }
      )
    );
    return true;
  };

  const updateArtisan = async (id: number, fields: ArtisanEditableFields) => {
    const { error } = await supabase
      .from("artisans")
      .update({
        name: fields.name,
        phone: fields.phone,
        category: fields.category,
        location: fields.location,
        experience: fields.experience,
        bio: fields.bio,
        availability: fields.availability ?? "Available",
        pricing: fields.pricing ?? null,
        photo_url: fields.photoUrl ?? null,
        portfolio_photos: fields.portfolioPhotos ?? null,
        initials: getInitials(fields.name),
        color: pickColor(fields.name),
      })
      .eq("id", id);

    if (!error) {
      setArtisans((prev) =>
        prev.map((a) =>
          a.id !== id
            ? a
            : { ...a, ...fields, initials: getInitials(fields.name), color: pickColor(fields.name) }
        )
      );
    }
  };

  const deleteArtisan = async (id: number) => {
    const { error } = await supabase.from("artisans").delete().eq("id", id);
    if (!error) setArtisans((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleSaved = (id: number) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const resetToDemo = async () => {
    setLoading(true);
    const data = await fetchArtisans();
    setArtisans(data);
    setLoading(false);
  };

  return (
    <ArtisansContext.Provider
      value={{ artisans, loading, addArtisan, addReview, markAsHired, updateArtisan, deleteArtisan, savedIds, toggleSaved, resetToDemo }}
    >
      {children}
    </ArtisansContext.Provider>
  );
}

export function useArtisans() {
  return useContext(ArtisansContext);
}
