const SECTIONS = [
  {
    title: "1. Acceptance of terms",
    body: [
      "By creating an account or using any part of the Apex Arenas platform, you agree to be bound by these Terms of Service and our Privacy Policy.",
      "If you do not agree to these terms, do not use the platform.",
      "We may update these terms at any time. Continued use after changes take effect constitutes acceptance.",
    ],
  },
  {
    title: "2. Eligibility",
    body: [
      "You must be at least 18 years old to create an account and participate in paid tournaments.",
      "You must provide accurate and complete information during registration.",
      "One account per person. Creating multiple accounts is prohibited and may result in permanent suspension.",
      "Apex Arenas reserves the right to verify your identity and refuse service at its discretion.",
    ],
  },
  {
    title: "3. Platform roles",
    body: [
      "Players: registered users who browse, register for, and compete in tournaments hosted on the platform.",
      "Organizers: verified users who create and manage tournaments, deposit prize escrow, and collect entry fees.",
      "Apex Arenas: acts solely as a technology and infrastructure provider. We do not operate tournaments, act as a gaming or betting operator, or guarantee prizes from our own funds.",
    ],
  },
  {
    title: "4. Tournament participation",
    body: [
      "By registering for a tournament, you agree to the specific rules set by that tournament's organizer in addition to these terms.",
      "Check-in windows, match times, and submission deadlines are strictly enforced. Late submissions may result in a loss by default.",
      "Cheating, match fixing, or using unauthorized software is prohibited and will result in immediate disqualification and account suspension.",
      "Disconnections during a match must be reported immediately. Evidence must be submitted within 30 minutes of the incident.",
    ],
  },
  {
    title: "5. Escrow and payments",
    body: [
      "All prize pools must be deposited into escrow by the organizer before a tournament is opened for registration.",
      "Apex Arenas charges a 1% escrow service fee and a 10% platform fee on entry fees collected.",
      "Prize distributions are triggered automatically upon tournament completion and verified results. Distributions are processed via Mobile Money.",
      "Entry fees are non-refundable once a tournament has commenced unless the organizer cancels the event.",
      "In the event of a cancellation, escrowed prizes and entry fees are refunded according to the refund policy in effect at the time.",
    ],
  },
  {
    title: "6. Organizer responsibilities",
    body: [
      "Organizers must complete identity verification before creating paid tournaments.",
      "Organizers are responsible for setting clear, fair, and enforceable tournament rules.",
      "Organizers must deposit the full advertised prize amount into escrow before opening registration.",
      "Apex Arenas is not liable for organizer conduct, including failure to run an event as advertised, provided we process refunds as required.",
      "Repeat violations by organizers may result in permanent removal from the platform.",
    ],
  },
  {
    title: "7. Prohibited conduct",
    body: [
      "Impersonating another user, organizer, or Apex Arenas staff.",
      "Attempting to manipulate match outcomes, rankings, or payout calculations.",
      "Harassing, threatening, or abusing other users on or off the platform.",
      "Attempting to access systems or accounts you are not authorized to use.",
      "Using the platform for any unlawful purpose under Ghanaian or applicable international law.",
    ],
  },
  {
    title: "8. Disputes",
    body: [
      "Match disputes must be submitted through the in-platform dispute resolution system within the time window specified per tournament.",
      "Apex Arenas moderators have final authority on dispute outcomes and their decisions are binding.",
      "Disputes about account actions or payments must be submitted to support@apexarenas.com within 14 days of the relevant event.",
    ],
  },
  {
    title: "9. Limitation of liability",
    body: [
      "Apex Arenas is not liable for lost profits, data loss, or indirect damages arising from use of the platform.",
      "Our total liability to any user for any claim shall not exceed the amount paid by that user to Apex Arenas in the 90 days prior to the claim.",
      "We do not guarantee uninterrupted access to the platform and are not liable for downtime caused by maintenance, third-party providers, or circumstances beyond our control.",
    ],
  },
  {
    title: "10. Termination",
    body: [
      "You may close your account at any time by contacting support. Pending tournament registrations and escrowed funds will be handled per our refund policy.",
      "Apex Arenas may suspend or terminate accounts that violate these terms, with or without notice.",
      "Upon termination, your right to use the platform ceases immediately. Data retention follows our Privacy Policy.",
    ],
  },
  {
    title: "11. Governing law",
    body: [
      "These terms are governed by the laws of the Republic of Ghana.",
      "Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of Ghana.",
    ],
  },
];

const TermsOfService = () => {
  return (
    <div className="bg-slate-950 text-white">
      {/* Hero */}
      <section className="border-b border-slate-800/70">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
            Legal
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-slate-500">
            Last updated: April 2026
          </p>
          <p className="mt-4 max-w-2xl text-base text-slate-300">
            These Terms of Service govern your use of the Apex Arenas platform. Please read them carefully before creating an account or participating in any tournament.
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
            Questions about these terms? Contact us at{" "}
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

export default TermsOfService;
