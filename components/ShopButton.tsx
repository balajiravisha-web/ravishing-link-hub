'use client'

import { useState } from 'react'

export default function ShopButton({ productId }: { productId: string }) {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    try {
      setBusy(true)
      const res = await fetch('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          referrer: document.referrer || null,
          utm: Object.fromEntries(new URLSearchParams(window.location.search))
        })
      })
      const json = await res.json()
      if (json?.ok && json?.url) {
        window.location.href = json.url
      } else {
        alert('Link is being updated — please try again soon.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="px-4 py-2 rounded-2xl shadow bg-yellow-200 text-gray-900"
    >
      {busy ? 'Updating link…' : 'Shop'}
    </button>
  )
}
