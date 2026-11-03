import { useLocation } from "wouter";
import { ArrowLeft, ScrollText } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By accessing or using the Gyara platform (\"the Platform\"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Platform.",
      "These Terms and Conditions apply to all users of the Platform, including visitors, registered customers, and registered artisans (\"Maigyara\").",
    ],
  },
  {
    title: "2. About Gyara",
    body: [
      "Gyara is a directory platform owned and operated by Danmari Tech Group, designed to connect customers with skilled local artisans across Nigeria. Gyara acts solely as an intermediary — we do not directly employ, supervise, or control any artisan listed on the Platform.",
      "All transactions, agreements, and arrangements between customers and artisans are conducted independently. Gyara is not a party to any such arrangements.",
    ],
  },
  {
    title: "3. Artisan Listings",
    body: [
      "By registering as an artisan on Gyara, you confirm that all information you provide — including your name, trade, location, contact details, and photos — is accurate and truthful.",
      "You agree not to impersonate another person or misrepresent your qualifications, experience, or identity.",
      "Danmari Tech Group reserves the right to remove any artisan listing that violates these Terms, contains false information, or is deemed harmful to users or the platform.",
      "Verified badges, where granted, indicate that Gyara has taken steps to confirm the artisan's identity or credentials. Verification does not constitute an endorsement or guarantee of the artisan's work quality.",
    ],
  },
  {
    title: "4. Customer Accounts",
    body: [
      "To leave reviews and confirm hires, customers must create an account with a valid display name and email address. You are responsible for keeping your account credentials secure.",
      "You agree not to create multiple accounts or use another person's account. Each customer may leave one verified review per artisan.",
      "Reviews must be honest and based on a genuine hiring experience. Gyara reserves the right to remove reviews that are false, abusive, or in violation of these Terms.",
    ],
  },
  {
    title: "5. Reviews and Verified Hires",
    body: [
      "The Gyara \"Verified Hire\" system requires customers to confirm that they have actually hired an artisan before submitting a review. This confirmation is on the honour of the customer.",
      "Gyara does not independently verify every hire. Submitting a false hire confirmation in order to leave a fraudulent review is a violation of these Terms and may result in account deletion.",
      "Reviews reflect the opinions of individual customers and do not represent the views of Danmari Tech Group.",
    ],
  },
  {
    title: "6. Prohibited Conduct",
    body: [
      "You agree not to use the Platform for any unlawful purpose or in any way that could damage, disable, or impair the Platform.",
      "Prohibited conduct includes but is not limited to: posting false or misleading information, harassing or threatening other users, scraping or copying Platform content without permission, and attempting to gain unauthorised access to any part of the Platform.",
    ],
  },
  {
    title: "7. Disclaimer of Liability",
    body: [
      "Gyara and Danmari Tech Group are not liable for the quality, safety, legality, or any other aspect of the services provided by artisans listed on the Platform.",
      "We do not guarantee that any artisan will be available, responsive, or suitable for your needs. All hiring decisions are made at your own risk.",
      "Danmari Tech Group shall not be held liable for any direct, indirect, incidental, or consequential damages arising from your use of the Platform or from any transaction between a customer and an artisan.",
    ],
  },
  {
    title: "8. Intellectual Property",
    body: [
      "The Gyara name, logo, and Platform design are the property of Danmari Tech Group. You may not reproduce, distribute, or use them without prior written permission.",
      "By uploading photos or other content to the Platform, you grant Danmari Tech Group a non-exclusive, royalty-free licence to display that content on the Platform for the purpose of operating the directory.",
    ],
  },
  {
    title: "9. Modifications to the Platform and Terms",
    body: [
      "Danmari Tech Group reserves the right to modify, suspend, or discontinue any part of the Platform at any time without notice.",
      "We may also update these Terms and Conditions at any time. The date at the top of this page indicates when they were last revised. Continued use of the Platform after changes are posted constitutes acceptance of the updated Terms.",
    ],
  },
  {
    title: "10. Governing Law",
    body: [
      "These Terms and Conditions are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising from your use of the Platform shall be subject to the jurisdiction of Nigerian courts.",
    ],
  },
  {
    title: "11. Contact",
    body: [
      "If you have any questions about these Terms and Conditions, please contact Danmari Tech Group.",
    ],
  },
];

export default function TermsAndConditionsPage() {
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
              <ScrollText size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-primary font-semibold text-xs uppercase tracking-widest">Legal</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
                Terms &amp; Conditions
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
            Please read these Terms and Conditions carefully before using the <span className="font-semibold text-foreground">Gyara</span> platform, operated by <span className="font-semibold text-foreground">Danmari Tech Group</span>. By using Gyara, you agree to be bound by these terms.
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

        <p className="text-xs text-center text-muted-foreground mt-12">
          © 2026 Danmari Tech Group. All rights reserved.
        </p>
      </div>
    </div>
  );
}
