use std::collections::HashMap;
use tauri::{AppHandle, State, Emitter};

use crate::state::{AppState, JobInfo, JobStatus, TranslationJob, generate_id};
use crate::translate::worker::{TranslationOptions, translate_document};
use crate::srt::write_srt;

#[tauri::command]
pub fn create_job(
    file_id: String,
    options: TranslationOptions,
    state: State<AppState>,
) -> Result<JobInfo, String> {
    let files = state.files.lock().unwrap();
    let file_data = files
        .get(&file_id)
        .ok_or_else(|| format!("File not found: {}", file_id))?;
    
    let job_id = generate_id();
    let info = JobInfo {
        id: job_id.clone(),
        file_id: file_id.clone(),
        status: JobStatus::Queued,
        progress: 0.0,
        eta_seconds: 0,
        output_path: None,
        error: None,
    };
    
    drop(files);
    
    let mut jobs = state.jobs.lock().unwrap();
    jobs.insert(
        job_id.clone(),
        TranslationJob {
            info: info.clone(),
            options: Some(options),
            translated: None,
        },
    );
    
    Ok(info)
}

#[tauri::command]
pub async fn start_job(
    job_id: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    // Get file document
    let (doc, file_name, file_path) = {
        let files = state.files.lock().unwrap();
        let jobs = state.jobs.lock().unwrap();
        
        let job = jobs
            .get(&job_id)
            .ok_or_else(|| format!("Job not found: {}", job_id))?;
        
        let file_data = files
            .get(&job.info.file_id)
            .ok_or_else(|| format!("File not found: {}", job.info.file_id))?;
        
        (
            file_data.document.clone(),
            file_data.item.name.clone(),
            file_data.item.path.clone(),
        )
    };
    
    // Get translation options from job
    let opts = {
        let jobs = state.jobs.lock().unwrap();
        let job = jobs.get(&job_id).unwrap();
        
        // Use options stored in job
        job.options.clone().expect("Job options not found")
    };
    
    // Update job status to running
    {
        let mut jobs = state.jobs.lock().unwrap();
        if let Some(job) = jobs.get_mut(&job_id) {
            job.info.status = JobStatus::Running;
        }
    }
    
    // Start translation
    let result = translate_document(
        app.clone(),
        job_id.clone(),
        file_name.clone(),
        doc.clone(),
        opts,
    )
    .await;
    
    match result {
        Ok(translated) => {
            // Write output file
            let output_path = file_path.replace(".srt", "_translated.srt");
            let srt_content = write_srt(&doc, &translated)
                .map_err(|e| format!("Failed to write SRT: {}", e))?;
            
            std::fs::write(&output_path, srt_content)
                .map_err(|e| format!("Failed to save file: {}", e))?;
            
            // Update job status
            let mut jobs = state.jobs.lock().unwrap();
            if let Some(job) = jobs.get_mut(&job_id) {
                job.info.status = JobStatus::Done;
                job.info.progress = 100.0;
                job.info.output_path = Some(output_path.clone());
                job.translated = Some(translated);
            }
            
            // Emit finished event
            let _ = app.emit("translation://finished", serde_json::json!({
                "job_id": job_id,
                "output_path": output_path,
            }));
            
            Ok(())
        }
        Err(e) => {
            // Update job status to error
            let mut jobs = state.jobs.lock().unwrap();
            if let Some(job) = jobs.get_mut(&job_id) {
                job.info.status = JobStatus::Error;
                job.info.error = Some(e.to_string());
            }
            
            // Emit error event
            let _ = app.emit("translation://error", e.to_string());
            
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub fn get_job(
    job_id: String,
    state: State<AppState>,
) -> Result<JobInfo, String> {
    let jobs = state.jobs.lock().unwrap();
    let job = jobs
        .get(&job_id)
        .ok_or_else(|| format!("Job not found: {}", job_id))?;
    Ok(job.info.clone())
}

#[tauri::command]
pub fn list_jobs(state: State<AppState>) -> Result<Vec<JobInfo>, String> {
    let jobs = state.jobs.lock().unwrap();
    Ok(jobs.values().map(|j| j.info.clone()).collect())
}
