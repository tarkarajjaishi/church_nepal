"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, X, Save, Loader2 } from "lucide-react";
import { useAdminPosts, useCreatePost, useUpdatePost, useDeletePost, type BlogPost } from "@/components/hooks";
import { LoadingState, EmptyState, ErrorState, useConfirmDialog } from "@/components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface FormData {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover: string;
  author: string;
  category: string;
  published: boolean;
}

const EMPTY_FORM: FormData = {
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  cover: "",
  author: "",
  category: "",
  published: false,
};

export default function AdminBlogPage() {
  const postsQuery = useAdminPosts();
  const createMutation = useCreatePost();
  const updateMutation = useUpdatePost();
  const deleteMutation = useDeletePost();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const posts = postsQuery.data || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

  const categories = useMemo(() => {
    const cats = new Set(posts.map((p) => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        !searchQuery ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = filterCategory === "all" || post.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchQuery, filterCategory]);

  const openCreateModal = () => {
    setEditingPost(null);
    setFormData({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      body: post.body,
      cover: post.cover || "",
      author: post.author,
      category: post.category,
      published: post.published,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setIsModalOpen(false);
    setEditingPost(null);
    setFormData(EMPTY_FORM);
  };

  const generateSlug = (title: string) => {
    return title
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleTitleChange = (title: string) => {
    const newFormData = { ...formData, title };
    if (!editingPost) {
      newFormData.slug = generateSlug(title);
    }
    setFormData(newFormData);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.author.trim()) {
      toast.error("Author is required");
      return;
    }
    if (!formData.category.trim()) {
      toast.error("Category is required");
      return;
    }
    if (!formData.body.trim()) {
      toast.error("Body is required");
      return;
    }

    if (editingPost) {
      updateMutation.mutate(
        { id: editingPost.id, data: formData },
        {
          onSuccess: () => {
            toast.success("Post updated successfully");
            handleCloseModal();
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success("Post created successfully");
          handleCloseModal();
        },
      });
    }
  };

  const handleDelete = (post: BlogPost) => {
    confirm({
      title: "Delete blog post?",
      description: `This will permanently delete "${post.title}". This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: () => {
        deleteMutation.mutate(post.id);
      },
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-strong">Blog Posts</h1>
          <p className="text-sm text-muted mt-1">
            Manage blog posts, draft content, and control publishing.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Filters */}
      {posts.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search posts by title, slug, or author..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  className="max-w-md"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="category-filter" className="text-sm text-muted whitespace-nowrap">
                  Category:
                </label>
                <select
                  id="category-filter"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="h-9 rounded-md border border-border bg-panel-2 px-3 py-1 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="all">All</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Table */}
      {postsQuery.isLoading ? (
        <LoadingState message="Loading blog posts..." variant="skeleton" rows={5} />
      ) : postsQuery.error ? (
        <ErrorState
          title="Failed to load blog posts"
          description={postsQuery.error.message}
          retry={() => postsQuery.refetch()}
        />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="edit"
          title="No blog posts yet"
          description="Create your first blog post to start publishing content."
          action={{
            label: "Create Post",
            onClick: openCreateModal,
          }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted">
                        No posts match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium text-text-strong max-w-xs">
                          <div className="truncate" title={post.title}>
                            {post.title}
                          </div>
                          {post.excerpt && (
                            <div className="text-xs text-muted truncate mt-0.5" title={post.excerpt}>
                              {post.excerpt}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-panel-2 px-1.5 py-0.5 rounded text-muted">
                            {post.slug}
                          </code>
                        </TableCell>
                        <TableCell>{post.author}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {post.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {post.published ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                              Draft
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted whitespace-nowrap">
                          {post.published_at ? formatDate(post.published_at) : "—"}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditModal(post)}
                              aria-label={`Edit ${post.title}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-danger hover:text-danger"
                              onClick={() => handleDelete(post)}
                              aria-label={`Delete ${post.title}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="px-4 py-3 border-t border-border text-sm text-muted">
              {filteredPosts.length} of {posts.length} posts
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Blog Post" : "New Blog Post"}</DialogTitle>
            <DialogDescription>
              {editingPost
                ? "Update the post details, content, and publishing status below."
                : "Write and publish a new blog post."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Title */}
            <div>
              <label
                htmlFor="post-title"
                className="block text-sm font-medium text-text-strong mb-1.5"
              >
                Title <span className="text-danger">*</span>
              </label>
              <Input
                id="post-title"
                placeholder="Enter post title..."
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Slug */}
            <div>
              <label
                htmlFor="post-slug"
                className="block text-sm font-medium text-text-strong mb-1.5"
              >
                Slug
              </label>
              <Input
                id="post-slug"
                placeholder="your-post-slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                disabled={isSubmitting || !!editingPost}
                readOnly={!!editingPost}
                className={editingPost ? "bg-panel-2 text-muted" : ""}
              />
              {editingPost && (
                <p className="text-xs text-muted mt-1.5">Slug cannot be changed after creation.</p>
              )}
            </div>

            {/* Excerpt */}
            <div>
              <label
                htmlFor="post-excerpt"
                className="block text-sm font-medium text-text-strong mb-1.5"
              >
                Excerpt <span className="text-danger">*</span>
              </label>
              <Textarea
                id="post-excerpt"
                placeholder="Short summary shown in post cards..."
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                disabled={isSubmitting}
                rows={2}
              />
            </div>

            {/* Body */}
            <div>
              <label
                htmlFor="post-body"
                className="block text-sm font-medium text-text-strong mb-1.5"
              >
                Body <span className="text-danger">*</span>
              </label>
              <Textarea
                id="post-body"
                placeholder="Write your post content here. Use blank lines to separate paragraphs."
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                disabled={isSubmitting}
                rows={10}
                className="font-mono text-sm leading-relaxed"
              />
              <p className="text-xs text-muted mt-1.5">
                Separate paragraphs with a clear blank line.
              </p>
            </div>

            {/* Cover */}
            <div>
              <label
                htmlFor="post-cover"
                className="block text-sm font-medium text-text-strong mb-1.5"
              >
                Cover
              </label>
              <Input
                id="post-cover"
                placeholder="linear-gradient(..., ...) or image URL"
                value={formData.cover}
                onChange={(e) =>
                  setFormData({ ...formData, cover: e.target.value })
                }
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted mt-1.5">
                A CSS gradient string or image URL (optional).
              </p>
            </div>

            {/* Author + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="post-author"
                  className="block text-sm font-medium text-text-strong mb-1.5"
                >
                  Author <span className="text-danger">*</span>
                </label>
                <Input
                  id="post-author"
                  placeholder="Author name"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label
                  htmlFor="post-category"
                  className="block text-sm font-medium text-text-strong mb-1.5"
                >
                  Category <span className="text-danger">*</span>
                </label>
                <Input
                  id="post-category"
                  placeholder="e.g. Getting Started, Growth"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  disabled={isSubmitting}
                  list="category-list"
                />
                <datalist id="category-list">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Published Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-panel-2 p-4">
              <div>
                <p className="text-sm font-medium text-text-strong">Published</p>
                <p className="text-xs text-muted mt-0.5">
                  {formData.published
                    ? "This post is live and visible on the public blog."
                    : "This post is a draft and only visible here in admin."}
                </p>
              </div>
              <Switch
                checked={formData.published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, published: checked })
                }
                disabled={isSubmitting}
              />
            </div>

            {createMutation.error && (
              <ErrorState
                title="Error creating post"
                description={createMutation.error.message}
              />
            )}
            {updateMutation.error && (
              <ErrorState
                title="Error updating post"
                description={updateMutation.error.message}
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingPost ? "Saving..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingPost ? "Save Changes" : "Create Post"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
    </>
  );
}
