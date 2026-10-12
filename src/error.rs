//! Single crate error type.
//!
//! Commands propagate failures with the `?` operator. We use `anyhow::Error`
//! as the crate-wide error so any error (HTTP, IO, serde, custom messages)
//! flows through one channel. `main` prints the error's `Display` to stderr
//! and exits 1, matching the TS entry point's
//! `console.error(err.message); process.exit(1)`.

// Convenience re-exports forming the crate's error vocabulary. Not all are used
// today, but command modules build against this surface.
#[allow(unused_imports)]
pub use anyhow::{anyhow, bail, Context, Error, Result};
