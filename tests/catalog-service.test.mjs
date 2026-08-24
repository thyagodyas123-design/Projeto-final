import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalogRepository, seedCatalog } from '../apps/catalog/src/catalog-repository.mjs';

test('seed cria três cursos com cinco aulas cada', async () => {
  const repository = createCatalogRepository(':memory:');
  await seedCatalog(repository);
  const result = await repository.listCourses();

  assert.equal(result.length, 3);
  assert.deepEqual(result.map((course) => course.lessons.length), [5, 5, 5]);
});

test('catálogo filtra por busca e categoria', async () => {
  const repository = createCatalogRepository(':memory:');
  await seedCatalog(repository);

  assert.equal((await repository.listCourses({ search: 'docker' })).length, 1);
  assert.equal((await repository.listCourses({ category: 'BACKEND' })).length, 1);
});

test('detalhe retorna aulas ordenadas', async () => {
  const repository = createCatalogRepository(':memory:');
  await seedCatalog(repository);
  const course = await repository.findCourse('nestjs-basico');

  assert.equal(course.lessons[0].order, 1);
  assert.equal(course.lessons[4].order, 5);
});
