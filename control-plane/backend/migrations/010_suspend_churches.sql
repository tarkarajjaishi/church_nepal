-- Migration 010: add suspended_at to churches
ALTER TABLE IF EXISTS churches ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
