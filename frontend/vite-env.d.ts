interface ImportMetaEnv {
    readonly VITE_API_URL: string
    // adicione outras variáveis aqui
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }