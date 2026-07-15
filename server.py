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
    send_contact_email,
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


@app.get("/")
def root():
    return {"message": "Auth API is running", "endpoints": [
        "POST /register", "POST /login", "POST /refresh", "POST /logout", "POST /logout-all",
        "POST /verify-email", "POST /verify-email/request", "POST /contact",
        "GET /me", "PUT /me", "GET /me/role",
        "POST /change-password", "POST /password-reset/request", "POST /password-reset",
        "GET /users", "PUT /users/{email}/role", "DELETE /users/{email}", "GET /roles"
    ]}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
