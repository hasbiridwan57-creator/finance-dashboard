export function formatIDR(n: number, opts: { compact?: boolean } = {}) {
  if (opts.compact) return 'Rp' + formatCompact(n)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

/** 1_250_000 -> "1,25 jt" ; 1_250_000_000 -> "1,25 M" */
export function formatCompact(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${trim(abs / 1_000_000_000)} M`
  if (abs >= 1_000_000) return `${sign}${trim(abs / 1_000_000)} jt`
  if (abs >= 1_000) return `${sign}${trim(abs / 1_000)} rb`
  return `${sign}${abs}`
}

function trim(n: number) {
  return n.toFixed(2).replace(/\.?0+$/, '').replace('.', ',')
}

export function formatPct(n: number, digits = 1) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(digits).replace('.', ',')}%`
}

/** "2026-02" -> "Feb 2026" */
export function formatMonth(ym: string) {
  const [y, m] = ym.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${names[Number(m) - 1]} ${y}`
}

/** "2026-02-14" -> "14 Feb" */
export function formatDay(iso: string) {
  const [, m, d] = iso.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${Number(d)} ${names[Number(m) - 1]}`
}
