use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Job {
    OptimizeImage { slug: String, filename: String, stem: String, ext: String },
}

use std::sync::Arc;
use tokio::sync::mpsc;

pub struct JobQueue {
    sender: mpsc::Sender<Job>,
}

impl JobQueue {
    pub fn new() -> (Self, mpsc::Receiver<Job>) {
        let (sender, receiver) = mpsc::channel(100);
        (Self { sender }, receiver)
    }

    pub async fn enqueue(&self, job: Job) {
        let _ = self.sender.send(job).await;
    }

    pub async fn process<F>(mut receiver: mpsc::Receiver<Job>, mut handler: F)
    where
        F: FnMut(Job) + Send + 'static,
    {
        while let Some(job) = receiver.recv().await {
            handler(job);
        }
    }
}

impl Default for JobQueue {
    fn default() -> Self {
        Self::new().0
    }
}