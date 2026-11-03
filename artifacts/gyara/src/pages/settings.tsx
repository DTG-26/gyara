import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, User, Lock, LogOut, Trash2, CheckCircle, Loader2, ChevronRight, AlertTriangle, Briefcase,
  Moon, Sun, Star, MessageSquare,
} from "lucide-react";
import { useCustomer } from "@/context/customer-context";
import { useArtisans } from "@/context/artisans-context";
import { useDarkMode } from "@/hooks/use-dark-mode";

const inputClass = (hasError: boolean) =>
  `w-full bg-muted/40 border rounded-xl px-4 py-3 text-sm outline-none transition-all ${
    hasError
      ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/10"
      : "border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
  }`;

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
}

function NotSignedIn() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <User size={28} className="text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Not signed in</h2>
        <p className="text-muted-foreground text-sm mb-6">Sign in to a customer account to access settings.</p>
        <button
          onClick={() => setLocation("/artisans")}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-all"
        >
          Go to Artisan Directory
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { customer, loading, logout, updateCustomer, deleteCustomer } = useCustomer();

  const [nameValue, setNameValue] = useState(customer?.name ?? "");
  const [nameError, setNameError] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (!customer) return <NotSignedIn />;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameValue.trim()) { setNameError("Name cannot be empty."); return; }
    setNameError("");
    setNameSaving(true);
    const err = await updateCustomer({ name: nameValue.trim() });
    setNameSaving(false);
    if (err) { setNameError(err); return; }
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw) { setPwError("Enter your current password."); return; }
    if (newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    setPwError("");
    setPwSaving(true);
    const err = await updateCustomer({ currentPassword: currentPw, newPassword: newPw });
    setPwSaving(false);
    if (err) { setPwError(err); return; }
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2500);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    const err = await deleteCustomer();
    setDeleting(false);
    if (err) {
      setDeleteError(err);
      return;
    }
    setLocation("/artisans");
  };

  const { isDark, toggle: toggleDark } = useDarkMode();

  const { artisans } = useArtisans();
  const myListing = artisans.find((a) => a.ownerCustomerId === customer.id);

  const myReviews = artisans.flatMap((a) =>
    (a.reviews ?? [])
      .filter((r) => r.customerId === customer.id)
      .map((r) => ({ ...r, artisanName: a.name, artisanId: a.id, artisanCategory: a.category }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => setLocation("/artisans")}
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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5">

        {/* Account card */}
        <div className="bg-background border border-border rounded-2xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0">
            {getInitials(customer.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-base truncate">{customer.name}</p>
            <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Member since {formatDate(customer.createdAt)}</p>
          </div>
        </div>

        {/* My Listing */}
        {myListing ? (
          <button
            onClick={() => setLocation(`/artisans/${myListing.id}`)}
            className="w-full bg-background border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-primary/40 hover:bg-muted/30 transition-all text-left"
            data-testid="my-listing-card"
          >
            {myListing.photoUrl ? (
              <img src={myListing.photoUrl} alt={myListing.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${myListing.color}`}>
                {myListing.initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-0.5">Your Artisan Listing</p>
              <p className="font-bold text-foreground truncate">{myListing.name}</p>
              <p className="text-sm text-muted-foreground truncate">{myListing.category} · {myListing.location}</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
          </button>
        ) : (
          <div className="bg-background border border-dashed border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Briefcase size={20} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">No artisan listing yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Register your trade to appear in the directory.</p>
            </div>
            <button
              onClick={() => setLocation("/become-artisan")}
              className="text-xs font-bold text-primary hover:underline flex-shrink-0"
            >
              Register
            </button>
          </div>
        )}

        {/* Review history */}
        <div className="bg-background border border-border rounded-2xl p-6" data-testid="review-history">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={16} className="text-primary" />
            <h2 className="font-bold text-foreground">My Reviews</h2>
            {myReviews.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground font-medium">{myReviews.length} review{myReviews.length !== 1 ? "s" : ""}</span>
            )}
          </div>
          {myReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven't reviewed any artisans yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {myReviews.map((r) => (
                <div key={r.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <button
                      onClick={() => setLocation(`/artisans/${r.artisanId}`)}
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left"
                    >
                      {r.artisanName}
                    </button>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={11}
                          className={i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{r.artisanCategory} · {formatDate(r.createdAt)}</p>
                  {r.comment && <p className="text-sm text-foreground/80 leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit name */}
        <div className="bg-background border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-primary" />
            <h2 className="font-bold text-foreground">Display Name</h2>
          </div>
          <form onSubmit={handleSaveName} className="flex flex-col gap-3">
            <input
              type="text"
              value={nameValue}
              onChange={(e) => { setNameValue(e.target.value); setNameError(""); setNameSaved(false); }}
              placeholder="Your name"
              className={inputClass(!!nameError)}
            />
            {nameError && (
              <p className="text-xs text-destructive font-medium flex items-center gap-1">
                <span>⚠</span> {nameError}
              </p>
            )}
            <button
              type="submit"
              disabled={nameSaving || nameValue.trim() === customer.name}
              className="self-start flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {nameSaving ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : nameSaved ? (
                <><CheckCircle size={14} /> Saved!</>
              ) : (
                "Save Name"
              )}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="bg-background border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-primary" />
            <h2 className="font-bold text-foreground">Change Password</h2>
          </div>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
            <input
              type="password"
              value={currentPw}
              onChange={(e) => { setCurrentPw(e.target.value); setPwError(""); setPwSaved(false); }}
              placeholder="Current password"
              className={inputClass(!!pwError)}
              autoComplete="current-password"
            />
            <input
              type="password"
              value={newPw}
              onChange={(e) => { setNewPw(e.target.value); setPwError(""); setPwSaved(false); }}
              placeholder="New password (min. 6 characters)"
              className={inputClass(!!pwError)}
              autoComplete="new-password"
            />
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => { setConfirmPw(e.target.value); setPwError(""); setPwSaved(false); }}
              placeholder="Confirm new password"
              className={inputClass(!!pwError)}
              autoComplete="new-password"
            />
            {pwError && (
              <p className="text-xs text-destructive font-medium flex items-center gap-1">
                <span>⚠</span> {pwError}
              </p>
            )}
            <button
              type="submit"
              disabled={pwSaving}
              className="self-start flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pwSaving ? (
                <><Loader2 size={14} className="animate-spin" /> Updating…</>
              ) : pwSaved ? (
                <><CheckCircle size={14} /> Password updated!</>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        </div>

        {/* Dark mode */}
        <div className="bg-background border border-border rounded-2xl overflow-hidden">
          <button
            onClick={toggleDark}
            className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
            data-testid="dark-mode-toggle"
          >
            <div className="flex items-center gap-3">
              {isDark ? <Moon size={16} className="text-muted-foreground" /> : <Sun size={16} className="text-muted-foreground" />}
              {isDark ? "Dark Mode" : "Light Mode"}
            </div>
            <div className={`relative w-10 h-5.5 rounded-full transition-colors ${isDark ? "bg-primary" : "bg-muted"}`}>
              <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${isDark ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </button>
        </div>

        {/* Sign out */}
        <div className="bg-background border border-border rounded-2xl overflow-hidden">
          <button
            onClick={() => { logout(); setLocation("/artisans"); }}
            className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut size={16} className="text-muted-foreground" />
              Sign Out
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Delete account */}
        <div className="bg-background border border-destructive/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Trash2 size={16} className="text-destructive" />
            <h2 className="font-bold text-destructive">Delete Account</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            This permanently removes your account and all reviews you've written. This cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 border border-destructive/40 text-destructive px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-destructive/5 transition-all"
            >
              <Trash2 size={14} />
              Delete My Account
            </button>
          ) : (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm font-semibold text-destructive">Are you sure? This cannot be undone.</p>
              </div>
              {deleteError && (
                <p className="text-xs text-destructive font-medium bg-destructive/10 rounded-lg px-3 py-2">
                  {deleteError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-destructive text-white py-2.5 rounded-xl text-sm font-bold hover:bg-destructive/90 transition-all disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Yes, Delete"}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(""); }}
                  disabled={deleting}
                  className="flex-1 border border-border py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted/50 transition-all disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground pb-4">
          © 2026 Danmari Tech Group
        </p>
      </div>
    </div>
  );
}
