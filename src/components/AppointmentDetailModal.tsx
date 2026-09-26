import React, { useState, useEffect } from 'react';
import { type Appointment, type AppointmentStatus } from '../types/database.types';

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: AppointmentStatus) => Promise<void>;
  onUpdateImageLink?: (id: string, imageUrl: string) => Promise<void>;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateImageLink
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [inputImageUrl, setInputImageUrl] = useState('');
  const [imgOrientation, setImgOrientation] = useState<'portrait' | 'landscape' | 'square'>('landscape');
  const [imgError, setImgError] = useState(false);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);

  useEffect(() => {
    if (appointment) {
      setInputImageUrl(appointment.imagem_referencia_url || '');
      setIsEditingLink(false);
      setImgError(false);
      setSelectedImgIndex(0);
    }
  }, [appointment]);

  if (!isOpen || !appointment) return null;

  const handleCopyLink = () => {
    const url = appointment.imagem_referencia_url || inputImageUrl;
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;
    if (ratio > 1.2) {
      setImgOrientation('landscape');
    } else if (ratio < 0.85) {
      setImgOrientation('portrait');
    } else {
      setImgOrientation('square');
    }
    setImgError(false);
  };

  const handleSaveImageLink = async () => {
    if (onUpdateImageLink && appointment) {
      await onUpdateImageLink(appointment.id, inputImageUrl);
    }
    setIsEditingLink(false);
  };

  // Função auxiliar para extrair todas as URLs de imagem disponíveis no agendamento
  const getAllImageUrls = (): string[] => {
    if (!appointment) return [];
    const urls: string[] = [];

    // 1. Imagem principal
    if (appointment.imagem_referencia_url && appointment.imagem_referencia_url.trim()) {
      urls.push(appointment.imagem_referencia_url.trim());
    }

    // 2. Tabela filha agendamento_referencias
    if (appointment.referencias && Array.isArray(appointment.referencias)) {
      appointment.referencias.forEach((ref: any) => {
        const u = ref.url || ref.url_imagem;
        if (u && typeof u === 'string' && u.trim() && !urls.includes(u.trim())) {
          urls.push(u.trim());
        }
      });
    }

    // 3. URLs extraídas do texto de observações (regex de URL)
    if (appointment.observacoes) {
      const urlRegex = /(https?:\/\/[^\s,]+)/gi;
      const matches = appointment.observacoes.match(urlRegex);
      if (matches) {
        matches.forEach(match => {
          const cleanUrl = match.trim().replace(/[.,;)]$/, '');
          if (!urls.includes(cleanUrl)) {
            urls.push(cleanUrl);
          }
        });
      }
    }

    // 4. Link digitado/editado manualmente no modal
    if (inputImageUrl && inputImageUrl.trim() && !urls.includes(inputImageUrl.trim())) {
      urls.push(inputImageUrl.trim());
    }

    return urls;
  };

  const allImages = getAllImageUrls();

  const price = Number(appointment.valor_cobrado || 0);
  const urgencyLabel = price >= 60 ? 'Alta' : price >= 40 ? 'Média' : 'Baixa';
  const urgencyClass = price >= 60 
    ? 'bg-danger/10 text-danger border-danger/20' 
    : price >= 40 
    ? 'bg-warning/10 text-warning border-warning/20' 
    : 'bg-success/10 text-success border-success/20';

  const imageUrl = allImages[selectedImgIndex] || allImages[0] || inputImageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-bg-surface w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl border border-border-main overflow-hidden my-auto max-h-[92dvh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header do Modal */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border-main bg-bg-base/50">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-icons-outlined text-lg sm:text-xl">collections</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-text-main truncate">Detalhes do Agendamento</h2>
              <p className="text-[10px] sm:text-xs text-text-secondary truncate">ID: {appointment.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-bg-elevated text-text-secondary hover:text-text-main flex items-center justify-center transition-colors p-1"
          >
            <span className="material-icons-outlined text-base sm:text-lg">close</span>
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          
          {/* Lado Esquerdo / Imagem Adaptável */}
          <div className={`md:col-span-6 flex flex-col gap-3 ${imgOrientation === 'portrait' ? 'max-w-md mx-auto w-full' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-icons-outlined text-sm">image</span>
                Imagem de Referência
              </span>
              {imageUrl && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-bg-elevated text-text-secondary uppercase">
                  Formato: {imgOrientation === 'portrait' ? 'Retrato (Vertical)' : imgOrientation === 'landscape' ? 'Paisagem (Horizontal)' : 'Quadrado'}
                </span>
              )}
            </div>

            {/* Container da Imagem que se adapta ao formato */}
            <div className={`relative bg-bg-base border border-border-main rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-300 ${
              imgOrientation === 'portrait' ? 'aspect-[3/4] max-h-[420px]' : 
              imgOrientation === 'landscape' ? 'aspect-[16/10] max-h-[350px]' : 
              'aspect-square max-h-[380px]'
            }`}>
              {imageUrl && !imgError ? (
                <img 
                  src={imageUrl} 
                  alt="Referência do Agendamento" 
                  onLoad={handleImageLoad}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 text-text-secondary">
                  <span className="material-icons-outlined text-5xl mb-2 text-text-secondary/50">hide_image</span>
                  <p className="text-sm font-medium">Nenhuma imagem enviada</p>
                  <p className="text-xs text-text-secondary/70 mt-1">Cole um link de imagem abaixo para adicionar a referência visual.</p>
                </div>
              )}
            </div>

            {/* Miniaturas de Múltiplas Fotos se houver mais de uma */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImgIndex(idx);
                      setImgError(false);
                    }}
                    className={`w-14 h-14 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                      (selectedImgIndex === idx || (!selectedImgIndex && idx === 0))
                        ? 'border-primary shadow-md scale-105' 
                        : 'border-border-main opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Exibição Visível do Link com Ações */}
            <div className="bg-bg-base p-3 rounded-2xl border border-border-main flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-medium text-text-secondary">
                <span>Link da Imagem (URL)</span>
                <button 
                  onClick={() => setIsEditingLink(!isEditingLink)}
                  className="text-primary hover:underline text-[11px] font-semibold"
                >
                  {isEditingLink ? 'Cancelar' : imageUrl ? 'Alterar Link' : '+ Adicionar Link'}
                </button>
              </div>

              {isEditingLink ? (
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={inputImageUrl}
                    onChange={e => setInputImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="flex-1 p-2 text-base sm:text-xs bg-bg-surface border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
                  />
                  <button 
                    onClick={handleSaveImageLink}
                    className="bg-primary hover:bg-primary-hover text-primary-text text-xs px-3 py-2 rounded-xl font-bold transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-bg-surface p-2 rounded-xl border border-border-main">
                  <span className="material-icons-outlined text-sm text-text-secondary shrink-0">link</span>
                  <input 
                    type="text" 
                    readOnly 
                    value={imageUrl || 'Nenhum link cadastrado'} 
                    className="w-full text-xs bg-transparent text-text-main outline-none truncate font-mono select-all"
                  />
                  {imageUrl && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={handleCopyLink}
                        title="Copiar Link"
                        className="p-1.5 rounded-lg bg-bg-elevated hover:bg-primary/20 hover:text-primary text-text-secondary text-xs transition-colors flex items-center gap-1"
                      >
                        <span className="material-icons-outlined text-sm">content_copy</span>
                        <span className="text-[10px] font-bold">{copied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                      <a 
                        href={imageUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        title="Abrir imagem em nova guia"
                        className="p-1.5 rounded-lg bg-bg-elevated hover:bg-primary/20 hover:text-primary text-text-secondary transition-colors"
                      >
                        <span className="material-icons-outlined text-sm">open_in_new</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito / Informações do Cliente e Agendamento */}
          <div className="md:col-span-6 flex flex-col gap-4">
            
            {/* Status e Urgência */}
            <div className="flex justify-between items-center bg-bg-base p-3 rounded-2xl border border-border-main">
              <div>
                <span className="text-[10px] uppercase font-bold text-text-secondary block">Status</span>
                <span className={`inline-block mt-0.5 text-xs font-bold px-2.5 py-0.5 rounded-full capitalize border ${
                  appointment.status === 'confirmado' ? 'bg-info/10 text-info border-info/20' :
                  appointment.status === 'concluido' ? 'bg-success/10 text-success border-success/20' :
                  'bg-warning/10 text-warning border-warning/20'
                }`}>
                  {appointment.status}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-text-secondary block">Prioridade</span>
                <span className={`inline-block mt-0.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${urgencyClass}`}>
                  {urgencyLabel}
                </span>
              </div>
            </div>

            {/* Informações do Cliente */}
            <div className="bg-bg-base p-4 rounded-2xl border border-border-main flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-main pb-2">
                Informações do Cliente
              </h3>
              <div>
                <p className="text-base font-bold text-text-main">{appointment.cliente_nome}</p>
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="material-icons-outlined text-sm">phone</span>
                    <span>{appointment.cliente_telefone || 'Sem telefone'}</span>
                    {appointment.cliente_telefone && (
                      <a 
                        href={`https://wa.me/55${appointment.cliente_telefone.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="ml-auto text-[11px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-md hover:bg-success/20 transition-colors"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                  {appointment.cliente_email && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className="material-icons-outlined text-sm">email</span>
                      <span className="truncate">{appointment.cliente_email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detalhes do Serviço & Data */}
            <div className="bg-bg-base p-4 rounded-2xl border border-border-main flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-main pb-2">
                Detalhes do Serviço
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-text-secondary block">Serviço</span>
                  <span className="text-xs font-bold text-text-main">{appointment.servico?.nome || appointment.servico_nome || 'Personalizado'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary block">Valor Estimado</span>
                  <span className="text-xs font-extrabold text-primary">R$ {price.toFixed(2)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-text-secondary block">Data e Horário</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text-main mt-0.5">
                    <span className="material-icons-outlined text-sm text-primary">event</span>
                    {new Date(appointment.data_hora_inicio).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {appointment.observacoes && (
                <div className="mt-2 pt-2 border-t border-border-main">
                  <span className="text-[10px] text-text-secondary block">Observações do Agendamento / Quiz</span>
                  <p className="text-xs text-text-main mt-1 italic bg-bg-surface p-2 rounded-xl border border-border-main">
                    "{appointment.observacoes}"
                  </p>
                </div>
              )}
            </div>

            {/* Ações de Mudança de Status */}
            {onUpdateStatus && (
              <div className="flex items-center gap-2 mt-auto">
                {appointment.status === 'pendente' && (
                  <button 
                    onClick={() => onUpdateStatus(appointment.id, 'confirmado')}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-text text-xs font-bold transition-colors shadow-sm"
                  >
                    Confirmar Agendamento
                  </button>
                )}
                {appointment.status === 'confirmado' && (
                  <button 
                    onClick={() => onUpdateStatus(appointment.id, 'concluido')}
                    className="flex-1 py-2.5 rounded-xl bg-success hover:bg-success/90 text-primary-text text-xs font-bold transition-colors shadow-sm"
                  >
                    Concluir Agendamento
                  </button>
                )}
                {appointment.status !== 'cancelado' && (
                  <button 
                    onClick={() => onUpdateStatus(appointment.id, 'cancelado')}
                    className="px-4 py-2.5 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
