'use client'

/**
 * One-click executive report export. Triggers the browser print dialog, where
 * the `@media print` rules in globals.css turn the dashboard into a clean
 * institutional IPS / financial audit document (Save as PDF).
 */
export function ExportReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print cursor-pointer rounded-lg border border-white/[.10] bg-white/[.03] px-3.5 py-1.5 text-xs font-semibold text-[#c9ced8] transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
    >
      <span className="mr-1.5" aria-hidden>
        ⎙
      </span>
      Export IPS Report (PDF)
    </button>
  )
}