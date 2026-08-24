# Resumo do Projeto Projeto Final

## Estado Atual
- (última atualização: 2026-08-24)
- Frente visual + integração frontend↔backend implementada.
- Storefront (port 3000): catálogo com fetch `/api/catalog/courses`, fallback local, proxy interno para Classroom preservando URL.
- Classroom (port 3004): fetch curso via API, matrícula, progresso via PATCH, certificado, fallback localStorage.
- 23 testes de integração/rotas passando; Docker build e compose config validados.

## Decisões Tomadas
- Arquitetura: Turborepo/pnpm, microsserviços Node.js puro (sem NestJS no MVP).
- Storefront na porta 3000 usa proxy interno para Classroom (preserva URL no browser).
- Classroom busca curso no Catálogo e progresso no Progresso via API Gateway.
- Fallback local amigável: dados do shared/data.mjs quando API indisponível.
- localStorage usado apenas como fallback offline, não como fonte primária.
- Usuário mockado como `user-123`; progresso usa referências lógicas para curso/aula.

## Próximos Passos
- Implementar autenticação real e proteção de rotas.
- Adicionar loading states mais elaborados (skeleton shimmer já implementado).
- Integrar "Meus Cursos" com filtragem por matrícula do usuário.
- Implementar upload de materiais via serviço de Arquivos.

## Contexto Técnico
- Documentos: PRD, Casos de Uso e SAD.
- Escopo funcional: catálogo, acesso ao curso, sala de aula, player, checklist de aulas e percentual persistido.
- Critérios principais: `pnpm dev`/Docker, seed de 3 cursos × 5 aulas, PATCH de progresso e URL preservada na porta 3000.

## Últimas Sessões
- 2026-08-24 — Leitura integral dos três documentos e das duas telas; identificadas divergências e lacunas de especificação.
- 2026-08-24 — Brainstorming iniciado: identidade A (institucional/limpa); MVP ampliado; autenticação completa com usuários seed; perfis aluno/professor/admin; professor gerencia cursos e aulas e publica diretamente; remoção de cursos exige aprovação do admin, permanecendo publicada até decisão; certificados a 100%; matrícula livre; busca e filtros por categoria; aulas com materiais via upload.
- 2026-08-24 — Refinamento: materiais em PDF/DOC/DOCX/JPG/PNG, limite de 50 MB, disco local e acesso para matriculados; admin tem acesso total aos cursos; cadastro público de alunos e professores por convite; login/logout, recuperação de senha e Google; categorias em lista fixa; remoções com indicador no painel.
- 2026-08-24 — Mais decisões: vídeos por links externos; conclusão manual por checkbox; curso removido encerra acesso, mas preserva certificados emitidos; SQLite separado por serviço; cinco microsserviços no MVP: Auth, Administração, Catálogo, Progresso e Arquivos.
- 2026-08-24 — Infra/auth: API Gateway como entrada única; sessão em cookie HttpOnly com renovação automática por refresh token seguro.
- 2026-08-24 — Infra adicional: recuperação por e-mail via Resend; contratos com OpenAPI/Swagger; testes unitários e testes automatizados de integração obrigatórios.
- 2026-08-24 — Deploy: Docker Compose será usado somente para desenvolvimento local inicialmente; produção será definida depois.
- 2026-08-24 — Implementação iniciada: fundação do monorepo criada com pnpm workspace, Turborepo, oito apps placeholder, runtime de health, volume local de arquivos e Docker Compose. Testes RED/GREEN e `docker compose config` passaram; subida real dos containers ainda não validada porque o Docker daemon não está ativo.
- 2026-08-24 — Docker validado: imagens construídas com sucesso, oito containers iniciaram e os endpoints `/health` responderam 200; containers foram desligados com `docker compose down`. Bind mount de código foi removido após erro ESM no Docker Desktop; somente volume de uploads permanece.
- 2026-08-24 — Fase Auth iniciada em TDD: políticas de cadastro, senha e convite; serviço em memória com hash `crypto.scrypt`, UUIDs, cadastro público de alunos e convite administrativo de professores. Suíte passou com 10 testes; endpoints, JWT, SQLite e NestJS ainda são próximos incrementos.
- 2026-08-24 — Auth conectado: SQLite via CLI (evita `better-sqlite3`/SIGSEGV), JWT com `jsonwebtoken`, cadastro/login HTTP e cookie HttpOnly. Testes locais passaram com 18 casos; fluxo de cadastro no container Docker retornou 201 e cookie válido. Ainda falta refresh token real, convite HTTP, Resend/Google OAuth e migração para NestJS.
- 2026-08-24 — Correção local concluída: Auth HTTP usa SQLite em arquivo com volume Docker `auth-data`; teste real confirmou cadastro `201` e login `200` após reiniciar o container. Suíte local passou com 20 testes.
- 2026-08-24 — Ambiente Docker Compose deixado ativo para uso local; oito containers subiram e todos os `/health` responderam 200. URLs principais: Storefront `http://localhost:3000`, Classroom `http://localhost:3004`, Gateway `http://localhost:4000`, Auth `http://localhost:4001`.
- 2026-08-24 — Frontend implementado: Storefront e Classroom com identidade visual A, catálogo, busca/filtros, curso, player placeholder e progresso local. Build passou; suíte final passou com 36 testes. Backend completo ainda não está finalizado: somente Auth possui lógica real; demais serviços/Gateway continuam health placeholders.
- 2026-08-24 — Serviço Catálogo implementado em TDD: SQLite persistente com seed de 3 cursos × 5 aulas, busca, filtro por categoria, detalhe com aulas ordenadas e endpoints GET `/courses`/`/courses/:id`. Volume `catalog-data` adicionado ao Compose. Testes locais e API Docker passaram.
- 2026-08-24 — Serviço Progresso implementado em TDD: SQLite persistente, matrícula idempotente, progresso manual, endpoints POST/GET/PATCH e certificado emitido a 100%. Volume `progress-data` adicionado. Testes locais e fluxo Docker passaram.
- 2026-08-24 — Serviço Arquivos implementado em TDD: upload/download HTTP via base64 local, metadados SQLite, conteúdo em volume, allowlist PDF/DOC/DOCX/JPG/PNG e limite de 50 MB. Volumes `files-data` e `files-db` configurados; 4 testes e fluxo Docker passaram.
- 2026-08-24 — Serviço Administração implementado em TDD: solicitações de remoção de cursos, listagem de pendências e aprovação/rejeição administrativa com motivo obrigatório na rejeição. SQLite/volume `admin-data`, 4 testes e fluxo Docker validados.
- 2026-08-24 — API Gateway implementada: roteamento `/api/{auth,admin,catalog,progress,files}`, propagação de headers/cookies/corpo, erros 404/502 e URLs internas no Compose. Testes de proxy passaram e integração Gateway→Catálogo no Docker foi validada.
- 2026-08-24 — Frontend integrado às APIs: Storefront consulta Catálogo via Gateway e usa proxy interno para Classroom mantendo porta 3000; Classroom sincroniza matrícula/progresso/certificado via API Progresso com fallback offline. Suíte passou com 65 testes, build passou e fluxo Docker completo foi validado.
- 2026-08-24 — Smoke test completo executado com Docker ativo: health dos 8 serviços, rotas HTML/404/redirect, catálogo direto e via Gateway, Auth direto e via Gateway, progresso, upload/download e fluxo de remoção Admin passaram com os status esperados. Ambiente permanece ativo.
- 2026-08-24 — Frente visual implementada: Storefront com catálogo de cards, busca/filtro por categoria, navegação para curso; Classroom com player placeholder, lista de aulas com checkboxes, barra de progresso e persistência via localStorage. Pacote `@plataforma/shared` criado para dados. Identidade visual A aplicada (Space Grotesk + DM Sans, azul #2563eb como acento). 16 testes de rotas/visual passando; Docker build e compose config validados.
- 2026-08-24 — Integração frontend↔backend: Storefront busca cursos de `/api/catalog/courses` com fallback local amigável; Classroom busca detalhes no Catálogo, cria matrícula via POST, busca progresso via GET e envia PATCH ao marcar/desmarcar aulas. Navegação corrigida: proxy interno preserva URL na porta 3000 (sem redirect). localStorage mantido apenas como fallback offline. Skeleton loading, toast de erro, barra de status online/offline, certificado a 100%. 23 testes passando; Docker build e compose config validados.
