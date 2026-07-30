//! Roles and permissions models.
//!
//! `permissions` on a role is a plain `Vec<String>` of permission codes, read
//! back from `role_permissions` in the same query. There is no nesting to
//! flatten and no counter to fall out of date.

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PermissionInfo {
    pub code: String,
    pub module: String,
    pub label: String,
    pub description: String,
    pub sort_order: i32,
    /// False when the database has a permission the running binary does not
    /// check. Surfaced rather than hidden: a stale row grants nothing, and
    /// pretending otherwise is how a security screen starts lying.
    pub enforced: bool,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Role {
    pub id: uuid::Uuid,
    pub slug: String,
    pub name: String,
    pub description: String,
    pub is_system: bool,
    pub is_superuser: bool,
    pub sort_order: i32,
    pub permissions: Vec<String>,
    pub user_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpsertRole {
    pub name: String,
    pub description: Option<String>,
    pub permissions: Option<Vec<String>>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct SetPermissions {
    pub permissions: Vec<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct UserWithRoles {
    pub id: uuid::Uuid,
    pub email: String,
    pub name: String,
    /// The coarse legacy role on the user row. Still the first gate: a
    /// non-admin never reaches an admin route whatever roles they hold.
    pub role: String,
    pub role_slugs: Vec<String>,
    pub role_names: Vec<String>,
    /// The union of their roles' permissions, resolved server-side so the UI
    /// never has to work it out and get it subtly different.
    pub permissions: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct SetUserRoles {
    pub role_ids: Vec<uuid::Uuid>,
}

/// What the signed-in user may do, for the UI to hide what it must not offer.
///
/// Hiding a button is a courtesy, never the control — every one of these is
/// enforced again on the route.
#[derive(Debug, Serialize)]
pub struct MyAccess {
    pub user_id: String,
    pub email: String,
    pub role: String,
    pub permissions: Vec<String>,
    pub roles: Vec<String>,
    /// True for a hand-minted token with no user row behind it, where the
    /// signed claim governs instead of the role tables.
    pub unmanaged: bool,
}
