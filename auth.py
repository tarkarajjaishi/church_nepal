"""Authentication module using AuthMiddleware from utils.py."""
from utils import AuthMiddleware
import json
import os

# Initialize with secret from environment or default
SECRET = os.environ.get("JWT_SECRET", "dev_secret_key_change_in_production")
auth = AuthMiddleware(SECRET)


def register_user(email, password, name=""):
    """Register a new user. Returns (token, user_dict) or raises ValueError."""
    # Check if user already exists (simple JSON file store for demo)
    users = _load_users()
    if email in users:
        raise ValueError("Email already registered")

    # Validate password
    strength = auth.hash_password(password)
    if not strength:
        raise ValueError("Password too weak")

    # Create user
    user_id = str(len(users) + 1)
    hashed = auth.hash_password(password)
    user = {
        "id": user_id,
        "email": email,
        "name": name,
        "password_hash": hashed,
        "role": "user",
        "verified": False,
    }
    users[email] = user
    _save_users(users)

    # Send verification email
    verify_token = auth.create_verify_token(email)
    send_verification_email(email, verify_token)

    # Generate token pair
    access, refresh = auth.create_token_pair(user_id, email, "user")
    return access, refresh, {k: v for k, v in user.items() if k != "password_hash"}


def verify_email(token):
    """Verify a user's email address using the verification token."""
    payload = auth.verify_token(token)
    if not payload or payload.get("type") != "verify":
        raise ValueError("Invalid or expired verification token")

    email = payload.get("email")
    users = _load_users()
    if email not in users:
        raise ValueError("User not found")

    users[email]["verified"] = True
    _save_users(users)
    return True


def send_verification_email(email, verify_token):
    """Send an email verification link via SMTP."""
    import smtplib
    from email.mime.text import MIMEText

    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")
    from_addr = os.environ.get("SMTP_FROM", smtp_user)
    frontend_url = os.environ.get("SITE_URL", "http://localhost:3000")

    verify_url = f"{frontend_url}/verify-email?token={verify_token}"
    body = f"Welcome! Please verify your email address by clicking this link:\n\n{verify_url}\n\nThis link expires in 24 hours."

    if not smtp_user:
        print(f"[DEV] Email verification for {email}: {verify_url}")
        return True

    msg = MIMEText(body)
    msg["Subject"] = "Verify Your Email Address"
    msg["From"] = from_addr
    msg["To"] = email

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
    return True


def login_user(email, password, ip="127.0.0.1"):
    """Login a user. Returns (access_token, refresh_token, user_dict) or raises ValueError."""
    # Rate limit check
    if not auth.check_rate_limit(ip):
        raise ValueError("Too many login attempts. Try again later.")

    # Load users
    users = _load_users()
    if email not in users:
        raise ValueError("Invalid email or password")

    user = users[email]

    # Verify password
    if not auth.verify_password(password, user["password_hash"]):
        raise ValueError("Invalid email or password")

    # Success - reset rate limit
    auth.reset_rate_limit(ip)

    # Generate token pair
    access, refresh = auth.create_token_pair(user["id"], email, user["role"])
    return access, refresh, {k: v for k, v in user.items() if k != "password_hash"}


def verify_auth(token):
    """Verify a token and return user info. Returns user_dict or None."""
    payload = auth.verify_token(token)
    if not payload:
        return None

    users = _load_users()
    user = users.get(payload.get("email"))
    if user:
        return {k: v for k, v in user.items() if k != "password_hash"}
    return None


def logout_all_devices(token):
    """Logout from all devices by blocking all tokens for this user."""
    payload = auth.verify_token(token)
    if not payload:
        raise ValueError("Invalid token")

    auth.block_all_user_tokens(payload["user_id"])
    auth.block_token(token)
    return True


def get_user_role(token):
    """Get the role from a token."""
    payload = auth.verify_token(token)
    if not payload:
        return None
    return payload.get("role", "user")


def require_role(token, roles):
    """Verify user has one of the required roles. Raises ValueError if not."""
    auth.require_role(token, roles)


def update_user_role(token, target_email, new_role):
    """Update a user's role. Requires admin role."""
    payload = auth.verify_token(token)
    if not payload:
        raise ValueError("Invalid token")
    if payload.get("role") != "admin":
        raise ValueError("Admin access required")

    valid_roles = ["admin", "editor", "viewer"]
    if new_role not in valid_roles:
        raise ValueError(f"Invalid role. Must be one of: {valid_roles}")

    users = _load_users()
    if target_email not in users:
        raise ValueError("User not found")

    users[target_email]["role"] = new_role
    _save_users(users)
    return {k: v for k, v in users[target_email].items() if k != "password_hash"}


def refresh_access_token(refresh_token):
    """Refresh an access token using a refresh token. Returns (new_access, new_refresh) or raises ValueError."""
    payload = auth.verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise ValueError("Invalid refresh token")

    # Block old refresh token (rotation)
    auth.block_token(refresh_token)

    new_access = auth.create_token(payload["user_id"], payload["email"])
    new_refresh = auth.generate_refresh_token(payload["user_id"], payload["email"])
    return new_access, new_refresh


def request_password_reset(email, ip="127.0.0.1"):
    """Generate a reset token for the given email and send it via email. Returns token or None."""
    if not auth.check_rate_limit(ip):
        raise ValueError("Too many reset attempts. Try again later.")

    users = _load_users()
    if email not in users:
        return None

    token = auth.create_reset_token(email)
    send_reset_email(email, token)
    auth.reset_rate_limit(ip)
    return token


def send_reset_email(email, reset_token):
    """Send a password reset email via SMTP."""
    import smtplib
    from email.mime.text import MIMEText

    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")
    from_addr = os.environ.get("SMTP_FROM", smtp_user)
    frontend_url = os.environ.get("SITE_URL", "http://localhost:3000")

    reset_url = f"{frontend_url}/reset-password?token={reset_token}"
    body = f"Click this link to reset your password:\n\n{reset_url}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email."

    if not smtp_user:
        print(f"[DEV] Password reset for {email}: {reset_url}")
        return True

    msg = MIMEText(body)
    msg["Subject"] = "Password Reset Request"
    msg["From"] = from_addr
    msg["To"] = email

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
    return True


def reset_password(token, new_password):
    """Reset a password using a reset token. Returns True or raises ValueError."""
    payload = auth.verify_token(token)
    if not payload:
        raise ValueError("Invalid or expired reset token")

    strength = password_strength_score(new_password)
    if strength["score"] < 30:
        raise ValueError("Password too weak")

    email = payload.get("email")
    users = _load_users()
    if email not in users:
        raise ValueError("User not found")

    users[email]["password_hash"] = auth.hash_password(new_password)
    _save_users(users)
    return True


def change_password(token, current_password, new_password):
    """Change a user's password. Requires valid auth token and current password."""
    payload = auth.verify_token(token)
    if not payload:
        raise ValueError("Invalid or expired token")

    email = payload.get("email")
    users = _load_users()
    stored_user = users.get(email)
    if not stored_user:
        raise ValueError("User not found")

    if not auth.verify_password(current_password, stored_user["password_hash"]):
        raise ValueError("Current password is incorrect")

    strength = password_strength_score(new_password)
    if strength["score"] < 30:
        raise ValueError("New password too weak")

    users[email]["password_hash"] = auth.hash_password(new_password)
    _save_users(users)
    return True


def update_profile(token, name=None, email=None):
    """Update user profile. Requires valid auth token."""
    payload = auth.verify_token(token)
    if not payload:
        raise ValueError("Invalid or expired token")

    current_email = payload.get("email")
    users = _load_users()
    if current_email not in users:
        raise ValueError("User not found")

    if name:
        users[current_email]["name"] = name
    if email and email != current_email:
        if email in users:
            raise ValueError("Email already in use")
        users[email] = users.pop(current_email)
        users[email]["email"] = email

    _save_users(users)
    return {k: v for k, v in users[current_email].items() if k != "password_hash"}


def get_user(token):
    """Get current user info from token. Returns user_dict or None."""
    return verify_auth(token)


def list_users(token):
    """List all users. Requires admin role."""
    payload = auth.verify_token(token)
    if not payload:
        raise ValueError("Invalid token")

    users = _load_users()
    email = payload.get("email")
    user = users.get(email)
    if not user or user.get("role") != "admin":
        raise ValueError("Admin access required")

    return [{k: v for k, v in u.items() if k != "password_hash"} for u in users.values()]


def delete_user(token, target_email):
    """Delete a user. Requires admin role or self-deletion."""
    payload = auth.verify_token(token)
    if not payload:
        raise ValueError("Invalid or expired token")

    email = payload.get("email")
    users = _load_users()
    current_user = users.get(email)
    if not current_user:
        raise ValueError("User not found")

    if current_user.get("role") != "admin" and email != target_email:
        raise ValueError("Admin access required for deleting other users")

    if target_email not in users:
        raise ValueError("User not found")

    del users[target_email]
    _save_users(users)
    return True


# Simple JSON file store for demo purposes
def _load_users():
    path = os.path.join(os.path.dirname(__file__), "users.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {}


def _save_users(users):
    path = os.path.join(os.path.dirname(__file__), "users.json")
    with open(path, "w") as f:
        json.dump(users, f, indent=2)


def send_contact_email(name, email, subject, message):
    """Send a contact form message via SMTP."""
    import smtplib
    from email.mime.text import MIMEText

    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")
    from_addr = os.environ.get("SMTP_FROM", smtp_user)
    to_addr = os.environ.get("CONTACT_EMAIL", smtp_user)

    body = f"From: {name} <{email}>\n\n{message}"

    if not smtp_user:
        print(f"[DEV] Contact from {name} ({email})")
        print(f"Subject: {subject}")
        print(f"Message: {message}")
        return True

    msg = MIMEText(body)
    msg["Subject"] = f"Contact Form: {subject}"
    msg["From"] = from_addr
    msg["To"] = to_addr
    msg["Reply-To"] = email

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
    return True


# Import from utils for password scoring
from utils import password_strength_score


# --- Newsletter Subscriber Functions ---

def _load_subscribers():
    path = os.path.join(os.path.dirname(__file__), "subscribers.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return []


def _save_subscribers(subscribers):
    path = os.path.join(os.path.dirname(__file__), "subscribers.json")
    with open(path, "w") as f:
        json.dump(subscribers, f, indent=2)


def subscribe_email(email, name=""):
    """Subscribe an email to the newsletter. Returns True or raises ValueError."""
    subscribers = _load_subscribers()

    # Check if already subscribed
    for sub in subscribers:
        if sub["email"] == email:
            if sub.get("active", True):
                raise ValueError("Email already subscribed")
            else:
                # Re-subscribe inactive user
                sub["active"] = True
                _save_subscribers(subscribers)
                return True

    subscriber = {
        "email": email,
        "name": name,
        "active": True,
    }
    subscribers.append(subscriber)
    _save_subscribers(subscribers)
    return True


def unsubscribe_email(email):
    """Unsubscribe an email from the newsletter. Returns True or raises ValueError."""
    subscribers = _load_subscribers()
    for sub in subscribers:
        if sub["email"] == email:
            sub["active"] = False
            _save_subscribers(subscribers)
            return True
    raise ValueError("Email not found in subscribers")


def list_subscribers():
    """List all active newsletter subscribers."""
    subscribers = _load_subscribers()
    return [s for s in subscribers if s.get("active", True)]


def get_subscriber_count():
    """Get count of active subscribers."""
    return len(list_subscribers())


# --- Testimonials Functions ---

def _load_testimonials():
    path = os.path.join(os.path.dirname(__file__), "testimonials.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return []


def _save_testimonials(testimonials):
    path = os.path.join(os.path.dirname(__file__), "testimonials.json")
    with open(path, "w") as f:
        json.dump(testimonials, f, indent=2)


def create_testimonial(name, role, quote, image="", rating=5):
    testimonials = _load_testimonials()
    testimonial_id = str(len(testimonials) + 1)
    testimonial = {
        "id": testimonial_id,
        "name": name,
        "role": role,
        "quote": quote,
        "image": image,
        "rating": rating,
        "featured": False,
    }
    testimonials.append(testimonial)
    _save_testimonials(testimonials)
    return testimonial


def list_testimonials():
    return _load_testimonials()


def get_testimonial(testimonial_id):
    testimonials = _load_testimonials()
    for t in testimonials:
        if t["id"] == testimonial_id:
            return t
    return None


def update_testimonial(testimonial_id, **kwargs):
    testimonials = _load_testimonials()
    for t in testimonials:
        if t["id"] == testimonial_id:
            for key, value in kwargs.items():
                if value is not None:
                    t[key] = value
            _save_testimonials(testimonials)
            return t
    return None


def delete_testimonial(testimonial_id):
    testimonials = _load_testimonials()
    testimonials = [t for t in testimonials if t["id"] != testimonial_id]
    _save_testimonials(testimonials)
    return True


def toggle_testimonial_featured(testimonial_id):
    testimonials = _load_testimonials()
    for t in testimonials:
        if t["id"] == testimonial_id:
            t["featured"] = not t.get("featured", False)
            _save_testimonials(testimonials)
            return t
    return None


# --- Blog Functions ---

def _load_blog_posts():
    path = os.path.join(os.path.dirname(__file__), "blog_posts.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return []


def _save_blog_posts(posts):
    path = os.path.join(os.path.dirname(__file__), "blog_posts.json")
    with open(path, "w") as f:
        json.dump(posts, f, indent=2)


def create_blog_post(title, content, excerpt="", author="", category="", image="", slug=""):
    """Create a new blog post."""
    posts = _load_blog_posts()
    post_id = str(len(posts) + 1)
    if not slug:
        slug = title.lower().replace(" ", "-").replace("'", "")

    post = {
        "id": post_id,
        "title": title,
        "content": content,
        "excerpt": excerpt,
        "author": author,
        "category": category,
        "image": image,
        "slug": slug,
        "published": False,
        "featured": False,
    }
    posts.append(post)
    _save_blog_posts(posts)
    return post


def list_blog_posts(published_only=True):
    """List blog posts. If published_only, only return published posts."""
    posts = _load_blog_posts()
    if published_only:
        return [p for p in posts if p.get("published", False)]
    return posts


def get_blog_post(post_id=None, slug=None):
    """Get a blog post by ID or slug."""
    posts = _load_blog_posts()
    for post in posts:
        if post_id and post["id"] == post_id:
            return post
        if slug and post["slug"] == slug:
            return post
    return None


def update_blog_post(post_id, **kwargs):
    """Update a blog post."""
    posts = _load_blog_posts()
    for post in posts:
        if post["id"] == post_id:
            for key, value in kwargs.items():
                if value is not None:
                    post[key] = value
            _save_blog_posts(posts)
            return post
    return None


def delete_blog_post(post_id):
    """Delete a blog post."""
    posts = _load_blog_posts()
    posts = [p for p in posts if p["id"] != post_id]
    _save_blog_posts(posts)
    return True


def toggle_blog_published(post_id):
    """Toggle published status of a blog post."""
    posts = _load_blog_posts()
    for post in posts:
        if post["id"] == post_id:
            post["published"] = not post.get("published", False)
            _save_blog_posts(posts)
            return post
    return None


def toggle_blog_featured(post_id):
    """Toggle featured status of a blog post."""
    posts = _load_blog_posts()
    for post in posts:
        if post["id"] == post_id:
            post["featured"] = not post.get("featured", False)
            _save_blog_posts(posts)
            return post
    return None


# --- Team Functions ---

def _load_team():
    path = os.path.join(os.path.dirname(__file__), "team.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return []


def _save_team(team):
    path = os.path.join(os.path.dirname(__file__), "team.json")
    with open(path, "w") as f:
        json.dump(team, f, indent=2)


def create_team_member(name, role, bio="", image="", category="general"):
    team = _load_team()
    member_id = str(len(team) + 1)
    member = {"id": member_id, "name": name, "role": role, "bio": bio, "image": image, "category": category, "featured": False}
    team.append(member)
    _save_team(team)
    return member


def list_team():
    return _load_team()


def get_team_member(member_id):
    for m in _load_team():
        if m["id"] == member_id:
            return m
    return None


def update_team_member(member_id, **kwargs):
    team = _load_team()
    for m in team:
        if m["id"] == member_id:
            for k, v in kwargs.items():
                if v is not None:
                    m[k] = v
            _save_team(team)
            return m
    return None


def delete_team_member(member_id):
    team = [m for m in _load_team() if m["id"] != member_id]
    _save_team(team)
    return True


def toggle_team_featured(member_id):
    team = _load_team()
    for m in team:
        if m["id"] == member_id:
            m["featured"] = not m.get("featured", False)
            _save_team(team)
            return m
    return None


# --- Services Functions ---

def _load_services():
    path = os.path.join(os.path.dirname(__file__), "services.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return []


def _save_services(services):
    path = os.path.join(os.path.dirname(__file__), "services.json")
    with open(path, "w") as f:
        json.dump(services, f, indent=2)


def create_service(title, description="", category="", price=0, image=""):
    services = _load_services()
    service_id = str(len(services) + 1)
    service = {"id": service_id, "title": title, "description": description, "category": category, "price": price, "image": image, "featured": False}
    services.append(service)
    _save_services(services)
    return service


def list_services():
    return _load_services()


def get_service(service_id):
    for s in _load_services():
        if s["id"] == service_id:
            return s
    return None


def update_service(service_id, **kwargs):
    services = _load_services()
    for s in services:
        if s["id"] == service_id:
            for k, v in kwargs.items():
                if v is not None:
                    s[k] = v
            _save_services(services)
            return s
    return None


def delete_service(service_id):
    services = [s for s in _load_services() if s["id"] != service_id]
    _save_services(services)
    return True


def toggle_service_featured(service_id):
    services = _load_services()
    for s in services:
        if s["id"] == service_id:
            s["featured"] = not s.get("featured", False)
            _save_services(services)
            return s
    return None
