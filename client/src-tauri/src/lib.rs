//! Backend Tauri - Five Dollar Post
//! Requisições HTTP são feitas pelo frontend via tauri-plugin-http (evita CORS).

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .run(tauri::generate_context!())
        .expect("erro ao iniciar Five Dollar Post");
}
