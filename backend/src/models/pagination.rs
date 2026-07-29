use serde::{Deserialize, Serialize};

/// Query parameters for paginated list endpoints.
#[derive(Debug, Deserialize, Default)]
pub struct Pagination {
    /// Page number (1-indexed). Defaults to 1.
    pub page: Option<i64>,
    /// Items per page. Defaults to 50, max 200.
    pub per_page: Option<i64>,
}

impl Pagination {
    pub fn offset(&self) -> i64 {
        let page = self.page.unwrap_or(1).max(1);
        let per_page = self.limit();
        (page - 1) * per_page
    }

    pub fn limit(&self) -> i64 {
        self.per_page.unwrap_or(50).clamp(1, 200)
    }

    pub fn page(&self) -> i64 {
        self.page.unwrap_or(1).max(1)
    }
}

/// Standard paginated response wrapper.
#[derive(Debug, Serialize)]
pub struct Paginated<T: Serialize> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub total_pages: i64,
}

impl<T: Serialize> Paginated<T> {
    pub fn new(data: Vec<T>, total: i64, p: &Pagination) -> Self {
        let per_page = p.limit();
        let total_pages = (total as f64 / per_page as f64).ceil() as i64;
        Paginated {
            data,
            total,
            page: p.page(),
            per_page,
            total_pages,
        }
    }
}

/// Helper: parse page/per_page from a URL query string, returning (limit, offset).
pub fn parse_pagination(page: Option<i64>, per_page: Option<i64>) -> (i64, i64) {
    let p = Pagination { page, per_page };
    (p.limit(), p.offset())
}
