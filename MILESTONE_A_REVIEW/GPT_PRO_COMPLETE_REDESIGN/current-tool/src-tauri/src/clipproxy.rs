//! Robust runtime resolution for the ProxyPal sidecar/binary (clipproxyapi).
//!
//! Why this exists:
//! - `Path::exists()` returns false for *any* metadata error (including AccessDenied),
//!   which can look like "file missing" even when it's present.
//! - Tauri resource bundling can place files under `_up_` depending on how `bundle.resources`
//!   is configured.
//! - The most robust way to ship an executable with Tauri is as a *sidecar* (bundle.externalBin),
//!   which avoids path guessing. If sidecar is not configured, we fall back to resource/exe-dir lookup.

use std::{
    collections::HashSet,
    fs,
    path::{Path, PathBuf},
};

use tauri::{path::BaseDirectory, AppHandle, Manager};
use tauri_plugin_shell::{process::Command, ShellExt};

#[derive(Clone, Debug)]
pub enum ClipProxyExecutable {
    /// Tauri "sidecar" name (no extension).
    Sidecar(&'static str),
    /// Explicit executable path on disk.
    Path(PathBuf),
}

impl ClipProxyExecutable {
    pub fn command(&self, app: &AppHandle) -> Result<Command, String> {
        match self {
            Self::Sidecar(name) => app
                .shell()
                .sidecar(name)
                .map_err(|e| format!("Failed to create sidecar command `{name}`: {e}")),
            Self::Path(path) => Ok(app.shell().command(path)),
        }
    }

    pub fn display(&self) -> String {
        match self {
            Self::Sidecar(name) => format!("sidecar:{name}"),
            Self::Path(p) => p.display().to_string(),
        }
    }
}

fn candidate_sidecar_names() -> &'static [&'static str] {
    // Match tauri.conf.json "externalBin" exactly
    &["clipproxyapi"]
}

fn candidate_file_names() -> &'static [&'static str] {
    #[cfg(target_os = "windows")]
    {
        &["clipproxyapi.exe", "cliproxyapi.exe"]
    }
    #[cfg(not(target_os = "windows"))]
    {
        &["clipproxyapi", "cliproxyapi"]
    }
}

#[cfg(target_os = "windows")]
fn to_extended_length_path(p: &Path) -> PathBuf {
    // Avoid touching relative paths.
    if !p.is_absolute() {
        return p.to_path_buf();
    }

    let s = p.to_string_lossy();
    if s.starts_with(r"\\?\") {
        return p.to_path_buf();
    }

    // UNC paths need \\?\UNC\server\share\...
    if s.starts_with(r"\\") {
        let without_prefix = s.trim_start_matches(r"\\");
        return PathBuf::from(format!(r"\\?\UNC\{without_prefix}"));
    }

    PathBuf::from(format!(r"\\?\{s}"))
}

fn probe_path(tried: &mut Vec<String>, label: &str, path: PathBuf) -> Option<PathBuf> {
    let md = fs::metadata(&path);
    match md {
        Ok(m) => {
            if m.is_file() {
                tried.push(format!("✓ {label}: {}", path.display()));
                return Some(path);
            }
            tried.push(format!("!  {label}: {} (exists but not a file)", path.display()));
            None
        }
        Err(e) => {
            tried.push(format!(
                "✗ {label}: {} (kind={:?}, os={:?})",
                path.display(),
                e.kind(),
                e.raw_os_error()
            ));

            // If Windows normalization is the culprit, the extended-length form may succeed.
            #[cfg(target_os = "windows")]
            {
                let ext = to_extended_length_path(&path);
                if ext != path {
                    match fs::metadata(&ext) {
                        Ok(m2) if m2.is_file() => {
                            tried.push(format!("✓ {label} (\\\\?\\): {}", ext.display()));
                            return Some(ext);
                        }
                        Ok(_) => {
                            tried.push(format!(
                                "!  {label} (\\\\?\\): {} (exists but not a file)",
                                ext.display()
                            ));
                        }
                        Err(e2) => {
                            tried.push(format!(
                                "✗ {label} (\\\\?\\): {} (kind={:?}, os={:?})",
                                ext.display(),
                                e2.kind(),
                                e2.raw_os_error()
                            ));
                        }
                    }
                }
            }

            None
        }
    }
}

fn scan_for_binary(root: &Path, max_depth: usize) -> Option<PathBuf> {
    if max_depth == 0 {
        return None;
    }
    let entries = fs::read_dir(root).ok()?;
    for ent in entries.flatten() {
        let p = ent.path();
        if p.is_dir() {
            if let Some(found) = scan_for_binary(&p, max_depth - 1) {
                return Some(found);
            }
            continue;
        }

        let Some(name) = p.file_name().and_then(|s| s.to_str()) else {
            continue;
        };

        let name_lc = name.to_ascii_lowercase();

        // Prefer exact match.
        for wanted in candidate_file_names() {
            if name_lc == wanted.to_ascii_lowercase() {
                return Some(p);
            }
        }

        // Fuzzy fallback (handles minor renames).
        #[cfg(target_os = "windows")]
        if name_lc.ends_with(".exe") && name_lc.contains("proxy") && name_lc.contains("api") {
            return Some(p);
        }
    }
    None
}

pub fn locate_clipproxy(app: &AppHandle) -> Result<ClipProxyExecutable, String> {
    let mut tried: Vec<String> = Vec::new();

    // 1) Sidecar (best)
    for &name in candidate_sidecar_names() {
        match app.shell().sidecar(name) {
            Ok(_) => {
                tried.push(format!("✓ sidecar available: {name}"));
                return Ok(ClipProxyExecutable::Sidecar(name));
            }
            Err(e) => {
                tried.push(format!("✗ sidecar {name}: {e}"));
            }
        }
    }

    // 2) Build candidate paths
    let mut candidates: Vec<(String, PathBuf)> = Vec::new();

    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            for fname in candidate_file_names() {
                candidates.push((format!("exe_dir/{}", fname), dir.join(fname)));
                candidates.push((
                    format!("exe_dir/resources/{}", fname),
                    dir.join("resources").join(fname),
                ));
            }
        }
    } else {
        tried.push("✗ std::env::current_exe() failed".to_string());
    }

    if let Ok(resource_dir) = app.path().resource_dir() {
        for fname in candidate_file_names() {
            candidates.push((format!("resource_dir/{}", fname), resource_dir.join(fname)));
            candidates.push((
                format!("resource_dir/_up_/proxypal-bundle/{}", fname),
                resource_dir.join("_up_").join("proxypal-bundle").join(fname),
            ));
        }
    } else {
        tried.push("✗ app.path().resource_dir() failed".to_string());
    }

    // Tauri-recommended resolver (handles _up_ layout, mapped resources, etc.)
    for rel in [
        // If you map resources directly into the resource root:
        "clipproxyapi.exe",
        "cliproxyapi.exe",
        // If you bundled using a `../proxypal-bundle/...` path:
        "../proxypal-bundle/clipproxyapi.exe",
        "../proxypal-bundle/cliproxyapi.exe",
        // If files ended up under `_up_`:
        "_up_/proxypal-bundle/clipproxyapi.exe",
        "_up_/proxypal-bundle/cliproxyapi.exe",
    ] {
        if let Ok(p) = app.path().resolve(rel, BaseDirectory::Resource) {
            candidates.push((format!("resolve(Resource)/{rel}"), p));
        }
    }

    // 3) Probe candidates (dedupe first)
    let mut seen = HashSet::<PathBuf>::new();
    for (label, p) in candidates {
        if seen.insert(p.clone()) {
            if let Some(found) = probe_path(&mut tried, &label, p) {
                return Ok(ClipProxyExecutable::Path(found));
            }
        }
    }

    // 4) Scan as a last resort (depth-limited so we don't walk the world)
    let mut scan_roots: Vec<PathBuf> = Vec::new();
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            scan_roots.push(dir.to_path_buf());
            scan_roots.push(dir.join("resources"));
        }
    }
    if let Ok(resource_dir) = app.path().resource_dir() {
        scan_roots.push(resource_dir);
    }

    for root in scan_roots {
        if root.exists() && root.is_dir() {
            if let Some(found) = scan_for_binary(&root, 3) {
                tried.push(format!("✓ scan found: {}", found.display()));
                return Ok(ClipProxyExecutable::Path(found));
            }
            tried.push(format!("✗ scan miss: {}", root.display()));
        }
    }

    Err(format!(
        "clipproxy executable not found.\n\
         ---- diagnostics ----\n{}\n\
         ---------------------\n\
         Notes:\n\
         • If diagnostics show `AccessDenied` (os=5), fix installer/file ACLs.\n\
         • If diagnostics show NotFound but directory listings show a file, the filename may contain\n\
           trailing dots/spaces or other invisible chars; try deleting/re-copying the binary.\n",
        tried.join("\n")
    ))
}
