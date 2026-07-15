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


# Import from utils for password scoring
from utils import password_strength_score
