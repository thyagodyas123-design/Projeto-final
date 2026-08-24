Este documento detalha as interações esperadas entre o Ator Principal (Estudante) e o Sistema, separando as ações por zona/microsserviço correspondente.

### Atores
- **Estudante (Aluno):** Usuário final da plataforma, identificado por um ID genérico fixo/mockado (`userId: "user-123"`).

### Casos de Uso - Zone: Storefront & API Catalog

#### UC01: Visualizar Catálogo de Cursos

- **Ator:** Estudante
- **Descrição:** O estudante acessa a página inicial (`/`) e visualiza todos os cursos disponíveis na plataforma.
- **Fluxo Principal:**
    1. O Estudante acessa a URL raiz da plataforma (Zone Storefront - porta 3000).
    2. O frontend requisita a listagem de cursos para a API de Catálogo (`GET /courses`).
    3. A API de Catálogo consulta o banco de dados `catalog.sqlite` e retorna o array de cursos.
    4. O frontend renderiza os cursos em formato de _cards_, exibindo `thumbnail`, `title` e `description`.

#### UC02: Acessar Curso Específico

- **Ator:** Estudante
- **Descrição:** A partir do catálogo, o estudante escolhe um curso para acessar a sala de aula.
- **Fluxo Principal:
    1. O Estudante clica no botão "Acessar Curso" em um dos cards da vitrine.
    2. O Zone Storefront redireciona o usuário para a rota `/curso/:courseId`
    3. O Next.js (via proxy/rewrite configurado no host) redireciona a requisição para a Zone Classroom de forma transparente.

### Casos de Uso - Zone: Classroom & API Progress

#### UC03: Ingressar/Visualizar Sala de Aula

- **Ator:** Estudante
- **Descrição:** O estudante entra na sala de aula, acionando o registro de sua matrícula e o carregamento dos conteúdos e do seu progresso.
- **Fluxo Principal:**
    1. A Zone Classroom é carregada na rota `/curso/:courseId`.
    2. Paralelamente, o frontend faz duas chamadas:
        - `GET /courses/:courseId` (API Catalog) para buscar os detalhes do curso e a lista de aulas (`video_url`, `title`).
        - `POST /enrollments` com o corpo `{ userId: "user-123", courseId: ":courseId" }` (API Progress) para garantir que a matrícula existe ou criá-la.
        - `GET /enrollments/user-123/:courseId` (API Progress) para buscar a lista de `lessonIds` já concluídas.
    3. O frontend consolida os dados: cruza a lista de aulas do catálogo com os IDs de aulas concluídas do progresso.
    4. A interface é renderizada mostrando o player principal e a listagem lateral com os _checkboxes_ marcados ou desmarcados corretamente.
#### UC04: Marcar Aula como Concluída

- **Ator:** Estudante
- **Descrição:** O estudante marca (ou desmarca) o _checkbox_ de uma aula, registrando seu progresso.
- **Fluxo Principal:
    1. O Estudante clica no _checkbox_ ao lado de uma aula na listagem lateral.
    2. O frontend dispara uma requisição `PATCH /enrollments/user-123/:courseId/lessons/:lessonId` passando `{ completed: true }` (ou `false` se estiver desmarcando).
    3. A API Progress recebe a requisição, atualiza (ou cria) o registro em `LessonProgress` atrelado ao `Enrollment` do usuário.
    4. A API Progress retorna o status de sucesso.
    5. O frontend recalcula a barra de progresso total do curso e atualiza a interface (Feedback visual: _checkbox_ ativo e barra avançando).