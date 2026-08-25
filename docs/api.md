# Contratos de API

As APIs são acessadas diretamente pelas portas abaixo ou pelo Gateway usando `/api/{serviço}`.

> **Erros**: os serviços usam NestJS, então respostas de erro seguem o formato `{ message, error, statusCode }` (ex.: `400`, `401`, `404`). Exceções: o Gateway responde `{ error }` para rotas desconhecidas e `{ error: "serviço indisponível" }` para serviços fora do ar.

## Auth — `4001`

| Método | Rota | Corpo | Resultado |
|---|---|---|---|
| GET | `/health` | — | status do serviço |
| POST | `/auth/register` | `{ email, password }` | cria aluno e define `access_token` HttpOnly |
| POST | `/auth/login` | `{ email, password }` | autentica e define cookie |

Via Gateway, use `/api/auth/register` e `/api/auth/login`.

## Catalog — `4003`

| Método | Rota | Query |
|---|---|---|
| GET | `/health` | — |
| GET | `/courses` | `search`, `category` opcionais |
| GET | `/courses/:id` | — |

Resposta de curso inclui `id`, `title`, `description`, `category`, `instructor`, `color`, `longDescription` e `lessons[]`. Cada aula inclui `id`, `title`, `duration`, `order` e `videoUrl`.

## Progress — `4004`

| Método | Rota | Corpo/query |
|---|---|---|
| GET | `/health` | — |
| POST | `/enrollments` | `{ userId, courseId }` |
| GET | `/enrollments/:userId/:courseId` | `totalLessons` opcional |
| PATCH | `/enrollments/:userId/:courseId/lessons/:lessonId` | `{ completed, totalLessons }` |

O PATCH retorna matrícula, `completedLessonIds`, `progressPercent` e `certificate` quando o percentual chega a 100.

## Files — `4005`

| Método | Rota | Corpo |
|---|---|---|
| GET | `/health` | — |
| POST | `/files` | `{ filename, mimeType, contentBase64 }` |
| GET | `/files/:id` | — |

Formatos permitidos: PDF, DOC, DOCX, JPG e PNG. Limite: 50 MB. O endpoint atual usa JSON/base64 para simplificar o desenvolvimento local.

## Admin — `4002`

| Método | Rota | Corpo/query |
|---|---|---|
| GET | `/health` | — |
| POST | `/removal-requests` | `{ courseId, requestedBy, actorRole: "teacher" }` |
| GET | `/removal-requests` | `status` opcional |
| PATCH | `/removal-requests/:id` | `{ actorRole: "admin", status, reason? }` |

`status` deve ser `approved` ou `rejected`. Rejeições precisam de `reason`.

## Gateway — `4000`

O Gateway remove `/api/{serviço}` e encaminha o restante para o serviço. Exemplos:

```text
/api/catalog/courses       → catalog:4003/courses
/api/progress/enrollments  → progress:4004/enrollments
/api/files/files/:id       → files:4005/files/:id
/api/auth/register         → auth:4001/auth/register
```
