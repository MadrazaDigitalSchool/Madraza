export interface Notificacion {
  id: number;
  tipo: 'INVITACION_ORG' | 'ASIGNACION_TEST' | string;
  titulo: string;
  mensaje: string;
  urlDestino: string | null;
  leida: boolean;
  fechaCreacion: string;
}
