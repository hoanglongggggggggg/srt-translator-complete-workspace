use tauri::command;
use std::process::Command;

#[command]
pub fn open_external_browser(url: String) -> Result<(), String> {
    eprintln!("[BROWSER] Attempting to open URL: {}", url);
    
    // Try opener crate first
    match opener::open(&url) {
        Ok(_) => {
            eprintln!("[BROWSER] Successfully opened with opener crate");
            Ok(())
        }
        Err(e) => {
            eprintln!("[BROWSER] opener failed: {}, trying Windows fallback", e);
            
            // Fallback to Windows-specific method
            #[cfg(target_os = "windows")]
            {
                match Command::new("cmd")
                    .args(&["/C", "start", "", &url])
                    .spawn()
                {
                    Ok(_) => {
                        eprintln!("[BROWSER] Successfully opened with Windows cmd fallback");
                        Ok(())
                    }
                    Err(e2) => {
                        let error_msg = format!("All methods failed. opener: {}, cmd: {}", e, e2);
                        eprintln!("[BROWSER] ERROR: {}", error_msg);
                        Err(error_msg)
                    }
                }
            }
            
            #[cfg(not(target_os = "windows"))]
            Err(format!("Failed to open browser: {}", e))
        }
    }
}
