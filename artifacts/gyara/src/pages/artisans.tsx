import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Search, Phone, MapPin, Briefcase, Star,
  ArrowLeft, SlidersHorizontal, X, ChevronDown, UserPlus,
  Sparkles, ArrowUpDown, Bookmark, BookmarkCheck, CheckCircle2, Wrench, Settings, BadgeCheck, MessageSquare,
} from "lucide-react";
import { useArtisans, type Artisan } from "@/context/artisans-context";
import {
  CATEGORY_GROUPS, CATEGORY_ICONS, GROUP_COLORS,
  CATEGORY_TO_GROUP, type CategoryGroup,
} from "@/data/categories";
import { NIGERIAN_STATES, NIGERIA_LOCATIONS } from "@/data/locations";
import { useCustomer } from "@/context/customer-context";
import { useMessages } from "@/context/messages-context";
import { ArtisanDirectoryCard } from "@/components/artisan-directory-card";

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

type SortKey = "newest" | "rating" | "experience";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "rating", label: "Highest rated" },
  { value: "experience", label: "Most experienced" },
];

function sortArtisans(list: Artisan[], key: SortKey): Artisan[] {
  return [...list].sort((a, b) => {
    if (key === "newest") return b.id - a.id;
    if (key === "rating") return b.rating - a.rating;
    if (key === "experience") return b.experience - a.experience;
    return 0;
  });
}

function ArtisanCardSkeleton() {
  return (
    <div className="bg-background border border-border rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center justify-between min-h-[20px]">
        <div className="h-5 w-16 bg-muted rounded-full" />
        <div className="h-6 w-6 bg-muted rounded-lg" />
      </div>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-muted flex-shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col gap-2 pt-1">
          <div className="h-4 w-32 bg-muted rounded-full" />
          <div className="flex gap-1.5">
            <div className="h-5 w-20 bg-muted rounded-full" />
            <div className="h-5 w-16 bg-muted rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-full bg-muted rounded-full" />
        <div className="h-3 w-4/5 bg-muted rounded-full" />
      </div>
      <div className="flex gap-3">
        <div className="h-3 w-24 bg-muted rounded-full" />
        <div className="h-3 w-20 bg-muted rounded-full" />
      </div>
      <div className="h-3 w-28 bg-muted rounded-full" />
      <div className="flex gap-2 pt-1">
        <div className="flex-1 h-10 bg-muted rounded-xl" />
        <div className="flex-1 h-10 bg-muted rounded-xl" />
        <div className="w-10 h-10 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

export default function ArtisansPage() {
  const [, setLocation] = useLocation();
  const { artisans, loading, savedIds, toggleSaved } = useArtisans();
  const { customer } = useCustomer();
  const { unreadTotal } = useMessages();

  const [query, setQuery] = useState(() => {
    const q = sessionStorage.getItem("gyara_initial_query") ?? "";
    if (q) sessionStorage.removeItem("gyara_initial_query");
    return q;
  });
  const [initialCat] = useState(() => {
    const c = sessionStorage.getItem("gyara_initial_category") ?? "";
    if (c) sessionStorage.removeItem("gyara_initial_category");
    return c;
  });
  const [activeGroup, setActiveGroup] = useState(() => {
    if (initialCat && CATEGORY_TO_GROUP[initialCat]) {
      return CATEGORY_TO_GROUP[initialCat];
    }
    return "All";
  });
  const [category, setCategory] = useState(() => initialCat || "All");
  const [stateFilter, setStateFilter] = useState("All");
  const [lgaFilter, setLgaFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const currentGroup: CategoryGroup | undefined = CATEGORY_GROUPS.find((g) => g.name === activeGroup);

  const locationOptions = useMemo(() => {
    const artisanLocations = new Set(artisans.map((a) => a.location));
    return NIGERIAN_STATES.map((s) => {
      const lgas = NIGERIA_LOCATIONS[s] ?? [];
      const hasArtisans =
        artisanLocations.has(s) ||
        lgas.some((lga) => artisanLocations.has(lga));
      return { name: s, lgas, hasArtisans };
    });
  }, [artisans]);

  const filtered = useMemo(() => {
    if (showSaved) {
      return sortArtisans(artisans.filter((a) => savedIds.includes(a.id)), sortKey);
    }
    const q = query.toLowerCase();
    const groupCats = currentGroup?.categories ?? [];
    const base = artisans.filter((a) => {
      const matchesQuery =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.bio.toLowerCase().includes(q) ||
        (CATEGORY_TO_GROUP[a.category] ?? "").toLowerCase().includes(q);
      const matchesGroup =
        activeGroup === "All" || groupCats.includes(a.category);
      const matchesCategory =
        category === "All" || a.category === category;
      const matchesLocation =
        stateFilter === "All" ? true :
        lgaFilter !== "All" ? a.location === lgaFilter :
        (a.location === stateFilter || (NIGERIA_LOCATIONS[stateFilter] ?? []).includes(a.location));
      const matchesAvailable = !availableOnly || (a.availability ?? "Available") === "Available";
      return matchesQuery && matchesGroup && matchesCategory && matchesLocation && matchesAvailable;
    });
    return sortArtisans(base, sortKey);
  }, [artisans, query, activeGroup, category, stateFilter, lgaFilter, sortKey, availableOnly, showSaved, savedIds, currentGroup]);

  const activeFilterCount =
    (activeGroup !== "All" ? 1 : 0) +
    (category !== "All" ? 1 : 0) +
    (stateFilter !== "All" ? 1 : 0) +
    (sortKey !== "newest" ? 1 : 0) +
    (availableOnly ? 1 : 0);

  const clearFilters = () => {
    setActiveGroup("All");
    setCategory("All");
    setStateFilter("All");
    setLgaFilter("All");
    setSortKey("newest");
    setQuery("");
    setAvailableOnly(false);
  };

  const handleGroupClick = (groupName: string) => {
    setActiveGroup(groupName);
    setCategory("All");
  };

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
              data-testid="button-back-home"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="w-px h-5 bg-border" />
            <span className="font-bold text-primary text-lg">Gyara</span>
            <div className="flex-1" />

            <button
              onClick={() => setShowSaved(!showSaved)}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                showSaved
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-primary hover:bg-muted"
              }`}
              data-testid="button-saved-view"
            >
              {showSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
              <span className="hidden sm:inline">Saved</span>
              {savedIds.length > 0 && (
                <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${
                  showSaved ? "bg-white/20 text-white" : "bg-primary text-primary-foreground"
                }`}>
                  {savedIds.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setLocation("/become-artisan")}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
              data-testid="button-become-artisan-nav"
            >
              <UserPlus size={15} />
              <span className="hidden sm:inline">Become a Maigyara</span>
            </button>

            <span className="text-sm text-muted-foreground hidden sm:block">
              {filtered.length} artisan{filtered.length !== 1 ? "s" : ""} found
            </span>

            {customer ? (
              <>
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
                <button
                  onClick={() => setLocation("/settings")}
                  title={`${customer.name} — Settings`}
                  className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0 hover:bg-primary/90 transition-all ring-2 ring-transparent hover:ring-primary/30"
                  data-testid="button-customer-settings"
                >
                  {getInitials(customer.name) || <Settings size={15} />}
                </button>
              </>
            ) : (
              <button
                onClick={() => setLocation("/settings")}
                title="Settings"
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all flex-shrink-0"
                data-testid="button-settings"
              >
                <Settings size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Page header + filters — hidden in saved view */}
      {!showSaved && (
        <div className="bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-1" data-testid="page-heading">
              Find Artisans
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Browse verified local professionals ready to get the job done.
            </p>

            {/* Search row */}
            <div className="mt-5 flex gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, trade, location, or skill…"
                  className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-9 py-3 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all"
                  data-testid="input-search"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all flex-shrink-0 ${
                  showFilters || activeFilterCount > 0
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-foreground hover:border-primary/40 hover:bg-muted/50"
                }`}
                data-testid="button-toggle-filters"
              >
                <SlidersHorizontal size={15} />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Group chip rail — tier 1 */}
            <div className="mt-3 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto scrollbar-none">
              <div className="flex gap-2 pb-1 w-max sm:w-auto sm:flex-wrap">
                <button
                  onClick={() => handleGroupClick("All")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex-shrink-0 ${
                    activeGroup === "All"
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background border-border text-foreground hover:border-primary/40 hover:bg-muted/50"
                  }`}
                  data-testid="chip-group-all"
                >
                  All Trades
                </button>

                {CATEGORY_GROUPS.map((group) => {
                  const active = activeGroup === group.name;
                  const colors = GROUP_COLORS[group.name];
                  return (
                    <button
                      key={group.name}
                      onClick={() => handleGroupClick(group.name)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex-shrink-0 ${
                        active ? colors.active : colors.inactive
                      }`}
                      data-testid={`chip-group-${group.short.toLowerCase()}`}
                    >
                      {group.short}
                    </button>
                  );
                })}

                {/* Divider + Available now toggle */}
                <div className="w-px bg-border self-stretch mx-1 flex-shrink-0" />
                <button
                  onClick={() => setAvailableOnly(!availableOnly)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex-shrink-0 ${
                    availableOnly
                      ? "bg-green-600 text-white border-green-600 shadow-sm"
                      : "bg-background border-border text-foreground hover:border-green-400 hover:text-green-700 hover:bg-green-50"
                  }`}
                  data-testid="chip-available-now"
                >
                  <CheckCircle2 size={11} />
                  Available now
                </button>
              </div>
            </div>

            {/* Sub-category chip rail — tier 2 (shows when a group is selected) */}
            {currentGroup && (
              <div className="mt-2 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto scrollbar-none">
                <div className="flex gap-1.5 pb-1 w-max sm:w-auto sm:flex-wrap">
                  <button
                    onClick={() => setCategory("All")}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all flex-shrink-0 ${
                      category === "All"
                        ? "bg-foreground text-background border-foreground"
                        : "bg-muted/50 border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                    data-testid="chip-subcat-all"
                  >
                    All {currentGroup.short}
                  </button>
                  {currentGroup.categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat] ?? Wrench;
                    const active = category === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all flex-shrink-0 ${
                          active
                            ? "bg-foreground text-background border-foreground"
                            : "bg-muted/50 border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                        }`}
                        data-testid={`chip-subcat-${cat.toLowerCase().replace(/[\s/]/g, "-")}`}
                      >
                        <Icon size={10} />
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter panel — location + sort */}
            {showFilters && (
              <div className="mt-3 p-4 bg-muted/40 border border-border rounded-2xl flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <select
                      value={stateFilter}
                      onChange={(e) => { setStateFilter(e.target.value); setLgaFilter("All"); }}
                      className="w-full appearance-none bg-background border border-border rounded-xl pl-8 pr-8 py-2.5 text-sm font-medium outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 cursor-pointer"
                      data-testid="select-state"
                    >
                      <option value="All">All States</option>
                      <optgroup label="States with artisans">
                        {locationOptions.filter((l) => l.hasArtisans).map((l) => (
                          <option key={l.name} value={l.name}>{l.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="All states">
                        {locationOptions.filter((l) => !l.hasArtisans).map((l) => (
                          <option key={l.name} value={l.name}>{l.name}</option>
                        ))}
                      </optgroup>
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                  {stateFilter !== "All" && (
                    <div className="relative">
                      <select
                        value={lgaFilter}
                        onChange={(e) => setLgaFilter(e.target.value)}
                        className="w-full appearance-none bg-background border border-border rounded-xl pl-3 pr-8 py-2.5 text-sm font-medium outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 cursor-pointer"
                        data-testid="select-lga"
                      >
                        <option value="All">All LGAs in {stateFilter}</option>
                        {(NIGERIA_LOCATIONS[stateFilter] ?? []).map((lga) => (
                          <option key={lga} value={lga}>{lga}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Sort by
                  </label>
                  <div className="relative">
                    <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      className="w-full appearance-none bg-background border border-border rounded-xl pl-8 pr-8 py-2.5 text-sm font-medium outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 cursor-pointer"
                      data-testid="select-sort"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-2.5"
                      data-testid="button-clear-filters"
                    >
                      <X size={14} />
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Active filter summary chips */}
            {(stateFilter !== "All" || sortKey !== "newest" || availableOnly) && !showFilters && (
              <div className="mt-3 flex flex-wrap gap-2">
                {stateFilter !== "All" && (
                  <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                    <MapPin size={10} />
                    {lgaFilter !== "All" ? `${lgaFilter}, ${stateFilter}` : stateFilter}
                    <button onClick={() => { setStateFilter("All"); setLgaFilter("All"); }} data-testid="chip-clear-location"><X size={11} /></button>
                  </span>
                )}
                {sortKey !== "newest" && (
                  <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                    <ArrowUpDown size={10} />
                    {SORT_OPTIONS.find((o) => o.value === sortKey)?.label}
                    <button onClick={() => setSortKey("newest")} data-testid="chip-clear-sort"><X size={11} /></button>
                  </span>
                )}
                {availableOnly && (
                  <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                    <CheckCircle2 size={10} />
                    Available now
                    <button onClick={() => setAvailableOnly(false)} data-testid="chip-clear-available"><X size={11} /></button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Saved view header */}
      {showSaved && (
        <div className="bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <BookmarkCheck size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground" data-testid="saved-heading">
                  Saved Artisans
                </h1>
                <p className="text-sm text-muted-foreground">
                  {savedIds.length === 0
                    ? "No artisans saved yet"
                    : `${savedIds.length} artisan${savedIds.length !== 1 ? "s" : ""} in your shortlist`}
                </p>
              </div>
              <button
                onClick={() => setShowSaved(false)}
                className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={15} />
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <ArtisanCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24" data-testid="no-results">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              {showSaved
                ? <Bookmark size={32} className="text-muted-foreground" />
                : <Search size={32} className="text-muted-foreground" />}
            </div>
            {showSaved ? (
              <>
                <h3 className="text-lg font-bold text-foreground mb-2">No saved artisans yet</h3>
                <p className="text-muted-foreground mb-6">
                  Tap the bookmark icon on any artisan card to save them here.
                </p>
                <button
                  onClick={() => setShowSaved(false)}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-all"
                >
                  Browse Artisans
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-foreground mb-2">No artisans found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your search or filters.</p>
                <button
                  onClick={clearFilters}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-all"
                  data-testid="button-reset-search"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-5 sm:hidden">
              {filtered.length} artisan{filtered.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((artisan) => (
                <ArtisanDirectoryCard
                  key={artisan.id}
                  artisan={artisan}
                  isSaved={savedIds.includes(artisan.id)}
                  onToggleSaved={() => toggleSaved(artisan.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {!showSaved && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-background border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div>
              <h3 className="font-bold text-foreground text-lg mb-1">Are you a skilled artisan?</h3>
              <p className="text-muted-foreground text-sm">Register on Gyara and get discovered by customers near you.</p>
            </div>
            <button
              onClick={() => setLocation("/become-artisan")}
              className="flex-shrink-0 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
              data-testid="button-become-artisan-cta"
            >
              <UserPlus size={15} />
              Join as Maigyara
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
