mod srt;
mod translate;
mod state;
mod commands;
mod proxy_config;
mod clipproxy;

use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use std::sync::{Arc, Mutex};
use std::path::PathBuf;
use state::AppState;

// State to hold ProxyPal process
struct ProxyPalProcess(Arc<Mutex<Option<tauri_plugin_shell::process::CommandChild>>>);

// Helper: Check if ProxyPal is already running (port 8317)
fn is_proxypal_running(port: u16) -> bool {
    use std::net::TcpStream;
    use std::time::Duration;
    
    TcpStream::connect_timeout(
        &format!("127.0.0.1:{}", port).parse().unwrap(),
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
            
            
            // Get clipproxyapi using robust resolver
            let app_handle_for_spawn = app.handle().clone();
            
            let clipproxy = match clipproxy::locate_clipproxy(&app_handle_for_spawn) {
                Ok(p) => {
                    println!("Found clipproxy executable via {}", p.display());
                    Some(p)
                }
                Err(e) => {
                    eprintln!("Warning: clipproxy executable not found.\n{e}");
                    None
                }
            };
            
            
            // Get writable path for logs
            let writable_path = proxy_config::AppConfig::get_config_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));
            
            // Spawn proxy if found and not already running
            if let Some(clipproxy) = clipproxy {
                if is_proxypal_running(app_config.port) {
                    println!("Proxy already running on port {}, skipping auto-start", app_config.port);
                    app.manage(ProxyPalProcess(Arc::new(Mutex::new(None))));
                } else {
                    println!("Starting ProxyPal on port {}", app_config.port);

                    let mut cmd = clipproxy
                        .command(&app_handle_for_spawn)
                        .map_err(|e| format!("Failed to create clipproxy command: {e}"))?;

                    let config_arg = proxy_config_path.to_string_lossy().to_string();
                    cmd = cmd
                        .env("WRITABLE_PATH", writable_path.to_string_lossy().to_string())
                        .arg("--config")
                        .arg(config_arg);

                    match cmd.spawn() {
                        Ok((mut rx, child)) => {
                            let pid = child.pid();
                            let process = Arc::new(Mutex::new(Some(child)));
                            app.manage(ProxyPalProcess(process));
                            println!("ProxyPal started successfully (PID: {})", pid);

                            tauri::async_runtime::spawn(async move {
                                let _ = rx.recv().await;
                            });
                        }
                        Err(e) => {
                            eprintln!("Failed to start ProxyPal: {}", e);
                            app.manage(ProxyPalProcess(Arc::new(Mutex::new(None))));
                        }
                    }
                }
            } else {
                eprintln!("Skipping ProxyPal auto-start (executable not found)");
                app.manage(ProxyPalProcess(Arc::new(Mutex::new(None))));
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
