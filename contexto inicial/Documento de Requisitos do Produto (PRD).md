### 1. Visão Geral e Objetivos

Desenvolver uma plataforma educacional modular utilizando arquitetura de microsserviços (NestJS) e frontends independentes unificados via Next.js Multi-Zones. O projeto visa avaliar 3 estagiários full-stack, com prazo de entrega para quarta-feira, focando na capacidade de colaboração, separação de domínios e orquestração de monorepo.

### 2. Escopo e Funcionalidades Essenciais

- **Vitrine de Cursos:** Interface inicial (`/`) exibindo a lista de cursos disponíveis com título, descrição e imagem.
- **Sala de Aula:** Interface isolada (`/curso/:id`) contendo um player de vídeo principal e uma lista lateral de aulas do curso.
- **Gestão de Progresso:** Interação em tempo real onde o aluno marca aulas como concluídas via _checkbox_, refletindo no cálculo e exibição de uma barra de progresso.
- **Roteamento Transparente:** O usuário final acessa um único domínio, sendo roteado de forma transparente entre as aplicações frontend utilizando a funcionalidade de _rewrites_ (Multi-Zones) do Next.js.

### 3. Arquitetura e Especificações Técnicas

**Estrutura do Monorepo (Turborepo):**

```
/
├── apps/
│   ├── api-catalog/      (NestJS - Porta 3001)
│   ├── api-progress/     (NestJS - Porta 3002)
│   ├── zone-storefront/  (Next.js - Porta 3000 - Host)
│   └── zone-classroom/   (Next.js - Porta 3004)
├── package.json
└── docker-compose.yml
```

**Bancos de Dados:**

- **Tecnologia:** SQLite + TypeORM em ambas as APIs.
- **Configuração:** `synchronize: true` para ambiente de desenvolvimento. Bancos isolados (`catalog.sqlite` e `progress.sqlite`). É obrigatória a criação de um script de _seed_ executado na inicialização para popular cursos e aulas iniciais.

**Especificação das Aplicações:**

|**Aplicação**|**Tecnologias**|**Porta**|**Responsabilidade Principal e Integrações**|
|---|---|---|---|
|**API Catalog**|NestJS|3001|Gerencia as entidades `Course` e `Lesson`. Isolada e independente. É a fonte de verdade do conteúdo.|
|**API Progress**|NestJS|3002|Gerencia as entidades `Enrollment` e `LessonProgress`. Armazena o ID do curso e aula como referência lógica.|
|**Zone: Storefront**|Next.js|3000|Renderiza a página inicial. Consome a API Catalog. Configura o Multi-Zones (`next.config.js`) fazendo _rewrite_ da rota `/curso/:path*` para a porta 3004.|
|**Zone: Classroom**|Next.js|3004|Renderiza a sala de aula respondendo pela rota base `/curso/:id`. Consome a API Catalog para dados e a API Progress para controle de conclusão.|

### 4. Modelagem de Dados

**Domínio de Catálogo (api-catalog):**
- `Course`: `id` (UUID), `title` (String), `description` (Text), `thumbnail_url` (String).

- `Lesson`: `id` (UUID), `courseId` (UUID - Relação ManyToOne), `title` (String), `video_url` (String), `order` (Integer).

**Domínio de Progresso (api-progress):**
- `Enrollment`: `id` (UUID), `userId` (String - Fixo/Mockado no frontend), `courseId` (UUID - Referência externa).

- `LessonProgress`: `id` (UUID), `enrollmentId` (UUID - Relação ManyToOne), `lessonId` (UUID - Referência externa), `completed` (Boolean).

### 5. Contratos de API (Endpoints)

**API Catalog (3001):**

- `GET /courses`: Retorna `Course[]`.

- `GET /courses/:id`: Retorna os detalhes de um `Course` específico e a lista de `Lesson` ordenada por `order`.

**API Progress (3002):**

- `POST /enrollments`: Recebe `{ userId, courseId }`. Cria ou recupera a matrícula.

- `GET /enrollments/:userId/:courseId`: Retorna dados da matrícula e um array de IDs (`completedLessonIds: string[]`).

- `PATCH /enrollments/:userId/:courseId/lessons/:lessonId`: Recebe `{ completed: boolean }`. Atualiza o registro em `LessonProgress`.

### 6. Configuração Multi-Zones (Next.js)

O arquivo `next.config.js` da aplicação **Zone: Storefront (Porta 3000)** deve conter obrigatoriamente a seguinte configuração:


```
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/curso/:path*',
        destination: 'http://localhost:3004/curso/:path*',
      },
    ];
  },
};
module.exports = nextConfig;
```

### 7. Critérios de Aceite

1. **Execução em Comando Único:** O comando `pnpm dev` na raiz do monorepo e o `docker compose up` (caso utilizado) devem inicializar as 4 aplicações e os bancos de dados simultaneamente.

2. **Seed Automático:** A API Catalog deve iniciar com pelo menos 3 cursos populados, contendo 5 aulas cada, prontas para consumo.

3. **Progresso em Tempo Real:** A alteração do status de uma aula via _checkbox_ na sala de aula deve atualizar a barra de progresso visual imediatamente e persistir no banco de dados via requisição `PATCH`.

4. **Isolamento Multi-Zones:** A navegação de `/` para `/curso/:id` deve ocorrer mantendo a porta 3000 na barra de endereços do navegador, com o proxy reverso do Next.js funcionando corretamente.

### 8. Divisão de Tarefas Sugerida

- **DEV 1 (Frontend Core & Catálogo):**
    - Criação da API Catalog (NestJS + TypeORM + SQLite + Seed).
    - Criação da Zone Storefront (Next.js), consumo de API e configuração estrita do `rewrites` no `next.config.js`.

- **DEV 2 (Backend Core & Infra):**
    - Configuração do Workspace Monorepo e scripts unificados.
    - Criação da API Progress (NestJS + TypeORM + SQLite).

- **DEV 3 (Integração & Sala de Aula):**
    - Criação da Zone Classroom (Next.js).
    - Integração com API Catalog (para listagem de vídeos) e API Progress (lógica de checkboxes, persistência e cálculo da barra de progresso percentual).