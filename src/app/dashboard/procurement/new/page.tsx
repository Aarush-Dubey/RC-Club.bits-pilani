
"use client";

import Link from "next/link";
import { NewItemRequestForm } from "../new-item-request-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewProcurementRequestPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
        <Link href="/dashboard/procurement" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Procurement
        </Link>
        <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">New Procurement Request</h2>
            <p className="text-muted-foreground mt-2">
              Submit a request for a new item that the club does not currently own. Once approved, you may purchase it for reimbursement.
            </p>
        </div>
        <NewItemRequestForm />
    </div>
  );
}

