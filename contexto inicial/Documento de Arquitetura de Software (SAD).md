### 1. Visão Arquitetural

O sistema utiliza um padrão híbrido de Microsserviços para o backend e Micro-frontends (implementado via Next.js Multi-Zones) para o frontend. Todo o ciclo de vida do código é gerenciado através de um Monorepo (Workspace). A arquitetura prioriza o isolamento de domínios (Bounded Contexts) e a independência de deploy (simulada localmente em portas distintas).

### 2. Topologia e Fluxo de Rede
- **Porta 3000 (Host/Gateway Frontend):** Recebe o tráfego inicial do usuário. Serve a rota raiz (`/`) nativamente e atua como Proxy Reverso transparente para a rota `/curso/*`.
- **Porta 3004 (Zone Classroom):** Recebe tráfego roteado internamente pela porta 3000 (Rewrite).
- **Portas 3001 e 3002 (APIs):** Recebem requisições HTTP REST diretamente dos frontends.

### 3. Detalhamento dos Componentes

#### 3.1. Camada de Frontend (Next.js Multi-Zones)

- **Zone Storefront (App Host - 3000):**
    - **Stack:** Next.js.
    - **Função:** Ponto de entrada da aplicação. Orquestra as zonas via configuração de `rewrites` no `next.config.js`.
    - **Integração:** Consome a `api-catalog` para renderizar a listagem de cursos.
- **Zone Classroom (Sub-Zone - 3004):**
    - **Stack:** Next.js.
    - **Função:** Renderização isolada do ambiente de aprendizagem (Player de vídeo + Lista de aulas interativa).
    - **Integração:** Consome a `api-catalog` (dados de metadados das aulas) e a `api-progress` (estado de conclusão e barra de progresso).

#### 3.2. Camada de Backend (NestJS Microservices)

- **API Catalog (Serviço de Domínio Core - 3001):**
    - **Stack:** NestJS, TypeORM.
    - **Responsabilidade:** Fonte primária de verdade para o catálogo de cursos e aulas.
    - **Padrão:** Expõe endpoints RESTful. Não possui dependências externas ou de outras APIs.

- **API Progress (Serviço de Domínio de Engajamento - 3002):**
    - **Stack:** NestJS, TypeORM.
    - **Responsabilidade:** Registro de matrículas de usuários e rastreamento de conclusão individual de aulas.
    - **Padrão:** Relacionamento por referência lógica. Armazena apenas os IDs numéricos ou UUIDs de cursos e aulas provenientes do Catálogo, sem ligação física de banco.

### 4. Padrões de Comunicação

- **Frontend -> Frontend:** Roteamento via Proxy Reverso interno do Next.js. O navegador do usuário mantém o domínio e a porta 3000 intactos na URL, ignorando que a aplicação da porta 3004 está processando a requisição.
- **Frontend -> Backend:** Chamadas HTTP/REST padrão em formato JSON.
- **Backend -> Backend:** Inexistente por design. A agregação de dados entre os domínios de Catálogo e Progresso ocorre na camada de Frontend (Zone Classroom), evitando acoplamento síncrono e degradação de performance entre os microsserviços.

### 5. Arquitetura de Dados
Aplicação do padrão _Database per Service_ para garantir baixo acoplamento.
- **Database Catalog (`catalog.sqlite`):**
    - Isolado fisicamente.
    - Entidades mapeadas via TypeORM: `Course`, `Lesson`.
- **Database Progress (`progress.sqlite`):**
    - Isolado fisicamente.
    - Entidades mapeadas via TypeORM: `Enrollment`, `LessonProgress`.
    - **Integridade Referencial:** Não há chaves estrangeiras (Foreign Keys) físicas apontando para o banco de Catálogo. A integridade estrutural é mantida via referência lógica nos campos `courseId` e `lessonId`.

### 6. Decisões Arquiteturais Principais (ADRs)

1. **Monorepo:** Adotado para reduzir a complexidade de configuração de múltiplos repositórios e centralizar scripts de inicialização, linting e padronização, facilitando o trabalho em equipe dos estagiários.

2. **Next.js Multi-Zones:** Selecionado no lugar de Webpack Module Federation para maximizar o uso de funcionalidades nativas do Next.js (como SSR nativo e SEO simplificado) eliminando o overhead de configuração de injeção de componentes client-side.

3. **Bancos SQLite Locais:** Escolhidos para eliminar a necessidade de provisionamento de containers ou instâncias de bancos relacionais robustos (como PostgreSQL), permitindo que o ambiente inicie rapidamente com `synchronize: true` no TypeORM.

4. **Composição de Dados no Frontend (BFF Pattern adaptado):** A decisão de fazer o Zone Classroom consumir as duas APIs de forma independente e unir os dados no frontend (Client-side ou Server-side no Next.js) evita o acoplamento excessivo das APIs backend, mantendo-as estritamente focadas em seus domínios.