'use client'

import { Button } from '@/components/ui/button'
import { deleteCampaign } from '../actions'

export function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  async function handleDelete() {
    if (!confirm('Hapus campaign ini? Tindakan tidak bisa dibatalkan.')) return
    await deleteCampaign(campaignId)
  }

  return (
    <Button variant="outline" type="button" onClick={handleDelete}
      className="border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-300 gap-1.5">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
      Hapus Campaign
    </Button>
  )
}
