"""String utilities and validation functions."""
import re
import secrets
import string
import hashlib
import urllib.request


# --- String Manipulation ---

def reverse_string(s):
    """Reverse a string."""
    return s[::-1]


def is_palindrome(s):
    """Check if a string is a palindrome (reads the same forwards and backwards)."""
    cleaned = s.lower().replace(" ", "")
    return cleaned == cleaned[::-1]


def count_vowels(s):
    """Count the number of vowels in a string (case-insensitive)."""
    vowels = "aeiou"
    return sum(1 for char in s.lower() if char in vowels)


def are_anagrams(s1, s2):
    """Check if two strings are anagrams of each other (case-insensitive)."""
    return sorted(s1.lower().replace(" ", "")) == sorted(s2.lower().replace(" ", ""))


def is_pangram(s):
    """Check if a string is a pangram (contains every letter of the alphabet)."""
    alphabet = set("abcdefghijklmnopqrstuvwxyz")
    return alphabet <= set(s.lower().replace(" ", ""))


# --- Validation ---

def is_valid_email(email):
    """Check if a string is a valid email address."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def is_valid_url(url):
    """Check if a string is a valid URL."""
    pattern = r'^https?://[^\s/$.?#].[^\s]*$'
    return bool(re.match(pattern, url, re.IGNORECASE))


def is_valid_phone(phone):
    """Check if a string is a valid phone number (digits, dashes, parens, spaces, + prefix)."""
    pattern = r'^[\+]?[\d\s\-\(\)]{7,20}$'
    return bool(re.match(pattern, phone.strip()))


def is_valid_credit_card(number):
    """Check if a string is a valid credit card number using the Luhn algorithm."""
    digits = re.sub(r'[\s\-]', '', number)
    if not digits.isdigit():
        return False
    checksum = 0
    for i, d in enumerate(reversed(digits)):
        n = int(d)
        if i % 2 == 1:
            n *= 2
            if n > 9:
                n -= 9
        checksum += n
    return checksum % 10 == 0 and len(digits) >= 13


# --- Password Utilities ---

def validate_password_strength(password):
    """Validate password strength. Returns a dict with is_valid and a list of missing requirements."""
    checks = {
        "min_length": len(password) >= 8,
        "has_uppercase": bool(re.search(r'[A-Z]', password)),
        "has_lowercase": bool(re.search(r'[a-z]', password)),
        "has_digit": bool(re.search(r'\d', password)),
        "has_special": bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password)),
    }
    missing = [req for req, passed in checks.items() if not passed]
    return {"is_valid": len(missing) == 0, "missing": missing}


def password_strength_score(password):
    """Score password strength from 0-100 with label."""
    score = 0
    length = len(password)

    # Length scoring (up to 30 pts)
    score += min(length * 2, 30)

    # Character variety (up to 40 pts)
    if re.search(r'[a-z]', password): score += 10
    if re.search(r'[A-Z]', password): score += 10
    if re.search(r'\d', password): score += 10
    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password): score += 10

    # Bonus for mixed types (up to 20 pts)
    types = sum([bool(re.search(p, password)) for p in [r'[a-z]', r'[A-Z]', r'\d', r'[!@#$%^&*()]']])
    if types >= 3: score += 10
    if types >= 4: score += 10

    # Penalty for common patterns
    if re.search(r'(.)\1{2,}', password): score -= 10
    if password.lower() in ['password', '12345678', 'qwerty']: score = 0

    score = max(0, min(100, score))
    label = "Weak" if score < 30 else "Fair" if score < 50 else "Good" if score < 70 else "Strong" if score < 90 else "Very Strong"
    return {"score": score, "label": label}


def generate_password(length=16):
    """Generate a random password with uppercase, lowercase, digits, and special characters."""
    if length < 4:
        raise ValueError("Password length must be at least 4")
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%^&*"),
    ]
    password += [secrets.choice(chars) for _ in range(length - 4)]
    secrets.SystemRandom().shuffle(password)
    return "".join(password)


def hash_password(password, rounds=12):
    """Hash a password using PBKDF2-SHA256 with a random salt. Returns 'salt:hash' string."""
    import base64
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, rounds)
    salt_b64 = base64.b64encode(salt).decode('ascii')
    hash_b64 = base64.b64encode(dk).decode('ascii')
    return f"{salt_b64}:{hash_b64}:{rounds}"


def verify_password(password, stored):
    """Verify a password against a stored 'salt:hash:rounds' string."""
    import base64
    salt_b64, hash_b64, rounds = stored.split(':')
    salt = base64.b64decode(salt_b64)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, int(rounds))
    hash_b64_check = base64.b64encode(dk).decode('ascii')
    return secrets.compare_digest(hash_b64, hash_b64_check)


def bcrypt_hash(password):
    """Hash a password using bcrypt. Returns the bcrypt hash string."""
    import bcrypt
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('ascii')


def bcrypt_verify(password, hashed):
    """Verify a password against a bcrypt hash string."""
    import bcrypt
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('ascii'))


def is_password_breached(password):
    """Check if a password has appeared in known data breaches using Have I Been Pwned (k-anonymity).
    Only the first 5 chars of the SHA-1 hash are sent — the actual password is never transmitted."""
    sha1 = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]
    url = f"https://api.pwnedpasswords.com/range/{prefix}"
    try:
        req = urllib.request.Request(url, headers={"Add-Padding": "true", "User-Agent": "utils.py"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            for line in resp.read().decode().splitlines():
                hash_suffix, count = line.split(":")
                if hash_suffix.strip() == suffix:
                    return {"breached": True, "count": int(count)}
        return {"breached": False, "count": 0}
    except Exception:
        return {"breached": None, "count": 0, "error": "Could not check breaches"}


def generate_safe_password(length=16, max_attempts=100):
    """Generate a strong password and verify it hasn't been in any data breaches.
    Keeps generating until a safe password is found or max_attempts is reached."""
    for attempt in range(max_attempts):
        password = generate_password(length)
        result = is_password_breached(password)
        if result.get("breached") is False:
            return {"password": password, "score": password_strength_score(password), "breached": False, "attempts": attempt + 1}
        if result.get("breached") is None:
            return {"password": password, "score": password_strength_score(password), "breached": None, "attempts": attempt + 1, "error": result.get("error")}
    raise RuntimeError(f"Could not generate a safe password after {max_attempts} attempts")


def generate_reset_token(length=32):
    """Generate a cryptographically secure random token for password reset."""
    return secrets.token_urlsafe(length)


# --- Authentication Middleware ---

class AuthMiddleware:
    """Simple authentication middleware using JWT and password hashing."""

    def __init__(self, secret, token_expiry=3600):
        self.secret = secret
        self.token_expiry = token_expiry
        self._login_attempts = {}  # ip -> (count, timestamp)
        self._blocked_tokens = set()
        self._blocked_users = {}  # user_id -> timestamp (blocks all tokens issued before this)

    def block_token(self, token):
        """Add a token to the blocklist (for logout/refresh rotation)."""
        self._blocked_tokens.add(token)

    def is_blocked(self, token):
        """Check if a token has been revoked."""
        return token in self._blocked_tokens

    def block_all_user_tokens(self, user_id):
        """Block ALL tokens for a user (logout from all devices)."""
        self._blocked_users[user_id] = time.time()

    def is_user_blocked(self, user_id):
        """Check if all tokens for a user are blocked."""
        return user_id in self._blocked_users

    def create_token(self, user_id, email, role="user"):
        """Create a JWT token for a user."""
        payload = {"user_id": user_id, "email": email, "role": role}
        return generate_jwt(payload, self.secret, expires_in=self.token_expiry)

    def verify_token(self, token):
        """Verify a JWT token and return the payload. Returns None if invalid, blocked, or user blocked."""
        if self.is_blocked(token):
            return None
        payload = verify_jwt(token, self.secret)
        if payload and self.is_user_blocked(payload.get("user_id")):
            return None
        return payload

    def has_role(self, token, required_roles):
        """Check if a token has one of the required roles."""
        payload = self.verify_token(token)
        if not payload:
            return False
        user_role = payload.get("role", "user")
        if isinstance(required_roles, str):
            required_roles = [required_roles]
        return user_role in required_roles

    def require_role(self, token, required_roles):
        """Verify token has one of the required roles. Raises ValueError if not."""
        if not self.has_role(token, required_roles):
            payload = self.verify_token(token)
            user_role = payload.get("role", "unknown") if payload else "unauthenticated"
            raise ValueError(f"Access denied: requires role {required_roles}, you have '{user_role}'")

    def hash_password(self, password):
        """Hash a password using bcrypt."""
        return bcrypt_hash(password)

    def verify_password(self, password, hashed):
        """Verify a password against a bcrypt hash."""
        return bcrypt_verify(password, hashed)

    def create_reset_token(self, email):
        """Generate a JWT reset token for the given email."""
        payload = {"email": email, "type": "reset"}
        return generate_jwt(payload, self.secret, expires_in=3600)

    def check_rate_limit(self, ip, max_attempts=5, window=300):
        """Check if an IP has exceeded login attempt rate limit."""
        now = time.time()
        if ip in self._login_attempts:
            count, timestamp = self._login_attempts[ip]
            if now - timestamp > window:
                self._login_attempts[ip] = (1, now)
                return True
            if count >= max_attempts:
                return False
            self._login_attempts[ip] = (count + 1, now)
        else:
            self._login_attempts[ip] = (1, now)
        return True

    def reset_rate_limit(self, ip):
        """Reset rate limit for an IP after successful login."""
        self._login_attempts.pop(ip, None)

    def create_verify_token(self, email):
        """Generate a JWT verification token for email verification."""
        payload = {"email": email, "type": "verify"}
        return generate_jwt(payload, self.secret, expires_in=86400)

    def generate_refresh_token(self, user_id, email):
        """Generate a long-lived refresh token (7 days)."""
        payload = {"user_id": user_id, "email": email, "type": "refresh"}
        return generate_jwt(payload, self.secret, expires_in=604800)

    def create_token_pair(self, user_id, email, role="user"):
        """Create both access and refresh tokens."""
        access = self.create_token(user_id, email, role)
        refresh = self.generate_refresh_token(user_id, email)
        return access, refresh


# --- JWT Token Utilities ---

import json
import base64
import hmac
import time


def _b64url_encode(data):
    """Base64url encode bytes or string."""
    if isinstance(data, str):
        data = data.encode("utf-8")
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data):
    """Base64url decode string to bytes."""
    padding = 4 - len(data) % 4
    data += "=" * padding
    return base64.urlsafe_b64decode(data)


def generate_jwt(payload, secret, algorithm="HS256", expires_in=3600):
    """Generate a JWT token with given payload and secret."""
    header = {"alg": algorithm, "typ": "JWT"}
    header_b64 = _b64url_encode(json.dumps(header))

    now = int(time.time())
    full_payload = {**payload, "iat": now, "exp": now + expires_in}
    payload_b64 = _b64url_encode(json.dumps(full_payload))

    signing_input = f"{header_b64}.{payload_b64}"
    signature = hmac.new(secret.encode("utf-8"), signing_input.encode("utf-8"), hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def verify_jwt(token, secret, algorithm="HS256"):
    """Verify a JWT token and return its payload. Returns None if invalid or expired."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header_b64, payload_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}"
        expected = hmac.new(secret.encode("utf-8"), signing_input.encode("utf-8"), hashlib.sha256).digest()
        actual = _b64url_decode(signature_b64)

        if not hmac.compare_digest(expected, actual):
            return None

        payload = json.loads(_b64url_decode(payload_b64))

        if "exp" in payload and payload["exp"] < time.time():
            return None

        return payload
    except Exception:
        return None


if __name__ == "__main__":
    print("=== String Functions ===")
    print(reverse_string("hello"))
    print(is_palindrome("racecar"))
    print(count_vowels("hello"))
    print(are_anagrams("listen", "silent"))
    print(is_pangram("The quick brown fox jumps over the lazy dog"))

    print("\n=== Validation ===")
    print(is_valid_email("test@example.com"))
    print(is_valid_url("https://www.google.com"))
    print(is_valid_phone("(555) 123-4567"))
    print(is_valid_credit_card("4539 1488 0343 6467"))

    print("\n=== Password ===")
    print(validate_password_strength("Str0ng!Pass"))
    print(password_strength_score("Xy!9kL#mNp"))
    print(generate_password())
    print(is_password_breached("password"))
    print(generate_safe_password())
    print()
    print("=== JWT ===")
    token = generate_jwt({"user_id": "123", "email": "test@example.com"}, "my_secret_key")
    print(f"Token: {token[:50]}...")
    result = verify_jwt(token, "my_secret_key")
    print(f"Verify correct: {result}")
    result = verify_jwt(token, "wrong_key")
    print(f"Verify wrong key: {result}")
    print()
    print("=== Reset Token ===")
    print(f"Token: {generate_reset_token()}")
    print(f"Short: {generate_reset_token(16)}")
    print()
    print("=== Auth Middleware ===")
    auth = AuthMiddleware("my_secret_key")
    token = auth.create_token("user_123", "test@example.com", "admin")
    print(f"Token: {token[:50]}...")
    payload = auth.verify_token(token)
    print(f"Verified: {payload}")
    hashed = auth.hash_password("MyPass123!")
    print(f"Password hash: {hashed[:30]}...")
    print(f"Verify: {auth.verify_password('MyPass123!', hashed)}")
    print(f"Rate limit 127.0.0.1: {auth.check_rate_limit('127.0.0.1')}")
    print(f"Rate limit 127.0.0.1 x6: {auth.check_rate_limit('127.0.0.1')}")
    print()
    print("=== Hashing (PBKDF2) ===")
    stored = hash_password("MySecret123!")
    print(f"Hash: {stored}")
    print(f"Verify correct: {verify_password('MySecret123!', stored)}")
    print(f"Verify wrong: {verify_password('wrong', stored)}")
    print()
    print("=== Hashing (bcrypt) ===")
    bcrypt_hashed = bcrypt_hash("MySecret123!")
    print(f"Hash: {bcrypt_hashed}")
    print(f"Verify correct: {bcrypt_verify('MySecret123!', bcrypt_hashed)}")
    print(f"Verify wrong: {bcrypt_verify('wrong', bcrypt_hashed)}")
