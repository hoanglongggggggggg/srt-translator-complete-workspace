use std::path::Path;
use tauri::State;

use crate::state::{AppState, FileData, FileItem, FileStatus, generate_id};
use crate::srt::parse_srt_file;

#[tauri::command]
pub fn import_srt_files(
    paths: Vec<String>,
    state: State<AppState>,
) -> Result<Vec<FileItem>, String> {
    let mut files = state.files.lock().unwrap();
    let mut imported = Vec::new();

    for path_str in paths {
        let path = Path::new(&path_str);
        
        // Parse the SRT file
        let document = parse_srt_file(path).map_err(|e| e.to_string())?;
        
        let file_id = generate_id();
        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown.srt")
            .to_string();
        
        let item = FileItem {
            id: file_id.clone(),
            path: path_str,
            name: file_name,
            cue_count: document.cues.len(),
            status: FileStatus::Ready,
        };
        
        files.insert(
            file_id,
            FileData {
                item: item.clone(),
                document,
            },
        );
        
        imported.push(item);
    }

    Ok(imported)
}

#[tauri::command]
pub fn remove_file(
    file_id: String,
    state: State<AppState>,
) -> Result<(), String> {
    let mut files = state.files.lock().unwrap();
    files.remove(&file_id)
        .ok_or_else(|| format!("File not found: {}", file_id))?;
    Ok(())
}

#[tauri::command]
pub fn list_files(state: State<AppState>) -> Result<Vec<FileItem>, String> {
    let files = state.files.lock().unwrap();
    Ok(files.values().map(|f| f.item.clone()).collect())
}
