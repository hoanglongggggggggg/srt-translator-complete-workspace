mod srt;
mod translate;
mod state;
mod commands;
mod proxy_config;

use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use std::sync::{Arc, Mutex};
use std::path::PathBuf;
use state::AppState;

// State to hold ProxyPal process
struct ProxyPalProcess(Arc<Mutex<Option<tauri_plugin_shell::process::CommandChild>>>);

// Helper: Check if ProxyPal is already running (port 8317)
fn is_proxypal_running() -> bool {
    use std::net::TcpStream;
    use std::time::Duration;
    
    TcpStream::connect_timeout(
        &"127.0.0.1:8317".parse().unwrap(),
        Duration::from_millis(500)
    ).is_ok()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::files::import_srt_files,
            commands::files::remove_file,
            commands::files::list_files,
            commands::jobs::create_job,
            commands::jobs::start_job,
            commands::jobs::get_job,
            commands::jobs::list_jobs,
            commands::proxypal::get_proxypal_status,
            commands::proxy_config::get_proxy_config,
            commands::proxy_config::save_proxy_config,
            commands::proxy_config::trigger_gemini_oauth,
            commands::proxy_config::add_gemini_key,
            commands::proxy_config::remove_gemini_key,
            commands::proxy_config::add_claude_key,
            commands::proxy_config::remove_claude_key,
            commands::proxy_config::add_codex_key,
            commands::proxy_config::remove_codex_key,
            commands::proxy_config::update_amp_config,
            commands::proxy_config::add_amp_mapping,
            commands::proxy_config::remove_amp_mapping,
            commands::proxy_config::add_openai_provider,
            commands::proxy_config::remove_openai_provider,
            commands::proxy_config::update_copilot_config,
            commands::proxy_config::trigger_oauth_login,
            commands::proxy_config::update_thinking_budget,
            commands::proxy_config::update_reasoning_effort,
            commands::proxy_config::restart_proxy,
        ])
        .setup(|app| {
            // ============= AUTO-START CLIPPROXYAPI (Direct) =============
            
            // Load app config
            let app_config = proxy_config::AppConfig::load()
                .unwrap_or_else(|e| {
                    eprintln!("Failed to load config: {}, using defaults", e);
                    proxy_config::AppConfig::default()
                });
            
            // Generate proxy-config.yaml
            let proxy_config_path = match app_config.write_proxy_config() {
                Ok(path) => path,
                Err(e) => {
                    eprintln!("Failed to write proxy config: {}", e);
                    app.manage(ProxyPalProcess(Arc::new(Mutex::new(None))));
                    return Ok(());
                }
            };
            
            // Get clipproxyapi.exe path - check multiple locations for NSIS/MSI installs
            
            // Helper to normalize path (remove \\?\ prefix on Windows)
            fn normalize_path(path: PathBuf) -> PathBuf {
                #[cfg(target_os = "windows")]
                {
                    if let Some(path_str) = path.to_str() {
                        if path_str.starts_with("\\\\?\\") {
                            return PathBuf::from(&path_str[4..]);
                        }
                    }
                }
                path
            }
            
            // First try: same directory as exe (NSIS installs here)
            let mut clipproxy_path = std::env::current_exe()
                .ok()
                .and_then(|exe| exe.parent().map(|p| p.join("clipproxyapi.exe")))
                .map(normalize_path)
                .unwrap_or_default();
            
            // Second try: resource_dir (MSI might use this)
            if !clipproxy_path.exists() {
                if let Ok(resource_dir) = app.path().resource_dir() {
                    clipproxy_path = normalize_path(resource_dir.join("clipproxyapi.exe"));
                }
            }
            
            // Third try: dev mode - project directory
            if !clipproxy_path.exists() {
                #[cfg(debug_assertions)]
                {
                    let dev_path = std::env::current_dir()
                        .unwrap()
                        .join("..")
                        .join("proxypal-bundle")
                        .join("clipproxyapi.exe");
                    
                    if dev_path.exists() {
                        eprintln!("Dev mode: Using clipproxyapi from: {:?}", dev_path);
                        clipproxy_path = dev_path;
                    }
                }
            }
            
            // Check if exists
            if !clipproxy_path.exists() {
                eprintln!("Warning: clipproxyapi.exe not found at {:?}", clipproxy_path);
                eprintln!("Proxy will not start automatically.");
                app.manage(ProxyPalProcess(Arc::new(Mutex::new(None))));
            } else if is_proxypal_running() {
                println!("Proxy already running on port {}, skipping auto-start", app_config.port);
                app.manage(ProxyPalProcess(Arc::new(Mutex::new(None))));
            } else {
                // Get writable path for logs
                let writable_path = proxy_config::AppConfig::get_config_dir()
                    .unwrap_or_else(|_| std::path::PathBuf::from("."));
                
                println!("Starting clipproxyapi from: {:?}", clipproxy_path);
                println!("Config: {:?}", proxy_config_path);
                
                // Launch clipproxyapi.exe
                match app.shell().command(clipproxy_path)
                    .env("WRITABLE_PATH", writable_path.to_str().unwrap())
                    .args(["--config", proxy_config_path.to_str().unwrap()])
                    .spawn() {
                    Ok((rx, child)) => {
                        drop(rx);
                        println!("clipproxyapi started (PID: {})", child.pid());
                        app.manage(ProxyPalProcess(Arc::new(Mutex::new(Some(child)))));
                    }
                    Err(e) => {
                        eprintln!("Failed to start clipproxyapi: {}", e);
                        app.manage(ProxyPalProcess(Arc::new(Mutex::new(None))));
                    }
                }
            }
            
            // Register window close handler for ProxyPal cleanup
            let window = app.get_webview_window("main").unwrap();
            let app_handle = app.handle().clone();
            
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { .. } = event {
                    // Kill ProxyPal before closing
                    if let Some(state) = app_handle.try_state::<ProxyPalProcess>() {
                        if let Ok(mut child_opt) = state.0.lock() {
                            if let Some(mut child) = child_opt.take() {
                                println!("Stopping ProxyPal...");
                                let _ = child.kill();
                            }
                        }
                    }
                }
            });
            
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
