# Arquitetura

Diagramas também estão disponíveis separadamente em [`diagrama-arquitetura.mmd`](diagrama-arquitetura.mmd) e [`diagrama-fluxo-aluno.mmd`](diagrama-fluxo-aluno.mmd).

## Visão geral

O sistema usa um monorepo pnpm/Turborepo, oito aplicações executadas localmente pelo Docker Compose e pacotes compartilhados. Cada domínio backend possui seu processo e seu banco SQLite; o Gateway é a entrada única das APIs.

```mermaid
flowchart LR
  Browser["Navegador"] --> Storefront["Storefront :3000"]
  Storefront -->|"/curso/* proxy interno"| Classroom["Classroom :3004"]
  Storefront --> Gateway["API Gateway :4000"]
  Classroom --> Gateway
  Gateway --> Auth["Auth :4001"]
  Gateway --> Admin["Admin :4002"]
  Gateway --> Catalog["Catalog :4003"]
  Gateway --> Progress["Progress :4004"]
  Gateway --> Files["Files :4005"]
  Auth --> AuthDB[("auth.sqlite")]
  Admin --> AdminDB[("admin.sqlite")]
  Catalog --> CatalogDB[("catalog.sqlite")]
  Progress --> ProgressDB[("progress.sqlite")]
  Files --> FilesDB[("files.sqlite")]
  Files --> FilesVolume[("files-data")]
```

## Fluxo do catálogo e da sala

```mermaid
sequenceDiagram
  participant U as Usuário
  participant S as Storefront
  participant G as Gateway
  participant C as Catalog
  participant R as Classroom
  participant P as Progress

  U->>S: GET /
  S-->>U: HTML + busca/filtros
  U->>S: GET /curso/:id
  S->>R: proxy interno
  R->>G: GET /api/catalog/courses/:id
  G->>C: GET /courses/:id
  C-->>G: curso + aulas
  R->>G: POST /api/progress/enrollments
  G->>P: POST /enrollments
  R->>G: GET progresso
  G->>P: GET matrícula/progresso
  R-->>U: sala de aula
  U->>R: marca aula
  R->>G: PATCH progresso
  G->>P: PATCH aula
  P-->>R: percentual/certificado
```

## Domínios e persistência

| Serviço | Responsabilidade | Persistência |
|---|---|---|
| Auth | alunos, credenciais, JWT e convites | `auth-data` |
| Admin | solicitações de remoção | `admin-data` |
| Catalog | cursos, aulas e seed | `catalog-data` |
| Progress | matrículas, progresso e certificados | `progress-data` |
| Files | metadados e arquivos | `files-db` + `files-data` |
| Gateway | roteamento HTTP | nenhuma |

Os backends são implementados em **NestJS + TypeScript** (compilados via `tsc` para `dist/`, com o binário SQLite do container para persistência) e os frontends em **Next.js 14 (App Router)**. O Gateway usa o adaptador Express com `bodyParser: false` para encaminhar o corpo bruto (streaming) aos serviços.

## Regras de publicação

1. Professor solicita remoção de um curso.
2. Curso permanece publicado enquanto a solicitação estiver pendente.
3. Administrador aprova ou rejeita.
4. Rejeição exige motivo.
5. Aprovação remove o curso da vitrine e encerra novos acessos.
6. Certificados emitidos permanecem preservados.
