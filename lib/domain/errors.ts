/** Error de negocio con un mensaje en español para mostrarle a la persona. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

/** No existe o no tenés acceso. Se muestra como 404 para no revelar si el grupo existe. */
export class NotFoundError extends Error {
  constructor() {
    super("No encontrado");
    this.name = "NotFoundError";
  }
}
