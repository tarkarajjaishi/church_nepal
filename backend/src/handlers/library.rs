//! Church Library handlers.
//!
//! The one rule that shapes this module: availability is never a stored
//! counter. A loan points at a specific copy, a partial unique index allows
//! one open loan per copy, and "available" means "copies with no open loan".
//! Two people cannot take the last copy, whatever the handler does.

use crate::auth::AuthUser;
use crate::error::AppError;
use crate::models::library::*;
use crate::tenant::Db;
use axum::extract::{Path, Query};
use axum::Json;

const UNIQUE_VIOLATION: &str = "23505";
const CHECK_VIOLATION: &str = "23514";

fn parse_date(s: &str) -> Result<chrono::NaiveDate, AppError> {
    chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d")
        .map_err(|_| AppError::bad_request("Invalid date, expected YYYY-MM-DD"))
}

fn opt_date(s: Option<&str>) -> Result<Option<chrono::NaiveDate>, AppError> {
    match s {
        Some(v) if !v.is_empty() => Ok(Some(parse_date(v)?)),
        _ => Ok(None),
    }
}

fn map_db_error(e: sqlx::Error) -> AppError {
    match &e {
        sqlx::Error::Database(db) => match db.code().as_deref() {
            Some(UNIQUE_VIOLATION) => {
                let m = db.message();
                if m.contains("uq_book_copy_on_loan") {
                    AppError::conflict("That copy is already on loan to someone")
                } else if m.contains("isbn") {
                    AppError::conflict("Another book already has that ISBN")
                } else if m.contains("holds_active") {
                    AppError::conflict("That person is already in the queue for this title")
                } else if m.contains("authors") {
                    AppError::conflict("An author with that name already exists")
                } else {
                    AppError::conflict("That value is already in use")
                }
            }
            Some(CHECK_VIOLATION) => {
                let m = db.message();
                if m.contains("due_after_borrowed") {
                    AppError::bad_request("The due date cannot be before the borrow date")
                } else if m.contains("pages_positive") {
                    AppError::bad_request("Page count must be greater than zero")
                } else if m.contains("settings_sane") {
                    AppError::bad_request("Loan settings must be positive, and fees cannot be negative")
                } else {
                    AppError::bad_request("That value is out of range")
                }
            }
            _ => e.into(),
        },
        _ => e.into(),
    }
}

/// Overdue fee for a loan, in minor units.
///
/// Capped at `max_fee` when one is configured: an unbounded fee on a book
/// forgotten for two years reaches a number nobody will ever pay, and the
/// point of a church library fine is to get the book back, not to punish.
fn overdue_fee(
    due_on: chrono::NaiveDate,
    as_of: chrono::NaiveDate,
    daily_fee: i64,
    max_fee: i64,
) -> (i64, i64) {
    if as_of <= due_on || daily_fee <= 0 {
        let days = (as_of - due_on).num_days().max(0);
        return (days, 0);
    }
    let days = (as_of - due_on).num_days();
    let raw = days.saturating_mul(daily_fee);
    let fee = if max_fee > 0 { raw.min(max_fee) } else { raw };
    (days, fee)
}

async fn settings(pool: &sqlx::PgPool) -> Result<LibrarySettings, AppError> {
    sqlx::query_as::<_, LibrarySettings>(
        "SELECT loan_days, max_renewals, renewal_days, daily_fee, max_fee,
                max_loans_per_person, hold_days
         FROM library_settings WHERE id = 1",
    )
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::internal("Library settings row missing — run migration 067"))
}

/// Fill days_overdue / fee_accruing on loans read back from the database.
fn enrich_loans(loans: &mut [Loan], s: &LibrarySettings, today: chrono::NaiveDate) {
    for l in loans.iter_mut() {
        if l.returned_on.is_some() {
            l.days_overdue = 0;
            l.fee_accruing = 0;
        } else {
            let (days, fee) = overdue_fee(l.due_on, today, s.daily_fee, s.max_fee);
            l.days_overdue = days;
            l.fee_accruing = fee;
        }
    }
}

// ===========================================================================
// Categories, authors, settings
// ===========================================================================

pub async fn categories_list(Db(pool): Db) -> Result<Json<Vec<LibraryCategory>>, AppError> {
    let rows = sqlx::query_as::<_, LibraryCategory>(
        r#"SELECT c.*,
                  (SELECT COUNT(*) FROM library_books b
                   WHERE b.category_id = c.id AND b.is_active)::bigint AS book_count
           FROM library_categories c ORDER BY c.sort_order, c.name"#,
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn authors_list(Db(pool): Db) -> Result<Json<Vec<Author>>, AppError> {
    let rows = sqlx::query_as::<_, Author>(
        r#"SELECT a.id, a.name, a.bio, a.photo,
                  (SELECT COUNT(*) FROM book_authors ba WHERE ba.author_id = a.id)::bigint AS book_count
           FROM authors a ORDER BY a.name"#,
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn settings_get(Db(pool): Db) -> Result<Json<LibrarySettings>, AppError> {
    Ok(Json(settings(&pool).await?))
}

pub async fn settings_update(
    _auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertSettings>,
) -> Result<Json<LibrarySettings>, AppError> {
    sqlx::query(
        r#"UPDATE library_settings SET
             loan_days = COALESCE($1, loan_days),
             max_renewals = COALESCE($2, max_renewals),
             renewal_days = COALESCE($3, renewal_days),
             daily_fee = COALESCE($4, daily_fee),
             max_fee = COALESCE($5, max_fee),
             max_loans_per_person = COALESCE($6, max_loans_per_person),
             hold_days = COALESCE($7, hold_days),
             updated_at = NOW()
           WHERE id = 1"#,
    )
    .bind(input.loan_days)
    .bind(input.max_renewals)
    .bind(input.renewal_days)
    .bind(input.daily_fee)
    .bind(input.max_fee)
    .bind(input.max_loans_per_person)
    .bind(input.hold_days)
    .execute(&pool)
    .await
    .map_err(map_db_error)?;
    Ok(Json(settings(&pool).await?))
}

// ===========================================================================
// Books
// ===========================================================================

/// Availability is computed here, in one place, from copies and open loans.
const BOOK_SELECT: &str = r#"
    SELECT b.id, b.title, b.subtitle, b.isbn, b.publisher, b.edition, b.language,
           b.category_id, c.name AS category_name, c.color AS category_color,
           b.description, b.keywords, b.pages, b.publication_year, b.cover_url,
           b.material_kind, b.digital_url, b.is_active,
           COALESCE(ARRAY(SELECT a.name FROM book_authors ba
                          JOIN authors a ON a.id = ba.author_id
                          WHERE ba.book_id = b.id ORDER BY ba.sort_order), '{}') AS authors,
           (SELECT COUNT(*) FROM book_copies cp
            WHERE cp.book_id = b.id AND cp.status = 'in_circulation')::bigint AS total_copies,
           (SELECT COUNT(*) FROM book_copies cp
            WHERE cp.book_id = b.id AND cp.status = 'in_circulation'
              AND NOT EXISTS (SELECT 1 FROM book_loans l
                              WHERE l.copy_id = cp.id AND l.returned_on IS NULL))::bigint AS available_copies,
           (SELECT COUNT(*) FROM book_copies cp
            JOIN book_loans l ON l.copy_id = cp.id AND l.returned_on IS NULL
            WHERE cp.book_id = b.id)::bigint AS on_loan,
           (SELECT COUNT(*) FROM book_copies cp
            WHERE cp.book_id = b.id AND cp.status <> 'in_circulation')::bigint AS out_of_circulation,
           (SELECT COUNT(*) FROM book_holds h
            WHERE h.book_id = b.id AND h.status = 'waiting')::bigint AS holds_waiting,
           b.updated_at
    FROM library_books b
    LEFT JOIN library_categories c ON c.id = b.category_id
"#;

fn sort_column(sort: Option<&str>) -> &'static str {
    // Allowlist, never the caller's string — this is interpolated into SQL.
    match sort {
        Some("title") => "b.title",
        Some("year") => "b.publication_year",
        Some("category") => "c.name",
        _ => "b.updated_at",
    }
}

pub async fn books_list(
    Db(pool): Db,
    Query(f): Query<BookFilter>,
) -> Result<Json<BookPage>, AppError> {
    let page = f.page.unwrap_or(1).max(1);
    let per_page = f.per_page.unwrap_or(25).clamp(1, 200);
    let offset = (page - 1) * per_page;

    // The availability filter has to be expressed against the same derived
    // count the SELECT uses, or the list and the badge would disagree.
    let where_sql = r#"
        WHERE ($1::text IS NULL OR (
                b.title ILIKE '%' || $1 || '%' OR b.subtitle ILIKE '%' || $1 || '%'
             OR b.isbn ILIKE '%' || $1 || '%' OR b.publisher ILIKE '%' || $1 || '%'
             OR b.keywords ILIKE '%' || $1 || '%'
             OR EXISTS (SELECT 1 FROM book_authors ba JOIN authors a ON a.id = ba.author_id
                        WHERE ba.book_id = b.id AND a.name ILIKE '%' || $1 || '%')))
          AND ($2::uuid IS NULL OR b.category_id = $2)
          AND ($3::text IS NULL OR b.material_kind = $3)
          AND ($4::text IS NULL OR b.language = $4)
          AND ($5::text IS NULL OR (
                CASE $5
                  WHEN 'available' THEN EXISTS (
                    SELECT 1 FROM book_copies cp WHERE cp.book_id = b.id
                      AND cp.status = 'in_circulation'
                      AND NOT EXISTS (SELECT 1 FROM book_loans l
                                      WHERE l.copy_id = cp.id AND l.returned_on IS NULL))
                  WHEN 'on_loan' THEN EXISTS (
                    SELECT 1 FROM book_copies cp
                    JOIN book_loans l ON l.copy_id = cp.id AND l.returned_on IS NULL
                    WHERE cp.book_id = b.id)
                  WHEN 'digital' THEN b.material_kind <> 'book'
                  ELSE TRUE
                END))
    "#;

    macro_rules! bind_filters {
        ($q:expr) => {
            $q.bind(f.search.as_deref())
                .bind(f.category_id)
                .bind(f.material_kind.as_deref())
                .bind(f.language.as_deref())
                .bind(f.availability.as_deref())
        };
    }

    let count_sql = format!(
        "SELECT COUNT(*) FROM library_books b
         LEFT JOIN library_categories c ON c.id = b.category_id {where_sql}"
    );
    let total: i64 = bind_filters!(sqlx::query_scalar(&count_sql))
        .fetch_one(&pool)
        .await?;

    let dir = if f.dir.as_deref() == Some("desc") { "DESC" } else { "ASC" };
    let order = sort_column(f.sort.as_deref());
    let sql = format!("{BOOK_SELECT} {where_sql} ORDER BY {order} {dir}, b.title LIMIT $6 OFFSET $7");

    let data = bind_filters!(sqlx::query_as::<_, BookRow>(&sql))
        .bind(per_page)
        .bind(offset)
        .fetch_all(&pool)
        .await?;

    Ok(Json(BookPage {
        data,
        total,
        page,
        per_page,
        total_pages: (total + per_page - 1) / per_page,
    }))
}

async fn next_copy_code(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>) -> Result<String, AppError> {
    let row: Option<(String, i64, i32)> = sqlx::query_as(
        "SELECT prefix, next_value, padding FROM receipt_sequences
         WHERE scope = 'library_copy' FOR UPDATE",
    )
    .fetch_optional(&mut **tx)
    .await?;
    let (prefix, value, padding) = row
        .ok_or_else(|| AppError::internal("Copy code sequence missing — run migration 067"))?;
    sqlx::query(
        "UPDATE receipt_sequences SET next_value = next_value + 1, updated_at = NOW()
         WHERE scope = 'library_copy'",
    )
    .execute(&mut **tx)
    .await?;
    Ok(format!("{prefix}-{:0width$}", value, width = padding as usize))
}

pub async fn books_create(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<UpsertBook>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.title.trim().is_empty() {
        return Err(AppError::bad_request("Title is required"));
    }
    let kind = input.material_kind.clone().unwrap_or_else(|| "book".into());
    let copies = input.copies.unwrap_or(1).clamp(0, 100);

    let mut tx = pool.begin().await?;
    let id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO library_books
             (title, subtitle, isbn, publisher, edition, language, category_id,
              description, keywords, pages, publication_year, cover_url,
              material_kind, digital_url, is_active, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
           RETURNING id"#,
    )
    .bind(input.title.trim())
    .bind(input.subtitle.unwrap_or_default())
    .bind(input.isbn.unwrap_or_default().trim())
    .bind(input.publisher.unwrap_or_default())
    .bind(input.edition.unwrap_or_default())
    .bind(input.language.unwrap_or_else(|| "English".into()))
    .bind(input.category_id)
    .bind(input.description.unwrap_or_default())
    .bind(input.keywords.unwrap_or_default())
    .bind(input.pages)
    .bind(input.publication_year)
    .bind(input.cover_url.unwrap_or_default())
    .bind(&kind)
    .bind(input.digital_url.unwrap_or_default())
    .bind(input.is_active.unwrap_or(true))
    .bind(&auth.email)
    .fetch_one(&mut *tx)
    .await
    .map_err(map_db_error)?;

    // Authors are created on demand: cataloguing a book should not require
    // pre-registering its author as a separate step.
    for (i, name) in input.authors.unwrap_or_default().iter().enumerate() {
        let name = name.trim();
        if name.is_empty() {
            continue;
        }
        let author_id: uuid::Uuid = sqlx::query_scalar(
            "INSERT INTO authors (name) VALUES ($1)
             ON CONFLICT (lower(name)) DO UPDATE SET name = authors.name
             RETURNING id",
        )
        .bind(name)
        .fetch_one(&mut *tx)
        .await?;
        sqlx::query(
            "INSERT INTO book_authors (book_id, author_id, sort_order)
             VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
        )
        .bind(id)
        .bind(author_id)
        .bind(i as i32)
        .execute(&mut *tx)
        .await?;
    }

    // Digital material has no physical copy and is never lent.
    if kind == "book" {
        for _ in 0..copies {
            let code = next_copy_code(&mut tx).await?;
            sqlx::query(
                "INSERT INTO book_copies (book_id, copy_code, shelf) VALUES ($1,$2,$3)",
            )
            .bind(id)
            .bind(&code)
            .bind(input.shelf.clone().unwrap_or_default())
            .execute(&mut *tx)
            .await?;
        }
    }

    tx.commit().await?;
    Ok(Json(serde_json::json!({ "id": id, "copies": if kind == "book" { copies } else { 0 } })))
}

pub async fn books_get(
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<BookDetail>, AppError> {
    let s = settings(&pool).await?;
    let today = chrono::Utc::now().date_naive();

    let sql = format!("{BOOK_SELECT} WHERE b.id = $1");
    let book = sqlx::query_as::<_, BookRow>(&sql)
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::not_found("Book not found"))?;

    let copies = sqlx::query_as::<_, BookCopy>(
        r#"SELECT cp.*,
                  l.borrower_name AS borrower,
                  l.due_on
           FROM book_copies cp
           LEFT JOIN book_loans l ON l.copy_id = cp.id AND l.returned_on IS NULL
           WHERE cp.book_id = $1 ORDER BY cp.copy_code"#,
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    let mut loans = sqlx::query_as::<_, Loan>(
        r#"SELECT l.id, l.copy_id, cp.copy_code, cp.book_id, b.title AS book_title,
                  l.person_id, l.borrower_name, l.borrower_contact, l.borrowed_on,
                  l.due_on, l.returned_on, l.renewals, l.condition_out, l.condition_in,
                  l.fee_assessed, l.fee_paid, l.notes,
                  0::bigint AS days_overdue, 0::bigint AS fee_accruing
           FROM book_loans l
           JOIN book_copies cp ON cp.id = l.copy_id
           JOIN library_books b ON b.id = cp.book_id
           WHERE cp.book_id = $1
           ORDER BY (l.returned_on IS NOT NULL), l.borrowed_on DESC LIMIT 50"#,
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;
    enrich_loans(&mut loans, &s, today);

    let holds = sqlx::query_as::<_, Hold>(
        r#"SELECT h.id, h.book_id, b.title AS book_title, h.person_id, h.requester_name,
                  h.requester_contact, h.status, h.notified_on, h.notes, h.created_at,
                  ROW_NUMBER() OVER (PARTITION BY h.book_id ORDER BY h.created_at)::bigint AS queue_position
           FROM book_holds h JOIN library_books b ON b.id = h.book_id
           WHERE h.book_id = $1 AND h.status IN ('waiting','ready')
           ORDER BY h.created_at"#,
    )
    .bind(id)
    .fetch_all(&pool)
    .await?;

    Ok(Json(BookDetail { book, copies, loans, holds }))
}

pub async fn copies_add(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<AddCopies>,
) -> Result<Json<serde_json::Value>, AppError> {
    let count = input.count.unwrap_or(1).clamp(1, 100);
    let kind: Option<String> =
        sqlx::query_scalar("SELECT material_kind FROM library_books WHERE id = $1")
            .bind(id)
            .fetch_optional(&pool)
            .await?;
    let kind = kind.ok_or_else(|| AppError::not_found("Book not found"))?;
    if kind != "book" {
        return Err(AppError::bad_request(
            "Digital material has no physical copies to add",
        ));
    }

    let mut tx = pool.begin().await?;
    let mut codes = Vec::new();
    for _ in 0..count {
        let code = next_copy_code(&mut tx).await?;
        sqlx::query(
            r#"INSERT INTO book_copies
                 (book_id, copy_code, shelf, location, condition, purchase_cost, acquired_on)
               VALUES ($1,$2,$3,$4,$5,$6,$7)"#,
        )
        .bind(id)
        .bind(&code)
        .bind(input.shelf.clone().unwrap_or_default())
        .bind(input.location.clone().unwrap_or_default())
        .bind(input.condition.clone().unwrap_or_else(|| "good".into()))
        .bind(input.purchase_cost.unwrap_or(0).max(0))
        .bind(opt_date(input.acquired_on.as_deref())?)
        .execute(&mut *tx)
        .await
        .map_err(map_db_error)?;
        codes.push(code);
    }
    tx.commit().await?;
    Ok(Json(serde_json::json!({ "added": count, "codes": codes })))
}

/// Repair, reshelve or write off one copy.
///
/// A copy taken out of circulation needs a way back in — otherwise a book
/// returned damaged and later mended stays invisible forever.
pub async fn copy_update(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<UpdateCopy>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Returning a copy to the shelf while it is still out would let it be
    // lent twice on paper, even though the index would refuse the second loan.
    if input.status.as_deref() == Some("in_circulation") {
        let out: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM book_loans WHERE copy_id = $1 AND returned_on IS NULL",
        )
        .bind(id)
        .fetch_one(&pool)
        .await?;
        if out > 0 {
            return Err(AppError::conflict(
                "That copy is out on loan — take the return first",
            ));
        }
    }

    let res = sqlx::query(
        r#"UPDATE book_copies SET
             shelf = COALESCE($2, shelf),
             location = COALESCE($3, location),
             condition = COALESCE($4, condition),
             status = COALESCE($5, status),
             notes = COALESCE($6, notes)
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(input.shelf.as_deref())
    .bind(input.location.as_deref())
    .bind(input.condition.as_deref())
    .bind(input.status.as_deref())
    .bind(input.notes.as_deref())
    .execute(&pool)
    .await
    .map_err(map_db_error)?;

    if res.rows_affected() == 0 {
        return Err(AppError::not_found("Copy not found"));
    }
    Ok(Json(serde_json::json!({ "updated": true })))
}

// ===========================================================================
// Lending
// ===========================================================================

pub async fn borrow(
    auth: AuthUser,
    Db(pool): Db,
    Json(input): Json<BorrowInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.borrower_name.trim().is_empty() {
        return Err(AppError::bad_request("Who is borrowing it?"));
    }
    let s = settings(&pool).await?;
    let today = chrono::Utc::now().date_naive();

    let mut tx = pool.begin().await?;

    // A borrower already at their limit is refused before a copy is picked,
    // so the limit cannot be walked past by borrowing several titles at once.
    let open: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM book_loans
         WHERE returned_on IS NULL
           AND (($1::uuid IS NOT NULL AND person_id = $1)
                OR ($1::uuid IS NULL AND lower(borrower_name) = lower($2)))",
    )
    .bind(input.person_id)
    .bind(input.borrower_name.trim())
    .fetch_one(&mut *tx)
    .await?;
    if open >= i64::from(s.max_loans_per_person) {
        return Err(AppError::conflict(format!(
            "{} already has {} book(s) out, which is the limit",
            input.borrower_name.trim(),
            open
        )));
    }

    // Pick a copy: the named one, or the first with no open loan.
    //
    // FOR UPDATE SKIP LOCKED so two simultaneous borrowers of the last two
    // copies each get a different one instead of queueing on the same row.
    // The unique index is still the real guarantee; this just avoids a
    // pointless conflict.
    let copy_id: Option<uuid::Uuid> = match (input.copy_id, input.book_id) {
        (Some(cid), _) => Some(cid),
        (None, Some(bid)) => sqlx::query_scalar(
            "SELECT cp.id FROM book_copies cp
             WHERE cp.book_id = $1 AND cp.status = 'in_circulation'
               AND NOT EXISTS (SELECT 1 FROM book_loans l
                               WHERE l.copy_id = cp.id AND l.returned_on IS NULL)
             ORDER BY cp.copy_code
             FOR UPDATE OF cp SKIP LOCKED
             LIMIT 1",
        )
        .bind(bid)
        .fetch_optional(&mut *tx)
        .await?,
        _ => return Err(AppError::bad_request("Give a copy_id or a book_id")),
    };

    let copy_id = copy_id.ok_or_else(|| {
        AppError::conflict("Every copy of that title is out — place a hold instead")
    })?;

    let status: Option<String> =
        sqlx::query_scalar("SELECT status FROM book_copies WHERE id = $1")
            .bind(copy_id)
            .fetch_optional(&mut *tx)
            .await?;
    match status.as_deref() {
        None => return Err(AppError::not_found("Copy not found")),
        Some("in_circulation") => {}
        Some(other) => {
            return Err(AppError::bad_request(format!(
                "That copy is marked {other} and cannot be lent"
            )))
        }
    }

    let borrowed = opt_date(input.borrowed_on.as_deref())?.unwrap_or(today);
    if borrowed > today {
        return Err(AppError::bad_request("A book cannot be lent in the future"));
    }
    let due = match opt_date(input.due_on.as_deref())? {
        Some(d) => d,
        None => borrowed + chrono::Duration::days(i64::from(s.loan_days)),
    };
    // A past due date is legitimate on a backdated entry, so the only rule is
    // the one the database also enforces: due on or after the borrow date.
    if due < borrowed {
        return Err(AppError::bad_request(
            "The due date cannot be before the borrow date",
        ));
    }

    let loan_id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO book_loans
             (copy_id, person_id, borrower_name, borrower_contact, borrowed_on, due_on,
              condition_out, notes, issued_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id"#,
    )
    .bind(copy_id)
    .bind(input.person_id)
    .bind(input.borrower_name.trim())
    .bind(input.borrower_contact.unwrap_or_default())
    .bind(borrowed)
    .bind(due)
    .bind(input.condition_out.unwrap_or_else(|| "good".into()))
    .bind(input.notes.unwrap_or_default())
    .bind(&auth.email)
    .fetch_one(&mut *tx)
    .await
    .map_err(map_db_error)?;

    // Taking a book you were queued for closes your hold.
    sqlx::query(
        "UPDATE book_holds SET status = 'fulfilled'
         FROM book_copies cp
         WHERE cp.id = $1 AND book_holds.book_id = cp.book_id
           AND book_holds.status IN ('waiting','ready')
           AND lower(book_holds.requester_name) = lower($2)",
    )
    .bind(copy_id)
    .bind(input.borrower_name.trim())
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(Json(serde_json::json!({ "loan_id": loan_id, "copy_id": copy_id, "due_on": due })))
}

pub async fn loan_return(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<ReturnInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    let s = settings(&pool).await?;
    let today = chrono::Utc::now().date_naive();

    let mut tx = pool.begin().await?;
    let row: Option<(chrono::NaiveDate, uuid::Uuid)> = sqlx::query_as(
        "SELECT due_on, copy_id FROM book_loans WHERE id = $1 AND returned_on IS NULL FOR UPDATE",
    )
    .bind(id)
    .fetch_optional(&mut *tx)
    .await?;
    let (due_on, copy_id) =
        row.ok_or_else(|| AppError::conflict("That loan was not found, or is already returned"))?;

    let (_, accrued) = overdue_fee(due_on, today, s.daily_fee, s.max_fee);
    // A waived fee is recorded as zero assessed, not as an unpaid debt — the
    // difference matters when someone later asks what is owed.
    let assessed = if input.waive_fee.unwrap_or(false) { 0 } else { accrued };
    let paid = input.fee_paid.unwrap_or(0).max(0).min(assessed);

    sqlx::query(
        r#"UPDATE book_loans
           SET returned_on = CURRENT_DATE,
               condition_in = COALESCE($2, condition_out),
               fee_assessed = $3,
               fee_paid = $4,
               notes = CASE WHEN $5 <> '' THEN $5 ELSE notes END
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(input.condition_in.as_deref())
    .bind(assessed)
    .bind(paid)
    .bind(input.notes.unwrap_or_default())
    .execute(&mut *tx)
    .await?;

    // A copy returned damaged should not go straight back on the shelf as
    // lendable, so the condition carries onto the copy.
    if let Some(cond) = input.condition_in.as_deref() {
        sqlx::query(
            "UPDATE book_copies SET condition = $2,
                    status = CASE WHEN $2 = 'damaged' THEN 'damaged' ELSE status END
             WHERE id = $1",
        )
        .bind(copy_id)
        .bind(cond)
        .execute(&mut *tx)
        .await?;
    }

    // The next person in the queue is now up.
    let next_hold: Option<uuid::Uuid> = sqlx::query_scalar(
        "SELECT h.id FROM book_holds h
         JOIN book_copies cp ON cp.book_id = h.book_id
         WHERE cp.id = $1 AND h.status = 'waiting'
         ORDER BY h.created_at LIMIT 1",
    )
    .bind(copy_id)
    .fetch_optional(&mut *tx)
    .await?;
    if let Some(hold_id) = next_hold {
        sqlx::query("UPDATE book_holds SET status='ready', notified_on=CURRENT_DATE WHERE id=$1")
            .bind(hold_id)
            .execute(&mut *tx)
            .await?;
    }

    tx.commit().await?;
    Ok(Json(serde_json::json!({
        "returned": true,
        "fee_assessed": assessed,
        "fee_paid": paid,
        "hold_notified": next_hold.is_some(),
    })))
}

pub async fn loan_renew(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let s = settings(&pool).await?;

    // Renewing is refused when someone is waiting: the queue exists so the
    // next reader gets a turn, and silent renewal would defeat it.
    let waiting: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM book_holds h
         JOIN book_copies cp ON cp.book_id = h.book_id
         JOIN book_loans l ON l.copy_id = cp.id
         WHERE l.id = $1 AND h.status = 'waiting'",
    )
    .bind(id)
    .fetch_one(&pool)
    .await?;
    if waiting > 0 {
        return Err(AppError::conflict(
            "Someone is waiting for this title, so it cannot be renewed",
        ));
    }

    let row = sqlx::query_as::<_, (i32, chrono::NaiveDate)>(
        "SELECT renewals, due_on FROM book_loans WHERE id = $1 AND returned_on IS NULL",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?;
    let (renewals, due_on) =
        row.ok_or_else(|| AppError::conflict("That loan was not found, or is already returned"))?;

    if renewals >= s.max_renewals {
        return Err(AppError::conflict(format!(
            "This loan has already been renewed {renewals} time(s), which is the limit"
        )));
    }

    let new_due = due_on + chrono::Duration::days(i64::from(s.renewal_days));
    sqlx::query("UPDATE book_loans SET renewals = renewals + 1, due_on = $2 WHERE id = $1")
        .bind(id)
        .bind(new_due)
        .execute(&pool)
        .await?;

    Ok(Json(serde_json::json!({
        "renewed": true,
        "renewals": renewals + 1,
        "due_on": new_due,
    })))
}

#[derive(serde::Deserialize, Default)]
pub struct LoanQuery {
    pub status: Option<String>,
    pub borrower: Option<String>,
}

pub async fn loans_list(
    Db(pool): Db,
    Query(q): Query<LoanQuery>,
) -> Result<Json<Vec<Loan>>, AppError> {
    let s = settings(&pool).await?;
    let today = chrono::Utc::now().date_naive();

    let mut loans = sqlx::query_as::<_, Loan>(
        r#"SELECT l.id, l.copy_id, cp.copy_code, cp.book_id, b.title AS book_title,
                  l.person_id, l.borrower_name, l.borrower_contact, l.borrowed_on,
                  l.due_on, l.returned_on, l.renewals, l.condition_out, l.condition_in,
                  l.fee_assessed, l.fee_paid, l.notes,
                  0::bigint AS days_overdue, 0::bigint AS fee_accruing
           FROM book_loans l
           JOIN book_copies cp ON cp.id = l.copy_id
           JOIN library_books b ON b.id = cp.book_id
           WHERE ($1::text IS NULL OR (
                   CASE $1
                     WHEN 'open'     THEN l.returned_on IS NULL
                     WHEN 'overdue'  THEN l.returned_on IS NULL AND l.due_on < CURRENT_DATE
                     WHEN 'returned' THEN l.returned_on IS NOT NULL
                     ELSE TRUE
                   END))
             AND ($2::text IS NULL OR l.borrower_name ILIKE '%' || $2 || '%')
           ORDER BY (l.returned_on IS NOT NULL), l.due_on ASC LIMIT 300"#,
    )
    .bind(q.status.as_deref())
    .bind(q.borrower.as_deref())
    .fetch_all(&pool)
    .await?;
    enrich_loans(&mut loans, &s, today);
    Ok(Json(loans))
}

// ===========================================================================
// Holds
// ===========================================================================

pub async fn hold_create(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
    Json(input): Json<HoldInput>,
) -> Result<Json<serde_json::Value>, AppError> {
    if input.requester_name.trim().is_empty() {
        return Err(AppError::bad_request("Who is the hold for?"));
    }

    // Queueing for a title with a free copy on the shelf is pointless and
    // confusing — tell them to just borrow it.
    let available: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM book_copies cp
         WHERE cp.book_id = $1 AND cp.status = 'in_circulation'
           AND NOT EXISTS (SELECT 1 FROM book_loans l
                           WHERE l.copy_id = cp.id AND l.returned_on IS NULL)",
    )
    .bind(id)
    .fetch_one(&pool)
    .await?;
    if available > 0 {
        return Err(AppError::bad_request(
            "A copy is on the shelf — borrow it rather than placing a hold",
        ));
    }

    sqlx::query(
        r#"INSERT INTO book_holds (book_id, person_id, requester_name, requester_contact, notes)
           VALUES ($1,$2,$3,$4,$5)"#,
    )
    .bind(id)
    .bind(input.person_id)
    .bind(input.requester_name.trim())
    .bind(input.requester_contact.unwrap_or_default())
    .bind(input.notes.unwrap_or_default())
    .execute(&pool)
    .await
    .map_err(map_db_error)?;

    Ok(Json(serde_json::json!({ "held": true })))
}

pub async fn holds_list(Db(pool): Db) -> Result<Json<Vec<Hold>>, AppError> {
    let rows = sqlx::query_as::<_, Hold>(
        r#"SELECT h.id, h.book_id, b.title AS book_title, h.person_id, h.requester_name,
                  h.requester_contact, h.status, h.notified_on, h.notes, h.created_at,
                  ROW_NUMBER() OVER (PARTITION BY h.book_id ORDER BY h.created_at)::bigint AS queue_position
           FROM book_holds h JOIN library_books b ON b.id = h.book_id
           WHERE h.status IN ('waiting','ready')
           ORDER BY h.status, h.created_at LIMIT 200"#,
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

pub async fn hold_cancel(
    _auth: AuthUser,
    Db(pool): Db,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let res = sqlx::query(
        "UPDATE book_holds SET status='cancelled' WHERE id=$1 AND status IN ('waiting','ready')",
    )
    .bind(id)
    .execute(&pool)
    .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::conflict("That hold was not found, or is already closed"));
    }
    Ok(Json(serde_json::json!({ "cancelled": true })))
}

// ===========================================================================
// Borrowers
// ===========================================================================

pub async fn borrowers_list(Db(pool): Db) -> Result<Json<Vec<Borrower>>, AppError> {
    let rows = sqlx::query_as::<_, Borrower>(
        r#"SELECT l.person_id,
                  MAX(l.borrower_name) AS name,
                  MAX(l.borrower_contact) AS contact,
                  COUNT(*) FILTER (WHERE l.returned_on IS NULL)::bigint AS open_loans,
                  COUNT(*)::bigint AS total_loans,
                  COUNT(*) FILTER (WHERE l.returned_on IS NULL AND l.due_on < CURRENT_DATE)::bigint AS overdue,
                  COALESCE(SUM(l.fee_assessed - l.fee_paid),0)::bigint AS fees_outstanding,
                  MAX(l.borrowed_on) AS last_borrowed
           FROM book_loans l
           GROUP BY l.person_id, lower(l.borrower_name)
           ORDER BY open_loans DESC, last_borrowed DESC NULLS LAST
           LIMIT 200"#,
    )
    .fetch_all(&pool)
    .await?;
    Ok(Json(rows))
}

// ===========================================================================
// Dashboard
// ===========================================================================

pub async fn dashboard(Db(pool): Db) -> Result<Json<LibraryDashboard>, AppError> {
    let s = settings(&pool).await?;
    let today = chrono::Utc::now().date_naive();

    let (total_titles, digital_titles): (i64, i64) = sqlx::query_as(
        "SELECT COUNT(*) FILTER (WHERE is_active),
                COUNT(*) FILTER (WHERE is_active AND material_kind <> 'book')
         FROM library_books",
    )
    .fetch_one(&pool)
    .await?;

    let (total_copies, on_loan): (i64, i64) = sqlx::query_as(
        "SELECT COUNT(*) FILTER (WHERE cp.status = 'in_circulation'),
                COUNT(*) FILTER (WHERE EXISTS (
                  SELECT 1 FROM book_loans l WHERE l.copy_id = cp.id AND l.returned_on IS NULL))
         FROM book_copies cp",
    )
    .fetch_one(&pool)
    .await?;

    let overdue: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM book_loans WHERE returned_on IS NULL AND due_on < CURRENT_DATE",
    )
    .fetch_one(&pool)
    .await?;

    let active_borrowers: i64 = sqlx::query_scalar(
        "SELECT COUNT(DISTINCT lower(borrower_name)) FROM book_loans WHERE returned_on IS NULL",
    )
    .fetch_one(&pool)
    .await?;

    let holds_waiting: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM book_holds WHERE status = 'waiting'")
            .fetch_one(&pool)
            .await?;

    let fees_outstanding: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(fee_assessed - fee_paid),0)::bigint FROM book_loans
         WHERE fee_assessed > fee_paid",
    )
    .fetch_one(&pool)
    .await?;

    let loans_this_month: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM book_loans
         WHERE borrowed_on >= date_trunc('month', CURRENT_DATE)::date",
    )
    .fetch_one(&pool)
    .await?;

    let by_category = sqlx::query_as::<_, TitleCount>(
        r#"SELECT COALESCE(c.name, 'Uncategorised') AS label, c.color,
                  COUNT(b.id)::bigint AS count
           FROM library_books b LEFT JOIN library_categories c ON c.id = b.category_id
           WHERE b.is_active
           GROUP BY c.name, c.color ORDER BY count DESC LIMIT 12"#,
    )
    .fetch_all(&pool)
    .await?;

    let most_borrowed = sqlx::query_as::<_, TitleCount>(
        r#"SELECT b.title AS label, NULL::varchar AS color, COUNT(l.id)::bigint AS count
           FROM book_loans l
           JOIN book_copies cp ON cp.id = l.copy_id
           JOIN library_books b ON b.id = cp.book_id
           GROUP BY b.title ORDER BY count DESC LIMIT 8"#,
    )
    .fetch_all(&pool)
    .await?;

    let loan_select = r#"
        SELECT l.id, l.copy_id, cp.copy_code, cp.book_id, b.title AS book_title,
               l.person_id, l.borrower_name, l.borrower_contact, l.borrowed_on,
               l.due_on, l.returned_on, l.renewals, l.condition_out, l.condition_in,
               l.fee_assessed, l.fee_paid, l.notes,
               0::bigint AS days_overdue, 0::bigint AS fee_accruing
        FROM book_loans l
        JOIN book_copies cp ON cp.id = l.copy_id
        JOIN library_books b ON b.id = cp.book_id
    "#;

    let mut overdue_loans = sqlx::query_as::<_, Loan>(&format!(
        "{loan_select} WHERE l.returned_on IS NULL AND l.due_on < CURRENT_DATE
         ORDER BY l.due_on LIMIT 10"
    ))
    .fetch_all(&pool)
    .await?;
    enrich_loans(&mut overdue_loans, &s, today);

    let mut due_soon = sqlx::query_as::<_, Loan>(&format!(
        "{loan_select} WHERE l.returned_on IS NULL AND l.due_on >= CURRENT_DATE
           AND l.due_on <= CURRENT_DATE + INTERVAL '7 days'
         ORDER BY l.due_on LIMIT 10"
    ))
    .fetch_all(&pool)
    .await?;
    enrich_loans(&mut due_soon, &s, today);

    Ok(Json(LibraryDashboard {
        total_titles,
        total_copies,
        on_loan,
        available: (total_copies - on_loan).max(0),
        overdue,
        digital_titles,
        active_borrowers,
        holds_waiting,
        fees_outstanding,
        loans_this_month,
        by_category,
        most_borrowed,
        overdue_loans,
        due_soon,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(y: i32, m: u32, day: u32) -> chrono::NaiveDate {
        chrono::NaiveDate::from_ymd_opt(y, m, day).unwrap()
    }

    #[test]
    fn no_fee_before_or_on_the_due_date() {
        let due = d(2026, 7, 30);
        assert_eq!(overdue_fee(due, d(2026, 7, 29), 500, 0).1, 0);
        assert_eq!(overdue_fee(due, due, 500, 0).1, 0);
    }

    #[test]
    fn fee_accrues_per_day_overdue() {
        let due = d(2026, 7, 1);
        let (days, fee) = overdue_fee(due, d(2026, 7, 11), 500, 0);
        assert_eq!(days, 10);
        assert_eq!(fee, 5_000); // 10 days x Rs 5.00
    }

    #[test]
    fn fee_is_capped_when_a_maximum_is_set() {
        let due = d(2020, 1, 1);
        // Years overdue, but capped at Rs 200.
        let (_, fee) = overdue_fee(due, d(2026, 1, 1), 500, 20_000);
        assert_eq!(fee, 20_000);
    }

    #[test]
    fn zero_daily_fee_means_no_fees_at_all() {
        let due = d(2020, 1, 1);
        let (days, fee) = overdue_fee(due, d(2026, 1, 1), 0, 0);
        assert!(days > 2000);
        assert_eq!(fee, 0, "a church that charges nothing must never accrue a fee");
    }

    #[test]
    fn days_overdue_is_reported_even_when_no_fee_is_charged() {
        // The librarian still needs to know it is late.
        let (days, fee) = overdue_fee(d(2026, 7, 1), d(2026, 7, 15), 0, 0);
        assert_eq!(days, 14);
        assert_eq!(fee, 0);
    }
}
