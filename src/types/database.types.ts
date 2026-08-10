export type StatusAgendamento = 'pendente' | 'confirmado' | 'concluido' | 'cancelado';
export type CanalConfirmacao = 'whatsapp' | 'sistema';
export type PapelEquipe = 'admin' | 'tatuador' | 'piercer' | 'barbeiro';
export type TipoTransacao = 'entrada' | 'saida';

// Aliases para compatibilidade legada da UI
export type UserRole = PapelEquipe;
export type AppointmentStatus = StatusAgendamento;
export type InventoryCategory = 'Produtos' | 'Equipamentos' | 'Estoque' | string;
export type TransactionType = TipoTransacao;
export type ConfirmationChannel = CanalConfirmacao;

export interface Estudio {
  id: string;
  nome: string;
  slug: string;
  telefone?: string | null;
  email_contato?: string | null;
  logo_url?: string | null;
  endereco?: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Servico {
  id: string;
  estudio_id: string;
  nome: string;
  descricao?: string | null;
  duracao_minutos: number;
  preco: number;
  ativo: boolean;
  criado_em: string;

  // Getter de conveniência
  duracao?: number;
}

export interface LocalCorpo {
  id: number;
  estudio_id?: string | null;
  nome: string;
  ativo: boolean;
}

export interface HorarioDisponivel {
  id: number;
  estudio_id: string;
  dia_semana: number; // 0-6 (0=Domingo)
  horario: string; // HH:mm:ss
  ativo: boolean;
}

export interface Perfil {
  id: string;
  estudio_id?: string;
  nome?: string;
  email?: string;
  telefone?: string | null;
  papel?: PapelEquipe;
  avatar_url?: string | null;
  ativo?: boolean;
  criado_em?: string;

  // Compatibilidade com UI
  name?: string;
  role?: PapelEquipe;
  cargo?: PapelEquipe;
  phone?: string | null;
  created_at?: string;
}

export type Profile = Perfil;
export type StaffMember = Perfil;

export interface Cliente {
  id: string;
  estudio_id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  total_investido: number;
  total_agendamentos: number;
  criado_em: string;
}

export interface AgendamentoLocal {
  id: number;
  agendamento_id: string;
  local_id?: number | null;
  descricao_customizada?: string | null;
  local?: LocalCorpo;
}

export interface AgendamentoReferencia {
  id: string;
  agendamento_id: string;
  url: string;
  ordem: number;
  criado_em: string;

  // Compatibilidade
  url_imagem?: string;
}

export interface Agendamento {
  id: string;
  estudio_id: string;
  cliente_id?: string | null;
  profissional_id?: string | null;
  servico_id?: string | null;

  cliente_nome: string;
  cliente_email?: string | null;
  cliente_telefone: string;

  data_agendamento: string; // YYYY-MM-DD
  horario_agendamento: string; // HH:mm:ss
  data_hora_inicio: string; // ISO
  data_hora_fim: string; // ISO

  mais_de_uma_tattoo: boolean;
  status: StatusAgendamento;
  canal_confirmacao: CanalConfirmacao;
  valor_cobrado?: number | null;
  observacoes?: string | null;
  origem: string;

  criado_em: string;
  atualizado_em: string;

  // Joins e aliases estendidos
  servico_nome?: string;
  imagem_referencia_url?: string;
  servico?: Servico;
  profissional?: Perfil;
  cliente?: Cliente;
  locais?: AgendamentoLocal[];
  referencias?: AgendamentoReferencia[];
}

export type Appointment = Agendamento;

export interface EstoqueItem {
  id: string;
  estudio_id: string;
  item: string;
  categoria: string;
  quantidade: number;
  minimo_alerta: number;
  preco_unitario: number;
  data_ultima_compra?: string | null;
  criado_em: string;

  // Aliases de interface
  name?: string;
  category?: string;
  min_quantity?: number;
  price_per_unit?: number;
  last_purchase_date?: string;
}

export interface TransacaoFinanceira {
  id: string;
  estudio_id: string;
  agendamento_id?: string | null;
  tipo: TipoTransacao;
  categoria: string;
  descricao?: string | null;
  valor: number;
  data: string;
  criado_em: string;
}

export interface Anotacao {
  id: string;
  estudio_id: string;
  perfil_id: string;
  conteudo: string;
  cor: string;
  criado_em: string;

  // Aliases de interface
  content?: string;
  color?: string;
  user_id?: string;
  created_at?: string;
}

export interface Notificacao {
  id: string;
  estudio_id: string;
  perfil_id?: string | null;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criado_em: string;

  // Aliases de interface
  title?: string;
  content?: string;
  read?: boolean;
  type?: string;
  body?: string;
  created_at?: string;
}

export type Notification = Notificacao;

export interface ChatConversa {
  id: string;
  estudio_id: string;
  tipo: string;
  titulo?: string | null;
  criado_em: string;
}

export interface ChatMensagem {
  id: string;
  conversa_id: string;
  remetente_id: string;
  texto?: string | null;
  tipo_conteudo: string;
  arquivo_url?: string | null;
  lida: boolean;
  criado_em: string;

  remetente?: Perfil;
}

export interface PayloadCriarAgendamentoPublico {
  estudio_id: string;
  cliente_nome: string;
  cliente_email?: string;
  cliente_telefone: string;
  data_agendamento: string;
  horario_agendamento: string;
  mais_de_uma_tattoo?: boolean;
  canal_confirmacao?: CanalConfirmacao;
  observacoes?: string;
  parte_corpo?: string[];
  imagens_referencia?: string[];
}
