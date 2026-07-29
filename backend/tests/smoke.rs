//! Smoke tests — hits every public + admin GET endpoint against a running
//! server and asserts 200 + valid JSON (array or object). Admin endpoints are
//! exercised with a freshly minted `role="admin"` JWT (HS256, same secret the
//! server uses), so the test needs NO pre-existing user in the DB.
//!
//! Tenant resolution uses the `Host` header; we target the seeded church via
//! `grace_church_dev.localhost` (subdomain `grace_church_dev` == the DB name).
//! `DEFAULT_TENANT` in `.env` is the same slug, so plain `localhost` also works.
//!
//! Prereqs: `grace-church-backend` running on port 3002 with a seeded church
//! DB. Run with: `cargo test --test smoke`
//!
//! Env overrides (optional):
//!   SMOKE_BASE   (default http://localhost:3002/api)
//!   SMOKE_HOST   (default grace_church_dev.localhost)
//!   JWT_SECRET   (default dev secret — must match the running server)

use chrono::Utc;
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::Serialize;
use serde_json::Value;

const DEFAULT_BASE: &str = "http://localhost:3002/api";
const DEFAULT_HOST: &str = "grace_church_dev.localhost";
const DEFAULT_SECRET: &str = "grace-nepal-church-jwt-secret-2026";

#[derive(Debug, Serialize)]
struct Claims {
    sub: String,
    email: String,
    role: String,
    exp: i64,
}

/// Mint an admin JWT using the same secret + claims shape the server expects.
fn admin_token() -> String {
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| DEFAULT_SECRET.to_string());
    let exp = Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .expect("valid timestamp")
        .timestamp();
    let claims = Claims {
        // Seeded church admin (provisioned user) so /auth/me resolves a real row.
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

fn base() -> String {
    std::env::var("SMOKE_BASE").unwrap_or_else(|_| DEFAULT_BASE.to_string())
}

fn host() -> String {
    std::env::var("SMOKE_HOST").unwrap_or_else(|_| DEFAULT_HOST.to_string())
}

/// GET without auth (public endpoints).
async fn get(path: &str) -> reqwest::Response {
    let client = reqwest::Client::new();
    client
        .get(format!("{}{}", base(), path))
        .header("Host", host())
        .send()
        .await
        .unwrap_or_else(|e| panic!("GET {path} failed to connect: {e}"))
}

/// GET with admin Bearer token (admin-only endpoints).
async fn get_admin(path: &str) -> reqwest::Response {
    let client = reqwest::Client::new();
    client
        .get(format!("{}{}", base(), path))
        .header("Host", host())
        .bearer_auth(admin_token())
        .send()
        .await
        .unwrap_or_else(|e| panic!("GET {path} failed to connect: {e}"))
}

/// Assert 200 + JSON value; returns the parsed body.
async fn ok_json(resp: reqwest::Response, path: &str) -> Value {
    let status = resp.status().as_u16();
    assert_eq!(status, 200, "GET {path} returned {status}");
    resp.json::<Value>()
        .await
        .unwrap_or_else(|e| panic!("GET {path} did not return valid JSON: {e}"))
}

/// Many list endpoints return a paginated envelope `{ data: [...], total, page,
/// ... }`. Unwrap `data` when present so tests can assert on the item list.
fn into_items(val: Value, path: &str) -> Vec<Value> {
    match val {
        Value::Array(arr) => arr,
        Value::Object(ref map) if map.get("data").is_some() => {
            match &val["data"] {
                Value::Array(arr) => arr.clone(),
                other => panic!("GET {path} envelope `data` was not an array: {other:?}"),
            }
        }
        other => panic!("GET {path} expected a JSON array or envelope, got {other:?}"),
    }
}

async fn assert_array(resp: reqwest::Response, path: &str) -> Vec<Value> {
    into_items(ok_json(resp, path).await, path)
}

async fn assert_object(resp: reqwest::Response, path: &str) -> Value {
    let val = ok_json(resp, path).await;
    assert!(val.is_object(), "GET {path} expected a JSON object");
    val
}

/// Fetch first id from a list response (tolerant of `{id}` as string).
fn first_id(arr: &[Value]) -> Option<String> {
    arr.first().and_then(|v| v.get("id")).and_then(|v| match v {
        Value::String(s) => Some(s.clone()),
        Value::Number(n) => Some(n.to_string()),
        _ => None,
    })
}

// ===========================================================================
// PUBLIC GET endpoints
// ===========================================================================

#[tokio::test]
async fn public_sermons_list() {
    let arr = assert_array(get("/sermons").await, "/sermons").await;
    assert!(!arr.is_empty(), "/sermons should be seeded");
}
#[tokio::test]
async fn public_sermons_detail() {
    let arr = assert_array(get("/sermons").await, "/sermons").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/sermons/{id}")).await, "/sermons/{id}").await;
    }
}
#[tokio::test]
async fn public_ministries_list() {
    assert_array(get("/ministries").await, "/ministries").await;
}
#[tokio::test]
async fn public_ministries_detail() {
    let arr = assert_array(get("/ministries").await, "/ministries").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/ministries/{id}")).await, "/ministries/{id}").await;
    }
}
#[tokio::test]
async fn public_events_list() {
    assert_array(get("/events").await, "/events").await;
}
#[tokio::test]
async fn public_events_detail() {
    let arr = assert_array(get("/events").await, "/events").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/events/{id}")).await, "/events/{id}").await;
    }
}
#[tokio::test]
async fn public_leaders_list() {
    assert_array(get("/leaders").await, "/leaders").await;
}
#[tokio::test]
async fn public_leaders_detail() {
    let arr = assert_array(get("/leaders").await, "/leaders").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/leaders/{id}")).await, "/leaders/{id}").await;
    }
}
#[tokio::test]
async fn public_gallery_list() {
    assert_array(get("/gallery").await, "/gallery").await;
}
#[tokio::test]
async fn public_gallery_detail() {
    let arr = assert_array(get("/gallery").await, "/gallery").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/gallery/{id}")).await, "/gallery/{id}").await;
    }
}
#[tokio::test]
async fn public_testimonies_list() {
    assert_array(get("/testimonies").await, "/testimonies").await;
}
#[tokio::test]
async fn public_testimonies_detail() {
    let arr = assert_array(get("/testimonies").await, "/testimonies").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/testimonies/{id}")).await, "/testimonies/{id}").await;
    }
}
#[tokio::test]
async fn public_notices_list() {
    assert_array(get("/notices").await, "/notices").await;
}
#[tokio::test]
async fn public_notices_detail() {
    let arr = assert_array(get("/notices").await, "/notices").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/notices/{id}")).await, "/notices/{id}").await;
    }
}
#[tokio::test]
async fn public_members_list() {
    assert_array(get("/members").await, "/members").await;
}
#[tokio::test]
async fn public_members_detail() {
    let arr = assert_array(get("/members").await, "/members").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/members/{id}")).await, "/members/{id}").await;
    }
}
#[tokio::test]
async fn public_service_times_list() {
    assert_array(get("/service-times").await, "/service-times").await;
}
#[tokio::test]
async fn public_service_times_detail() {
    let arr = assert_array(get("/service-times").await, "/service-times").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/service-times/{id}")).await, "/service-times/{id}").await;
    }
}
#[tokio::test]
async fn public_verses_list() {
    assert_array(get("/verses").await, "/verses").await;
}
#[tokio::test]
async fn public_verses_detail() {
    let arr = assert_array(get("/verses").await, "/verses").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/verses/{id}")).await, "/verses/{id}").await;
    }
}
#[tokio::test]
async fn public_campaigns_list() {
    assert_array(get("/campaigns").await, "/campaigns").await;
}
#[tokio::test]
async fn public_campaigns_detail() {
    let arr = assert_array(get("/campaigns").await, "/campaigns").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/campaigns/{id}")).await, "/campaigns/{id}").await;
    }
}
#[tokio::test]
async fn public_settings_list() {
    assert_array(get("/settings").await, "/settings").await;
}
#[tokio::test]
async fn public_settings_detail() {
    assert_object(get("/settings/theme_primary").await, "/settings/theme_primary").await;
}
#[tokio::test]
async fn public_settings_sections() {
    assert_object(get("/settings/sections").await, "/settings/sections").await;
}
#[tokio::test]
async fn public_content_blocks_enabled() {
    let arr = assert_array(get("/content-blocks/enabled").await, "/content-blocks/enabled").await;
    assert!(!arr.is_empty(), "enabled content blocks should be seeded");
}
#[tokio::test]
async fn public_content_block_by_key() {
    let val = assert_object(get("/content-blocks/key/hero").await, "/content-blocks/key/hero").await;
    assert_eq!(val["section_key"], "hero");
}
#[tokio::test]
async fn public_blog_list() {
    assert_array(get("/blog").await, "/blog").await;
}
#[tokio::test]
async fn public_blog_published() {
    assert_array(get("/blog/published").await, "/blog/published").await;
}
#[tokio::test]
async fn public_services_list() {
    assert_array(get("/services").await, "/services").await;
}
#[tokio::test]
async fn public_services_detail() {
    let arr = assert_array(get("/services").await, "/services").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/services/{id}")).await, "/services/{id}").await;
    }
}
#[tokio::test]
async fn public_team_list() {
    assert_array(get("/team").await, "/team").await;
}
#[tokio::test]
async fn public_team_detail() {
    let arr = assert_array(get("/team").await, "/team").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/team/{id}")).await, "/team/{id}").await;
    }
}
#[tokio::test]
async fn public_newsletter_count() {
    assert_object(get("/newsletter/count").await, "/newsletter/count").await;
}
#[tokio::test]
async fn public_portfolio_list() {
    assert_array(get("/portfolio").await, "/portfolio").await;
}
#[tokio::test]
async fn public_portfolio_detail() {
    let arr = assert_array(get("/portfolio").await, "/portfolio").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/portfolio/{id}")).await, "/portfolio/{id}").await;
    }
}
#[tokio::test]
async fn public_contact_info_list() {
    assert_array(get("/contact-info").await, "/contact-info").await;
}
#[tokio::test]
async fn public_contact_info_detail() {
    let arr = assert_array(get("/contact-info").await, "/contact-info").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/contact-info/{id}")).await, "/contact-info/{id}").await;
    }
}
#[tokio::test]
async fn public_groups_list() {
    assert_array(get("/groups").await, "/groups").await;
}
#[tokio::test]
async fn public_groups_detail() {
    let arr = assert_array(get("/groups").await, "/groups").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/groups/{id}")).await, "/groups/{id}").await;
    }
}
#[tokio::test]
async fn public_dashboard_stats() {
    assert_object(get("/dashboard/stats").await, "/dashboard/stats").await;
}
#[tokio::test]
async fn public_people_stats() {
    assert_object(get("/people/stats").await, "/people/stats").await;
}
#[tokio::test]
async fn public_offerings_stats() {
    assert_object(get("/offerings/stats").await, "/offerings/stats").await;
}
#[tokio::test]
async fn public_donations_status() {
    // Requires a `donation_id` query param; use a seeded gift.
    let arr = assert_array(get_admin("/donations").await, "/donations").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get(&format!("/donations/status?donation_id={id}")).await, "/donations/status").await;
    }
}
#[tokio::test]
async fn public_donations_stats() {
    assert_object(get("/donations/stats").await, "/donations/stats").await;
}
#[tokio::test]
async fn public_reports_giving_summary() {
    assert_object(get("/reports/giving-summary").await, "/reports/giving-summary").await;
}
#[tokio::test]
async fn public_reports_people_summary() {
    assert_object(get("/reports/people-summary").await, "/reports/people-summary").await;
}
#[tokio::test]
async fn public_auth_me() {
    // Any valid JWT (here an admin one) -> 200 with the user object.
    let val = assert_object(get_admin("/auth/me").await, "/auth/me").await;
    assert_eq!(val["role"], "admin");
}

// ===========================================================================
// ADMIN GET endpoints (require role='admin')
// ===========================================================================

#[tokio::test]
async fn admin_users_list() {
    assert_array(get_admin("/users").await, "/users").await;
}
#[tokio::test]
async fn admin_users_detail() {
    let arr = assert_array(get_admin("/users").await, "/users").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get_admin(&format!("/users/{id}")).await, "/users/{id}").await;
    }
}
#[tokio::test]
async fn admin_content_blocks_list() {
    assert_array(get_admin("/content-blocks").await, "/content-blocks").await;
}
#[tokio::test]
async fn admin_content_blocks_detail() {
    let arr = assert_array(get_admin("/content-blocks").await, "/content-blocks").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get_admin(&format!("/content-blocks/{id}")).await, "/content-blocks/{id}").await;
    }
}
#[tokio::test]
async fn admin_donations_list() {
    assert_array(get_admin("/donations").await, "/donations").await;
}
#[tokio::test]
async fn admin_donations_detail() {
    let arr = assert_array(get_admin("/donations").await, "/donations").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get_admin(&format!("/donations/{id}")).await, "/donations/{id}").await;
    }
}
#[tokio::test]
async fn admin_donations_statements() {
    assert_array(get_admin("/donations/statements").await, "/donations/statements").await;
}
#[tokio::test]
async fn admin_donations_by_donor() {
    assert_array(get_admin("/donations/by-donor").await, "/donations/by-donor").await;
}
#[tokio::test]
async fn admin_donations_donor_history() {
    // Requires an `email` query param; use a seeded donor.
    let arr = assert_array(get_admin("/donations/donor-history?email=bishal.rai@gracenepal.org").await, "/donations/donor-history").await;
    assert!(arr.iter().all(|d| d["donor_email"] == "bishal.rai@gracenepal.org"), "donor-history should filter by email");
}
#[tokio::test]
async fn admin_todos_list() {
    assert_array(get_admin("/todos").await, "/todos").await;
}
#[tokio::test]
async fn admin_todos_detail() {
    let arr = assert_array(get_admin("/todos").await, "/todos").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get_admin(&format!("/todos/{id}")).await, "/todos/{id}").await;
    }
}
#[tokio::test]
async fn admin_newsletter_subscribers() {
    assert_array(get_admin("/newsletter/subscribers").await, "/newsletter/subscribers").await;
}
#[tokio::test]
async fn admin_contact_messages_list() {
    assert_array(get_admin("/contact-messages").await, "/contact-messages").await;
}
#[tokio::test]
async fn admin_contact_messages_detail() {
    let arr = assert_array(get_admin("/contact-messages").await, "/contact-messages").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get_admin(&format!("/contact-messages/{id}")).await, "/contact-messages/{id}").await;
    }
}
#[tokio::test]
async fn admin_people_list() {
    assert_array(get_admin("/people").await, "/people").await;
}
#[tokio::test]
async fn admin_people_detail() {
    let arr = assert_array(get_admin("/people").await, "/people").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get_admin(&format!("/people/{id}")).await, "/people/{id}").await;
    }
}
#[tokio::test]
async fn admin_people_tags() {
    let arr = assert_array(get_admin("/people").await, "/people").await;
    if let Some(id) = first_id(&arr) {
        assert_array(get_admin(&format!("/people/{id}/tags")).await, "/people/{id}/tags").await;
    }
}
#[tokio::test]
async fn admin_people_notes() {
    let arr = assert_array(get_admin("/people").await, "/people").await;
    if let Some(id) = first_id(&arr) {
        assert_array(get_admin(&format!("/people/{id}/notes")).await, "/people/{id}/notes").await;
    }
}
#[tokio::test]
async fn admin_households_list() {
    assert_array(get_admin("/households").await, "/households").await;
}
#[tokio::test]
async fn admin_households_detail() {
    let arr = assert_array(get_admin("/households").await, "/households").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get_admin(&format!("/households/{id}")).await, "/households/{id}").await;
    }
}
#[tokio::test]
async fn admin_tags() {
    assert_array(get_admin("/tags").await, "/tags").await;
}
#[tokio::test]
async fn admin_groups_members() {
    let arr = assert_array(get_admin("/groups").await, "/groups").await;
    if let Some(id) = first_id(&arr) {
        assert_array(get_admin(&format!("/groups/{id}/members")).await, "/groups/{id}/members").await;
    }
}
#[tokio::test]
async fn admin_offerings_list() {
    assert_array(get_admin("/offerings").await, "/offerings").await;
}
#[tokio::test]
async fn admin_offerings_detail() {
    let arr = assert_array(get_admin("/offerings").await, "/offerings").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get_admin(&format!("/offerings/{id}")).await, "/offerings/{id}").await;
    }
}
#[tokio::test]
async fn admin_attendance_list() {
    assert_array(get_admin("/attendance").await, "/attendance").await;
}
#[tokio::test]
async fn admin_attendance_stats() {
    assert_object(get_admin("/attendance/stats").await, "/attendance/stats").await;
}
#[tokio::test]
async fn admin_broadcasts_list() {
    assert_array(get_admin("/broadcasts").await, "/broadcasts").await;
}
#[tokio::test]
async fn admin_broadcasts_detail() {
    let arr = assert_array(get_admin("/broadcasts").await, "/broadcasts").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get_admin(&format!("/broadcasts/{id}")).await, "/broadcasts/{id}").await;
    }
}
#[tokio::test]
async fn admin_forms_list() {
    assert_array(get_admin("/forms").await, "/forms").await;
}
#[tokio::test]
async fn admin_forms_detail() {
    let arr = assert_array(get_admin("/forms").await, "/forms").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get_admin(&format!("/forms/{id}")).await, "/forms/{id}").await;
    }
}
#[tokio::test]
async fn admin_forms_submissions() {
    let arr = assert_array(get_admin("/forms").await, "/forms").await;
    if let Some(id) = first_id(&arr) {
        assert_array(get_admin(&format!("/forms/{id}/submissions")).await, "/forms/{id}/submissions").await;
    }
}
#[tokio::test]
async fn admin_volunteer_teams_list() {
    assert_array(get_admin("/volunteer-teams").await, "/volunteer-teams").await;
}
#[tokio::test]
async fn admin_volunteer_teams_detail() {
    let arr = assert_array(get_admin("/volunteer-teams").await, "/volunteer-teams").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get_admin(&format!("/volunteer-teams/{id}")).await, "/volunteer-teams/{id}").await;
    }
}
#[tokio::test]
async fn admin_volunteer_shifts_list() {
    assert_array(get_admin("/volunteer-shifts").await, "/volunteer-shifts").await;
}
#[tokio::test]
async fn admin_volunteer_shifts_detail() {
    let arr = assert_array(get_admin("/volunteer-shifts").await, "/volunteer-shifts").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get_admin(&format!("/volunteer-shifts/{id}")).await, "/volunteer-shifts/{id}").await;
    }
}
#[tokio::test]
async fn admin_volunteer_shift_assignments() {
    let arr = assert_array(get_admin("/volunteer-shifts").await, "/volunteer-shifts").await;
    if let Some(id) = first_id(&arr) {
        assert_array(get_admin(&format!("/volunteer-shifts/{id}/assignments")).await, "/volunteer-shifts/{id}/assignments").await;
    }
}
#[tokio::test]
async fn admin_audit_log() {
    assert_array(get_admin("/audit-log").await, "/audit-log").await;
}
#[tokio::test]
async fn admin_funds_list() {
    assert_array(get_admin("/funds").await, "/funds").await;
}
#[tokio::test]
async fn admin_funds_detail() {
    let arr = assert_array(get_admin("/funds").await, "/funds").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get_admin(&format!("/funds/{id}")).await, "/funds/{id}").await;
    }
}
#[tokio::test]
async fn admin_recurring_donations() {
    assert_array(get_admin("/recurring-donations").await, "/recurring-donations").await;
}
#[tokio::test]
async fn admin_pledges_list() {
    assert_array(get_admin("/pledges").await, "/pledges").await;
}
#[tokio::test]
async fn admin_pledges_detail() {
    let arr = assert_array(get_admin("/pledges").await, "/pledges").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get_admin(&format!("/pledges/{id}")).await, "/pledges/{id}").await;
    }
}
#[tokio::test]
async fn admin_campaign_pledges() {
    let arr = assert_array(get("/campaigns").await, "/campaigns").await;
    if let Some(id) = first_id(&arr) {
        assert_array(get_admin(&format!("/campaigns/{id}/pledges")).await, "/campaigns/{id}/pledges").await;
    }
}
#[tokio::test]
async fn admin_member_applications_list() {
    assert_array(get_admin("/member-applications").await, "/member-applications").await;
}
#[tokio::test]
async fn admin_member_applications_stats() {
    assert_object(get_admin("/member-applications/stats").await, "/member-applications/stats").await;
}
#[tokio::test]
async fn admin_member_applications_detail() {
    let arr = assert_array(get_admin("/member-applications").await, "/member-applications").await;
    if let Some(id) = first_id(&arr) {
        assert_object(get_admin(&format!("/member-applications/{id}")).await, "/member-applications/{id}").await;
    }
}

// ===========================================================================
// Shape assertions on representative public resources
// ===========================================================================

#[tokio::test]
async fn shape_sermon() {
    let arr = assert_array(get("/sermons").await, "/sermons").await;
    if let Some(s) = arr.first() {
        assert!(s.get("id").is_some(), "sermon missing 'id'");
        assert!(s.get("title").is_some(), "sermon missing 'title'");
        assert!(s.get("speaker").is_some(), "sermon missing 'speaker'");
    }
}
#[tokio::test]
async fn shape_ministry() {
    let arr = assert_array(get("/ministries").await, "/ministries").await;
    if let Some(m) = arr.first() {
        assert!(m.get("id").is_some(), "ministry missing 'id'");
        assert!(m.get("name").is_some(), "ministry missing 'name'");
        assert!(m.get("description").is_some(), "ministry missing 'description'");
    }
}
#[tokio::test]
async fn shape_event() {
    let arr = assert_array(get("/events").await, "/events").await;
    if let Some(e) = arr.first() {
        assert!(e.get("id").is_some(), "event missing 'id'");
        assert!(e.get("title").is_some(), "event missing 'title'");
        assert!(e.get("date").is_some(), "event missing 'date'");
    }
}
#[tokio::test]
async fn shape_group() {
    let arr = assert_array(get("/groups").await, "/groups").await;
    if let Some(g) = arr.first() {
        assert!(g.get("id").is_some(), "group missing 'id'");
        assert!(g.get("name").is_some(), "group missing 'name'");
    }
}
#[tokio::test]
async fn shape_leader() {
    let arr = assert_array(get("/leaders").await, "/leaders").await;
    if let Some(l) = arr.first() {
        assert!(l.get("id").is_some(), "leader missing 'id'");
        assert!(l.get("name").is_some(), "leader missing 'name'");
        assert!(l.get("role").is_some(), "leader missing 'role'");
    }
}
#[tokio::test]
async fn shape_person() {
    let arr = assert_array(get_admin("/people").await, "/people").await;
    if let Some(p) = arr.first() {
        assert!(p.get("id").is_some(), "person missing 'id'");
        assert!(p.get("firstName").is_some() || p.get("first_name").is_some(), "person missing name field");
    }
}
#[tokio::test]
async fn shape_giving_summary() {
    let val = assert_object(get("/reports/giving-summary").await, "/reports/giving-summary").await;
    assert!(val.get("total_raised").is_some(), "giving-summary missing 'total_raised'");
    assert!(val.get("total_donations").is_some(), "giving-summary missing 'total_donations'");
    assert!(val.get("top_donors").is_some(), "giving-summary missing 'top_donors'");
}
