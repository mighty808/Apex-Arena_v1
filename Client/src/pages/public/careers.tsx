const OPENINGS = [
  {
    role: "Frontend Engineer",
    type: "Full-time · Remote",
    description:
      "Build the interfaces players and organizers interact with daily. React, TypeScript, and Tailwind CSS. Strong eye for design required.",
    expired: true,
  },
  {
    role: "Backend Engineer",
    type: "Full-time · Remote",
    description:
      "Design and maintain the APIs, payment flows, and real-time match infrastructure that power every tournament on the platform.",
    expired: true,
  },
  {
    role: "Community Manager",
    type: "Full-time · Accra, Ghana",
    description:
      "Grow and manage our player and organizer community across Ghana. Gaming background is a must. Social media and events experience preferred.",
    expired: true,
  },
  {
    role: "Product Designer",
    type: "Contract · Remote",
    description:
      "Shape the end-to-end user experience for players and organizers. Own design from wireframes to shipped components.",
    expired: true,
  },
];

const Careers = () => {
  return (
    <div className="bg-slate-950 text-white">
      {/* Hero */}
      <section className="border-b border-slate-800/70">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
            Careers
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Help build the future of African esports
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            We are a small, focused team working on a platform that matters to millions of gamers across West Africa. If that excites you, we want to hear from you.
          </p>
        </div>
      </section>

      {/* Why join */}
      <section className="mx-auto max-w-5xl px-6 py-14 border-b border-slate-800/60">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400 mb-8">
          Why Apex Arenas
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Real impact",
              body: "Every feature you ship is used by players competing for real prize money. Your work is not abstract.",
            },
            {
              title: "Small team",
              body: "No bureaucracy. You will own your work, make decisions, and see the results immediately.",
            },
            {
              title: "Remote-first",
              body: "Most roles are fully remote. We care about output, not office hours.",
            },
          ].map(({ title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <h3 className="text-base font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Open roles */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400 mb-8">
          Open positions
        </p>
        <div className="space-y-4">
          {OPENINGS.map(({ role, type, description, expired }) => (
            <div
              key={role}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 opacity-60"
            >
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-base font-bold text-white">{role}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-400">
                    Closed
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold mb-2">{type}</p>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xl">{description}</p>
              </div>
              <span className="shrink-0 self-start inline-flex items-center px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-500 text-sm font-semibold cursor-not-allowed">
                {expired ? "Expired" : "Apply"}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <p className="text-sm text-slate-400 leading-relaxed">
            Don't see a role that fits? We're always open to strong candidates. Send your CV and a note about what you'd like to work on to{" "}
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

export default Careers;
