/// Macro to add pagination to a simple list handler.
/// Usage: `paginated_list!(table_name, ModelType, "ORDER BY created_at DESC")`
macro_rules! paginated_list {
    ($table:expr, $model:ty, $order:expr) => {
        pub async fn list(
            Db(pool): Db,
            Query(p): Query<$crate::models::Pagination>,
        ) -> Result<Json<$crate::models::Paginated<$model>>, AppError> {
            let total: i64 = sqlx::query_scalar(&format!("SELECT COUNT(*) FROM {}", $table))
                .fetch_one(&pool).await?;
            let rows = sqlx::query_as::<_, $model>(&format!(
                "SELECT * FROM {} {} LIMIT {} OFFSET {}",
                $table, $order, p.limit(), p.offset()
            ))
            .fetch_all(&pool).await?;
            Ok(Json($crate::models::Paginated::new(rows, total, &p)))
        }
    };
}
