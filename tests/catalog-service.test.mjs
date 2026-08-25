import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const DIST = new URL('../apps/catalog/dist/catalog/catalog.repository.js', import.meta.url);
const BUILT = existsSync(DIST);

const t = (name, fn) =>
  BUILT
    ? test(name, fn)
    : test(name, { skip: 'catálogo não compilado — rode pnpm build primeiro' }, fn);

t('seed cria três cursos com cinco aulas cada', async () => {
  const { CatalogRepository } = await import(DIST.href);
  const repository = new CatalogRepository(':memory:');
  await repository.seed();
  const result = await repository.listCourses();

  assert.equal(result.length, 3);
  assert.deepEqual(result.map((course) => course.lessons.length), [5, 5, 5]);
});

t('catálogo filtra por busca e categoria', async () => {
  const { CatalogRepository } = await import(DIST.href);
  const repository = new CatalogRepository(':memory:');
  await repository.seed();

  assert.equal((await repository.listCourses({ search: 'docker' })).length, 1);
  assert.equal((await repository.listCourses({ category: 'BACKEND' })).length, 1);
});

t('detalhe retorna aulas ordenadas', async () => {
  const { CatalogRepository } = await import(DIST.href);
  const repository = new CatalogRepository(':memory:');
  await repository.seed();
  const course = await repository.findCourse('nestjs-basico');

  assert.equal(course.lessons[0].order, 1);
  assert.equal(course.lessons[4].order, 5);
});
