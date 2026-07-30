use axum::middleware::from_extractor;
use axum::routing::{delete, get, patch, post, put};
use axum::Router;

use crate::auth::PermissionGuard;
use crate::handlers::*;
use crate::{lenient_ip_governor, per_token_governor, strict_ip_governor};
use tower_governor::GovernorLayer;

// Public-write routes that POST a JSON body and must be validated and have a
// tighter per-IP rate-limit than the lenient global floor.
fn public_submit_routes() -> Router {
    Router::new()
        .route("/auth/login", post(auth::login))
        .route("/contact-messages", post(contact_messages::create))
        .route("/donations/initiate", post(donations::initiate))
        .route("/donations/callback/esewa", get(donations::callback_esewa))
        .route(
            "/donations/callback/khalti/{id}",
            post(donations::callback_khalti),
        )
        .route("/donations/callback/stripe", post(donations::callback_stripe))
        .route("/give/esewa/init", post(donations::init_esewa))
        .route(
            "/give/esewa/callback",
            get(donations::esewa_callback_get)
                .post(donations::esewa_callback_post),
        )
        .route("/events/{id}/rsvps", post(event_rsvps::create_public))
        .route("/forms/{id}/submit", post(forms::submit_public))
        .route("/groups/{id}/join", post(groups::join))
        .route("/member-applications", post(member_applications::create))
        .route("/newsletter/subscribe", post(newsletter::subscribe))
        .route("/prayer-requests", post(prayer_requests::create))
        .route(
            "/prayer-requests/{id}/pray",
            post(prayer_requests::pray),
        )
        .route("/testimonies/submit", post(testimonies::submit_public))
}

// Public-read routes (GET-only, no JSON body) — same per-IP bucket as the
// public_submit group so shared IPs between read and write are tracked
// together.
fn public_read_routes() -> Router {
    Router::new()
        // Content (public reads)
        .route("/sermons", get(sermons::list))
        .route("/sermons/public", get(sermons::list_public))
        .route("/sermons/{id}", get(sermons::get))
        .route("/ministries", get(ministries::list))
        .route("/ministries/{id}", get(ministries::get))
        .route("/events", get(events::list))
        .route("/events/{id}", get(events::get))
        .route("/leaders", get(leaders::list))
        .route("/leaders/{id}", get(leaders::get))
        .route("/gallery", get(gallery::list))
        .route("/gallery/{id}", get(gallery::get))
        .route("/testimonies", get(testimonies::list))
        .route("/testimonies/public", get(testimonies::list_public))
        .route("/testimonies/{id}", get(testimonies::get))
        .route("/notices", get(notices::list))
        .route("/notices/{id}", get(notices::get))
        .route("/members", get(members::list))
        .route("/members/{id}", get(members::get))
        .route("/service-times", get(service_times::list))
        .route("/service-times/{id}", get(service_times::get))
        .route("/verses", get(verses::list))
        .route("/verses/{id}", get(verses::get))
        .route("/campaigns", get(campaigns::list))
        .route("/campaigns/{id}", get(campaigns::get))
        .route("/campaigns/{id}/stats", get(campaigns::get_stats))
        .route("/settings", get(settings::list))
        .route("/settings/{key}", get(settings::get))
        .route("/settings/sections", get(settings::get_sections))
        .route("/uploads/{filename}", get(upload::serve_upload))
        .route("/content-blocks/enabled", get(content_blocks::list_enabled))
        .route("/content-blocks/key/{key}", get(content_blocks::get_by_key))
        .route("/blog", get(blog::list))
        .route("/blog/published", get(blog::list_published))
        .route("/blog/{id}", get(blog::get))
        .route("/services", get(services::list))
        .route("/services/{id}", get(services::get))
        .route("/team", get(team::list))
        .route("/team/{id}", get(team::get))
        .route("/newsletter/count", get(newsletter::count))
        .route("/portfolio", get(portfolio::list))
        .route("/portfolio/{id}", get(portfolio::get))
        .route("/contact-info", get(contact_info::list))
        .route("/contact-info/{id}", get(contact_info::get))
        .route("/groups", get(groups::list))
        .route("/groups/{id}", get(groups::get))
        .route("/dashboard/stats", get(dashboard::stats))
        .route("/dashboard/search", get(dashboard::search))
        .route("/people/stats", get(people::stats))
        .route("/offerings/stats", get(offerings::stats))
        .route("/donations/{id}/receipt", get(donations::receipt))
        .route("/donations/status", get(donations::status))
        // Broadcasts
        .route(
            "/broadcasts/open/{broadcast_id}/{recipient_id}",
            get(broadcasts::mark_opened),
        )
        .route("/funds", get(funds::list))
        .route("/funds/{id}", get(funds::get))
        // Display devices poll this unauthenticated — see live_watch_public.
        .route(
            "/presentation/live/watch",
            get(presentation_live::live_watch_public),
        )
        .route("/prayer-requests/public", get(prayer_requests::list_public))
}

/// Public + authenticated-write routes — same per-IP bucket (30/min) as
/// public_submit so the combined public face of the API is rate-limited as
/// one pool per IP. Individual public-write handlers also receive body
/// validation middleware that returns structured 400 on failure.
pub fn public_routes() -> Router {
    // Strict 30/min per IP — login and public writes are the abuse surface.
    let submit = public_submit_routes()
        .layer(GovernorLayer { config: strict_ip_governor() });

    Router::new().merge(submit).merge(public_read_routes())
}

/// Authenticated-user routes: same tight per-IP bucket as public-facing
/// public_routes so users share IPs (e.g. office, church Wi-Fi) see a
/// combined ceiling.
pub fn auth_routes() -> Router {
    Router::new()
        .route("/auth/me", get(auth::me).put(auth::update_me))
        // What the signed-in user may do. Deliberately not behind
        // `users.manage`: every user needs to read their own access, and the
        // UI cannot hide what it must not offer without asking.
        .route("/auth/access", get(roles::my_access))
        .route("/auth/change-password", post(auth::change_password))
        .route("/auth/refresh", post(auth::refresh))
        .route("/auth/logout", post(auth::logout))
        .layer(from_extractor::<crate::auth::AuthUser>())
        .layer(GovernorLayer { config: strict_ip_governor() })
}

/// Member portal routes: authenticated non-admin users only.
pub fn portal_routes() -> Router {
    Router::new()
        .route("/portal/me", get(members::portal_me).put(members::portal_update_me))
        .route("/portal/donations", get(members::portal_donations))
        .route("/portal/rsvps", get(members::portal_rsvps))
        .route("/portal/rsvps/{id}", delete(members::portal_cancel_rsvp))
        .route("/portal/groups", get(members::portal_groups))
        .route("/portal/magic-link", post(members::request_magic_link))
        .route("/portal/magic-login", post(members::magic_login))
        .route("/portal/directory", get(people::directory_list))
        .route("/portal/directory/contact", post(people::directory_contact))
        .layer(from_extractor::<crate::auth::MemberGuard>())
        .layer(GovernorLayer { config: strict_ip_governor() })
}

/// Admin-only routes (AdminGuard extractor). Tracked per bearer-token via
/// the AUTHORIZATION header at 1 000 req/min; falls back to per-IP counting
/// when no token is present.
pub fn admin_routes() -> Router {
    Router::new()
        // Users (admin only)
        .route("/users", get(users::list).post(users::create))
        .route(
            "/users/{id}",
            get(users::get).put(users::update).delete(users::delete),
        )
        // Sermons
        .route("/sermons", post(sermons::create))
        .route(
            "/sermons/{id}",
            put(sermons::update).delete(sermons::delete),
        )
        .route("/sermons/{id}/toggle", put(sermons::toggle))
        .route("/sermons/{id}/reorder", put(sermons::reorder))
        // Ministries
        .route("/ministries", post(ministries::create))
        .route(
            "/ministries/{id}",
            put(ministries::update).delete(ministries::delete),
        )
        .route("/ministries/{id}/toggle", put(ministries::toggle))
        .route("/ministries/{id}/reorder", put(ministries::reorder))
        // Events
        .route("/events", post(events::create))
        .route(
            "/events/{id}",
            put(events::update).delete(events::delete),
        )
        .route("/events/{id}/toggle", put(events::toggle))
        .route("/events/{id}/reorder", put(events::reorder))
        // Leaders
        .route("/leaders", post(leaders::create))
        .route(
            "/leaders/{id}",
            put(leaders::update).delete(leaders::delete),
        )
        .route("/leaders/{id}/toggle", put(leaders::toggle))
        .route("/leaders/{id}/reorder", put(leaders::reorder))
        // Gallery
        .route("/gallery", post(gallery::create))
        .route(
            "/gallery/{id}",
            put(gallery::update).delete(gallery::delete),
        )
        .route("/gallery/{id}/toggle", put(gallery::toggle))
        .route("/gallery/{id}/reorder", put(gallery::reorder))
        // Testimonies
        .route("/testimonies", post(testimonies::create))
        .route(
            "/testimonies/{id}",
            put(testimonies::update).delete(testimonies::delete),
        )
        .route("/testimonies/{id}/approve", put(testimonies::approve))
        .route("/testimonies/{id}/reject", put(testimonies::reject))
        .route("/testimonies/{id}/toggle", put(testimonies::toggle))
        .route("/testimonies/{id}/reorder", put(testimonies::reorder))
        // Notices
        .route("/notices", post(notices::create))
        .route(
            "/notices/{id}",
            put(notices::update).delete(notices::delete),
        )
        .route("/notices/{id}/toggle", put(notices::toggle))
        .route("/notices/{id}/reorder", put(notices::reorder))
        // Members (CRM)
        .route("/members", post(members::create))
        .route("/members/export-csv", get(members::export_csv))
        .route("/members/import-csv", post(members::import_csv))
        .route(
            "/members/{id}",
            put(members::update).delete(members::delete),
        )
        .route("/members/{id}/toggle", put(members::toggle))
        .route("/members/{id}/reorder", put(members::reorder))
        .route("/members/bulk/delete", post(members::bulk_delete))
        .route("/members/bulk/status", post(members::bulk_set_status))
        .route(
            "/members/bulk/household",
            post(members::bulk_set_household),
        )
        .route("/members/bulk/tag", post(members::bulk_assign_tag))
        .route(
            "/members/households",
            get(members::list_households).post(members::create_household),
        )
        .route(
            "/members/households/{id}",
            get(members::get_household)
                .put(members::update_household)
                .delete(members::delete_household),
        )
        .route(
            "/members/tags",
            get(members::list_tags).post(members::create_tag),
        )
        .route("/members/tags/{id}", delete(members::delete_tag))
        .route(
            "/members/{id}/tags",
            get(members::list_member_tags),
        )
        .route(
            "/members/{id}/tags/{tag_id}",
            post(members::add_member_tag).delete(members::remove_member_tag),
        )
        .route(
            "/members/{id}/notes",
            get(members::list_member_notes).post(members::create_member_note),
        )
        .route(
            "/members/{id}/notes/{note_id}",
            delete(members::delete_member_note),
        )
        .route(
            "/members/{id}/custom-fields",
            get(members::list_member_custom_fields)
                .post(members::set_member_custom_field),
        )
        .route(
            "/members/{id}/custom-fields/{field_id}",
            delete(members::delete_member_custom_field),
        )
        // Service Times
        .route("/service-times", post(service_times::create))
        .route(
            "/service-times/{id}",
            put(service_times::update).delete(service_times::delete),
        )
        .route("/service-times/{id}/toggle", put(service_times::toggle))
        .route(
            "/service-times/{id}/reorder",
            put(service_times::reorder),
        )
        // Verses
        .route("/verses", post(verses::create))
        .route(
            "/verses/{id}",
            put(verses::update).delete(verses::delete),
        )
        .route("/verses/{id}/toggle", put(verses::toggle))
        .route("/verses/{id}/reorder", put(verses::reorder))
        .route("/verses/{id}/pin", put(verses::pin))
        // Campaigns
        .route("/campaigns", post(campaigns::create))
        .route(
            "/campaigns/{id}",
            put(campaigns::update).delete(campaigns::delete),
        )
        .route("/campaigns/{id}/toggle", put(campaigns::toggle))
        .route("/campaigns/{id}/reorder", put(campaigns::reorder))
        .route(
            "/campaigns/{id}/recalc-raised",
            post(campaigns::recalc_raised),
        )
        // Settings (writes)
        .route("/settings/{key}", put(settings::upsert))
        .route(
            "/settings/sections/{section}/toggle",
            put(settings::toggle_section),
        )
        .route(
            "/settings/theme/draft",
            get(settings::get_theme_draft).put(settings::save_theme_draft),
        )
        .route("/settings/theme/publish", post(settings::publish_theme))
        // Upload
        .route("/upload", post(upload::upload))
        .route("/uploads", get(upload::list_uploads))
        // Content Blocks
        .route(
            "/content-blocks",
            get(content_blocks::list).post(content_blocks::create),
        )
        .route("/content-blocks/reorder", patch(content_blocks::batch_reorder))
        .route(
            "/content-blocks/{id}",
            get(content_blocks::get)
                .put(content_blocks::update)
                .delete(content_blocks::delete),
        )
        .route("/content-blocks/{id}/toggle", put(content_blocks::toggle))
        .route(
            "/content-blocks/{id}/reorder",
            put(content_blocks::reorder),
        )
        // Donations (admin reads)
        .route("/donations", get(donations::list))
        .route("/donations/stats", get(donations::stats))
        .route("/donations/gateway-status", get(donations::gateway_status))
        .route("/donations/funds-breakdown", get(donations::funds_breakdown))
        .route("/donations/export-csv", get(donations::export_csv))
        .route("/donations/{id}", get(donations::get))
        .route("/donations/{id}/refund", post(donations::refund))
        .route(
            "/donations/{id}/resend-receipt",
            post(donations::resend_receipt),
        )
        .route("/donations/statements", get(donations::statements))
        .route("/donations/by-donor", get(donations::by_donor))
        .route("/donations/donor-history", get(donations::donor_history))
        // Todos
        .route(
            "/todos",
            get(todos::list).post(todos::create),
        )
        .route(
            "/todos/{id}",
            get(todos::get).put(todos::update).delete(todos::delete),
        )
        .route("/todos/{id}/toggle", put(todos::toggle_status))
        .route("/todos/{id}/reorder", put(todos::reorder))
        // Blog (admin writes)
        .route("/blog", post(blog::create))
        .route(
            "/blog/{id}",
            put(blog::update).delete(blog::delete),
        )
        // Services (admin writes)
        .route("/services", post(services::create))
        .route(
            "/services/{id}",
            put(services::update).delete(services::delete).patch(services::update),
        )
        .route("/services/{id}/toggle", put(services::toggle))
        .route("/services/{id}/reorder", put(services::reorder))
        // Team (admin writes)
        .route("/team", post(team::create))
        .route(
            "/team/{id}",
            put(team::update).delete(team::delete),
        )
        .route("/team/{id}/toggle", put(team::toggle))
        .route("/team/{id}/reorder", put(team::reorder))
        // Newsletter (admin)
        .route(
            "/newsletter/subscribers",
            get(newsletter::list_subscribers),
        )
        .route(
            "/newsletter/unsubscribe/{email}",
            post(newsletter::unsubscribe),
        )
        // Portfolio (admin writes)
        .route("/portfolio", post(portfolio::create))
        .route(
            "/portfolio/{id}",
            put(portfolio::update).delete(portfolio::delete),
        )
        .route("/portfolio/{id}/toggle", put(portfolio::toggle))
        .route("/portfolio/{id}/reorder", put(portfolio::reorder))
        // Contact Info (admin writes)
        .route("/contact-info", post(contact_info::create))
        .route(
            "/contact-info/{id}",
            put(contact_info::update).delete(contact_info::delete),
        )
        .route("/contact-messages", get(contact_messages::list))
        .route(
            "/contact-messages/{id}",
            get(contact_messages::get)
                .put(contact_messages::update)
                .delete(contact_messages::delete),
        )
        .route(
            "/contact-messages/{id}/read",
            put(contact_messages::mark_read),
        )
        .route("/groups", post(groups::create))
        .route(
            "/groups/{id}",
            put(groups::update).delete(groups::delete),
        )
        .route("/groups/{id}/toggle", put(groups::toggle))
        .route("/groups/{id}/reorder", put(groups::reorder))
        // People (CRM)
        .route(
            "/people",
            get(people::list).post(people::create),
        )
        .route(
            "/people/{id}",
            get(people::get)
                .put(people::update)
                .delete(people::delete),
        )
        .route("/people/{id}/toggle", put(people::toggle))
        .route("/people/{id}/reorder", put(people::reorder))
        .route(
            "/people/{id}/tags",
            get(people::get_person_tags),
        )
        .route(
            "/people/{id}/tags/{tag_id}",
            post(people::add_person_tag).delete(people::remove_person_tag),
        )
        .route(
            "/people/{id}/notes",
            get(people::list_person_notes).post(people::create_person_note),
        )
        .route(
            "/people/{id}/notes/{note_id}",
            delete(people::delete_person_note),
        )
        // Households
        .route(
            "/households",
            get(people::list_households).post(people::create_household),
        )
        .route(
            "/households/{id}",
            get(people::get_household)
                .put(people::update_household)
                .delete(people::delete_household),
        )
        // Tags
        .route(
            "/tags",
            get(people::list_tags).post(people::create_tag),
        )
        .route("/tags/{id}", delete(people::delete_tag))
        // Group memberships
        .route(
            "/groups/{id}/members",
            get(people::list_group_members).post(people::add_group_member),
        )
        .route(
            "/groups/{group_id}/members/{person_id}",
            delete(people::remove_group_member),
        )
        // Offerings
        .route(
            "/offerings",
            get(offerings::list).post(offerings::create),
        )
        .route(
            "/offerings/{id}",
            get(offerings::get)
                .put(offerings::update)
                .delete(offerings::delete),
        )
        // ---- Offering Management module ----------------------------------
        // Registered before the `/offerings/{id}` catch-alls above would match,
        // because axum resolves static segments ahead of dynamic ones — but
        // kept adjacent so the whole offering surface reads together.
        .route(
            "/offering-management/dashboard",
            get(offering_mgmt::dashboard),
        )
        .route("/offering-management/offerings", get(offering_mgmt::offerings_page))
        .route(
            "/offering-management/offerings/create",
            post(offering_mgmt::offerings_create),
        )
        .route(
            "/offering-management/offerings/{id}/approve",
            post(offering_mgmt::offerings_approve),
        )
        .route(
            "/offering-management/offerings/{id}/reject",
            post(offering_mgmt::offerings_reject),
        )
        .route(
            "/offering-management/offerings/bulk-approve",
            post(offering_mgmt::offerings_bulk_approve),
        )
        // Categories
        .route(
            "/offering-categories",
            get(offering_mgmt::categories_list).post(offering_mgmt::categories_create),
        )
        .route(
            "/offering-categories/{id}",
            put(offering_mgmt::categories_update).delete(offering_mgmt::categories_delete),
        )
        .route(
            "/offering-categories/{id}/allocations",
            get(offering_mgmt::allocation_rules_get).put(offering_mgmt::allocation_rules_set),
        )
        // Bank accounts
        .route(
            "/bank-accounts",
            get(offering_mgmt::bank_accounts_list).post(offering_mgmt::bank_accounts_create),
        )
        .route(
            "/bank-accounts/{id}",
            put(offering_mgmt::bank_accounts_update),
        )
        // Cash counting
        .route(
            "/cash-counts",
            get(offering_mgmt::cash_counts_list).post(offering_mgmt::cash_counts_save),
        )
        .route("/cash-counts/{id}", get(offering_mgmt::cash_counts_get))
        .route(
            "/cash-counts/{id}/approve",
            post(offering_mgmt::cash_counts_approve),
        )
        // Deposits
        .route(
            "/deposits",
            get(offering_mgmt::deposits_list).post(offering_mgmt::deposits_create),
        )
        .route("/deposits/{id}/verify", post(offering_mgmt::deposits_verify))
        .route(
            "/deposits/{id}/status/{status}",
            post(offering_mgmt::deposits_set_status),
        )
        // ---- Presentation & Worship Display module ------------------------
        // Songs
        .route("/songs", get(presentation::songs_list).post(presentation::songs_create))
        .route(
            "/songs/{id}",
            get(presentation::songs_get)
                .put(presentation::songs_update)
                .delete(presentation::songs_delete),
        )
        .route("/songs/{id}/slide-preview", get(presentation::songs_preview_slides))
        // Themes
        .route(
            "/presentation-themes",
            get(presentation::themes_list).post(presentation::themes_create),
        )
        // Presentations (decks) and slides
        .route(
            "/presentations",
            get(presentation::presentations_list).post(presentation::presentations_create),
        )
        .route(
            "/presentations/{id}",
            get(presentation::presentations_get).delete(presentation::presentations_delete),
        )
        .route("/presentations/from-song", post(presentation::presentations_from_song))
        .route("/presentations/{id}/slides", post(presentation::slides_create))
        .route("/presentations/{id}/slides/reorder", put(presentation::slides_reorder))
        .route(
            "/slides/{id}",
            put(presentation::slides_update).delete(presentation::slides_delete),
        )
        // Playlists
        .route(
            "/playlists",
            get(presentation_live::playlists_list).post(presentation_live::playlists_create),
        )
        .route(
            "/playlists/{id}",
            get(presentation_live::playlists_get)
                .put(presentation_live::playlists_update)
                .delete(presentation_live::playlists_delete),
        )
        .route("/playlists/{id}/duplicate", post(presentation_live::playlists_duplicate))
        .route("/playlists/{id}/items", post(presentation_live::playlist_items_add))
        .route(
            "/playlists/{id}/items/reorder",
            put(presentation_live::playlist_items_reorder),
        )
        .route("/playlist-items/{id}", delete(presentation_live::playlist_items_delete))
        // Displays
        .route(
            "/displays",
            get(presentation_live::displays_list).post(presentation_live::displays_create),
        )
        .route(
            "/displays/{id}",
            put(presentation_live::displays_update).delete(presentation_live::displays_delete),
        )
        // Live control
        // ---- Worship Management -------------------------------------------
        // ---- Asset Management ---------------------------------------------
        .route("/assets/dashboard", get(assets::dashboard))
        .route("/asset-categories", get(assets::categories_list).post(assets::categories_create))
        .route("/suppliers", get(assets::suppliers_list).post(assets::suppliers_create))
        .route("/assets", get(assets::assets_list).post(assets::assets_create))
        .route("/assets/{id}", get(assets::assets_get).put(assets::assets_update))
        .route("/assets/{id}/dispose/{status}", post(assets::assets_dispose))
        .route("/assets/{id}/assign", post(assets::assign))
        .route("/asset-assignments", get(assets::assignments_list))
        .route("/asset-assignments/{id}/return", post(assets::assignment_return))
        .route("/assets/{id}/reserve", post(assets::reserve))
        .route("/asset-reservations", get(assets::reservations_list))
        .route("/asset-reservations/{id}/{decision}", post(assets::reservation_decide))
        .route("/assets/{id}/maintenance", post(assets::maintenance_create))
        .route("/asset-maintenance", get(assets::maintenance_list))
        .route("/asset-maintenance/{id}/complete", post(assets::maintenance_complete))
        .route("/worship/dashboard", get(worship::dashboard))
        .route("/worship/roles", get(worship::roles_list))
        .route("/worship/members", get(worship::members_list).post(worship::members_create))
        .route("/worship/members/{id}", put(worship::members_update).delete(worship::members_delete))
        .route("/worship/services", get(worship::services_list).post(worship::services_create))
        .route("/worship/services/{id}", get(worship::services_get).put(worship::services_update).delete(worship::services_delete))
        .route("/worship/services/{id}/duplicate", post(worship::services_duplicate))
        .route("/worship/services/{id}/items", post(worship::items_add))
        .route("/worship/services/{id}/items/reorder", put(worship::items_reorder))
        .route("/worship/items/{id}", put(worship::items_update).delete(worship::items_delete))
        .route("/worship/services/{id}/assign", post(worship::assign))
        .route("/worship/assignments/{id}", delete(worship::unassign))
        .route("/worship/assignments/{id}/status/{status}", post(worship::assignment_status))
        .route("/worship/rehearsals", get(worship::rehearsals_list).post(worship::rehearsals_create))
        .route("/worship/rehearsals/{id}", delete(worship::rehearsals_delete))
        .route("/worship/rehearsals/{id}/attendance", post(worship::rehearsals_attendance))
        // ---- Reports ---------------------------------------------------------
        // These handlers existed but were never routed, so /admin/reports has
        // been rendering empty charts from 404s that its `= {}` defaults
        // swallowed. Mounted under the module each one reads from rather than a
        // shared /reports prefix, so the giving summary needs `giving.view` and
        // the people summary needs `people.view` — a coordinator gets the
        // people half and a finance officer gets the money half, which is the
        // whole point of splitting those permissions.
        // One endpoint per verb, not one per report: every report returns the
        // same envelope, so the catalogue, the runner and the exporter are
        // each a single route. The permission is checked per report inside the
        // handler, since one route cannot know which module is being asked for.
        .route("/reports", get(reports::catalogue))
        // Static segments before the `{key}` param, so a saved-report route is
        // never swallowed by the ad-hoc runner.
        .route("/reports/saved", get(saved_reports::list).post(saved_reports::create))
        .route(
            "/reports/saved/{id}",
            put(saved_reports::update).delete(saved_reports::delete),
        )
        .route("/reports/saved/{id}/run", get(saved_reports::run))
        .route("/reports/saved/{id}/export", get(saved_reports::export))
        .route("/reports/{key}", get(reports::run))
        .route("/reports/{key}/export", get(reports::export))
        // ---- Roles & permissions --------------------------------------------
        // Separate top-level segments rather than nesting everything under
        // /roles/, so no static path ever sits where the matcher expects an id.
        .route("/roles", get(roles::roles_list).post(roles::roles_create))
        .route("/roles/{id}", delete(roles::roles_delete))
        .route("/roles/{id}/permissions", put(roles::roles_set_permissions))
        .route("/permissions", get(roles::permissions_list))
        .route("/role-assignments", get(roles::users_with_roles))
        .route("/role-assignments/{id}", put(roles::set_user_roles))
        // ---- Church Library -----------------------------------------------
        .route("/library/dashboard", get(library::dashboard))
        .route("/library/categories", get(library::categories_list))
        .route("/library/authors", get(library::authors_list))
        .route("/library/settings", get(library::settings_get).put(library::settings_update))
        .route("/library/books", get(library::books_list).post(library::books_create))
        .route("/library/books/{id}", get(library::books_get))
        .route("/library/books/{id}/copies", post(library::copies_add))
        .route("/library/copies/{id}", put(library::copy_update))
        .route("/library/books/{id}/hold", post(library::hold_create))
        .route("/library/loans", get(library::loans_list).post(library::borrow))
        .route("/library/loans/{id}/return", post(library::loan_return))
        .route("/library/loans/{id}/renew", post(library::loan_renew))
        .route("/library/holds", get(library::holds_list))
        .route("/library/holds/{id}", delete(library::hold_cancel))
        .route("/library/borrowers", get(library::borrowers_list))
        // ---- Help Desk ------------------------------------------------------
        .route("/helpdesk/dashboard", get(helpdesk::dashboard))
        .route("/helpdesk/categories", get(helpdesk::categories_list).post(helpdesk::categories_create))
        .route("/helpdesk/tickets", get(helpdesk::tickets_list).post(helpdesk::tickets_create))
        .route("/helpdesk/tickets/{id}", get(helpdesk::tickets_get).put(helpdesk::tickets_update))
        .route("/helpdesk/tickets/{id}/claim", post(helpdesk::tickets_claim))
        .route("/helpdesk/tickets/{id}/release", post(helpdesk::tickets_release))
        .route("/helpdesk/tickets/{id}/status", post(helpdesk::tickets_status))
        .route("/helpdesk/tickets/{id}/comments", post(helpdesk::comments_add))
        .route("/helpdesk/articles", get(helpdesk::articles_list).post(helpdesk::articles_create))
        .route("/helpdesk/articles/{id}/helpful", post(helpdesk::articles_helpful))
        .route("/church-dashboard", get(church_dashboard::overview))
        .route("/presentation/dashboard", get(presentation_live::dashboard))
        .route("/presentation/live", get(presentation_live::live_get))
        .route("/presentation/live/go", post(presentation_live::live_go))
        .route("/presentation/live/stop", post(presentation_live::live_stop))
        .route("/presentation/live/step/{direction}", post(presentation_live::live_step))
        .route("/presentation/live/goto", post(presentation_live::live_goto))
        .route("/presentation/live/screen", post(presentation_live::live_screen_mode))
        .route("/presentation/live/countdown", post(presentation_live::live_countdown))
        .route(
            "/presentation/live/countdown/toggle",
            post(presentation_live::live_countdown_toggle),
        )
        .route("/presentation/live/lower-third", post(presentation_live::live_lower_third))
        // Event RSVPs (admin)
        .route(
            "/rsvps/{id}",
            delete(event_rsvps::delete),
        )
        // Attendance
        .route(
            "/attendance",
            get(attendance::list).post(attendance::check_in),
        )
        .route("/attendance/stats", get(attendance::stats))
        .route("/attendance/trends", get(attendance::trends))
        .route("/attendance/by-service", get(attendance::by_service))
        // Broadcasts
        .route(
            "/broadcasts",
            get(broadcasts::list).post(broadcasts::create),
        )
        .route(
            "/broadcasts/{id}",
            get(broadcasts::get)
                .put(broadcasts::update)
                .delete(broadcasts::delete),
        )
        .route("/broadcasts/{id}/send", post(broadcasts::send))
        .route(
            "/broadcasts/{id}/schedule",
            post(broadcasts::schedule),
        )
        .route("/broadcasts/{id}/stats", get(broadcasts::stats))
        .route(
            "/broadcasts/{id}/recipients",
            get(broadcasts::list_recipients),
        )
        // Forms
        .route(
            "/forms",
            get(forms::list).post(forms::create),
        )
        .route(
            "/forms/{id}",
            get(forms::get).put(forms::update).delete(forms::delete),
        )
        .route("/forms/{id}/submissions", get(forms::list_submissions))
        // Volunteers
        .route(
            "/volunteer-teams",
            get(volunteers::list_teams).post(volunteers::create_team),
        )
        .route(
            "/volunteer-teams/{id}",
            get(volunteers::get_team)
                .put(volunteers::update_team)
                .delete(volunteers::delete_team),
        )
        .route(
            "/volunteer-shifts",
            get(volunteers::list_shifts).post(volunteers::create_shift),
        )
        .route(
            "/volunteer-shifts/{id}",
            get(volunteers::get_shift)
                .put(volunteers::update_shift)
                .delete(volunteers::delete_shift),
        )
        .route(
            "/volunteer-shifts/{id}/assignments",
            get(volunteers::list_assignments)
                .post(volunteers::create_assignment),
        )
        // Audit Log
        .route("/audit-log", get(audit::list))
        .route("/audit-log/export-csv", get(audit::export_csv))
        // Funds — GET /funds and GET /funds/{id} are served by public_read_routes;
        // registering them here too panics axum with an overlapping method route.
        .route("/funds", post(funds::create))
        .route(
            "/funds/{id}",
            put(funds::update).delete(funds::delete),
        )
        .route(
            "/recurring-donations",
            get(donations::list_recurring).post(donations::create_recurring),
        )
        .route(
            "/recurring-donations/{id}",
            get(donations::get_recurring),
        )
        .route(
            "/recurring-donations/{id}/pause",
            post(donations::pause_recurring),
        )
        .route(
            "/recurring-donations/{id}/cancel",
            post(donations::cancel_recurring),
        )
        // Pledges
        .route(
            "/pledges",
            get(pledges::list_all).post(pledges::create),
        )
        .route(
            "/pledges/{id}",
            get(pledges::get).put(pledges::update).delete(pledges::delete),
        )
        .route(
            "/campaigns/{id}/pledges",
            get(pledges::list_by_campaign),
        )
        // Member Applications (admin management)
        .route("/member-applications", get(member_applications::list))
        .route(
            "/member-applications/stats",
            get(member_applications::stats),
        )
        .route(
            "/member-applications/{id}",
            get(member_applications::get)
                .put(member_applications::update)
                .delete(member_applications::delete),
        )
        .route(
            "/member-applications/{id}/approve",
            put(member_applications::approve),
        )
        .route(
            "/member-applications/{id}/reject",
            put(member_applications::reject),
        )
        // Prayer Requests (admin moderation)
        .route("/prayer-requests", get(prayer_requests::list_all))
        .route(
            "/prayer-requests/{id}",
            get(prayer_requests::get)
                .put(prayer_requests::update)
                .delete(prayer_requests::delete),
        )
        .route(
            "/prayer-requests/{id}/approve",
            put(prayer_requests::approve),
        )
        .route(
            "/prayer-requests/{id}/reject",
            put(prayer_requests::reject),
        )
        // Webhooks
        .route("/webhooks", get(webhooks::list_endpoints).post(webhooks::create_endpoint))
        .route(
            "/webhooks/{id}",
            get(webhooks::get_endpoint).put(webhooks::update_endpoint).delete(webhooks::delete_endpoint),
        )
        .route("/webhooks/deliveries", get(webhooks::list_deliveries))
        .route(
            "/webhooks/deliveries/{id}/retry",
            post(webhooks::retry_delivery),
        )
        // Search (admin)
        .route("/search", get(dashboard::search))
        // 1 000/min keyed on the bearer token, so one busy admin session cannot
        // consume another's budget. Falls back to IP when no token is present.
        .layer(GovernorLayer { config: per_token_governor() })
}

/// State-agnostic root: handlers pick up their pool via the tenant extractor.
pub fn api_routes() -> Router {
    // Per-IP strict governor (30/min) applied over the lenient 200/min
    // global governor on public + auth route groups. Both thresholds must
    // pass for a request to succeed — that is the "stricter" behaviour
    // the task requires for these sensitive endpoints.
    let public = public_routes();

    let auth = auth_routes()
        // AuthGuard is an axum extractor; it runs only after the request
        // has cleared the rate limits above.
        .layer(from_extractor::<crate::auth::AuthUser>());

    let portal = portal_routes();

    let guarded_admin = admin_routes()
        // `route_layer`, not `layer`. A `layer` wraps the router itself and so
        // runs *before* the request is routed, which means `MatchedPath` is
        // not set yet — the guard then saw an empty path, resolved it through
        // the fail-closed branch, and refused every request from anyone who
        // was not a full administrator. `route_layer` runs after matching,
        // where the pattern the guard needs actually exists.
        .route_layer(from_extractor::<PermissionGuard>());

    Router::new()
        .merge(public)
        .merge(auth)
        .merge(portal)
        .merge(guarded_admin)
        // Global floor: 200/min per IP across every route. The stricter
        // per-group limiters above nest inside this, so a burst must clear both.
        .layer(GovernorLayer { config: lenient_ip_governor() })
}
