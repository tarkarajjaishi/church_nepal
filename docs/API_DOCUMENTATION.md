# Church Nepal API Documentation

**Base URL:** `https://churchnepal.com/auth/`  
**Python Auth Server:** Port 8000 (proxied via Nginx at `/auth/`)  
**Rust Backend:** Port 3002 (proxied via Nginx at `/api/`)

**Authentication:** JWT Bearer token in `Authorization` header  
**Content-Type:** `application/json` for all requests

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Dashboard](#dashboard)
4. [Contact](#contact)
5. [Newsletter](#newsletter)
6. [Blog](#blog)
7. [Testimonials](#testimonials)
8. [Team](#team)
9. [Services](#services)
10. [Contact Info](#contact-info)
11. [Portfolio](#portfolio)
12. [Site Settings](#site-settings)

---

## Authentication

### POST /register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "verified": false
  }
}
```

**Errors:** 400 — Email already registered

---

### POST /login
Authenticate and receive tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Errors:** 401 — Invalid email or password, 429 — Too many attempts

---

### POST /refresh
Refresh an expired access token.

**Request:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

**Errors:** 401 — Invalid or expired refresh token

---

### POST /logout
Block the current access token.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### POST /logout-all
Block all tokens for the current user.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "message": "Logged out from all devices"
}
```

---

### POST /change-password
Change the current user's password.

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Errors:** 400 — Current password incorrect

---

### POST /password-reset/request
Request a password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If the email exists, a reset link has been sent"
}
```

**Note:** Rate limited to 5 requests per 15 minutes per IP. Generic response prevents email enumeration.

---

### POST /password-reset
Reset password using the token from the email.

**Request:**
```json
{
  "token": "eyJ...",
  "new_password": "newpassword"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**Errors:** 400 — Invalid or expired token

---

### POST /verify-email
Verify email address using the token from the email.

**Request:**
```json
{
  "token": "eyJ..."
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

---

### POST /verify-email/request
Send a new verification email.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "message": "Verification email sent"
}
```

---

### GET /me
Get current user profile.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "id": "1",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "verified": true
}
```

---

### PUT /me
Update current user profile.

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "name": "New Name"
}
```

**Response (200):** Updated user object

---

## User Management

### GET /users
List all users. **Requires admin role.**

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
[
  {
    "id": "1",
    "email": "admin@gracenepal.org",
    "name": "Admin",
    "role": "admin",
    "verified": true
  }
]
```

---

### DELETE /users/{email}
Delete a user by email. **Requires admin role.**

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

---

### PUT /users/{email}/role
Update a user's role. **Requires admin role.**

**Headers:** `Authorization: Bearer <admin_token>`

**Request:**
```json
{
  "role": "editor"
}
```

**Valid roles:** `admin`, `editor`, `viewer`

**Response (200):**
```json
{
  "message": "Role updated successfully"
}
```

---

### GET /roles
List available roles.

**Response (200):**
```json
{
  "roles": ["admin", "editor", "viewer"]
}
```

---

### GET /me/role
Get current user's role.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "role": "user"
}
```

---

## Dashboard

### GET /dashboard/stats
Get aggregated counts for all CMS sections.

**Response (200):**
```json
{
  "users": 2,
  "blog_posts": 5,
  "published_posts": 3,
  "testimonials": 10,
  "team_members": 8,
  "services": 6,
  "portfolio_projects": 4,
  "subscribers": 25
}
```

---

## Contact

### POST /contact
Send a contact form message. Sends email via SMTP (or logs to console in dev mode).

**Request:**
```json
{
  "name": "Visitor Name",
  "email": "visitor@example.com",
  "subject": "Church Inquiry",
  "message": "I would like to know more about your services."
}
```

**Response (200):**
```json
{
  "message": "Message sent successfully"
}
```

**Rate limited:** 5 requests per 15 minutes per IP.

---

## Newsletter

### POST /newsletter/subscribe
Subscribe an email to the newsletter.

**Request:**
```json
{
  "email": "subscriber@example.com"
}
```

**Response (200):**
```json
{
  "message": "Successfully subscribed to newsletter"
}
```

**Errors:** 400 — Email already subscribed

---

### POST /newsletter/unsubscribe
Unsubscribe an email from the newsletter.

**Query param:** `?email=subscriber@example.com`

**Response (200):**
```json
{
  "message": "Successfully unsubscribed from newsletter"
}
```

---

### GET /newsletter/subscribers
List all subscribers. **Requires auth.**

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
[
  {"email": "sub1@example.com"},
  {"email": "sub2@example.com"}
]
```

---

### GET /newsletter/count
Get total subscriber count. Public endpoint.

**Response (200):**
```json
{
  "count": 25
}
```

---

## Blog

### GET /blog
List all blog posts.

**Query params:**
- `published=true` — Only published posts

**Response (200):**
```json
[
  {
    "id": "1",
    "title": "Sunday Sermon Highlights",
    "content": "Full blog content...",
    "excerpt": "A summary...",
    "author": "Pastor John",
    "category": "Faith",
    "image": "https://...",
    "slug": "sunday-sermon-highlights",
    "published": true,
    "featured": false
  }
]
```

---

### GET /blog/{slug_or_id}
Get a single blog post by slug or ID.

**Response (200):** Single blog post object

**Errors:** 404 — Post not found

---

### POST /blog
Create a new blog post.

**Request:**
```json
{
  "title": "New Blog Post",
  "content": "Full content here...",
  "excerpt": "Short summary",
  "author": "Author Name",
  "category": "Faith",
  "image": "https://...",
  "slug": "new-blog-post"
}
```

**Response (200):** Created blog post object with `id`, `published: false`, `featured: false`

---

### PUT /blog/{post_id}
Update a blog post. All fields optional.

**Request:**
```json
{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

**Response (200):** Updated blog post object

---

### DELETE /blog/{post_id}
Delete a blog post.

**Response (200):**
```json
{
  "message": "Blog post deleted"
}
```

---

### PUT /blog/{post_id}/publish
Toggle published status.

**Response (200):** Blog post with toggled `published` field

---

### PUT /blog/{post_id}/featured
Toggle featured status.

**Response (200):** Blog post with toggled `featured` field

---

## Testimonials

### GET /testimonials
List all testimonials.

**Response (200):**
```json
[
  {
    "id": "1",
    "name": "Jane Doe",
    "role": "Church Member",
    "quote": "God has been so good to our family.",
    "image": "https://...",
    "rating": 5,
    "featured": false
  }
]
```

---

### GET /testimonials/{id}
Get a single testimonial by ID.

**Response (200):** Single testimonial object

**Errors:** 404 — Not found

---

### POST /testimonials
Create a new testimonial.

**Request:**
```json
{
  "name": "Jane Doe",
  "role": "Church Member",
  "quote": "God has been so good to our family.",
  "image": "https://...",
  "rating": 5
}
```

**Response (200):** Created testimonial object

---

### PUT /testimonials/{id}
Update a testimonial. All fields optional.

**Request:**
```json
{
  "quote": "Updated quote..."
}
```

**Response (200):** Updated testimonial object

---

### DELETE /testimonials/{id}
Delete a testimonial.

**Response (200):**
```json
{
  "message": "Testimonial deleted"
}
```

---

### PUT /testimonials/{id}/featured
Toggle featured status.

**Response (200):** Testimonial with toggled `featured` field

---

## Team

### GET /team
List all team members.

**Response (200):**
```json
[
  {
    "id": "1",
    "name": "Pastor John",
    "role": "Senior Pastor",
    "bio": "Serves the church faithfully...",
    "image": "https://...",
    "category": "pastors",
    "featured": false
  }
]
```

---

### GET /team/{id}
Get a single team member by ID.

**Errors:** 404 — Not found

---

### POST /team
Create a new team member.

**Request:**
```json
{
  "name": "Pastor John",
  "role": "Senior Pastor",
  "bio": "Serves the church faithfully...",
  "image": "https://...",
  "category": "pastors"
}
```

**Response (200):** Created team member object

---

### PUT /team/{id}
Update a team member. All fields optional.

---

### DELETE /team/{id}
Delete a team member.

**Response (200):**
```json
{
  "message": "Team member deleted"
}
```

---

### PUT /team/{id}/featured
Toggle featured status.

**Response (200):** Team member with toggled `featured` field

---

## Services

### GET /services
List all services.

**Response (200):**
```json
[
  {
    "id": "1",
    "title": "Wedding Photography",
    "description": "Professional wedding photography services.",
    "category": "Photography",
    "price": 500,
    "image": "https://...",
    "featured": false
  }
]
```

---

### GET /services/{id}
Get a single service by ID.

**Errors:** 404 — Not found

---

### POST /services
Create a new service.

**Request:**
```json
{
  "title": "Wedding Photography",
  "description": "Professional wedding photography services.",
  "category": "Photography",
  "price": 500,
  "image": "https://..."
}
```

**Response (200):** Created service object

---

### PUT /services/{id}
Update a service. All fields optional.

---

### DELETE /services/{id}
Delete a service.

**Response (200):**
```json
{
  "message": "Service deleted"
}
```

---

### PUT /services/{id}/featured
Toggle featured status.

**Response (200):** Service with toggled `featured` field

---

## Contact Info

### GET /contact-info
List all contact info entries.

**Response (200):**
```json
[
  {
    "id": "1",
    "address": "123 Church St, Kathmandu",
    "phone": "+977-1-444444",
    "email": "info@churchnepal.com",
    "hours": "Sun 9:00 AM, Wed 6:00 PM",
    "map_url": "https://maps.google.com/...",
    "social_links": []
  }
]
```

---

### GET /contact-info/{id}
Get a single contact info entry.

**Errors:** 404 — Not found

---

### POST /contact-info
Create a contact info entry.

**Request:**
```json
{
  "address": "123 Church St, Kathmandu",
  "phone": "+977-1-444444",
  "email": "info@churchnepal.com",
  "hours": "Sun 9:00 AM, Wed 6:00 PM",
  "map_url": "https://maps.google.com/...",
  "social_links": ["https://facebook.com/church"]
}
```

**Response (200):** Created contact info object

---

### PUT /contact-info/{id}
Update a contact info entry. All fields optional.

---

### DELETE /contact-info/{id}
Delete a contact info entry.

**Response (200):**
```json
{
  "message": "Contact info deleted"
}
```

---

## Portfolio

### GET /portfolio
List all portfolio projects.

**Response (200):**
```json
[
  {
    "id": "1",
    "title": "Church Website Redesign",
    "description": "Complete redesign of the church website.",
    "image": "https://...",
    "category": "Web Design",
    "client": "Grace Church",
    "year": "2026",
    "url": "https://example.com",
    "featured": false
  }
]
```

---

### GET /portfolio/{id}
Get a single portfolio project.

**Errors:** 404 — Not found

---

### POST /portfolio
Create a new portfolio project.

**Request:**
```json
{
  "title": "Church Website Redesign",
  "description": "Complete redesign of the church website.",
  "image": "https://...",
  "category": "Web Design",
  "client": "Grace Church",
  "year": "2026",
  "url": "https://example.com"
}
```

**Response (200):** Created portfolio object

---

### PUT /portfolio/{id}
Update a portfolio project. All fields optional.

---

### DELETE /portfolio/{id}
Delete a portfolio project.

**Response (200):**
```json
{
  "message": "Portfolio project deleted"
}
```

---

### PUT /portfolio/{id}/featured
Toggle featured status.

**Response (200):** Portfolio with toggled `featured` field

---

## Site Settings

### GET /site-settings
Get all site settings. Public endpoint.

**Response (200):**
```json
{
  "church_name": "Grace Nepal Church",
  "church_address": "123 Church St, Kathmandu",
  "church_phone": "+977-1-444444",
  "church_email": "info@churchnepal.com",
  "church_hours": "Sun 9:00 AM, Wed 6:00 PM",
  "church_tagline": "Faith · Community · Service",
  "facebook": "https://facebook.com/gracechurch",
  "instagram": "https://instagram.com/gracechurch",
  "youtube": "https://youtube.com/gracechurch",
  "twitter": "",
  "website_url": "https://churchnepal.com",
  "meta_title": "Grace Nepal Church - Home",
  "meta_description": "A vibrant Christian community in Kathmandu",
  "site_url": "https://churchnepal.com"
}
```

---

### PUT /site-settings
Update site settings. All fields optional.

**Request:**
```json
{
  "church_name": "Updated Church Name",
  "facebook": "https://facebook.com/newpage"
}
```

**Response (200):** Full updated settings object

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "detail": "Error message"
}
```

**Common HTTP status codes:**
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request / validation error |
| 401 | Unauthorized / invalid token |
| 403 | Forbidden / insufficient role |
| 404 | Resource not found |
| 422 | Validation error (missing fields) |
| 429 | Rate limited |

---

## Rate Limiting

The following endpoints are rate limited (5 requests per 15 minutes per IP):
- `POST /register`
- `POST /login`
- `POST /password-reset/request`
- `POST /contact`

---

## Storage

All data is stored in JSON files in the server directory:
| File | Contents |
|------|----------|
| `users.json` | User accounts |
| `subscribers.json` | Newsletter subscribers |
| `blog_posts.json` | Blog posts |
| `testimonials.json` | Testimonials |
| `team.json` | Team members |
| `services.json` | Services |
| `contact_info.json` | Contact information |
| `portfolio.json` | Portfolio projects |
| `site_settings.json` | Site settings (single object) |

---

## RBAC Roles

| Role | Permissions |
|------|------------|
| `admin` | Full access — manage users, change roles, delete content |
| `editor` | Edit content (blog, testimonials, team, services, portfolio) |
| `viewer` | Read-only access |

---

**Total endpoints: 62**  
**Server:** Python FastAPI on port 8000  
**Docs:** Auto-generated at `http://localhost:8000/docs` (Swagger UI)
