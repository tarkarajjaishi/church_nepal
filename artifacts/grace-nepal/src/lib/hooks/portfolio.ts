import { createResourceHooks } from './factory'

export interface PortfolioProject {
  id: string
  title: string
  description: string
  image: string
  category: string
  client: string
  year: string
  url?: string
  featured: boolean
  enabled: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export const portfolioHooks = createResourceHooks<PortfolioProject>('portfolio')
export const { useList: usePortfolioProjects, useGet: usePortfolioProject, useCreate: useCreatePortfolioProject, useUpdate: useUpdatePortfolioProject, useDelete: useDeletePortfolioProject, useToggle: useTogglePortfolioProject, useReorder: useReorderPortfolioProject } = portfolioHooks
