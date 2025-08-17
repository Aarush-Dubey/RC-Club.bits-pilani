
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
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-display font-bold tracking-tighter">
            The Ultimate Hub for Your RC Club
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Streamline project tracking, manage inventory with ease, and automate
            finances. All in one place.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Join the Club</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Member Login
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-h2 font-bold">What We Offer</h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              A suite of tools designed to make club management seamless.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ToyBrick /> Project Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Propose new projects, track progress with updates, and manage
                  team members from a centralized dashboard.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck /> Inventory & Procurement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Keep track of all club equipment, manage loan requests, and
                  streamline new procurement orders.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HandCoins /> Automated Finance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Handle reimbursement requests with automated approval flows
                  and gain financial insights with our AI-powered tools.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="bg-secondary py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-h2 font-bold">About the Club</h2>
              <p className="text-muted-foreground">
                We are a community of passionate RC enthusiasts dedicated to
                building, flying, and racing. Our club provides the tools,
                space, and support for members to bring their most ambitious
                projects to life.
              </p>
              <Button asChild>
                <Link href="/register">Become a Member</Link>
              </Button>
            </div>
            <div>
              <Image
                src="https://placehold.co/600x400.png"
                data-ai-hint="rc plane workshop"
                alt="RC Club Workshop"
                width={600}
                height={400}
                className="w-full"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm border-t">
          <p>&copy; {new Date().getFullYear()} RC-Club. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
