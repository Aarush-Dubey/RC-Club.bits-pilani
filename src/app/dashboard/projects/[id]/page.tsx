
import { notFound } from "next/navigation";
import ProjectDetailsClient from "./project-details-client";

export default async function ProjectDetailsPage({ params }: { params: { id: string } }) {
    const { id } = params;

    if (!id) {
        notFound();
    }

    return <ProjectDetailsClient projectId={id} />;
}
