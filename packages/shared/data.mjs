export const courses = [
  {
    id: 'nestjs-basico',
    title: 'NestJS Básico',
    category: 'BACKEND',
    instructor: 'Dr. Silva',
    description:
      'Aprenda o básico da API construindo serviços escaláveis e modulares com TypeScript.',
    longDescription:
      'Domine os fundamentos do NestJS, um framework Node.js opinionado para construção de APIs robustas. Aprenda Controllers, Providers, Módulos, Guards, Interceptors e integração com banco de dados usando TypeORM.',
    lessons: [
      { id: 1, title: 'Introdução ao NestJS', duration: '12:45' },
      { id: 2, title: 'Criando o primeiro módulo', duration: '18:20' },
      { id: 3, title: 'Controllers e Rotas', duration: '22:15' },
      { id: 4, title: 'Providers e Injeção de Dep.', duration: '25:10' },
      { id: 5, title: 'Integração com TypeORM', duration: '31:05' },
    ],
    color: '#1e3a5f',
  },
  {
    id: 'nextjs-avancado',
    title: 'NextJS Avançado',
    category: 'FRONTEND',
    instructor: 'Ana Costa',
    description:
      'Crie MFE (Micro Frontends) com Next Zones. Explore arquiteturas complexas, otimização de performance e renderização híbrida para aplicações em larga escala.',
    longDescription:
      'Explore avançado desenvolvimento com Next.js, incluindo Micro Frontends, Server Components, Streaming, ISR, e padrões de arquitetura para aplicações enterprise.',
    lessons: [
      { id: 1, title: 'Arquitetura de Micro Frontends', duration: '15:30' },
      { id: 2, title: 'Server Components em produção', duration: '20:10' },
      { id: 3, title: 'Streaming e Suspense', duration: '18:45' },
      { id: 4, title: 'ISR e cache avançado', duration: '22:00' },
      { id: 5, title: 'Deploy e monitoramento', duration: '16:50' },
    ],
    color: '#2563eb',
  },
  {
    id: 'docker',
    title: 'Docker',
    category: 'DEVOPS',
    instructor: 'Carlos Lima',
    description:
      'Orquestração de containers. Domine imagens, volumes, networks e Docker Compose para ambientes de desenvolvimento e produção.',
    longDescription:
      'Do básico ao avançado: Dockerfile, multi-stage builds, Docker Compose, redes, volumes, health checks e orquestração com Docker Swarm.',
    lessons: [
      { id: 1, title: 'Fundamentos de Containers', duration: '14:20' },
      { id: 2, title: 'Dockerfile na prática', duration: '19:30' },
      { id: 3, title: 'Docker Compose', duration: '23:10' },
      { id: 4, title: 'Volumes e Networks', duration: '17:45' },
      { id: 5, title: 'Produção e Boas Práticas', duration: '21:15' },
    ],
    color: '#0891b2',
  },
];

export function getCourse(id) {
  return courses.find((c) => c.id === id);
}
