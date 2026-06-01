export class FocusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FocusError';
  }
}
