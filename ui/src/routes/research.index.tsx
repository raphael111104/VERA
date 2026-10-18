import { createFileRoute } from '@tanstack/react-router';
import { ResearchProjectsPage } from '../features/research-workflow/ResearchProjectsPage';
export const Route = createFileRoute('/research/')({component: ResearchProjectsPage});
