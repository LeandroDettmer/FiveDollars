/// PROJETO APP DESENVOLVIDO EM TAURI USANDO LINGUAGUENS WEB REACT E JAVASCRIPT

PROJETO COM FOCO PARA SUBSCTITUIR O POSTMAN/INSOMNIA E GRATUTITO

Quero um projeto parecido com postman, para fazer chamadas http poder configurar variaveis de ambiente importar collections do postman por exemplo e poder usar no meu software para ir migrando aos poucos


PROMPT inicial
Atue como um Engenheiro de Software Sênior especializado em Rust, React e Tauri. >
Objetivo: Iniciar o desenvolvimento de um cliente HTTP desktop open-source (alternativa ao Postman/Insomnia) focado em performance e privacidade.

Stack Técnica: > * Frontend: React.js com Tailwind CSS.

Backend/Core: Tauri (Rust) para gerenciar requisições de rede e sistema de arquivos.

Gerenciamento de Estado: Context API ou Zustand.

Funcionalidades Necessárias (MVP):

Requisições HTTP: Interface para métodos GET, POST, PUT, DELETE, PATCH. Campos para Headers, Body (JSON, Form-data, Raw) e Query Params.

Ambientes (Environments): Sistema de variáveis de ambiente (ex: {{baseUrl}}) que podem ser alternadas globalmente.

Importação: Implementar um parser inicial para importar arquivos JSON de Collections do Postman (v2.1).

Persistência Local: Salvar todas as configurações e histórico localmente via sistema de arquivos do Tauri (não usar LocalStorage do browser para evitar limites de tamanho).

Design: > * Layout de 3 colunas: (1) Sidebar com coleções e histórico, (2) Painel de configuração da requisição, (3) Painel de resposta (Response Body, Status, Time, Size).

Tema Dark moderno (estilo Obsidian ou VS Code).

Tarefa Inicial: > Comece estruturando a arquitetura de pastas e crie o componente principal de requisição que consiga disparar um "Fetch" simples via comando tauri-plugin-http (para evitar problemas de CORS do navegador). Mostre como mapear as variáveis de ambiente no corpo da URL antes do disparo.


Fuja do CORS: Peça ao Cursor para usar o plugin @tauri-apps/plugin-http do Rust. Se você fizer as requisições pelo fetch do JavaScript (browser), muitos sites vão bloquear a requisição por segurança. No Rust, você tem controle total.

Arquitetura de Dados: Peça para ele criar uma estrutura de dados baseada em IDs únicos (UUIDs) para que, ao importar uma collection, você não perca referências.

Editor de Código: Para o campo de JSON do Body, recomendo pedir para ele integrar o Monaco Editor (o mesmo do VS Code) ou o CodeMirror, para ter syntax highlighting.