use std::path::{Path, PathBuf};
use std::process::Command;
use std::fs;

use serde::Serialize;

#[derive(Serialize)]
pub struct GitRepoInfo {
    pub path: String,
    pub branch: String,
    pub is_clean: bool,
    pub has_fivedollars_folder: bool,
    pub has_collections_file: bool,
}

fn ensure_repo_path(path: Option<String>) -> Result<PathBuf, String> {
    if let Some(p) = path {
        let pb = PathBuf::from(p);
        if pb.join(".git").exists() {
            return Ok(pb);
        } else {
            return Err("Caminho informado não é um repositório Git (sem .git)".to_string());
        }
    }

    // Fallback: usar diretório atual do processo.
    let cwd = std::env::current_dir().map_err(|e| e.to_string())?;
    if cwd.join(".git").exists() {
        Ok(cwd)
    } else {
        Err("Diretório atual não é um repositório Git (sem .git)".to_string())
    }
}

fn run_git(repo_path: &Path, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(repo_path)
        .output()
        .map_err(|e| format!("Erro ao executar git: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git {:?} falhou: {}", args, stderr.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.trim().to_string())
}

#[tauri::command]
pub fn detect_git_repo(path: Option<String>) -> Result<GitRepoInfo, String> {
    let repo_path = ensure_repo_path(path)?;

    let branch = run_git(&repo_path, &["rev-parse", "--abbrev-ref", "HEAD"])?;
    let status_output = run_git(&repo_path, &["status", "--porcelain"])?;
    let is_clean = status_output.is_empty();

    let fivedollars_folder = repo_path.join(".fivedollars");
    let has_fivedollars_folder = fivedollars_folder.is_dir();
    let collections_file = fivedollars_folder.join("collections.json");
    let has_collections_file = collections_file.is_file();

    Ok(GitRepoInfo {
        path: repo_path.to_string_lossy().to_string(),
        branch,
        is_clean,
        has_fivedollars_folder,
        has_collections_file,
    })
}

#[tauri::command]
pub fn read_git_collections(repo_path: String) -> Result<String, String> {
    let repo = PathBuf::from(repo_path);
    if !repo.join(".git").exists() {
        return Err("Caminho informado não é um repositório Git (sem .git)".to_string());
    }
    let collections_path = repo.join(".fivedollars").join("collections.json");
    if !collections_path.exists() {
        return Err("Arquivo .fivedollars/collections.json não encontrado".to_string());
    }

    fs::read_to_string(&collections_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_git_collections(repo_path: String, payload: String) -> Result<(), String> {
    let repo = PathBuf::from(repo_path);
    if !repo.join(".git").exists() {
        return Err("Caminho informado não é um repositório Git (sem .git)".to_string());
    }

    let folder = repo.join(".fivedollars");
    if !folder.exists() {
        fs::create_dir_all(&folder).map_err(|e| e.to_string())?;
    }
    let collections_path = folder.join("collections.json");
    fs::write(&collections_path, payload).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn git_commit_collections(repo_path: String, message: Option<String>) -> Result<(), String> {
    let repo = PathBuf::from(repo_path);
    if !repo.join(".git").exists() {
        return Err("Caminho informado não é um repositório Git (sem .git)".to_string());
    }

    let collections_rel = ".fivedollars/collections.json";

    // git add
    run_git(&repo, &["add", collections_rel])?;

    // Verificar se há algo para commitar
    let status_output = run_git(&repo, &["status", "--porcelain", collections_rel])?;
    if status_output.is_empty() {
        // Nada para commitar, sair silenciosamente.
        return Ok(());
    }

    let commit_msg = message.unwrap_or_else(|| "chore(fivedollars): update collections".to_string());
    run_git(&repo, &["commit", "-m", &commit_msg])?;

    Ok(())
}

