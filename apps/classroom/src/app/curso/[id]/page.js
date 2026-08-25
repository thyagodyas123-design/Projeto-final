import { notFound } from 'next/navigation';
import { getCourse } from '@plataforma/shared';
import ClassroomClient from './classroom-client.js';
import '../../classroom.css';

export const metadata = {
  title: 'Cursando Flow — Sala de Aula',
};

export default async function CoursePage({ params }) {
  const course = getCourse(params?.id);
  if (!course) notFound();
  return <ClassroomClient course={course} courseId={params.id} />;
}