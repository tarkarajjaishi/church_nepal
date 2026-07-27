import { createResourceHooks } from './factory'

export interface Campaign {
  id: string
  title: string
  raised: number
  goal: number
  enabled?: boolean
  sortOrder?: number
  createdAt?: string
}

export const campaignHooks = createResourceHooks<Campaign>('campaigns')
export const { useList: useCampaigns, useGet: useCampaign, useCreate: useCreateCampaign, useUpdate: useUpdateCampaign, useDelete: useDeleteCampaign, useToggle: useToggleCampaign, useReorder: useReorderCampaign } = campaignHooks
