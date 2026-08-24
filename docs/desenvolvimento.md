# Desenvolvimento local

## Configuração

Copie `.env.example` para `.env` quando precisar substituir valores padrão. O Compose define os hosts internos dos serviços; a execução direta fora do Docker usa `localhost`.

```bash
pnpm install
pnpm test
pnpm run build
```

## Docker Compose

O Compose constrói uma imagem por serviço a partir do `Dockerfile`. O código é copiado para a imagem, evitando problemas de bind mount no Docker Desktop. Os bancos e uploads usam volumes nomeados.

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f gateway
docker compose down
```

## Dados locais

Volumes:

- `auth-data`: banco do Auth
- `admin-data`: solicitações administrativas
- `catalog-data`: banco e seed do Catálogo
- `progress-data`: matrículas e certificados
- `files-db`: metadados dos arquivos
- `files-data`: conteúdo dos arquivos

`docker compose down` preserva os volumes. Use `docker compose down -v` para reiniciar o estado.

## Testes

```bash
pnpm test
node --test tests/catalog-http.test.mjs
node --test tests/progress-http.test.mjs
docker compose config
```

Os testes HTTP usam portas efêmeras e bancos em memória. O smoke test Docker deve ser executado com os serviços ativos para cobrir DNS interno, volumes e Gateway.

## Limitações conhecidas

- A implementação atual usa Node HTTP nativo como fundação; o PRD original cita NestJS e Next.js como destino arquitetural.
- Auth ainda não possui refresh token persistente, convite HTTP, recuperação de senha e Google OAuth.
- O frontend Classroom usa fallback `localStorage` quando as APIs estão indisponíveis.
- Upload é recebido como base64 JSON; multipart/form-data é uma melhoria futura.
- Autorização entre serviços ainda usa dados de requisição e não valida JWT em todos os serviços.
- `depends_on` controla inicialização, mas não substitui readiness checks de produção.

## Fluxo recomendado de contribuição

1. Criar teste de comportamento.
2. Confirmar falha RED.
3. Implementar o menor comportamento necessário.
4. Executar testes específicos e a suíte completa.
5. Validar `pnpm run build` e Compose quando houver mudança de infraestrutura.
6. Atualizar esta documentação quando contratos ou portas mudarem.
