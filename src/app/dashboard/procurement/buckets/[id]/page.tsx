
import { notFound } from "next/navigation";
import BucketDetailsClient from "./bucket-details-client";

export default async function BucketDetailsPage({ params }: { params: { id: string } }) {
    const { id } = params;
    
    if (!id) {
        notFound();
    }

    return <BucketDetailsClient bucketId={id} />;
}
