'use client'

import { Button } from '@/components/ui/button'
import { deleteCampaign } from '../actions'

export function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  async function handleDelete() {
    if (!confirm('Hapus campaign ini? Tindakan tidak bisa dibatalkan.')) return
    await deleteCampaign(campaignId)
  }

  return (
    <Button variant="ghost" type="button" onClick={handleDelete}
      className="text-red-500 hover:text-red-700 hover:bg-red-50">
      Hapus Campaign
    </Button>
  )
}
