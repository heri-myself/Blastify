'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { pauseCampaign, resumeCampaign } from '../actions'

const Spinner = () => (
  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
)

export function PauseCampaignButton({ campaignId }: { campaignId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => startTransition(async () => { await pauseCampaign(campaignId) })}
      className="inline-flex items-center gap-1.5"
    >
      {isPending && <Spinner />}
      {isPending ? 'Menjeda...' : 'Pause'}
    </Button>
  )
}

export function ResumeCampaignButton({ campaignId }: { campaignId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      disabled={isPending}
      onClick={() => startTransition(async () => { await resumeCampaign(campaignId) })}
      className="inline-flex items-center gap-1.5"
    >
      {isPending && <Spinner />}
      {isPending ? 'Melanjutkan...' : 'Lanjutkan'}
    </Button>
  )
}
