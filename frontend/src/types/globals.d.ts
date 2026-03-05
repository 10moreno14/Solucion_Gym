export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      rol?: "gimnasio" | "tecnico" | "afiliado";
      tenant_id?: string;
    };
  }
}