const SECTIONS = [
  {
    title: "Information we collect",
    body: [
      "Account information: name, email address, username, phone number, and role (player or organizer) provided during registration.",
      "Profile data: gaming tags, profile photo, linked game accounts, and performance statistics generated through platform activity.",
      "Payment information: Mobile Money account identifiers used for deposits and withdrawals. We do not store full payment credentials.",
      "Usage data: pages visited, features used, device type, browser, IP address, and timestamps collected automatically when you use the platform.",
      "Communications: messages you send to support and content submitted through contact forms.",
    ],
  },
  {
    title: "How we use your information",
    body: [
      "To operate and maintain your account and provide tournament services.",
      "To process payments, escrow prize funds, and distribute winnings.",
      "To send transactional emails including OTP codes, account security alerts, and tournament updates.",
      "To detect and prevent fraud, abuse, and unauthorized access.",
      "To improve the platform through aggregated usage analytics.",
      "To comply with applicable laws and regulations in Ghana and other jurisdictions we operate in.",
    ],
  },
  {
    title: "How we share your information",
    body: [
      "We do not sell your personal data to third parties.",
      "Payment processors: we share necessary identifiers with Mobile Money providers (MTN, Vodafone, AirtelTigo) to process transactions.",
      "Service providers: hosting, email delivery, and analytics providers process data on our behalf under confidentiality agreements.",
      "Legal requirements: we may disclose information if required by law, court order, or to protect the rights and safety of users and the platform.",
      "Public profile: your username, game stats, and tournament results may be visible to other users on leaderboards and tournament pages.",
    ],
  },
  {
    title: "Data retention",
    body: [
      "Account data is retained for as long as your account is active.",
      "Transaction and escrow records are retained for a minimum of 7 years to comply with financial regulations.",
      "If you delete your account, personal data is removed within 30 days except where retention is required by law.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "Access: you may request a copy of the personal data we hold about you.",
      "Correction: you may update inaccurate or incomplete information through your profile settings.",
      "Deletion: you may request account deletion, subject to legal retention requirements.",
      "Withdrawal of consent: where processing is based on consent, you may withdraw it at any time.",
      "To exercise any of these rights, contact us at support@apexarenas.com.",
    ],
  },
  {
    title: "Security",
    body: [
      "We use industry-standard encryption for data in transit (TLS) and at rest.",
      "Sensitive account actions require OTP verification.",
      "Two-factor authentication is available and strongly recommended for all accounts.",
      "Despite our measures, no system is completely secure. Report any suspected breach to support@apexarenas.com immediately.",
    ],
  },
  {
    title: "Cookies and tracking",
    body: [
      "We use essential cookies to maintain your session and authenticate requests.",
      "We may use analytics cookies to understand how the platform is used. These are not used for advertising.",
      "You can disable cookies in your browser settings, though some platform features may not function correctly as a result.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "We may update this Privacy Policy from time to time. We will notify registered users of material changes by email.",
      "Continued use of the platform after changes take effect constitutes acceptance of the revised policy.",
    ],
  },
];

const PrivacyPolicy = () => {
  return (
    <div className="bg-slate-950 text-white">
      {/* Hero */}
      <section className="border-b border-slate-800/70">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
            Legal
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-slate-500">
            Last updated: April 2026
          </p>
          <p className="mt-4 max-w-2xl text-base text-slate-300">
            This Privacy Policy describes how Apex Arenas collects, uses, and protects information about you when you use our platform.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="space-y-10">
          {SECTIONS.map(({ title, body }) => (
            <div key={title}>
              <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
              <ul className="space-y-3">
                {body.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-400 leading-relaxed">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-orange-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <p className="text-sm text-slate-400 leading-relaxed">
            Questions about this policy? Contact our team at{" "}
            <a href="mailto:support@apexarenas.com" className="text-orange-400 hover:underline">
              support@apexarenas.com
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
