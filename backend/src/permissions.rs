//! What each admin route requires, and how a user's permissions are resolved.
//!
//! Two rules shape this module:
//!
//! 1. **The catalogue lives here, not in the database.** A permission string
//!    only means something if code checks it, so the set of real permissions
//!    is the set this file knows about. Migration 069 seeds a mirror table for
//!    the UI to describe them; that table grants nothing.
//!
//! 2. **Unmapped routes fail closed.** `required_permission` has no
//!    permissive fallback: a path this file has never heard of requires
//!    `system.admin`. Adding a module without adding it here makes it
//!    administrator-only, which is noticed immediately. The opposite default
//!    would silently expose it to everyone, and nobody would notice at all.

use std::collections::HashSet;

pub const DASHBOARD_VIEW: &str = "dashboard.view";
pub const CONTENT_MANAGE: &str = "content.manage";
pub const SETTINGS_MANAGE: &str = "settings.manage";
pub const PEOPLE_VIEW: &str = "people.view";
pub const PEOPLE_MANAGE: &str = "people.manage";
pub const GIVING_VIEW: &str = "giving.view";
pub const GIVING_MANAGE: &str = "giving.manage";
pub const WORSHIP_MANAGE: &str = "worship.manage";
pub const PRESENTATION_MANAGE: &str = "presentation.manage";
pub const ASSETS_MANAGE: &str = "assets.manage";
pub const LIBRARY_MANAGE: &str = "library.manage";
pub const HELPDESK_MANAGE: &str = "helpdesk.manage";
pub const COMMUNICATION_MANAGE: &str = "communication.manage";
pub const USERS_MANAGE: &str = "users.manage";
pub const AUDIT_VIEW: &str = "audit.view";
/// Holding this means holding everything, including any route added later
/// that nobody has categorised yet.
pub const SYSTEM_ADMIN: &str = "system.admin";

pub const ALL: [&str; 16] = [
    DASHBOARD_VIEW,
    CONTENT_MANAGE,
    SETTINGS_MANAGE,
    PEOPLE_VIEW,
    PEOPLE_MANAGE,
    GIVING_VIEW,
    GIVING_MANAGE,
    WORSHIP_MANAGE,
    PRESENTATION_MANAGE,
    ASSETS_MANAGE,
    LIBRARY_MANAGE,
    HELPDESK_MANAGE,
    COMMUNICATION_MANAGE,
    USERS_MANAGE,
    AUDIT_VIEW,
    SYSTEM_ADMIN,
];

/// The permission a request needs, from the route it matched and its method.
///
/// Keyed on the first path segment of the *matched route pattern*, not on the
/// raw URL — so `/members/{id}/toggle` and `/members` resolve identically and
/// a crafted path cannot slip past by not matching the prefix someone
/// imagined.
///
/// Reading is split from writing only where reading is itself the sensitive
/// act: donor giving and personal contact details. Elsewhere a single
/// `manage` permission covers both, because a rota nobody may read is not a
/// rota anyone can work from.
pub fn required_permission(segment: &str, method: &axum::http::Method) -> &'static str {
    let reading = matches!(*method, axum::http::Method::GET | axum::http::Method::HEAD);

    match segment {
        // --- Overview ------------------------------------------------------
        "dashboard" | "church-dashboard" | "search" => DASHBOARD_VIEW,
        // Deliberately coarse. One endpoint serves nine reports across five
        // modules, so the route cannot know which permission this request
        // needs — `handlers::reports` checks the specific report's permission
        // itself, and the catalogue only lists what the caller may run.
        "reports" => DASHBOARD_VIEW,
        // Todos are the shared task list on the dashboard, not a module.
        "todos" => DASHBOARD_VIEW,

        // --- Website content ----------------------------------------------
        "sermons" | "ministries" | "events" | "leaders" | "gallery"
        | "testimonies" | "notices" | "service-times" | "verses" | "blog"
        | "services" | "team" | "portfolio" | "content-blocks" | "contact-info"
        | "upload" | "uploads" => CONTENT_MANAGE,

        "settings" => SETTINGS_MANAGE,

        // --- People --------------------------------------------------------
        // The member directory and attendance are personal data; reading them
        // is a decision a church should be able to make separately.
        "people" | "members" | "groups" | "member-applications" | "tags"
        | "attendance" => {
            if reading { PEOPLE_VIEW } else { PEOPLE_MANAGE }
        }

        // --- Giving --------------------------------------------------------
        // Who gave what is the most sensitive data here. `giving.view` is a
        // real gate, not a formality.
        "donations" | "offerings" | "offering-management" | "funds"
        | "cash-counts" | "deposits" | "campaigns" | "give" => {
            if reading { GIVING_VIEW } else { GIVING_MANAGE }
        }

        // --- Modules -------------------------------------------------------
        "worship" => WORSHIP_MANAGE,
        "presentation" | "presentations" | "songs" | "playlists"
        | "playlist-items" | "displays" => PRESENTATION_MANAGE,
        "assets" | "asset-categories" | "asset-assignments"
        | "asset-reservations" | "asset-maintenance" | "suppliers" => ASSETS_MANAGE,
        "library" => LIBRARY_MANAGE,
        "helpdesk" => HELPDESK_MANAGE,

        // --- Communication -------------------------------------------------
        "broadcasts" | "newsletter" | "contact-messages" | "forms"
        | "prayer-requests" => COMMUNICATION_MANAGE,

        // --- Administration ------------------------------------------------
        "users" | "roles" | "permissions" | "role-assignments" => USERS_MANAGE,
        "audit-log" | "webhooks" => AUDIT_VIEW,

        // Fails closed. See the module docs.
        _ => SYSTEM_ADMIN,
    }
}

/// Module segment of a matched route pattern (`/api/members/{id}` -> `members`).
///
/// `MatchedPath` carries the *whole* pattern including the `/api` mount
/// prefix from `nest("/api", ...)`, so the leading `api` has to come off. It
/// is not cosmetic: without it every route resolved to the segment `api`,
/// fell through to the fail-closed branch, and the entire admin API answered
/// 403 to everyone except a full administrator — a guard that looks like it
/// works because the only person testing it is the one it never blocks.
pub fn segment_of(path: &str) -> &str {
    let mut parts = path.trim_start_matches('/').split('/');
    match parts.next() {
        Some("api") => parts.next().unwrap_or(""),
        Some(first) => first,
        None => "",
    }
}

/// Does this permission set satisfy `needed`?
///
/// `system.admin` satisfies everything — that is what makes it the safe
/// fallback for unmapped routes rather than a lockout.
///
/// `*.manage` implies `*.view` for the two split modules. Granting someone the
/// right to record offerings but not to see them would be a rule that reads as
/// caution and behaves as a bug.
pub fn allows(held: &HashSet<String>, needed: &str) -> bool {
    if held.contains(SYSTEM_ADMIN) || held.contains(needed) {
        return true;
    }
    match needed {
        PEOPLE_VIEW => held.contains(PEOPLE_MANAGE),
        GIVING_VIEW => held.contains(GIVING_MANAGE),
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn set(items: &[&str]) -> HashSet<String> {
        items.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn an_unknown_route_needs_full_administrator_rights() {
        // The important one: a module added without touching this file must
        // not become world-readable to every logged-in volunteer.
        assert_eq!(
            required_permission("some-new-module", &axum::http::Method::GET),
            SYSTEM_ADMIN
        );
        assert!(!allows(&set(&[LIBRARY_MANAGE, HELPDESK_MANAGE]), SYSTEM_ADMIN));
    }

    #[test]
    fn reading_giving_is_separate_from_recording_it() {
        assert_eq!(required_permission("donations", &axum::http::Method::GET), GIVING_VIEW);
        assert_eq!(required_permission("donations", &axum::http::Method::POST), GIVING_MANAGE);
        // A librarian cannot read donor history.
        assert!(!allows(&set(&[LIBRARY_MANAGE]), GIVING_VIEW));
    }

    #[test]
    fn managing_implies_viewing_but_never_the_reverse() {
        assert!(allows(&set(&[GIVING_MANAGE]), GIVING_VIEW));
        assert!(!allows(&set(&[GIVING_VIEW]), GIVING_MANAGE));
        assert!(allows(&set(&[PEOPLE_MANAGE]), PEOPLE_VIEW));
        assert!(!allows(&set(&[PEOPLE_VIEW]), PEOPLE_MANAGE));
    }

    #[test]
    fn manage_on_one_module_never_leaks_into_another() {
        let librarian = set(&[DASHBOARD_VIEW, LIBRARY_MANAGE]);
        for p in ALL {
            let expected = p == DASHBOARD_VIEW || p == LIBRARY_MANAGE;
            assert_eq!(allows(&librarian, p), expected, "librarian vs {p}");
        }
    }

    #[test]
    fn system_admin_satisfies_every_permission() {
        let root = set(&[SYSTEM_ADMIN]);
        for p in ALL {
            assert!(allows(&root, p), "system.admin should allow {p}");
        }
    }

    #[test]
    fn segment_is_taken_from_the_pattern_not_the_raw_path() {
        assert_eq!(segment_of("/members/{id}/toggle"), "members");
        assert_eq!(segment_of("/library/books/{id}/hold"), "library");
        assert_eq!(segment_of("/"), "");
        assert_eq!(segment_of(""), "");
    }

    #[test]
    fn the_api_mount_prefix_is_stripped() {
        // MatchedPath includes the nest("/api", ...) prefix. Missing this made
        // every route resolve to `api` and answer 403 to everyone who was not
        // a full administrator.
        assert_eq!(segment_of("/api/library/dashboard"), "library");
        assert_eq!(segment_of("/api/donations/{id}/refund"), "donations");
        assert_eq!(segment_of("/api"), "");
        assert_ne!(
            required_permission(segment_of("/api/library/dashboard"), &axum::http::Method::GET),
            SYSTEM_ADMIN,
            "a prefixed path must resolve to its own module, not the fail-closed default"
        );
    }

    #[test]
    fn every_admin_route_segment_is_categorised() {
        // Every first segment reachable under admin_routes(). If a segment
        // here ever resolves to system.admin it means this file was not
        // updated alongside a new module, and only the administrator will be
        // able to use it — a visible failure, not a silent hole.
        let known = [
            "dashboard", "church-dashboard", "search", "todos", "reports",
            "sermons", "ministries", "events", "leaders", "gallery",
            "testimonies", "notices", "service-times", "verses", "blog",
            "services", "team", "portfolio", "content-blocks", "contact-info",
            "upload", "uploads", "settings",
            "people", "members", "groups", "member-applications", "tags", "attendance",
            "donations", "offerings", "offering-management", "funds",
            "cash-counts", "deposits", "campaigns",
            "worship", "presentation", "presentations", "songs", "playlists",
            "playlist-items", "displays",
            "assets", "asset-categories", "asset-assignments",
            "asset-reservations", "asset-maintenance", "suppliers",
            "library", "helpdesk",
            "broadcasts", "newsletter", "contact-messages", "forms", "prayer-requests",
            "users", "roles", "permissions", "role-assignments",
            "audit-log", "webhooks",
        ];
        for s in known {
            assert_ne!(
                required_permission(s, &axum::http::Method::GET),
                SYSTEM_ADMIN,
                "route segment /{s} has no permission of its own"
            );
        }
    }
}
