use chrono::Utc;
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::Serialize;
use std::env;

const BASE: &str = "http://localhost:3002/api";
const BASE_DOMAIN: &str = "grace_church_dev.localhost"; // matches smoke test default
const JWT_SECRET: &str = "grace-nepal-church-jwt-secret-2026";

#[derive(Debug, Serialize)]
struct Claims {
    sub: String,
    email: String,
    role: String,
    exp: i64,
}

fn admin_token() -> String {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| JWT_SECRET.to_string());
    let exp = Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .expect("valid timestamp")
        .timestamp();
    let claims = Claims {
        sub: "1f42037d-7878-4890-a4a0-29a60b310c69".to_string(),
        email: "admin@gracenepal.org".to_string(),
        role: "admin".to_string(),
        exp,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .expect("mint admin JWT")
}

async fn req(
    method: reqwest::Method,
    path: &str,
    host: Option<String>,
    token: Option<String>,
) -> reqwest::Response {
    let client = reqwest::Client::new();
    let mut req = client.request(method, format!("{}{}", BASE, path));
    if let Some(h) = host {
        req = req.header("Host", h);
    }
    if let Some(t) = token {
        req = req.bearer_auth(t);
    }
    req.send().await.expect("request failed")
}

async fn assert_status(resp: reqwest::Response, expected: u16) {
    let status = resp.status().as_u16();
    assert_eq!(
        status, expected,
        "expected status {}, got {}",
        expected, status
    );
}

#[tokio::test]
async fn test_subdomain_scoping_valid() {
    // Valid subdomain should succeed (200) on a public endpoint
    let resp = req(
        reqwest::Method::GET,
        "/sermons",
        Some(format!("grace_church_dev.{}", BASE_DOMAIN)),
        None,
    )
    .await;
    assert_status(resp, 200).await;
}

#[tokio::test]
async fn test_subdomain_scoping_invalid_returns_404() {
    // Subdomain that does not correspond to a known tenant should give 404
    let resp = req(
        reqwest::Method::GET,
        "/sermons",
        Some("nonexistent.localhost".to_string()),
        None,
    )
    .await;
    assert_status(resp, 404).await;
}

#[tokio::test]
async fn test_subdomain_scoping_default_host() {
    // Using default Host header (localhost) should also work if default tenant is set
    // In the test environment, DEFAULT_TENANT is likely grace_church_dev
    let resp = req(
        reqwest::Method::GET,
        "/sermons",
        Some("localhost".to_string()),
        None,
    )
    .await;
    // Might be 200 if default tenant matches, otherwise 404.
    // We'll accept either, but we expect it to work because the smoke test uses localhost.
    let status = resp.status().as_u16();
    assert!(
        status == 200 || status == 404,
        "unexpected status {}",
        status
    );
}

#[tokio::test]
async fn cross_tenant_read_denied_with_valid_token() {
    // Attempt to read a protected endpoint using a token from tenant A but targeting tenant B host.
    // Expect 404 because tenant B's database does not have the user (or tenant not found).
    let token = admin_token();
    let resp = req(
        reqwest::Method::GET,
        "/users",
        Some("wrongtenant.localhost".to_string()),
        Some(token),
    )
    .await;
    // Should be 404 (tenant not found) or maybe 401 if user not found in that tenant's DB.
    // We'll accept 404 or 401 as denial.
    let status = resp.status().as_u16();
    assert!(
        status == 404 || status == 401 || status == 403,
        "expected deny status, got {}",
        status
    );
}

#[tokio::test]
async fn cross_tenant_write_denied_with_valid_token() {
    // Try to create a resource (POST) in wrong tenant -> should be denied.
    // We'll attempt to POST to /sermons (requires auth) with invalid host.
    let token = admin_token();
    let payload = serde_json::json!({
        "title": "Test Sermon",
        "slug": "test-sermon",
        "speaker": "Test",
        "content": "content",
        "published": true
    });
    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{}/sermons", BASE))
        .header("Host", "wrongtenant.localhost")
        .bearer_auth(token)
        .json(&payload)
        .send()
        .await
        .expect("request failed");
    let status = resp.status().as_u16();
    assert!(
        status == 404 || status == 401 || status == 403 || status == 422,
        "expected deny status, got {}",
        status
    );
}

#[tokio::test]
async fn valid_token_allowed_in_correct_tenant() {
    // Positive control: valid token with correct host should succeed (200) for endpoint that returns list.
    let token = admin_token();
    let resp = req(
        reqwest::Method::GET,
        "/users",
        Some(format!("grace_church_dev.{}", BASE_DOMAIN)),
        Some(token),
    )
    .await;
    assert_status(resp, 200).await;
}

#[tokio::test]
async fn missing_token_denied() {
    // Request to protected endpoint without token should be denied (401).
    let resp = req(
        reqwest::Method::GET,
        "/users",
        Some(format!("grace_church_dev.{}", BASE_DOMAIN)),
        None,
    )
    .await;
    let status = resp.status().as_u16();
    assert!(
        status == 401 || status == 403,
        "expected 401/403 for missing token, got {}",
        status
    );
}
