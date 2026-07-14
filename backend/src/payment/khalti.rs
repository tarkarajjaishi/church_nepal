use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct KhaltiConfig {
    pub secret_key: String,
    pub base_url: String,
}

impl KhaltiConfig {
    pub fn from_env() -> Self {
        Self {
            secret_key: std::env::var("KHALTI_SECRET_KEY").unwrap_or_default(),
            base_url: std::env::var("KHALTI_BASE_URL")
                .unwrap_or_else(|_| "https://a.khalti.com/api/v2".to_string()),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct KhaltiInitiateRequest {
    pub public_key: String,
    pub product_identity: String,
    pub product_name: String,
    pub product_url: String,
    pub amount: i64,
}

#[derive(Debug, Deserialize)]
pub struct KhaltiInitiateResponse {
    pub token: String,
    pub redirect_url: String,
}

#[derive(Debug, Deserialize)]
pub struct KhaltiVerifyResponse {
    pub idx: String,
    pub product_identity: String,
    pub product_name: String,
    pub amount: i64,
    pub status: String,
}

pub fn get_public_key() -> String {
    std::env::var("KHALTI_PUBLIC_KEY").unwrap_or_default()
}
