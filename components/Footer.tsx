export default function Footer() {
  return (
    <footer className="relative py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="card p-6 sm:p-8">
          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            <div className="sm:col-span-2">
              <div className="text-xs uppercase tracking-wider text-ink-500 mb-2">
                Disclaimer
              </div>
              <p className="text-ink-400 leading-relaxed">
                Cap Table Studio is an educational playground. It is not legal,
                tax, or financial advice. Indian company law (Companies Act
                2013, Income Tax Act, FEMA) is detailed and changes regularly.
                Always consult a qualified Chartered Accountant and Company
                Secretary before filings or capital transactions.
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-ink-500 mb-2">
                Built for
              </div>
              <p className="text-ink-300">
                Indian founders incorporating their first private limited
                company. ₹-first formatting throughout.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-ink-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
              Cap Table Studio
            </div>
            <div className="text-xs text-ink-500">
              All calculations run in your browser. Nothing is stored.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
