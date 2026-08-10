// useAuth.ts — Thin wrapper que re-exporta o AuthContext para compatibilidade
// com os componentes existentes que chamam useAuth().
// NÃO contém lógica própria de autenticação; toda a lógica está em auth-context.tsx.
export { useAuthContext as useAuth } from '../lib/auth-context';
