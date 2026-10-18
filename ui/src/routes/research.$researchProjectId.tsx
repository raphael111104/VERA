import { createFileRoute } from '@tanstack/react-router';
import { ResearchWorkspace } from '../features/research-workflow/ResearchWorkspace';
export const Route = createFileRoute('/research/$researchProjectId')({component: Page});
function Page() { const {researchProjectId} = Route.useParams(); return <ResearchWorkspace key={researchProjectId} id={researchProjectId}/>; }
