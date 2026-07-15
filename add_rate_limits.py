import re

with open('C:/churchnepal.com/FullProductionSetup-main/auth.py', 'r') as f:
    content = f.read()

# 1. Add rate limit to register_user
old = 'def register_user(email, password, name=""):'
new = 'def register_user(email, password, name="", ip="127.0.0.1"):'
content = content.replace(old, new, 1)

old = '    """Register a new user. Returns (token, user_dict) or raises ValueError."""\n    # Check if user already exists'
new = '''    """Register a new user. Returns (token, user_dict) or raises ValueError."""
    # Rate limit: max 3 registrations per 15 minutes per IP
    if not auth.check_rate_limit(ip, max_attempts=3, window=900):
        raise ValueError("Too many registration attempts. Please try again later.")
    # Check if user already exists'''
content = content.replace(old, new, 1)

# 2. Add rate limit to subscribe_email
old = 'def subscribe_email(email, name=""):'
new = 'def subscribe_email(email, name="", ip="127.0.0.1"):'
content = content.replace(old, new, 1)

old = 'def subscribe_email(email, name="", ip="127.0.0.1"):\n    """Subscribe an email to the newsletter."""\n    subscribers = _load_subscribers()'
new = '''def subscribe_email(email, name="", ip="127.0.0.1"):
    """Subscribe an email to the newsletter."""
    # Rate limit: max 5 subscriptions per 15 minutes per IP
    if not auth.check_rate_limit(ip, max_attempts=5, window=900):
        raise ValueError("Too many subscription attempts. Please try again later.")
    subscribers = _load_subscribers()'''
content = content.replace(old, new, 1)

# 3. Add rate limit to send_contact_email
old = 'def send_contact_email(name, email, subject, message):'
new = 'def send_contact_email(name, email, subject, message, ip="127.0.0.1"):'
content = content.replace(old, new, 1)

old = 'def send_contact_email(name, email, subject, message, ip="127.0.0.1"):\n    """Send contact form email via SMTP."""'
new = '''def send_contact_email(name, email, subject, message, ip="127.0.0.1"):
    """Send contact form email via SMTP."""
    # Rate limit: max 3 messages per 15 minutes per IP
    if not auth.check_rate_limit(ip, max_attempts=3, window=900):
        raise ValueError("Too many contact form submissions. Please try again later.")'''
content = content.replace(old, new, 1)

with open('C:/churchnepal.com/FullProductionSetup-main/auth.py', 'w') as f:
    f.write(content)

print("Done: Added rate limiting to register_user, subscribe_email, send_contact_email")
