export type StatusAtendimento = 'AGUARDANDO_FILA' | 'EM_ATENDIMENTO' | 'FINALIZADO';

export interface Atendimento {
  id: string;
  assunto: string;
  assuntoNormalizado: string;
  timeId: string;
  atendenteId: string | null;
  status: StatusAtendimento;
  idempotencyKey: string | null;
  criadoEm: Date;
  atribuidoEm: Date | null;
  finalizadoEm: Date | null;
}
