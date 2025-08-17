
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToyBrick, Truck, HandCoins } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="bg-secondary">
            <CardHeader>
              <CardTitle className="text-h2">Help Us Build Our Homepage!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                We're redesigning the public face of our RC club's management platform. Below is a breakdown of the current (now previous) homepage content. We need your honest feedback, criticism, and suggestions to make it better.
              </p>
              
              <div className="space-y-4">
                <h3 className="text-h3 font-semibold">The Prompt:</h3>
                <div className="p-4 border bg-background font-mono text-sm space-y-2">
                    <p className="font-bold">"Please review the following homepage structure and provide suggestions. The goal is a professional, clean, and inviting page for new and existing members. What's missing? What's unclear? What would you change?"</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-h3 font-semibold">Current Homepage Structure (for critique):</h3>
                <div className="p-4 border bg-background font-mono text-sm space-y-4">
                  <div>
                    <p className="font-bold text-primary">[Section 1: Hero]</p>
                    <p>&gt; <span className="text-muted-foreground">Title: "The Ultimate Hub for Your RC Club"</span></p>
                    <p>&gt; <span className="text-muted-foreground">Subtitle: "Streamline project tracking, manage inventory, and handle finances with ease..."</span></p>
                    <p>&gt; <span className="text-muted-foreground">Buttons: "Join the Club", "Member Login"</span></p>
                  </div>
                  <div>
                    <p className="font-bold text-primary">[Section 2: What We Offer]</p>
                    <p>&gt; <span className="text-muted-foreground">Card 1: "Project Tracking"</span></p>
                    <p>&gt; <span className="text-muted-foreground">Card 2: "Inventory & Procurement"</span></p>
                    <p>&gt; <span className="text-muted-foreground">Card 3: "Automated Finance"</span></p>
                  </div>
                  <div>
                    <p className="font-bold text-primary">[Section 3: About the Club]</p>
                    <p>&gt; <span className="text-muted-foreground">Content: A brief description of the club and its community.</span></p>
                    <p>&gt; <span className="text-muted-foreground">Image: Placeholder image of a workshop.</span></p>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4">
                <p className="text-lg">What are your thoughts?</p>
              </div>

            </CardContent>
          </Card>
        </section>
      </main>

       <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm border-t">
          <p>&copy; {new Date().getFullYear()} RC-Club. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
