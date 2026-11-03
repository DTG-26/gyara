import { useLocation } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: [
      "When an artisan registers on Gyara, we collect the following information: full name, phone number, trade category, location/city, years of experience, a short bio, availability status, pricing details, a profile photo, and optional portfolio photos of past work.",
      "When a customer creates an account to leave reviews, we collect a display name and email address.",
      "All information you provide is stored locally in your browser (localStorage) and is not transmitted to or stored on any external server by default.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    body: [
      "Artisan profile information (name, category, location, contact numbers, photos) is displayed publicly in the Gyara directory so that customers can find and contact artisans.",
      "Customer account information is used solely to associate reviews and hire confirmations with a named individual and to prevent anonymous or duplicate reviews.",
      "We do not use your information for advertising, profiling, or any purpose beyond operating the Gyara directory.",
    ],
  },
  {
    title: "3. Information Visibility",
    body: [
      "Artisan profiles — including name, trade, location, phone number, profile photo, and portfolio photos — are publicly visible to anyone who visits the Gyara platform.",
      "By registering as an artisan, you consent to your profile information being publicly displayed.",
      "Customer display names are visible alongside the reviews they post. Email addresses are never shown publicly.",
    ],
  },
  {
    title: "4. Data Storage",
    body: [
      "Gyara stores all platform data in your browser's localStorage. This means data lives on the device you use to access Gyara and is not uploaded to a central database.",
      "Clearing your browser's site data or localStorage will permanently remove all artisan listings, customer accounts, and reviews stored on that device.",
      "We are not responsible for data loss resulting from browser data clearing, device changes, or browser updates.",
    ],
  },
  {
    title: "5. Photos",
    body: [
      "Profile photos and portfolio photos uploaded by artisans are compressed and stored as part of the artisan's local profile data.",
      "By uploading a photo to Gyara, you confirm that you have the right to use and share that image, and you consent to it being displayed publicly on your artisan profile.",
      "You may remove or replace your photos at any time by editing your profile.",
    ],
  },
  {
    title: "6. Third-Party Services",
    body: [
      "Gyara does not share your personal data with third-party advertisers or data brokers.",
      "Phone links on artisan profiles open your device's native dialler. Any interactions you have through that channel are governed by your device's own privacy policies.",
    ],
  },
  {
    title: "7. Children's Privacy",
    body: [
      "Gyara is not intended for use by persons under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided personal information through this platform, please contact us so we can remove it.",
    ],
  },
  {
    title: "8. Changes to This Policy",
    body: [
      "Danmari Tech Group may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons.",
      "The date at the top of this page indicates when the policy was last revised. Continued use of Gyara after changes are posted constitutes acceptance of the updated policy.",
    ],
  },
  {
    title: "9. Contact Us",
    body: [
      "If you have questions or concerns about this Privacy Policy or how your information is handled on Gyara, please contact Danmari Tech Group.",
    ],
  },
];

export default function PrivacyPolicyPage() {
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

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-primary font-semibold text-xs uppercase tracking-widest">Legal</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
                Privacy Policy
              </h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: <span className="font-medium text-foreground">June 2026</span> &nbsp;·&nbsp; Danmari Tech Group
          </p>
        </div>

        {/* Intro */}
        <div className="bg-background border border-border rounded-2xl p-6 sm:p-8 mb-6">
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            This Privacy Policy describes how <span className="font-semibold text-foreground">Danmari Tech Group</span> ("we", "us", or "our") handles information collected through the <span className="font-semibold text-foreground">Gyara</span> platform. By using Gyara, you agree to the practices described in this policy.
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-4">
          {SECTIONS.map((section) => (
            <div key={section.title} className="bg-background border border-border rounded-2xl p-6 sm:p-8">
              <h2 className="text-base font-bold text-foreground mb-3">{section.title}</h2>
              <div className="flex flex-col gap-3">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer line */}
        <p className="text-xs text-center text-muted-foreground mt-12">
          © 2026 Danmari Tech Group. All rights reserved.
        </p>
      </div>
    </div>
  );
}
