// Type declarations for Vite environment variables used by the app
// This makes `import.meta.env` and `import.meta.env.VITE_API_BASE` available to TypeScript.
/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE?: string
    // add other VITE_ variables here as needed
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

export {}