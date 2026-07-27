"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover: string | null;
  author: string;
  category: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

export interface NewBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover?: string;
  author: string;
  category: string;
  published?: boolean;
}

export function usePublicPosts() {
  return useQuery({
    queryKey: ["public-blog-posts"],
    queryFn: async () => {
      const response = await apiClient.get<BlogPost[]>("/blog");
      return response.data;
    },
    staleTime: 30000,
  });
}

export function usePublicPost(slug: string) {
  return useQuery({
    queryKey: ["public-blog-post", slug],
    queryFn: async () => {
      const response = await apiClient.get<BlogPost>(`/blog/${encodeURIComponent(slug)}`);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 60000,
  });
}

export function useAdminPosts() {
  return useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const response = await apiClient.get<BlogPost[]>("/admin/blog");
      return response.data;
    },
    staleTime: 30000,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: NewBlogPost) => {
      const response = await apiClient.post<BlogPost>("/admin/blog", post);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["public-blog-posts"] });
      toast.success("Post created successfully");
    },
    onError: (err) => {
      toast.error("Failed to create post", {
        description: err instanceof Error ? err.message : "An error occurred",
      });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewBlogPost> }) => {
      const response = await apiClient.patch<BlogPost>(`/admin/blog/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["public-blog-posts"] });
      toast.success("Post updated successfully");
    },
    onError: (err) => {
      toast.error("Failed to update post", {
        description: err instanceof Error ? err.message : "An error occurred",
      });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/admin/blog/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["public-blog-posts"] });
      toast.success("Post deleted successfully");
    },
    onError: (err) => {
      toast.error("Failed to delete post", {
        description: err instanceof Error ? err.message : "An error occurred",
      });
    },
  });
}
