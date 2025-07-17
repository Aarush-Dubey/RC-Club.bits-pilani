
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ToyBrick, Truck, HandCoins } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <Image src="/assets/logo.png" alt="RC Club Manager Logo" width={32} height={32} className="size-8" />
            <h1 className="text-xl font-bold tracking-tighter font-headline">
              RC Club Manager
            </h1>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Sign Up</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-grow flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-16 md:py-24">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-headline tracking-tighter mb-4">
            The Ultimate Hub for Your RC Club
          </h2>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
            Streamline project tracking, manage inventory, and handle finances with ease. Everything your RC club needs, all in one place.
          </p>
          <Link href="/login">
            <Button size="lg">
              Get Started
            </Button>
          </Link>

           <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <Card>
              <CardContent className="p-6">
                <ToyBrick className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-bold font-headline mb-2">Project Tracking</h3>
                <p className="text-muted-foreground text-sm">Propose and track RC projects, request resources, and share updates with your team.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Truck className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-bold font-headline mb-2">Inventory & Procurement</h3>
                <p className="text-muted-foreground text-sm">Manage equipment lending, process purchase requests, and keep track of all club assets.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <HandCoins className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-bold font-headline mb-2">Automated Finance</h3>
                <p className="text-muted-foreground text-sm">Handle reimbursement requests with automated workflows and gain financial insights with AI.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

       <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} RC Club Manager. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
