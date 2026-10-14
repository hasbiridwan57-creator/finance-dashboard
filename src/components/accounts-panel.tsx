'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateAccountBalance, deleteAccount, transferBetweenAccounts } from '@/app/actions'
import { formatIDR } from '@/lib/format'

export function AccountsPanel({
  accounts,
  isLoggedIn,
}: {
  accounts: { name: string; kind: string; balance: number; institution?: string | null }[]
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editBalance, setEditBalance] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Transfer form state
  const [fromAcc, setFromAcc] = useState('')
  const [toAcc, setToAcc] = useState('')
  const [transferAmount, setTransferAmount] = useState('')

  // 1a & 1b: Filter source and target accounts properly
  const sourceAccounts = accounts.filter((a) => a.kind !== 'debt' && a.kind !== 'investment')
  const targetAccounts = accounts.filter((a) => a.kind !== 'investment')

  async function handleUpdate(name: string) {
    const val = Number(editBalance)
    if (!Number.isFinite(val)) {
      setError('Nominal tidak valid.')
      return
    }
    setLoading(true)
    setError(null)
    const res = await updateAccountBalance({ name, balance: val })
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setEditingName(null)
      router.refresh()
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`Hapus akun ${name}?`)) return
    setLoading(true)
    setError(null)
    const res = await deleteAccount({ name })
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      router.refresh()
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(transferAmount)
    if (!amt || amt <= 0) {
      setError('Jumlah transfer harus lebih dari 0.')
      return
    }
    if (!fromAcc || !toAcc) {
      setError('Pilih akun sumber dan akun tujuan.')
      return
    }
    setLoading(true)
    setError(null)
    const res = await transferBetweenAccounts({
      fromAccount: fromAcc,
      toAccount: toAcc,
      amount: amt,
    })
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setTransferAmount('')
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-[#4a515e]">
            <tr>
              <th className="pb-3 pr-4 font-medium">Nama Akun</th>
              <th className="pb-3 pr-4 font-medium">Jenis</th>
              <th className="pb-3 pr-4 text-right font-medium">Saldo</th>
              {isLoggedIn && <th className="pb-3 text-right font-medium">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[.045]">
            {accounts.map((a) => {
              const kindBadge =
                a.kind === 'bank'
                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                  : a.kind === 'ewallet'
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  : a.kind === 'cash'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : a.kind === 'investment'
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'

              const isEditing = editingName === a.name

              return (
                <tr key={a.name} className="transition-colors hover:bg-white/[.02]">
                  <td className="py-3 pr-4 font-medium text-white">
                    {a.name}
                    {a.institution && <span className="ml-2 text-xs text-[#646b78]">({a.institution})</span>}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${kindBadge}`}>
                      {a.kind}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-white">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editBalance}
                        onChange={(e) => setEditBalance(e.target.value)}
                        className="w-32 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-right text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    ) : (
                      formatIDR(a.balance, { compact: true })
                    )}
                  </td>
                  {isLoggedIn && (
                    <td className="py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={loading}
                            onClick={() => handleUpdate(a.name)}
                            className="rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-medium text-black hover:bg-emerald-400"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => setEditingName(null)}
                            className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-medium text-white hover:bg-white/20"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingName(a.name)
                              setEditBalance(String(a.balance))
                            }}
                            className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(a.name)}
                            className="text-xs font-medium text-rose-400 hover:text-rose-300"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isLoggedIn && accounts.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/[.06] bg-black/20 p-4">
          <h4 className="text-xs font-semibold text-white">Transfer Antar-Akun / Bayar Utang</h4>
          <form onSubmit={handleTransfer} className="mt-3 grid gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#646b78]">Dari Akun</label>
              <select
                value={fromAcc}
                onChange={(e) => setFromAcc(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Pilih Sumber...</option>
                {sourceAccounts.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#646b78]">Ke Akun / Tujuan</label>
              <select
                value={toAcc}
                onChange={(e) => setToAcc(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Pilih Tujuan...</option>
                {targetAccounts.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#646b78]">Nominal (Rp)</label>
              <input
                type="number"
                placeholder="Contoh: 500000"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
              >
                Transfer / Bayar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
