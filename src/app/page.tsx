
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ToyBrick, Truck, HandCoins } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-16 md:py-24">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-headline tracking-tighter mb-4 text-primary">
            The Ultimate Hub for Your RC Club
          </h2>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
            Streamline project tracking, manage inventory, and handle finances with ease. Everything your RC club needs, all in one place.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
                <Button size="lg">
                Join the Club
                </Button>
            </Link>
             <Link href="/login">
                <Button size="lg" variant="outline">
                Member Login
                </Button>
            </Link>
          </div>
        </section>

        <section className="bg-muted/50 py-16 md:py-24">
             <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                     <h3 className="text-3xl font-bold font-headline">What We Offer</h3>
                     <p className="text-muted-foreground mt-2">A platform built by hobbyists, for hobbyists.</p>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
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
        </section>

         <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                     <h3 className="text-3xl font-bold font-headline">About the Club</h3>
                     <p className="text-muted-foreground mt-4">
                        We are a passionate community of radio-control enthusiasts dedicated to building, flying, and racing. From high-speed FPV drones to custom-built rock crawlers and elegant gliders, our members are always pushing the boundaries of what's possible.
                     </p>
                     <p className="text-muted-foreground mt-4">
                        Our club provides the tools, space, and collaborative environment to bring your most ambitious RC projects to life. Whether you're a seasoned veteran or just getting started, you'll find a welcoming community ready to share knowledge and help you succeed.
                     </p>
                </div>
                <div>
                    <Image 
                        src="https://placehold.co/600x400.png"
                        data-ai-hint="drone workshop"
                        alt="A workshop with RC plane parts"
                        width={600}
                        height={400}
                        className="rounded-lg shadow-lg"
                    />
                </div>
            </div>
        </section>

      </main>

       <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm border-t">
          <p>&copy; {new Date().getFullYear()} RC Club Manager. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
