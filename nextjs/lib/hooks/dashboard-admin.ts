import { useDashboardStats, useDashboardSermons, useDashboardEvents, useDashboardMinistries, useDashboardNotices } from './dashboard'
import { useLeaders } from './leaders'
import { useGalleryItems } from './gallery'
import { useTestimonies } from './testimonies'
import { useMembers } from './members'
import { useServiceTimes } from './service-times'
import { useVerses } from './verses'
import { useCampaigns } from './campaigns'
import { useSettingsSections, useToggleSection } from './settings'
import { useUsers } from './users'

export {
  useDashboardStats,
  useDashboardSermons,
  useDashboardEvents,
  useDashboardMinistries,
  useDashboardNotices,
  useLeaders as useDashboardLeaders,
  useGalleryItems as useDashboardGallery,
  useTestimonies as useDashboardTestimonies,
  useMembers as useDashboardMembers,
  useServiceTimes as useDashboardServiceTimes,
  useVerses as useDashboardVerses,
  useCampaigns as useDashboardCampaigns,
  useSettingsSections,
  useToggleSection,
  useUsers,
}
