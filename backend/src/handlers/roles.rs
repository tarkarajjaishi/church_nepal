//! Role and permission administration.
//!
//! The rule that shapes this module: **you cannot lock the church out.**
//!
//! Every destructive operation here checks that at least one enabled user is
//! left holding a superuser role. Without that, a single careless "remove
//! role" leaves a church with a database nobody can administer and no way back
//! in except a DBA. The check runs inside the transaction that does the
//! removal, so two administrators demoting each other at the same moment
//! cannot both succeed.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::role::*;
use crate::permissions;
use crate::tenant::Db;
use axum::extract::Path;
use axum::Json;
use std::collections::HashSet;

const UNIQUE_VIOLATION: &str = "23505";

fn map_db_error(e: sqlx::Error) -> AppError {
    match &e {
        sqlx::Error::Database(db) if db.code().as_deref() == Some(UNIQUE_VIOLATION) => {
            AppError::conflict("A role with that name already exists")
        }
        _ => e.into(),
    }
}

fn slugify(s: &str) -> String {
    let out: String = s
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect();
    out.split('-').filter(|p| !p.is_empty()).collect::<Vec<_>>().join("-")
}

/// Reject permission codes the binary does not check.
///
/// Storing one would put a control in the UI that grants nothing — it would
/// read as protection and behave as decoration.
fn validate(codes: &[String]) -> Result<(), AppError> {
    let known: HashSet<&str> = permissions::ALL.iter().copied().collect();
    if let Some(bad) = codes.iter().find(|c| !known.contains(c.as_str())) {
        return Err(AppError::bad_request(format!(
            "There is no permission called \"{bad}\""
        )));
    }
    Ok(())
}

const ROLE_SELECT: &str = r#"
    SELECT r.id, r.slug, r.name, r.description, r.is_system, r.is_superuser, r.sort_order,
           COALESCE(ARRAY(SELECT rp.permission FROM role_permissions rp
                          WHERE rp.role_id = r.id ORDER BY rp.permission), '{}') AS permissions,
           (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id)::bigint AS user_count
    FROM roles r
"#;

/// How many enabled users still hold a superuser role.
///
/// Counted inside the caller's transaction and after the change, so the last
/// administrator cannot be removed by two concurrent requests that each saw
/// the other still there.
async fn superusers_left(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>) -> Result<i64, AppError> {
    Ok(sqlx::query_scalar(
        "SELECT COUNT(DISTINCT ur.user_id)
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         JOIN users u ON u.id = ur.user_id
         WHERE r.is_superuser",
    )
    .fetch_one(&mut **tx)
    .await?)
}

// ===========================================================================
// Reads
// ===========================================================================

pub async fn permissions_list(Db(pool): Db) -> Result<Json<Vec<PermissionInfo>>, AppError> {
    let mut rows = sqlx::query_as::<_, PermissionInfo>(
        "SELECT code, module, label, description, sort_order, true AS enforced
         FROM permissions ORDER BY sort_order, code",
    )
    .fetch_all(&pool)
    .await?;

    // The catalogue in the database is a mirror of the one in the binary. If
    // they have drifted, say so here rather than let an administrator grant
    // something nothing checks.
    let known: HashSet<&str> = permissions::ALL.iter().copied().collect();
    for p in rows.iter_mut() {
        p.enforced = known.contains(p.code.as_str());
    }
    Ok(Json(rows))
}

pub async fn roles_list(Db(pool): Db) -> Result<Json<Vec<Role>>, AppError> {
    let rows = sqlx::query_as::<_, Role>(&format!("{ROLE_SELECT} ORDER BY r.sort_order, r.name"))
        .fetch_all(&pool)
        .await?;
    Ok(Json(rows))
}

pub async fn users_with_roles(Db(pool): Db) -> Result<Json<Vec<UserWithRoles>>, AppError> {
    let rows = sqlx::query_as::<_, UserWithRoles>(
        r#"SELECT u.id, u.email, u.name, u.role,
                  COALESCE(ARRAY(SELECT r.slug FROM user_roles ur
                                 JOIN roles r ON r.id = ur.role_id
                                 WHERE ur.user_id = u.id ORDER BY r.sort_order), '{}') AS role_slugs,
                  COALESCE(ARRAY(SELECT r.name FROM user_roles ur
                                 JOIN roles r ON r.id = ur.role_id
                                 WHERE ur.user_id = u.id ORDER BY r.sort_order), '{}') AS role_names,
                  COALESCE(ARRAY(SELECT DISTINCT rp.permission FROM user_roles ur
                                 JOIN role_permissions rp ON rp.role_id = ur.role_id
                                 WHERE ur.user_id = u.id ORDER BY rp.permission), '{}') AS permissions
           FROM users u ORDER BY u.name, u.email"#,
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

/// What the caller may do. Used by the UI to hide what it must not offer.
pub async fn my_access(auth: AuthUser, Db(pool): Db) -> Result<Json<MyAccess>, AppError> {
    let held = crate::auth::permissions_for(&pool, &auth.user_id).await;
    let unmanaged = held.is_none();

    // A synthetic token reports what the signed claim actually grants, rather
    // than an empty list that would make the UI hide everything it can in fact
    // reach. Saying "unmanaged" out loud is the honest version.
    let permissions: Vec<String> = match &held {
        Some(p) => {
            let mut v: Vec<String> = p.iter().cloned().collect();
            v.sort();
            v
        }
        None if auth.role == "admin" => {
            permissions::ALL.iter().map(|s| s.to_string()).collect()
        }
        None => Vec::new(),
    };

    let roles: Vec<String> = if unmanaged {
        Vec::new()
    } else {
        sqlx::query_scalar(
            "SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id
             WHERE ur.user_id = $1::uuid ORDER BY r.sort_order",
        )
        .bind(&auth.user_id)
        .fetch_all(&pool)
        .await
        .unwrap_or_default()
    };

    Ok(Json(MyAccess {
        user_id: auth.user_id,
        email: auth.email,
        role: auth.role,
        permissions,
        roles,
        unmanaged,
    }))
}

// ===========================================================================
// Writes
// ===========================================================================

pub async fn roles_create(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertRole>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::bad_request("A role needs a name"));
    }
    let perms = input.permissions.unwrap_or_default();
    validate(&perms)?;

    let mut tx = pool.begin().await?;
    let id: uuid::Uuid = sqlx::query_scalar(
        "INSERT INTO roles (slug, name, description, sort_order) VALUES ($1,$2,$3,$4) RETURNING id",
    )
    .bind(slugify(&input.name))
    .bind(input.name.trim())
    .bind(input.description.unwrap_or_default())
    .bind(input.sort_order.unwrap_or(50))
    .fetch_one(&mut *tx)
    .await
    .map_err(map_db_error)?;

    for p in &perms {
        sqlx::query("INSERT INTO role_permissions (role_id, permission) VALUES ($1,$2)")
            .bind(id)
            .bind(p)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await?;
    Ok(Json(serde_json::json!({ "id": id })))
}

/// Replace a role's permission set.
///
/// The superuser role keeps `system.admin` whatever is sent: a church that
/// accidentally saves "Administrator" with nothing ticked would have no way to
/// undo it, because undoing it requires being an administrator.
pub async fn roles_set_permissions(
    auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<SetPermissions>,
) -> Result<Json<serde_json::Value>, AppError> {
    validate(&input.permissions)?;

    let mut tx = pool.begin().await?;
    let row: Option<(bool, String)> =
        sqlx::query_as("SELECT is_superuser, name FROM roles WHERE id = $1 FOR UPDATE")
            .bind(id)
            .fetch_optional(&mut *tx)
            .await?;
    let (is_superuser, name) = row.ok_or_else(|| AppError::not_found("Role not found"))?;

    let mut perms: HashSet<String> = input.permissions.into_iter().collect();
    if is_superuser {
        perms.insert(permissions::SYSTEM_ADMIN.to_string());
    }

    sqlx::query("DELETE FROM role_permissions WHERE role_id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await?;
    for p in &perms {
        sqlx::query("INSERT INTO role_permissions (role_id, permission) VALUES ($1,$2)")
            .bind(id)
            .bind(p)
            .execute(&mut *tx)
            .await?;
    }
    sqlx::query("UPDATE roles SET updated_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await?;

    // Everyone holding this role now has different rights. Their tokens carry
    // no permissions, so nothing needs revoking — permissions are resolved on
    // every request precisely so this takes effect at once.
    touch_holders(&mut tx, id).await?;
    tx.commit().await?;

    let _ = crate::handlers::audit::create_audit_entry(
        &pool, &auth.email, "update", "role", &id.to_string(),
        Some(serde_json::json!({ "role": name, "permissions": perms.len() })),
    )
    .await;

    Ok(Json(serde_json::json!({ "permissions": perms.len() })))
}

pub async fn roles_delete(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut tx = pool.begin().await?;
    let row: Option<(bool, i64)> = sqlx::query_as(
        "SELECT r.is_system, (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id)
         FROM roles r WHERE r.id = $1 FOR UPDATE",
    )
    .bind(id)
    .fetch_optional(&mut *tx)
    .await?;
    let (is_system, holders) = row.ok_or_else(|| AppError::not_found("Role not found"))?;

    if is_system {
        return Err(AppError::bad_request(
            "This is a built-in role. Change what it can do instead of deleting it.",
        ));
    }
    if holders > 0 {
        return Err(AppError::conflict(format!(
            "{holders} user(s) still hold this role — move them first"
        )));
    }

    sqlx::query("DELETE FROM roles WHERE id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

/// Bump `users.updated_at` for everyone holding a role.
///
/// `AuthUser` treats a user row newer than the token's `pwd_changed_at` as a
/// reason to reject the token, so this signs affected people out. Their next
/// sign-in gets the rights they actually have now.
async fn touch_holders(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    role_id: uuid::Uuid,
) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE users SET updated_at = NOW()
         WHERE id IN (SELECT user_id FROM user_roles WHERE role_id = $1)",
    )
    .bind(role_id)
    .execute(&mut **tx)
    .await?;
    Ok(())
}

/// Replace which roles a user holds.
pub async fn set_user_roles(
    auth: AuthUser,
    Db(pool): Db,
    Path(user_id): Path<uuid::Uuid>,
    Json(input): Json<SetUserRoles>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut tx = pool.begin().await?;

    let target: Option<String> = sqlx::query_scalar("SELECT email FROM users WHERE id = $1 FOR UPDATE")
        .bind(user_id)
        .fetch_optional(&mut *tx)
        .await?;
    let target_email = target.ok_or_else(|| AppError::not_found("User not found"))?;

    // Every id must exist, or a typo would silently grant less than intended.
    let found: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM roles WHERE id = ANY($1)")
        .bind(&input.role_ids)
        .fetch_one(&mut *tx)
        .await?;
    if found != input.role_ids.len() as i64 {
        return Err(AppError::bad_request("One of those roles does not exist"));
    }

    sqlx::query("DELETE FROM user_roles WHERE user_id = $1")
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
    for role_id in &input.role_ids {
        sqlx::query(
            "INSERT INTO user_roles (user_id, role_id, granted_by) VALUES ($1,$2,$3)",
        )
        .bind(user_id)
        .bind(role_id)
        .bind(&auth.email)
        .execute(&mut *tx)
        .await?;
    }

    // Checked after the change and inside the transaction, so two people
    // demoting each other simultaneously cannot both slip through.
    if superusers_left(&mut tx).await? == 0 {
        return Err(AppError::conflict(
            "That would leave the church with no administrator. Give someone else the Administrator role first.",
        ));
    }

    // Sign them out so the change is felt now, not when their token expires.
    sqlx::query("UPDATE users SET updated_at = NOW() WHERE id = $1")
        .bind(user_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    let _ = crate::handlers::audit::create_audit_entry(
        &pool, &auth.email, "update", "user_roles", &user_id.to_string(),
        Some(serde_json::json!({ "user": target_email, "roles": input.role_ids.len() })),
    )
    .await;

    Ok(Json(serde_json::json!({ "roles": input.role_ids.len() })))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_real_permissions_can_be_granted() {
        assert!(validate(&["giving.view".into(), "library.manage".into()]).is_ok());
        // The failure this prevents: a control in the UI that grants nothing.
        assert!(validate(&["giving.everything".into()]).is_err());
        assert!(validate(&["giving.view".into(), "made.up".into()]).is_err());
    }

    #[test]
    fn every_catalogue_entry_is_grantable() {
        let all: Vec<String> = permissions::ALL.iter().map(|s| s.to_string()).collect();
        assert!(validate(&all).is_ok());
    }

    #[test]
    fn role_names_become_usable_slugs() {
        assert_eq!(slugify("Finance Officer"), "finance-officer");
        assert_eq!(slugify("  Media & Tech  "), "media-tech");
    }
}
