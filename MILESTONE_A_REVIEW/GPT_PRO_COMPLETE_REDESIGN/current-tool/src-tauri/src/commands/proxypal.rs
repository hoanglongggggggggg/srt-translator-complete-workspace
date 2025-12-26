use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct ProxyPalStatus {
    pub running: bool,
    pub endpoint: String,
}

#[tauri::command]
pub fn get_proxypal_status() -> ProxyPalStatus {
    use std::net::TcpStream;
    use std::time::Duration;
    
    let running = TcpStream::connect_timeout(
        &"127.0.0.1:8317".parse().unwrap(),
        Duration::from_millis(500)
    ).is_ok();
    
    ProxyPalStatus {
        running,
        endpoint: if running {
            "http://localhost:8317/v1".to_string()
        } else {
            "Not running".to_string()
        }
    }
}
