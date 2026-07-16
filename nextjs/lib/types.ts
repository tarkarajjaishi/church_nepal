/**
 * Core type definitions for the entire application.
 * This file ensures type safety across all components.
 */

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer' | 'user'
  verified: boolean
  created_at?: string
  updated_at?: string
}

export interface AuthToken {
  access_token: string
  refresh_token: string
  user: User
}

// ============================================================================
// BLOG & CONTENT TYPES
// ============================================================================

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
  created_at?: string
  updated_at?: string
}

export interface ContentBlock {
  id: string
  sectionKey: string
  enabled: boolean
  items?: Record<string, any>[]
  createdAt?: string
  updatedAt?: string
}

// ============================================================================
// EVENT & CALENDAR TYPES
// ============================================================================

export interface Event {
  id: string
  title: string
  description: string
  date: string
  displayDate: string
  time?: string
  location: string
  image?: string
  category?: string
  created_at?: string
  updated_at?: string
}

export interface ServiceTime {
  id: string
  day: string
  time: string
  location: string
  description?: string
}

// ============================================================================
// TESTIMONIAL & TEAM TYPES
// ============================================================================

export interface Testimonial {
  id: string
  name: string
  role: string
  quote: string
  image: string
  rating: number
  featured: boolean
  created_at?: string
  updated_at?: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  image: string
  category: string
  featured: boolean
  created_at?: string
  updated_at?: string
}

// ============================================================================
// SERVICE & PORTFOLIO TYPES
// ============================================================================

export interface Service {
  id: string
  title: string
  description: string
  category: string
  price?: number
  image?: string
  featured: boolean
  created_at?: string
  updated_at?: string
}

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
  created_at?: string
  updated_at?: string
}

// ============================================================================
// CONTACT & SUBSCRIPTION TYPES
// ============================================================================

export interface ContactInfo {
  id: string
  address: string
  phone: string
  email: string
  hours: string
  map_url?: string
  social_links?: string[]
  created_at?: string
  updated_at?: string
}

export interface ContactSubmission {
  name: string
  email: string
  subject: string
  message: string
}

export interface NewsletterSubscriber {
  email: string
  name?: string
  subscribed_at?: string
}

// ============================================================================
// SITE SETTINGS & CONFIGURATION TYPES
// ============================================================================

export interface SiteSettings {
  church_name: string
  church_address: string
  church_phone: string
  church_email: string
  church_hours: string
  church_tagline: string
  facebook?: string
  instagram?: string
  youtube?: string
  twitter?: string
  website_url: string
  meta_title: string
  meta_description: string
  site_url: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

export interface ApiError {
  detail: string
  status?: number
  error_id?: string
}

// ============================================================================
// ADMIN DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  users: number
  blog_posts: number
  published_posts: number
  testimonials: number
  team_members: number
  services: number
  portfolio_projects: number
  subscribers: number
}

export interface DashboardCard {
  label: string
  count: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  link: string
  items?: any[]
  renderItem?: (item: any) => { title: string; sub: string }
}

// ============================================================================
// FORM & VALIDATION TYPES
// ============================================================================

export interface FormError {
  field: string
  message: string
}

export interface FormState<T> {
  values: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface UpdateProfileRequest {
  name?: string
  email?: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}
