use std::env;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::fs;

use serde::Serialize;

/// PATH com diretórios onde Node/npx costumam estar, para hooks (ex.: Husky) funcionarem.
fn git_path_env() -> String {
    let existing = env::var("PATH").unwrap_or_default();
    let mut prefix = String::from("/usr/local/bin:/opt/homebrew/bin");
    if let Some(home) = env::var_os("HOME") {
        let home_str = home.to_string_lossy();
        if !home_str.is_empty() {
            prefix.push_str(&format!(":{}/.nvm/versions/node/current/bin", home_str));
        }
    }
    format!("{prefix}:{existing}")
}

#[derive(Serialize)]
pub struct GitRepoInfo {
    pub path: String,
    pub branch: String,
    pub is_clean: bool,
    pub has_fivedollars_folder: bool,
    pub has_collections_file: bool,
}

fn ensure_repo_path(path: Option<String>) -> Result<PathBuf, String> {
    let start_dir = match path {
        Some(p) => PathBuf::from(p),
        None => std::env::current_dir().map_err(|e| e.to_string())?,
    };

    // Usa git para encontrar a raiz do repo a partir do diretório informado,
    // subindo automaticamente pelos diretórios pai se necessário.
    let output = Command::new("git")
        .args(["rev-parse", "--show-toplevel"])
        .current_dir(&start_dir)
        .env("PATH", git_path_env())
        .output()
        .map_err(|e| format!("Erro ao executar git: {e}"))?;

    if output.status.success() {
        let root = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(PathBuf::from(root))
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!(
            "A pasta selecionada não pertence a um repositório Git. ({})",
            stderr.trim()
        ))
    }
}

fn run_git(repo_path: &Path, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(repo_path)
        .env("PATH", git_path_env())
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

#[derive(Serialize)]
pub struct GitBranchesInfo {
    pub current: String,
    pub all: Vec<String>,
}

#[tauri::command]
pub fn list_git_branches(repo_path: String) -> Result<GitBranchesInfo, String> {
    let repo = PathBuf::from(&repo_path);
    if !repo.join(".git").exists() {
        return Err("Caminho informado não é um repositório Git (sem .git)".to_string());
    }
    let output = run_git(&repo, &["branch"])?;
    let mut current = String::new();
    let mut all = Vec::new();
    for line in output.lines() {
        let line = line.trim();
        let (name, is_current) = if line.starts_with("* ") {
            (line.trim_start_matches("* ").trim(), true)
        } else {
            (line.trim(), false)
        };
        if !name.is_empty() {
            all.push(name.to_string());
            if is_current {
                current = name.to_string();
            }
        }
    }
    if current.is_empty() && !all.is_empty() {
        current = all.first().cloned().unwrap_or_default();
    }
    Ok(GitBranchesInfo { current, all })
}

#[tauri::command]
pub fn git_checkout_branch(repo_path: String, branch: String) -> Result<(), String> {
    let repo = PathBuf::from(&repo_path);
    if !repo.join(".git").exists() {
        return Err("Caminho informado não é um repositório Git (sem .git)".to_string());
    }
    if branch.is_empty() {
        return Err("Nome do branch não pode ser vazio.".to_string());
    }
    run_git(&repo, &["checkout", &branch])?;
    Ok(())
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

