//! Backend Tauri - FiveDollars
//! Requisições HTTP são feitas pelo frontend via tauri-plugin-http (evita CORS).
//! Persistência: comandos load_app_data / save_app_data gravam em app_data_dir.

use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

const DATA_FILE: &str = "data.json";

fn data_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    Ok(dir.join(DATA_FILE))
}

#[tauri::command]
fn load_app_data(app: AppHandle) -> Result<String, String> {
    let path = data_path(&app)?;
    if !path.exists() {
        return Ok("{}".to_string());
    }
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_app_data(app: AppHandle, payload: String) -> Result<(), String> {
    let path = data_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, payload).map_err(|e| e.to_string())
}

/// Grava o backup no caminho escolhido pelo usuário (diálogo "Salvar como").
#[tauri::command]
fn write_backup_file(path: String, payload: String) -> Result<(), String> {
    if let Some(parent) = PathBuf::from(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, payload).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![load_app_data, save_app_data, write_backup_file])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar FiveDollars");
}
