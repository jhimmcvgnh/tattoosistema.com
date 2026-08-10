-- ===========================================================================
-- RECRIAÇÃO COMPLETA DO BANCO DE DADOS (v4 - DEFINITIVO)
-- ===========================================================================

-- 1. LIMPEZA TOTAL DO SCHEMA PUBLIC
drop trigger if exists on_auth_user_created on auth.users;
drop schema public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;

-- 2. EXTENSÕES E TIPOS ENUM
create extension if not exists pgcrypto;

create type status_agendamento as enum ('pendente','confirmado','concluido','cancelado');
create type canal_confirmacao as enum ('whatsapp','sistema');
create type papel_equipe as enum ('admin','tatuador','piercer','barbeiro');
create type tipo_transacao as enum ('entrada','saida');
create type metodo_pagamento_tipo as enum ('a_combinar','pix','cartao_credito','cartao_debito','dinheiro');
create type categoria_estoque_tipo as enum ('Produtos','Equipamentos','Descartáveis','Tintas','Agulhas','Outros');

-- 3. TABELAS
create table public.estudios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text unique not null,
  telefone text,
  email_contato text,
  logo_url text,
  endereco text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  estudio_id uuid not null references public.estudios(id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  papel papel_equipe not null default 'admin',
  avatar_url text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index idx_perfis_estudio on public.perfis(estudio_id);

create table public.servicos (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references public.estudios(id) on delete cascade,
  nome text not null,
  descricao text,
  duracao_minutos integer not null default 60,
  preco numeric(10,2) not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index idx_servicos_estudio on public.servicos(estudio_id);

create table public.locais_corpo (
  id serial primary key,
  estudio_id uuid references public.estudios(id) on delete cascade,
  nome text not null,
  ativo boolean not null default true
);

create table public.horarios_disponiveis (
  id serial primary key,
  estudio_id uuid not null references public.estudios(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  horario time not null,
  ativo boolean not null default true,
  unique (estudio_id, dia_semana, horario)
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references public.estudios(id) on delete cascade,
  nome text not null,
  email text,
  telefone text not null,
  total_investido numeric(10,2) not null default 0,
  total_agendamentos integer not null default 0,
  criado_em timestamptz not null default now(),
  unique (estudio_id, telefone)
);

create table public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references public.estudios(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  profissional_id uuid references public.perfis(id) on delete set null,
  servico_id uuid references public.servicos(id) on delete set null,

  cliente_nome text not null,
  cliente_email text,
  cliente_telefone text not null,

  servico_nome text not null default 'Tatuagem Personalizada',
  duracao_minutos integer not null default 60,
  metodo_pagamento metodo_pagamento_tipo not null default 'a_combinar',

  data_agendamento date not null,
  horario_agendamento time not null,
  data_hora_inicio timestamptz not null,
  data_hora_fim timestamptz not null,

  mais_de_uma_tattoo boolean not null default false,
  status status_agendamento not null default 'pendente',
  canal_confirmacao canal_confirmacao not null default 'sistema',
  valor_cobrado numeric(10,2),
  observacoes text,
  imagem_referencia_url text,
  origem text not null default 'site',

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_agendamentos_estudio on public.agendamentos(estudio_id);
create index idx_agendamentos_data on public.agendamentos(estudio_id, data_agendamento);

create unique index uq_agendamento_horario_estudio
  on public.agendamentos(estudio_id, data_agendamento, horario_agendamento)
  where status <> 'cancelado';

create table public.agendamento_locais (
  id serial primary key,
  agendamento_id uuid not null references public.agendamentos(id) on delete cascade,
  local_id integer references public.locais_corpo(id),
  descricao_customizada text
);
create index idx_agendamento_locais_agendamento on public.agendamento_locais(agendamento_id);

create table public.agendamento_referencias (
  id uuid primary key default gen_random_uuid(),
  agendamento_id uuid not null references public.agendamentos(id) on delete cascade,
  url text not null,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);
create index idx_agendamento_referencias_agendamento on public.agendamento_referencias(agendamento_id);

create table public.estoque_itens (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references public.estudios(id) on delete cascade,
  item text not null,
  categoria categoria_estoque_tipo not null default 'Produtos',
  quantidade integer not null default 0,
  minimo_alerta integer not null default 1,
  preco_unitario numeric(10,2) not null default 0,
  data_ultima_compra timestamptz,
  criado_em timestamptz not null default now()
);
create index idx_estoque_estudio on public.estoque_itens(estudio_id);

create table public.transacoes_financeiras (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references public.estudios(id) on delete cascade,
  agendamento_id uuid references public.agendamentos(id) on delete set null,
  tipo tipo_transacao not null,
  categoria text not null default 'Serviço',
  descricao text,
  valor numeric(10,2) not null,
  data timestamptz not null default now(),
  criado_em timestamptz not null default now()
);
create index idx_transacoes_estudio on public.transacoes_financeiras(estudio_id);

create table public.anotacoes (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references public.estudios(id) on delete cascade,
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  conteudo text not null,
  cor text not null default 'amarelo',
  criado_em timestamptz not null default now()
);

create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references public.estudios(id) on delete cascade,
  perfil_id uuid references public.perfis(id) on delete cascade,
  titulo text not null,
  mensagem text not null,
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.chat_conversas (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references public.estudios(id) on delete cascade,
  tipo text not null default 'equipe',
  titulo text,
  criado_em timestamptz not null default now()
);

create table public.chat_mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.chat_conversas(id) on delete cascade,
  remetente_id uuid not null references public.perfis(id),
  texto text,
  tipo_conteudo text not null default 'texto',
  arquivo_url text,
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);
create index idx_chat_mensagens_conversa on public.chat_mensagens(conversa_id);

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- 4. TRIGGER DE NOVOS USUÁRIOS
create or replace function public.lidar_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estudio_id uuid;
  v_nome_estudio text;
  v_nome_pessoa text;
begin
  v_nome_estudio := coalesce(new.raw_user_meta_data->>'nome_estudio', 'Meu Estúdio');
  v_nome_pessoa := coalesce(new.raw_user_meta_data->>'nome', v_nome_estudio);

  insert into public.estudios (nome, slug)
  values (
    v_nome_estudio,
    lower(regexp_replace(v_nome_estudio, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8)
  )
  returning id into v_estudio_id;

  insert into public.perfis (id, estudio_id, nome, email, telefone, papel)
  values (
    new.id,
    v_estudio_id,
    v_nome_pessoa,
    new.email,
    new.raw_user_meta_data->>'telefone',
    'admin'
  );

  -- Popula automaticamente os 11 serviços padrão para o novo estúdio
  insert into public.servicos (estudio_id, nome, preco, duracao_minutos, descricao) values
    (v_estudio_id, 'Tatuagem Pequena (até 5cm)', 150.00, 45, 'Traços finos, escritas simples ou símbolos pequenos.'),
    (v_estudio_id, 'Tatuagem Média (5 a 15cm)', 350.00, 90, 'Desenhos com sombreamento leve ou cores básicas.'),
    (v_estudio_id, 'Tatuagem Grande (acima de 15cm)', 800.00, 180, 'Projetos detalhados, fechamentos parciais.'),
    (v_estudio_id, 'Sessão Fechamento (Braço/Perna)', 1200.00, 240, 'Sessão de dia inteiro para projetos grandes.'),
    (v_estudio_id, 'Reforma / Cover-Up', 450.00, 120, 'Cobertura ou restauração de tatuagens antigas.'),
    (v_estudio_id, 'Piercing Básico', 80.00, 30, 'Aplicação com jóia básica em titânio ou aço cirúrgico.'),
    (v_estudio_id, 'Piercing Avançado / Microdermal', 150.00, 45, 'Aplicações especiais, superfície ou microdermal.'),
    (v_estudio_id, 'Corte de Cabelo Masculino', 50.00, 30, 'Corte tradicional ou degradê na tesoura/máquina.'),
    (v_estudio_id, 'Barba Completa com Toalha Quente', 45.00, 30, 'Modelagem de barba com alinhamento e hidratação.'),
    (v_estudio_id, 'Combo Cabelo + Barba', 85.00, 60, 'Serviço completo de barbearia com desconto.'),
    (v_estudio_id, 'Avaliação / Orçamento Presencial', 0.00, 20, 'Consulta prévia para análise de projeto ou cover-up.');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.lidar_novo_usuario();

-- 5. RPCs PÚBLICAS
create or replace function public.criar_agendamento_publico(
  p_estudio_id uuid,
  p_cliente_nome text,
  p_cliente_email text,
  p_cliente_telefone text,
  p_data_hora_inicio timestamptz,
  p_locais text[],
  p_mais_de_uma_tattoo boolean default false,
  p_imagens text[] default '{}',
  p_profissional_id uuid default null,
  p_servico_id uuid default null,
  p_servico_nome text default 'Tatuagem Personalizada',
  p_duracao_minutos integer default 60,
  p_metodo_pagamento metodo_pagamento_tipo default 'a_combinar',
  p_canal_confirmacao canal_confirmacao default 'sistema',
  p_observacoes text default null
)
returns public.agendamentos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agendamento public.agendamentos;
  v_cliente_id uuid;
  v_data date := (p_data_hora_inicio at time zone 'utc')::date;
  v_horario time := (p_data_hora_inicio at time zone 'utc')::time;
  v_local text;
begin
  if p_estudio_id is null then
    raise exception 'estudio_id é obrigatório';
  end if;

  if exists (
    select 1 from public.agendamentos
    where estudio_id = p_estudio_id
      and data_agendamento = v_data
      and horario_agendamento = v_horario
      and status <> 'cancelado'
  ) then
    raise exception 'HORARIO_INDISPONIVEL: este horário já foi reservado para este estúdio';
  end if;

  insert into public.clientes (estudio_id, nome, email, telefone, total_agendamentos)
  values (p_estudio_id, p_cliente_nome, lower(trim(coalesce(p_cliente_email, ''))), p_cliente_telefone, 1)
  on conflict (estudio_id, telefone) do update
    set total_agendamentos = public.clientes.total_agendamentos + 1,
        nome = excluded.nome
  returning id into v_cliente_id;

  insert into public.agendamentos (
    estudio_id, cliente_id, profissional_id, servico_id,
    cliente_nome, cliente_email, cliente_telefone,
    servico_nome, duracao_minutos, metodo_pagamento,
    data_agendamento, horario_agendamento, data_hora_inicio, data_hora_fim,
    mais_de_uma_tattoo, status, canal_confirmacao, observacoes, imagem_referencia_url, origem
  ) values (
    p_estudio_id, v_cliente_id, p_profissional_id, p_servico_id,
    p_cliente_nome, lower(trim(coalesce(p_cliente_email, ''))), p_cliente_telefone,
    p_servico_nome, p_duracao_minutos, p_metodo_pagamento,
    v_data, v_horario, p_data_hora_inicio,
    p_data_hora_inicio + (p_duracao_minutos || ' minutes')::interval,
    coalesce(p_mais_de_uma_tattoo, false), 'pendente', coalesce(p_canal_confirmacao, 'sistema'),
    p_observacoes,
    coalesce(
      case when p_imagens is not null and array_length(p_imagens, 1) > 0 then p_imagens[1] else null end,
      (regexp_matches(coalesce(p_observacoes, ''), 'https?://[^\s,]+', 'i'))[1]
    ),
    'site'
  ) returning * into v_agendamento;

  foreach v_local in array coalesce(p_locais, '{}')
  loop
    insert into public.agendamento_locais (agendamento_id, descricao_customizada)
    values (v_agendamento.id, v_local);
  end loop;

  if p_imagens is not null and array_length(p_imagens, 1) > 0 then
    insert into public.agendamento_referencias (agendamento_id, url, ordem)
    select v_agendamento.id, url, ord - 1
    from unnest(p_imagens) with ordinality as t(url, ord);
  elsif v_agendamento.imagem_referencia_url is not null then
    insert into public.agendamento_referencias (agendamento_id, url, ordem)
    values (v_agendamento.id, v_agendamento.imagem_referencia_url, 0);
  end if;

  return v_agendamento;
end;
$$;

grant execute on function public.criar_agendamento_publico(
  uuid, text, text, text, timestamptz, text[], boolean, text[],
  uuid, uuid, text, integer, metodo_pagamento_tipo, canal_confirmacao, text
) to anon, authenticated;

create or replace function public.buscar_estudio_id_por_slug(p_slug text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.estudios where slug = p_slug and ativo = true limit 1;
$$;

grant execute on function public.buscar_estudio_id_por_slug(text) to anon, authenticated;

create or replace function public.buscar_horarios_ocupados(p_estudio_id uuid, p_data date)
returns setof time
language sql
stable
security definer
set search_path = public
as $$
  select horario_agendamento
  from public.agendamentos
  where estudio_id = p_estudio_id
    and data_agendamento = p_data
    and status <> 'cancelado';
$$;

grant execute on function public.buscar_horarios_ocupados(uuid, date) to anon, authenticated;

-- 5.3. FUNÇÃO RPC PARA CRIAR AGENDAMENTO PÚBLICO PELO SITE
create or replace function public.criar_agendamento_publico(
  p_estudio_id uuid,
  p_cliente_nome text,
  p_cliente_email text,
  p_cliente_telefone text,
  p_data_hora_inicio timestamptz,
  p_locais text[] default '{}',
  p_mais_de_uma_tattoo boolean default false,
  p_imagens text[] default '{}',
  p_observacoes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_id uuid;
  v_agendamento_id uuid;
  v_data_agendamento date;
  v_horario_agendamento time;
  v_data_hora_fim timestamptz;
  v_primeira_imagem text := null;
  v_img text;
  v_ordem int := 0;
  v_local_nome text;
  v_local_id int;
begin
  -- 1. Extrair data e horário
  v_data_agendamento := (p_data_hora_inicio at time zone 'UTC')::date;
  v_horario_agendamento := (p_data_hora_inicio at time zone 'UTC')::time;
  v_data_hora_fim := p_data_hora_inicio + interval '1 hour';

  -- 2. Verificar se horário já está ocupado
  if exists (
    select 1 from public.agendamentos
    where estudio_id = p_estudio_id
      and data_agendamento = v_data_agendamento
      and horario_agendamento = v_horario_agendamento
      and status <> 'cancelado'
  ) then
    raise exception 'HORARIO_INDISPONIVEL';
  end if;

  -- 3. Obter ou Criar Cliente pelo Telefone
  select id into v_cliente_id
  from public.clientes
  where estudio_id = p_estudio_id and telefone = p_cliente_telefone
  limit 1;

  if v_cliente_id is null then
    insert into public.clientes (estudio_id, nome, email, telefone, total_agendamentos)
    values (p_estudio_id, p_cliente_nome, p_cliente_email, p_cliente_telefone, 1)
    returning id into v_cliente_id;
  else
    update public.clientes
    set total_agendamentos = total_agendamentos + 1,
        nome = coalesce(nullif(p_cliente_nome, ''), nome),
        email = coalesce(nullif(p_cliente_email, ''), email)
    where id = v_cliente_id;
  end if;

  -- 4. Definir primeira imagem principal (se houver)
  if array_length(p_imagens, 1) > 0 then
    v_primeira_imagem := p_imagens[1];
  end if;

  -- 5. Inserir Agendamento
  insert into public.agendamentos (
    estudio_id,
    cliente_id,
    cliente_nome,
    cliente_email,
    cliente_telefone,
    data_agendamento,
    horario_agendamento,
    data_hora_inicio,
    data_hora_fim,
    mais_de_uma_tattoo,
    status,
    canal_confirmacao,
    observacoes,
    imagem_referencia_url,
    origem
  ) values (
    p_estudio_id,
    v_cliente_id,
    p_cliente_nome,
    p_cliente_email,
    p_cliente_telefone,
    v_data_agendamento,
    v_horario_agendamento,
    p_data_hora_inicio,
    v_data_hora_fim,
    p_mais_de_uma_tattoo,
    'pendente',
    'sistema',
    p_observacoes,
    v_primeira_imagem,
    'site'
  )
  returning id into v_agendamento_id;

  -- 6. Inserir Imagens de Referência em public.agendamento_referencias
  if array_length(p_imagens, 1) > 0 then
    foreach v_img in array p_imagens loop
      if v_img is not null and trim(v_img) <> '' then
        v_ordem := v_ordem + 1;
        insert into public.agendamento_referencias (agendamento_id, url, ordem)
        values (v_agendamento_id, trim(v_img), v_ordem);
      end if;
    end loop;
  end if;

  -- 7. Inserir Locais do Corpo em public.agendamento_locais
  if array_length(p_locais, 1) > 0 then
    foreach v_local_nome in array p_locais loop
      select id into v_local_id
      from public.locais_corpo
      where nome = v_local_nome limit 1;

      insert into public.agendamento_locais (agendamento_id, local_id, descricao_customizada)
      values (v_agendamento_id, v_local_id, v_local_nome);
    end loop;
  end if;

  return v_agendamento_id;
end;
$$;

grant execute on function public.criar_agendamento_publico(uuid, text, text, text, timestamptz, text[], boolean, text[], text) to anon, authenticated;

-- STORAGE BUCKET 'referencias' PERMISSÕES
insert into storage.buckets (id, name, public)
values ('referencias', 'referencias', true)
on conflict (id) do update set public = true;

create policy "Permitir upload público para referencias"
on storage.objects for insert
with check (bucket_id = 'referencias');

create policy "Permitir leitura pública das referencias"
on storage.objects for select
using (bucket_id = 'referencias');

-- 6. TRIGGER FINANCEIRO AUTOMÁTICO
create or replace function public.gerar_transacao_ao_concluir()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'concluido' and old.status is distinct from 'concluido' and new.valor_cobrado is not null then
    insert into public.transacoes_financeiras (estudio_id, agendamento_id, tipo, categoria, descricao, valor, data)
    values (new.estudio_id, new.id, 'entrada', 'Serviço', new.observacoes, new.valor_cobrado, now());

    if new.cliente_id is not null then
      update public.clientes
        set total_investido = total_investido + new.valor_cobrado
        where id = new.cliente_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_agendamento_concluido
  after update on public.agendamentos
  for each row execute function public.gerar_transacao_ao_concluir();

-- 7. ROW LEVEL SECURITY (RLS)
create or replace function public.estudio_atual()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select estudio_id from public.perfis where id = auth.uid();
$$;

alter table public.estudios enable row level security;
alter table public.servicos enable row level security;
alter table public.locais_corpo enable row level security;
alter table public.horarios_disponiveis enable row level security;
alter table public.clientes enable row level security;
alter table public.agendamentos enable row level security;
alter table public.agendamento_locais enable row level security;
alter table public.agendamento_referencias enable row level security;
alter table public.perfis enable row level security;
alter table public.estoque_itens enable row level security;
alter table public.transacoes_financeiras enable row level security;
alter table public.anotacoes enable row level security;
alter table public.notificacoes enable row level security;
alter table public.chat_conversas enable row level security;
alter table public.chat_mensagens enable row level security;

create policy "estudios_leitura_publica" on public.estudios for select using (true);
create policy "servicos_leitura_publica" on public.servicos for select using (ativo = true);
create policy "locais_corpo_leitura_publica" on public.locais_corpo for select using (true);
create policy "horarios_leitura_publica" on public.horarios_disponiveis for select using (ativo = true);

create policy "estudios_gestao_own" on public.estudios
  for update using (id = public.estudio_atual()) with check (id = public.estudio_atual());

create policy "servicos_gestao_own" on public.servicos
  for all using (estudio_id = public.estudio_atual()) with check (estudio_id = public.estudio_atual());

create policy "clientes_gestao_own" on public.clientes
  for all using (estudio_id = public.estudio_atual()) with check (estudio_id = public.estudio_atual());

create policy "agendamentos_gestao_own" on public.agendamentos
  for all using (estudio_id = public.estudio_atual()) with check (estudio_id = public.estudio_atual());

create policy "perfis_gestao_own" on public.perfis
  for all using (id = auth.uid() or estudio_id = public.estudio_atual()) with check (id = auth.uid() or estudio_id = public.estudio_atual());

create policy "estoque_gestao_own" on public.estoque_itens
  for all using (estudio_id = public.estudio_atual()) with check (estudio_id = public.estudio_atual());

create policy "financeiro_gestao_own" on public.transacoes_financeiras
  for all using (estudio_id = public.estudio_atual()) with check (estudio_id = public.estudio_atual());

create policy "anotacoes_gestao_own" on public.anotacoes
  for all using (estudio_id = public.estudio_atual()) with check (estudio_id = public.estudio_atual());

create policy "notificacoes_gestao_own" on public.notificacoes
  for all using (estudio_id = public.estudio_atual()) with check (estudio_id = public.estudio_atual());

create policy "chat_conversas_gestao_own" on public.chat_conversas
  for all using (estudio_id = public.estudio_atual()) with check (estudio_id = public.estudio_atual());

create policy "chat_mensagens_gestao_own" on public.chat_mensagens
  for all using (conversa_id in (select id from public.chat_conversas where estudio_id = public.estudio_atual()));

create policy "agendamento_referencias_gestao_all" on public.agendamento_referencias
  for all using (true) with check (true);

create policy "agendamento_locais_gestao_all" on public.agendamento_locais
  for all using (true) with check (true);

-- 8. PUBLICAÇÕES REALTIME
alter publication supabase_realtime add table public.agendamentos;
alter publication supabase_realtime add table public.notificacoes;
alter publication supabase_realtime add table public.chat_mensagens;
alter publication supabase_realtime add table public.estoque_itens;
alter publication supabase_realtime add table public.anotacoes;
alter publication supabase_realtime add table public.perfis;
alter publication supabase_realtime add table public.clientes;
alter publication supabase_realtime add table public.transacoes_financeiras;

-- 9. DADOS INICIAIS (SEED)
insert into public.locais_corpo (nome) values
  ('Braço'), ('Perna'), ('Costas'), ('Peito'), ('Pescoço'), ('Outro');
