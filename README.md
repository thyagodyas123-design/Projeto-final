# Fábrica de Gênios — Plataforma Educacional

Plataforma educacional modular com catálogo de cursos, sala de aula, progresso, certificados, materiais complementares e fluxo administrativo de remoção de cursos.

> As imagens em `telas/` e `contexto inicial/telas/` são referências de identidade visual. A identidade adotada é institucional e limpa, com azul, branco e cinza.

## Estado atual

- Storefront e Classroom funcionais.
- Auth funcional para cadastro/login local, JWT e cookie HttpOnly.
- Catálogo funcional com seed, busca e filtro.
- Progresso funcional com matrícula, conclusão e certificado.
- Arquivos funcionais com upload local em base64 e download protegido por serviço.
- Administração funcional para solicitações de remoção.
- Gateway funcional para roteamento entre serviços.
- Integrações Google OAuth, Resend, refresh token persistente e autorização completa ainda são etapas futuras.

## Requisitos

- Node.js 20+
- pnpm 9+
- Docker Desktop, para execução via Compose

## Executar localmente

```bash
pnpm install
pnpm test
pnpm run build
docker compose up -d --build
```

Aplicações:

| Aplicação | URL |
|---|---|
| Storefront | http://localhost:3000 |
| Classroom | http://localhost:3000/curso/nestjs-basico |
| API Gateway | http://localhost:4000/health |
| Auth | http://localhost:4001/health |
| Administração | http://localhost:4002/health |
| Catálogo | http://localhost:4003/health |
| Progresso | http://localhost:4004/health |
| Arquivos | http://localhost:4005/health |

Para encerrar:

```bash
docker compose down
```

Para remover também os dados locais:

```bash
docker compose down -v
```

## Scripts

```bash
pnpm dev        # executa os apps fora do Docker
pnpm test       # executa todos os testes Node
pnpm run build  # verifica a sintaxe/build de todos os workspaces
pnpm typecheck  # verifica os entrypoints atuais
```

## Estrutura

```text
apps/
  auth/        # identidade, cadastro, login e JWT
  admin/       # solicitações administrativas
  catalog/     # cursos, aulas, seed, busca e filtros
  progress/    # matrículas, progresso e certificados
  files/       # upload/download e metadados
  gateway/     # entrada única das APIs
  storefront/  # catálogo visual
  classroom/   # sala de aula visual
packages/
  runtime/     # servidor de health compartilhado
  shared/      # dados de referência do catálogo
tests/         # testes unitários, integração e rotas
docs/          # arquitetura, APIs e desenvolvimento
```

## Documentação

- [Arquitetura e diagramas](docs/arquitetura.md)
- [Contratos das APIs](docs/api.md)
- [Guia de desenvolvimento](docs/desenvolvimento.md)
- [Requisitos originais](contexto%20inicial/Documento%20de%20Requisitos%20do%20Produto%20(PRD).md)
- [Casos de uso](contexto%20inicial/Documento%20de%20Casos%20de%20Uso.md)

## Testes

A suíte cobre regras de autenticação, SQLite, catálogo, progresso, arquivos, administração, Gateway, Storefront e Classroom. O smoke test Docker deve verificar os endpoints `/health` e os fluxos principais entre serviços.

## Licença

Projeto educacional privado. Definir licença antes de distribuição pública.
