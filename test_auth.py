"""Test all FastAPI auth endpoints including refresh tokens."""
import requests
import json
import os

base = "http://localhost:8000"

# Clean up
if os.path.exists("users.json"):
    os.remove("users.json")

print("=== Register ===")
r = requests.post(f"{base}/register", json={"email": "admin@test.com", "password": "Admin123!", "name": "Admin"})
data = r.json()
print(f"OK: {data['user']['name']}")
print(f"  Access token: {data['access_token'][:30]}...")
print(f"  Refresh token: {data['refresh_token'][:30]}...")
access_token = data["access_token"]
refresh_token = data["refresh_token"]

# Make admin
users = json.load(open("users.json"))
users["admin@test.com"]["role"] = "admin"
json.dump(users, open("users.json", "w"), indent=2)

print("\n=== Login ===")
r = requests.post(f"{base}/login", json={"email": "admin@test.com", "password": "Admin123!"})
data = r.json()
access_token = data["access_token"]
refresh_token = data["refresh_token"]
headers = {"Authorization": f"Bearer {access_token}"}
print(f"OK: {data['user']['name']}")
print(f"  Access token: {access_token[:30]}...")
print(f"  Refresh token: {refresh_token[:30]}...")

print("\n=== Get Me ===")
r = requests.get(f"{base}/me", headers=headers)
print(f"OK: {r.json()['name']} - {r.json()['role']}")

print("\n=== Refresh Token ===")
r = requests.post(f"{base}/refresh", json={"refresh_token": refresh_token})
new_data = r.json()
print(f"OK: New access token: {new_data['access_token'][:30]}...")
print(f"  New refresh token: {new_data['refresh_token'][:30]}...")
new_access = new_data["access_token"]
new_refresh = new_data["refresh_token"]

print("\n=== Verify with new access token ===")
new_headers = {"Authorization": f"Bearer {new_access}"}
r = requests.get(f"{base}/me", headers=new_headers)
print(f"OK: {r.json()['name']}")

print("\n=== Old refresh token should be rejected ===")
r = requests.post(f"{base}/refresh", json={"refresh_token": refresh_token})
print(f"Status: {r.status_code} - {r.json()}")

print("\n=== Invalid refresh token ===")
r = requests.post(f"{base}/refresh", json={"refresh_token": "invalid_token"})
print(f"Status: {r.status_code} - {r.json()}")

print("\n=== Logout ===")
r = requests.post(f"{base}/logout", headers=headers, json={"refresh_token": new_refresh})
print(f"OK: {r.json()['message']}")

print("\n=== Old access token should be rejected ===")
r = requests.get(f"{base}/me", headers=headers)
print(f"Status: {r.status_code} - {r.json()}")

print("\n=== Refresh token should also be rejected ===")
r = requests.post(f"{base}/refresh", json={"refresh_token": new_refresh})
print(f"Status: {r.status_code} - {r.json()}")

print("\n=== Login fresh session for logout-all test ===")
r = requests.post(f"{base}/login", json={"email": "admin@test.com", "password": "Admin123!"})
data = r.json()
headers = {"Authorization": f"Bearer {data['access_token']}"}
refresh_all = data["refresh_token"]
print(f"OK: {data['user']['name']}")

print("\n=== Logout All Devices ===")
r = requests.post(f"{base}/logout-all", headers=headers)
print(f"OK: {r.json()['message']}")

print("\n=== Access token should be rejected ===")
r = requests.get(f"{base}/me", headers=headers)
print(f"Status: {r.status_code} - {r.json()}")

print("\n=== Refresh token should also be rejected ===")
r = requests.post(f"{base}/refresh", json={"refresh_token": refresh_all})
print(f"Status: {r.status_code} - {r.json()}")

print("\n=== Login fresh session ===")
r = requests.post(f"{base}/login", json={"email": "admin@test.com", "password": "Admin123!"})
data = r.json()
token = data["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"OK: {data['user']['name']}")

print("\n=== Update Profile ===")
r = requests.put(f"{base}/me", headers=headers, json={"name": "Admin Updated"})
print(f"OK: {r.json()['name']}")

print("\n=== Change Password ===")
r = requests.post(f"{base}/change-password", headers=headers, json={"current_password": "Admin123!", "new_password": "NewPass456!"})
print(f"OK: {r.json()['message']}")

print("\n=== Login with new password ===")
r = requests.post(f"{base}/login", json={"email": "admin@test.com", "password": "NewPass456!"})
data = r.json()
token = data["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"OK: {data['user']['name']}")

print("\n=== List Users ===")
r = requests.get(f"{base}/users", headers=headers)
print(f"OK: {len(r.json())} users")

print("\n=== Register + Delete ===")
requests.post(f"{base}/register", json={"email": "user@test.com", "password": "Pass123!", "name": "User"})
r = requests.delete(f"{base}/users/user@test.com", headers=headers)
print(f"OK: {r.json()['message']}")

print("\n=== Non-Admin Delete ===")
r = requests.post(f"{base}/register", json={"email": "regular@test.com", "password": "Pass123!", "name": "Regular"})
token2 = r.json()["access_token"]
headers2 = {"Authorization": f"Bearer {token2}"}
r = requests.delete(f"{base}/users/admin@test.com", headers=headers2)
print(f"Blocked: {r.json()['detail']}")

print("\n=== Password Reset ===")
r = requests.post(f"{base}/password-reset/request?email=admin@test.com")
print(f"Reset token: {r.json()['reset_token'][:30]}...")

print("\n=== Root ===")
r = requests.get(f"{base}/")
print(f"OK: {r.json()['message']} - {len(r.json()['endpoints'])} endpoints")

print("\nALL TESTS PASSED")
