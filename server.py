"""FastAPI server with authentication routes using AuthMiddleware from utils.py."""
from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from auth import (
    register_user, login_user, verify_auth, change_password,
    update_profile, get_user, list_users, delete_user,
    request_password_reset, reset_password, refresh_access_token,
    logout_all_devices, verify_email, get_user_role, require_role, update_user_role,
    send_contact_email, subscribe_email, unsubscribe_email, list_subscribers, get_subscriber_count,
    create_blog_post, list_blog_posts, get_blog_post, update_blog_post, delete_blog_post,
    toggle_blog_published, toggle_blog_featured,
    create_testimonial, list_testimonials, get_testimonial, update_testimonial, delete_testimonial, toggle_testimonial_featured,
    create_team_member, list_team, get_team_member, update_team_member, delete_team_member, toggle_team_featured,
)

app = FastAPI(title="Auth API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None

class ContactRequest(BaseModel):
    name: str
    email: str
    subject: str = "Contact Form"
    message: str

class NewsletterSubscribeRequest(BaseModel):
    email: str
    name: str = ""

class BlogPostRequest(BaseModel):
    title: str
    content: str
    excerpt: str = ""
    author: str = ""
    category: str = ""
    image: str = ""
    slug: str = ""

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None
    slug: Optional[str] = None

class TestimonialRequest(BaseModel):
    name: str
    role: str
    quote: str
    image: str = ""
    rating: int = 5

class TestimonialUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    quote: Optional[str] = None
    image: Optional[str] = None
    rating: Optional[int] = None

class TeamMemberRequest(BaseModel):
    name: str
    role: str
    bio: str = ""
    image: str = ""
    category: str = "general"

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    bio: Optional[str] = None
    image: Optional[str] = None
    category: Optional[str] = None


def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    payload = verify_auth(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    payload["_token"] = token
    return payload


@app.post("/register")
def register(req: RegisterRequest):
    try:
        access, refresh, user = register_user(req.email, req.password, req.name)
        return {"access_token": access, "refresh_token": refresh, "user": user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/login")
def login(req: LoginRequest):
    try:
        access, refresh, user = login_user(req.email, req.password)
        return {"access_token": access, "refresh_token": refresh, "user": user}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.post("/refresh")
def refresh(req: RefreshRequest):
    try:
        access, refresh = refresh_access_token(req.refresh_token)
        return {"access_token": access, "refresh_token": refresh}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.post("/logout")
def logout(req: LogoutRequest = None, user=Depends(get_current_user)):
    from auth import auth
    auth.block_token(user["_token"])
    if req and req.refresh_token:
        auth.block_token(req.refresh_token)
    return {"message": "Logged out"}


@app.post("/logout-all")
def logout_all(user=Depends(get_current_user)):
    try:
        logout_all_devices(user["_token"])
        return {"message": "Logged out from all devices"}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.get("/me")
def me(user=Depends(get_current_user)):
    return {k: v for k, v in user.items() if k != "_token"}


@app.put("/me")
def update_me(req: UpdateProfileRequest, user=Depends(get_current_user)):
    try:
        return update_profile(user["_token"], name=req.name, email=req.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/change-password")
def change_pw(req: ChangePasswordRequest, user=Depends(get_current_user)):
    try:
        change_password(user["_token"], req.current_password, req.new_password)
        return {"message": "Password changed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/password-reset/request")
def request_reset(email: str, request: Request):
    client_ip = request.client.host
    try:
        token = request_password_reset(email, client_ip)
    except ValueError as e:
        raise HTTPException(status_code=429, detail=str(e))
    if not token:
        raise HTTPException(status_code=404, detail="Email not found")
    return {"reset_token": token}


@app.post("/password-reset")
def do_reset(req: ResetPasswordRequest):
    try:
        reset_password(req.token, req.new_password)
        return {"message": "Password reset successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/verify-email")
def verify_email_endpoint(req: ResetPasswordRequest):
    try:
        verify_email(req.token)
        return {"message": "Email verified successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/verify-email/request")
def request_verify(email: str):
    try:
        from auth import auth, send_verification_email
        token = auth.create_verify_token(email)
        send_verification_email(email, token)
        return {"message": "Verification email sent", "token": token}
    except Exception:
        raise HTTPException(status_code=400, detail="Could not send verification email")


@app.get("/users")
def get_users(user=Depends(get_current_user)):
    try:
        return list_users(user["_token"])
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@app.delete("/users/{email}")
def delete_user_route(email: str, user=Depends(get_current_user)):
    try:
        delete_user(user["_token"], email)
        return {"message": f"User {email} deleted"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


class RoleRequest(BaseModel):
    role: str


@app.put("/users/{email}/role")
def update_role(email: str, req: RoleRequest, user=Depends(get_current_user)):
    try:
        return update_user_role(user["_token"], email, req.role)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@app.get("/roles")
def get_roles(user=Depends(get_current_user)):
    return {"roles": ["admin", "editor", "viewer"]}


@app.get("/me/role")
def get_my_role(user=Depends(get_current_user)):
    return {"role": user.get("role", "user")}


@app.post("/contact")
def contact(req: ContactRequest):
    try:
        send_contact_email(req.name, req.email, req.subject, req.message)
        return {"message": "Message sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send message")


@app.post("/newsletter/subscribe")
def newsletter_subscribe(req: NewsletterSubscribeRequest):
    try:
        subscribe_email(req.email, req.name)
        return {"message": "Successfully subscribed to newsletter"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/newsletter/unsubscribe")
def newsletter_unsubscribe(email: str):
    try:
        unsubscribe_email(email)
        return {"message": "Successfully unsubscribed from newsletter"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/newsletter/subscribers")
def newsletter_subscribers(user=Depends(get_current_user)):
    return list_subscribers()


@app.get("/newsletter/count")
def newsletter_count():
    return {"count": get_subscriber_count()}


# --- Blog Endpoints ---

@app.get("/blog")
def list_blog(published: bool = True):
    return list_blog_posts(published_only=published)


@app.get("/blog/{slug_or_id}")
def get_blog(slug_or_id: str):
    post = get_blog_post(slug=slug_or_id)
    if not post:
        post = get_blog_post(post_id=slug_or_id)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post


@app.post("/blog")
def create_blog(req: BlogPostRequest):
    post = create_blog_post(
        title=req.title, content=req.content, excerpt=req.excerpt,
        author=req.author, category=req.category, image=req.image, slug=req.slug
    )
    return post


@app.put("/blog/{post_id}")
def update_blog(post_id: str, req: BlogPostUpdate):
    post = update_blog_post(post_id, title=req.title, content=req.content, excerpt=req.excerpt, author=req.author, category=req.category, image=req.image, slug=req.slug)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post


@app.delete("/blog/{post_id}")
def delete_blog(post_id: str):
    delete_blog_post(post_id)
    return {"message": "Blog post deleted"}


@app.put("/blog/{post_id}/publish")
def toggle_publish(post_id: str):
    post = toggle_blog_published(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post


@app.put("/blog/{post_id}/featured")
def toggle_featured(post_id: str):
    post = toggle_blog_featured(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post


# --- Testimonials Endpoints ---

@app.get("/testimonials")
def list_test():
    return list_testimonials()


@app.get("/testimonials/{testimonial_id}")
def get_test(testimonial_id: str):
    testimonial = get_testimonial(testimonial_id)
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return testimonial


@app.post("/testimonials")
def create_test(req: TestimonialRequest):
    return create_testimonial(name=req.name, role=req.role, quote=req.quote, image=req.image, rating=req.rating)


@app.put("/testimonials/{testimonial_id}")
def update_test(testimonial_id: str, req: TestimonialUpdate):
    testimonial = update_testimonial(testimonial_id, name=req.name, role=req.role, quote=req.quote, image=req.image, rating=req.rating)
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return testimonial


@app.delete("/testimonials/{testimonial_id}")
def delete_test(testimonial_id: str):
    delete_testimonial(testimonial_id)
    return {"message": "Testimonial deleted"}


@app.put("/testimonials/{testimonial_id}/featured")
def toggle_test_featured(testimonial_id: str):
    testimonial = toggle_testimonial_featured(testimonial_id)
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return testimonial


# --- Team Endpoints ---

@app.get("/team")
def list_team_endpoint():
    return list_team()


@app.get("/team/{member_id}")
def get_team_endpoint(member_id: str):
    member = get_team_member(member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return member


@app.post("/team")
def create_team_endpoint(req: TeamMemberRequest):
    return create_team_member(name=req.name, role=req.role, bio=req.bio, image=req.image, category=req.category)


@app.put("/team/{member_id}")
def update_team_endpoint(member_id: str, req: TeamMemberUpdate):
    member = update_team_member(member_id, name=req.name, role=req.role, bio=req.bio, image=req.image, category=req.category)
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return member


@app.delete("/team/{member_id}")
def delete_team_endpoint(member_id: str):
    delete_team_member(member_id)
    return {"message": "Team member deleted"}


@app.put("/team/{member_id}/featured")
def toggle_team_featured_endpoint(member_id: str):
    member = toggle_team_featured(member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return member


@app.get("/")
def root():
    return {"message": "Auth API is running", "endpoints": [
        "POST /register", "POST /login", "POST /refresh", "POST /logout", "POST /logout-all",
        "POST /verify-email", "POST /verify-email/request", "POST /contact",
        "POST /newsletter/subscribe", "POST /newsletter/unsubscribe", "GET /newsletter/subscribers", "GET /newsletter/count",
        "GET /blog", "GET /blog/{slug_or_id}", "POST /blog", "PUT /blog/{post_id}", "DELETE /blog/{post_id}",
        "PUT /blog/{post_id}/publish", "PUT /blog/{post_id}/featured",
        "GET /testimonials", "GET /testimonials/{id}", "POST /testimonials", "PUT /testimonials/{id}", "DELETE /testimonials/{id}", "PUT /testimonials/{id}/featured",
        "GET /team", "GET /team/{id}", "POST /team", "PUT /team/{id}", "DELETE /team/{id}", "PUT /team/{id}/featured",
        "GET /me", "PUT /me", "GET /me/role",
        "POST /change-password", "POST /password-reset/request", "POST /password-reset",
        "GET /users", "PUT /users/{email}/role", "DELETE /users/{email}", "GET /roles"
    ]}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
