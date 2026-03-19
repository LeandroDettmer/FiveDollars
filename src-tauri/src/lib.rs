//! Backend Tauri - FiveDollars
//! Requisições HTTP são feitas pelo frontend via tauri-plugin-http (evita CORS).
//! Persistência: comandos load_app_data / save_app_data gravam em app_data_dir.
//! Backups internos: subpasta `backups/` (isolada de data.json e imports).

use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

mod git_sync;

const DATA_FILE: &str = "data.json";
const BACKUPS_DIR: &str = "backups";

fn data_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    Ok(dir.join(DATA_FILE))
}

fn backups_dir_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    Ok(dir.join(BACKUPS_DIR))
}

/// Apenas nomes simples `*.json` (sem path traversal).
fn sanitize_backup_file_name(file_name: &str) -> Result<&str, String> {
    if file_name.is_empty() || file_name.len() > 200 {
        return Err("nome de arquivo inválido".to_string());
    }
    if file_name.contains('/') || file_name.contains('\\') || file_name.contains("..") {
        return Err("nome de arquivo inválido".to_string());
    }
    if !file_name.ends_with(".json") {
        return Err("apenas arquivos .json".to_string());
    }
    let base = file_name.trim_end_matches(".json");
    if base.is_empty() {
        return Err("nome de arquivo inválido".to_string());
    }
    if !base
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '_' || c == '-')
    {
        return Err("nome de arquivo inválido".to_string());
    }
    Ok(file_name)
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct AppBackupEntry {
    file_name: String,
    modified_unix: i64,
    size_bytes: u64,
}

#[tauri::command]
fn list_app_backups(app: AppHandle) -> Result<Vec<AppBackupEntry>, String> {
    let dir = backups_dir_path(&app)?;
    if !dir.exists() {
        return Ok(Vec::new());
    }
    let mut entries = Vec::new();
    for read in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let entry = read.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if !name.ends_with(".json") {
            continue;
        }
        if sanitize_backup_file_name(&name).is_err() {
            continue;
        }
        let meta = fs::metadata(&path).map_err(|e| e.to_string())?;
        if !meta.is_file() {
            continue;
        }
        let modified = meta
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);
        entries.push(AppBackupEntry {
            file_name: name,
            modified_unix: modified,
            size_bytes: meta.len(),
        });
    }
    entries.sort_by(|a, b| b.modified_unix.cmp(&a.modified_unix));
    Ok(entries)
}

#[tauri::command]
fn write_app_backup(app: AppHandle, file_name: String, payload: String) -> Result<(), String> {
    let name = sanitize_backup_file_name(&file_name)?;
    let dir = backups_dir_path(&app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(name);
    fs::write(path, payload).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_app_backup(app: AppHandle, file_name: String) -> Result<String, String> {
    let name = sanitize_backup_file_name(&file_name)?;
    let path = backups_dir_path(&app)?.join(name);
    if !path.exists() {
        return Err("backup não encontrado".to_string());
    }
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_app_backup(app: AppHandle, file_name: String) -> Result<(), String> {
    let name = sanitize_backup_file_name(&file_name)?;
    let path = backups_dir_path(&app)?.join(name);
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
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
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            load_app_data,
            save_app_data,
            write_backup_file,
            git_sync::detect_git_repo,
            git_sync::list_git_branches,
            git_sync::git_checkout_branch,
            git_sync::read_git_collections,
            git_sync::write_git_collections,
            git_sync::git_commit_collections
            list_app_backups,
            write_app_backup,
            read_app_backup,
            delete_app_backup
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar FiveDollars");
}
