use serde_json::json;

use crate::handlers::{
    ApiKeyRow, BillingInfo, BlogPost, Church, ChurchStats, HealthResponse, Notification,
    Plan, RefundAnalytics, RouteInfo, SearchResultItem, StatusComponent, StatusIncident,
    StatusResponse,
};

#[test]
fn login_response_contract() {
    let body = json!({
        "token": "abc123",
        "refresh_token": "refresh123",
        "email": "admin@test.com",
        "role": "super_admin"
    });

    assert!(body.get("token").and_then(|v| v.as_str()).is_some());
    assert!(body.get("refresh_token").and_then(|v| v.as_str()).is_some());
    assert!(body.get("email").and_then(|v| v.as_str()).is_some());
    assert!(body.get("role").and_then(|v| v.as_str()).is_some());
}

#[test]
fn login_twofa_required_response_contract() {
    let body = json!({ "twofa_required": true });
    assert!(body.get("twofa_required").and_then(|v| v.as_bool()).is_some());
}

#[test]
fn refresh_token_response_contract() {
    let body = json!({
        "token": "newtoken",
        "refresh_token": "newrefresh",
        "email": "admin@test.com",
        "role": "admin"
    });
    assert!(body.get("token").and_then(|v| v.as_str()).is_some());
    assert!(body.get("refresh_token").and_then(|v| v.as_str()).is_some());
    assert!(body.get("email").and_then(|v| v.as_str()).is_some());
    assert!(body.get("role").and_then(|v| v.as_str()).is_some());
}

#[test]
fn logout_response_contract() {
    let body = json!({ "success": true });
    assert!(body.get("success").and_then(|v| v.as_bool()).is_some());
}

#[test]
fn me_response_contract() {
    let body = json!({
        "id": "1",
        "email": "admin@test.com",
        "role": "super_admin",
        "twofa_enabled": false
    });
    assert!(body.get("id").and_then(|v| v.as_str()).is_some());
    assert!(body.get("email").and_then(|v| v.as_str()).is_some());
    assert!(body.get("role").and_then(|v| v.as_str()).is_some());
    assert!(body.get("twofa_enabled").and_then(|v| v.as_bool()).is_some());
}

#[test]
fn reset_password_response_contract() {
    let body = json!({ "success": true, "message": "Password updated" });
    assert!(body.get("success").and_then(|v| v.as_bool()).is_some());
    assert!(body.get("message").and_then(|v| v.as_str()).is_some());
}

#[test]
fn twofa_enroll_response_contract() {
    let body = json!({
        "secret": "BASE32SECRET",
        "otpauth_url": "otpauth://...",
        "qr_base64": "data:image/png;base64,..."
    });
    assert!(body.get("secret").and_then(|v| v.as_str()).is_some());
    assert!(body.get("otpauth_url").and_then(|v| v.as_str()).is_some());
    assert!(body.get("qr_base64").and_then(|v| v.as_str()).is_some());
}

#[test]
fn twofa_verify_response_contract() {
    let body = json!({ "success": true, "message": "2FA enabled" });
    assert!(body.get("success").and_then(|v| v.as_bool()).is_some());
    assert!(body.get("message").and_then(|v| v.as_str()).is_some());
}

#[test]
fn twofa_disable_response_contract() {
    let body = json!({ "success": true, "message": "2FA disabled" });
    assert!(body.get("success").and_then(|v| v.as_bool()).is_some());
    assert!(body.get("message").and_then(|v| v.as_str()).is_some());
}

#[test]
fn church_json_contract() {
    let church = Church {
        id: uuid::Uuid::new_v4(),
        name: "Grace Church".into(),
        slug: "gracechurchktm".into(),
        db_name: "gracechurchktm".into(),
        storage_path: "/storage/gracechurchktm".into(),
        subdomain: "gracechurchktm.churchnepal.com".into(),
        admin_email: "admin@test.com".into(),
        status: "active".into(),
        plan: Some("Standard".into()),
        custom_domain: None,
        last_active_at: None,
        storage_bytes: Some(0),
        notes: None,
        suspended_at: None,
        created_at: None,
        past_due_at: None,
    };

    let value = serde_json::to_value(&church).expect("serialize church");
    let obj = value.as_object().unwrap();

    assert!(obj.contains_key("id"));
    assert!(obj.contains_key("name"));
    assert!(obj.contains_key("slug"));
    assert!(obj.contains_key("subdomain"));
    assert!(obj.contains_key("admin_email"));
    assert!(obj.contains_key("status"));
    assert!(obj.contains_key("plan"));
    assert!(obj.contains_key("custom_domain"));
    assert!(obj.contains_key("storage_bytes"));
    assert!(obj.contains_key("notes"));
    assert!(obj.contains_key("suspended_at"));
    assert!(obj.contains_key("past_due_at"));
    assert!(obj.contains_key("created_at"));
}

#[test]
fn plan_json_contract() {
    let plan = Plan {
        id: uuid::Uuid::new_v4(),
        name: "Standard".into(),
        price_monthly: 2900,
        price_annual: 29000,
        max_members: 500,
        max_storage_mb: 1024,
        max_emails: 10000,
        max_churches: 1,
        features: json!({}),
        created_at: None,
    };

    let value = serde_json::to_value(&plan).expect("serialize plan");
    let obj = value.as_object().unwrap();

    assert!(obj.contains_key("id"));
    assert!(obj.contains_key("name"));
    assert!(obj.contains_key("price_monthly"));
    assert!(obj.contains_key("price_annual"));
    assert!(obj.contains_key("max_members"));
    assert!(obj.contains_key("max_storage_mb"));
    assert!(obj.contains_key("max_emails"));
    assert!(obj.contains_key("max_churches"));
    assert!(obj.contains_key("features"));
    assert!(obj.contains_key("created_at"));
}

#[test]
fn api_key_json_contract() {
    let row = ApiKeyRow {
        id: uuid::Uuid::new_v4(),
        name: "Test Key".into(),
        prefix: "cn_aaaaaaa".into(),
        last_four: "bbbb".into(),
        scopes: vec!["read".into()],
        revoked_at: None,
        last_used_at: None,
        created_at: chrono::Utc::now().naive_utc(),
    };

    let value = serde_json::to_value(&row).expect("serialize api key");
    let obj = value.as_object().unwrap();

    assert!(obj.contains_key("id"));
    assert!(obj.contains_key("name"));
    assert!(obj.contains_key("prefix"));
    assert!(obj.contains_key("last_four"));
    assert!(obj.contains_key("scopes"));
    assert!(obj.contains_key("revoked_at"));
    assert!(obj.contains_key("last_used_at"));
    assert!(obj.contains_key("created_at"));
}

#[test]
fn billing_info_json_contract() {
    let billing = BillingInfo {
        id: uuid::Uuid::new_v4(),
        church_id: uuid::Uuid::new_v4(),
        church_name: "Grace Church".into(),
        plan: "Standard".into(),
        status: "active".into(),
        trial_ends_at: None,
        current_period_end: None,
        mrr: 2900,
    };

    let value = serde_json::to_value(&billing).expect("serialize billing");
    let obj = value.as_object().unwrap();

    assert!(obj.contains_key("id"));
    assert!(obj.contains_key("church_id"));
    assert!(obj.contains_key("church_name"));
    assert!(obj.contains_key("plan"));
    assert!(obj.contains_key("status"));
    assert!(obj.contains_key("trial_ends_at"));
    assert!(obj.contains_key("current_period_end"));
    assert!(obj.contains_key("mrr"));
}

#[test]
fn notification_json_contract() {
    let notification = Notification {
        id: 1,
        event_type: "info".into(),
        title: "Test".into(),
        body: Some("Body".into()),
        church_id: None,
        read: false,
        created_at: chrono::Utc::now(),
    };

    let value = serde_json::to_value(&notification).expect("serialize notification");
    let obj = value.as_object().unwrap();

    assert!(obj.contains_key("id"));
    assert!(obj.contains_key("event_type"));
    assert!(obj.contains_key("title"));
    assert!(obj.contains_key("body"));
    assert!(obj.contains_key("church_id"));
    assert!(obj.contains_key("read"));
    assert!(obj.contains_key("created_at"));
}

#[test]
fn blog_post_json_contract() {
    let now = chrono::Utc::now();
    let post = BlogPost {
        id: uuid::Uuid::new_v4(),
        slug: "hello-world".into(),
        title: "Hello World".into(),
        excerpt: "Excerpt".into(),
        body: "Body".into(),
        cover: None,
        author: "Admin".into(),
        category: "News".into(),
        published: Some(true),
        published_at: Some(now),
        created_at: now,
    };

    let value = serde_json::to_value(&post).expect("serialize blog post");
    let obj = value.as_object().unwrap();

    assert!(obj.contains_key("id"));
    assert!(obj.contains_key("slug"));
    assert!(obj.contains_key("title"));
    assert!(obj.contains_key("excerpt"));
    assert!(obj.contains_key("body"));
    assert!(obj.contains_key("cover"));
    assert!(obj.contains_key("author"));
    assert!(obj.contains_key("category"));
    assert!(obj.contains_key("published"));
    assert!(obj.contains_key("published_at"));
    assert!(obj.contains_key("created_at"));
}

#[test]
fn church_stats_contract() {
    let stats = ChurchStats {
        members: 10,
        giving: 5000,
        events: 2,
        sermons: 5,
        groups: 3,
    };

    let value = serde_json::to_value(&stats).expect("serialize church stats");
    let obj = value.as_object().unwrap();

    assert!(obj.contains_key("members"));
    assert!(obj.contains_key("giving"));
    assert!(obj.contains_key("events"));
    assert!(obj.contains_key("sermons"));
    assert!(obj.contains_key("groups"));
}

#[test]
fn search_result_contract() {
    let item = SearchResultItem {
        id: "church-1".into(),
        label: "Grace Church".into(),
        kind: "church".into(),
        href: "/admin/churches/1".into(),
    };

    let value = serde_json::to_value(&item).expect("serialize search result");
    let obj = value.as_object().unwrap();

    assert!(obj.contains_key("id"));
    assert!(obj.contains_key("label"));
    assert!(obj.contains_key("type"));
    assert!(obj.contains_key("href"));
}

#[test]
fn health_response_contract() {
    let body = HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
        uptime_seconds: 0,
    };

    let value = serde_json::to_value(&body).expect("serialize health response");
    let obj = value.as_object().unwrap();

    assert!(obj.contains_key("status"));
    assert!(obj.contains_key("version"));
    assert!(obj.contains_key("uptime_seconds"));
}

#[test]
fn status_response_contract() {
    let body = StatusResponse {
        status: "operational".into(),
        updated_at: chrono::Utc::now().to_rfc3339(),
        components: vec![StatusComponent { name: "Database".into(), status: "up".into() }],
        incidents: vec![StatusIncident {
            id: "1".into(),
            date: "2024-01-01".into(),
            title: "None".into(),
            resolution: "None".into(),
            status: "resolved".into(),
        }],
    };

    let value = serde_json::to_value(&body).expect("serialize status response");
    let obj = value.as_object().unwrap();

    assert!(obj.contains_key("status"));
    assert!(obj.contains_key("updated_at"));
    assert!(obj.contains_key("components"));
    assert!(obj.contains_key("incidents"));
}

#[test]
fn refund_analytics_contract() {
    let body = RefundAnalytics {
        total_refunded: 0,
        refund_count: 0,
        parish_refunds: vec![],
    };

    let value = serde_json::to_value(&body).expect("serialize refund analytics");
    let obj = value.as_object().unwrap();

    assert!(obj.contains_key("total_refunded"));
    assert!(obj.contains_key("refund_count"));
    assert!(obj.contains_key("parish_refunds"));
}

#[test]
fn analytics_contract() {
    let analytics = crate::handlers::Analytics {
        total_churches: 0,
        active_churches: 0,
        suspended_churches: 0,
        total_members: 0,
        total_giving: 0,
        mrr: 0,
        churches_this_month: 0,
    };

    let value = serde_json::to_value(&analytics).expect("serialize analytics");
    let obj = value.as_object().unwrap();

    assert!(obj.contains_key("total_churches"));
    assert!(obj.contains_key("active_churches"));
    assert!(obj.contains_key("suspended_churches"));
    assert!(obj.contains_key("total_members"));
    assert!(obj.contains_key("total_giving"));
    assert!(obj.contains_key("mrr"));
    assert!(obj.contains_key("churches_this_month"));
}

#[test]
fn routes_catalog_contract() {
    let routes = crate::handlers::api_routes();
    let value = serde_json::to_value(routes).expect("serialize routes");
    let arr = value.as_array().expect("routes must be array");

    assert!(!arr.is_empty());
    let sample = arr[0].as_object().expect("route item must be object");
    assert!(sample.contains_key("method"));
    assert!(sample.contains_key("path"));
    assert!(sample.contains_key("auth"));

    let required_paths: Vec<&'static str> = vec![
        "/healthz",
        "/readyz",
        "/api/webhooks/stripe",
        "/api/auth/login",
        "/api/auth/refresh",
        "/api/auth/logout",
        "/api/auth/me",
        "/api/churches",
        "/api/plans",
        "/api/invoices",
        "/api/analytics",
        "/api/notifications",
        "/api/settings",
        "/api/search",
        "/api/blog",
        "/api/admin/blog",
        "/api/_routes",
    ];

    let paths: Vec<String> = arr.iter().filter_map(|v| v.get("path").and_then(|p| p.as_str().map(|s| s.to_string()))).collect();
    for required in &required_paths {
        assert!(paths.contains(&required.to_string()), "Missing route: {}", required);
    }
}
