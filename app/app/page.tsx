export default function AppPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Willkommen
        </p>
        <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          Dein Workspace ist bereit
        </h1>
        <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          Hier startet das Mini-CRM für deine Brautpaare, Verträge und
          Automationen. Im nächsten Schritt können wir Kundenlisten und
          Vertragsstatus ergänzen.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            title: "Kunden",
            description: "Erfasse Brautpaare, halte Status und Notizen fest.",
          },
          {
            title: "Verträge",
            description:
              "Behalte Entwürfe, gesendete und unterschriebene Verträge im Blick.",
          },
          {
            title: "Automationen",
            description:
              "Trigger E-Mails basierend auf Vertragsstatus und Follow-ups.",
          },
          {
            title: "Organisation",
            description:
              "Mehrere Teams? Multi-Tenant Struktur bleibt sauber getrennt.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
