import type { ElementType } from "react";
import {
  Wrench, Zap, Wind, Cpu, Sun, Power, Satellite,
  Hammer, Building2, Pencil, Ruler, Network, HardHat,
  Flame, Car, Bike, Plug, Circle, Battery,
  Thermometer, Droplets, Settings,
  Paintbrush, Palette, Layers, Image, Square, Tag,
  Scissors, Star, Smile, Footprints,
  Bug, Sparkles, Trash2,
} from "lucide-react";

export interface CategoryGroup {
  name: string;
  short: string;
  categories: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    name: "Plumbing & Electrical",
    short: "Electrical",
    categories: [
      "Plumber",
      "Electrician",
      "AC Technician",
      "Generator Repair",
      "Solar Panel Installer",
      "Inverter Technician",
      "Satellite / DStv Installer",
    ],
  },
  {
    name: "Building & Construction",
    short: "Building",
    categories: [
      "Carpenter",
      "Bricklayer / Mason",
      "Tiler",
      "Plasterer",
      "Iron Bender",
      "Scaffolder",
      "Site Labourer",
    ],
  },
  {
    name: "Mechanical & Technical",
    short: "Mechanical",
    categories: [
      "Welder",
      "Automobile Mechanic",
      "Motorcycle Mechanic",
      "Auto Electrician",
      "Panel Beater",
      "Vulcanizer",
      "Battery Technician",
    ],
  },
  {
    name: "Home & Appliances",
    short: "Home",
    categories: [
      "Refrigerator Repairer",
      "Washing Machine Repairer",
      "Home Appliance Repairer",
    ],
  },
  {
    name: "Finishing & Design",
    short: "Finishing",
    categories: [
      "Painter",
      "Interior Designer",
      "Upholsterer",
      "Wallpaper Installer",
      "POP Ceiling Installer",
      "Glass / Aluminum Installer",
      "Signage Designer",
    ],
  },
  {
    name: "Personal & Lifestyle",
    short: "Lifestyle",
    categories: [
      "Barber",
      "Hair Stylist",
      "Makeup Artist",
      "Tailor / Fashion Designer",
      "Cobbler",
      "Laundry / Dry Cleaner",
    ],
  },
  {
    name: "Outdoor & Utility",
    short: "Outdoor",
    categories: [
      "Borehole Driller",
      "Water Tank Installer",
      "Pest Control Technician",
      "Cleaning Services",
      "Waste Disposal Worker",
    ],
  },
];

export const ALL_CATEGORIES: string[] = CATEGORY_GROUPS.flatMap((g) => g.categories);

export const CATEGORY_TO_GROUP: Record<string, string> = Object.fromEntries(
  CATEGORY_GROUPS.flatMap((g) => g.categories.map((c) => [c, g.name]))
);

export const CATEGORY_ICONS: Record<string, ElementType> = {
  "Plumber": Wrench,
  "Electrician": Zap,
  "AC Technician": Wind,
  "Generator Repair": Cpu,
  "Solar Panel Installer": Sun,
  "Inverter Technician": Power,
  "Satellite / DStv Installer": Satellite,
  "Carpenter": Hammer,
  "Bricklayer / Mason": Building2,
  "Tiler": Layers,
  "Plasterer": Pencil,
  "Iron Bender": Ruler,
  "Scaffolder": Network,
  "Site Labourer": HardHat,
  "Welder": Flame,
  "Automobile Mechanic": Car,
  "Motorcycle Mechanic": Bike,
  "Auto Electrician": Plug,
  "Panel Beater": Hammer,
  "Vulcanizer": Circle,
  "Battery Technician": Battery,
  "Refrigerator Repairer": Thermometer,
  "Washing Machine Repairer": Droplets,
  "Home Appliance Repairer": Settings,
  "Painter": Paintbrush,
  "Interior Designer": Palette,
  "Upholsterer": Layers,
  "Wallpaper Installer": Image,
  "POP Ceiling Installer": Square,
  "Glass / Aluminum Installer": Square,
  "Signage Designer": Tag,
  "Barber": Scissors,
  "Hair Stylist": Star,
  "Makeup Artist": Smile,
  "Tailor / Fashion Designer": Scissors,
  "Cobbler": Footprints,
  "Laundry / Dry Cleaner": Droplets,
  "Borehole Driller": Layers,
  "Water Tank Installer": Droplets,
  "Pest Control Technician": Bug,
  "Cleaning Services": Sparkles,
  "Waste Disposal Worker": Trash2,
};

export const CATEGORY_COLORS: Record<string, string> = {
  "Plumber": "bg-blue-100 text-blue-700",
  "Electrician": "bg-yellow-100 text-yellow-700",
  "AC Technician": "bg-cyan-100 text-cyan-700",
  "Generator Repair": "bg-green-100 text-green-700",
  "Solar Panel Installer": "bg-amber-100 text-amber-700",
  "Inverter Technician": "bg-indigo-100 text-indigo-700",
  "Satellite / DStv Installer": "bg-sky-100 text-sky-700",
  "Carpenter": "bg-amber-100 text-amber-700",
  "Bricklayer / Mason": "bg-orange-100 text-orange-700",
  "Tiler": "bg-stone-100 text-stone-700",
  "Plasterer": "bg-gray-100 text-gray-700",
  "Iron Bender": "bg-slate-100 text-slate-700",
  "Scaffolder": "bg-zinc-100 text-zinc-700",
  "Site Labourer": "bg-orange-100 text-orange-700",
  "Welder": "bg-orange-100 text-orange-700",
  "Automobile Mechanic": "bg-slate-100 text-slate-700",
  "Motorcycle Mechanic": "bg-gray-100 text-gray-700",
  "Auto Electrician": "bg-yellow-100 text-yellow-700",
  "Panel Beater": "bg-zinc-100 text-zinc-700",
  "Vulcanizer": "bg-neutral-100 text-neutral-700",
  "Battery Technician": "bg-emerald-100 text-emerald-700",
  "Refrigerator Repairer": "bg-cyan-100 text-cyan-700",
  "Washing Machine Repairer": "bg-teal-100 text-teal-700",
  "Home Appliance Repairer": "bg-sky-100 text-sky-700",
  "Painter": "bg-purple-100 text-purple-700",
  "Interior Designer": "bg-violet-100 text-violet-700",
  "Upholsterer": "bg-fuchsia-100 text-fuchsia-700",
  "Wallpaper Installer": "bg-purple-100 text-purple-700",
  "POP Ceiling Installer": "bg-indigo-100 text-indigo-700",
  "Glass / Aluminum Installer": "bg-blue-100 text-blue-700",
  "Signage Designer": "bg-pink-100 text-pink-700",
  "Barber": "bg-rose-100 text-rose-700",
  "Hair Stylist": "bg-pink-100 text-pink-700",
  "Makeup Artist": "bg-fuchsia-100 text-fuchsia-700",
  "Tailor / Fashion Designer": "bg-rose-100 text-rose-700",
  "Cobbler": "bg-amber-100 text-amber-700",
  "Laundry / Dry Cleaner": "bg-sky-100 text-sky-700",
  "Borehole Driller": "bg-emerald-100 text-emerald-700",
  "Water Tank Installer": "bg-teal-100 text-teal-700",
  "Pest Control Technician": "bg-lime-100 text-lime-700",
  "Cleaning Services": "bg-green-100 text-green-700",
  "Waste Disposal Worker": "bg-gray-100 text-gray-700",
};

export const GROUP_COLORS: Record<string, { active: string; inactive: string }> = {
  "Plumbing & Electrical": {
    active: "bg-blue-600 text-white border-blue-600 shadow-sm",
    inactive: "bg-background border-border text-foreground hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50",
  },
  "Building & Construction": {
    active: "bg-amber-600 text-white border-amber-600 shadow-sm",
    inactive: "bg-background border-border text-foreground hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50",
  },
  "Mechanical & Technical": {
    active: "bg-slate-600 text-white border-slate-600 shadow-sm",
    inactive: "bg-background border-border text-foreground hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50",
  },
  "Home & Appliances": {
    active: "bg-teal-600 text-white border-teal-600 shadow-sm",
    inactive: "bg-background border-border text-foreground hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50",
  },
  "Finishing & Design": {
    active: "bg-purple-600 text-white border-purple-600 shadow-sm",
    inactive: "bg-background border-border text-foreground hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50",
  },
  "Personal & Lifestyle": {
    active: "bg-rose-600 text-white border-rose-600 shadow-sm",
    inactive: "bg-background border-border text-foreground hover:border-rose-400 hover:text-rose-700 hover:bg-rose-50",
  },
  "Outdoor & Utility": {
    active: "bg-green-600 text-white border-green-600 shadow-sm",
    inactive: "bg-background border-border text-foreground hover:border-green-400 hover:text-green-700 hover:bg-green-50",
  },
};
