import { createResourceHooks } from './factory'

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  author: string
  category: string
  image: string
  published: boolean
  featured: boolean
  createdAt?: string
  updatedAt?: string
}

export const blogHooks = createResourceHooks<BlogPost>('blog')
export const { useList: useBlogPosts, useGet: useBlogPost, useCreate: useCreateBlogPost, useUpdate: useUpdateBlogPost, useDelete: useDeleteBlogPost } = blogHooks
