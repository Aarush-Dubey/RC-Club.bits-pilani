
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Users, Wrench } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';

const projects = [
  {
    name: 'Autonomous Fixed-Wing UAV (2024)',
    image: 'https://placehold.co/600x400.png',
    hint: 'autonomous drone',
  },
  {
    name: 'VTOL Prototype',
    image: 'https://placehold.co/600x400.png',
    hint: 'vtol aircraft',
  },
  {
    name: 'SAE Aero Design 2023',
    image: 'https://placehold.co/600x400.png',
    hint: 'model airplane competition',
  },
];

const benefits = [
    {
        icon: Rocket,
        title: "Hands-On Experience",
        description: "Gain practical skills by designing, building, and testing advanced UAVs from the ground up."
    },
    {
        icon: Users,
        title: "Expert Mentorship",
        description: "Learn from senior members and faculty advisors with deep aerospace and robotics knowledge."
    },
    {
        icon: Wrench,
        title: "Cutting-Edge Resources",
        description: "Access state-of-the-art labs, workshops, and a comprehensive inventory of RC components."
    }
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-display font-bold tracking-tighter">
            BITS Pilani RC Club
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
            Building autonomous aircraft, pushing boundaries, and training the next generation of aerospace innovators.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="#our-work">
              <Button size="lg">Explore Our Work</Button>
            </Link>
          </div>
        </section>

        <section id="our-work" className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-h2 font-bold">Our Work</h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              A selection of our most innovative projects and competition entries.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {projects.map((project) => (
                <div key={project.name} className="border bg-secondary group">
                    <div className="relative overflow-hidden aspect-video">
                         <Image
                            src={project.image}
                            alt={project.name}
                            data-ai-hint={project.hint}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                    <div className="p-4">
                        <h3 className="text-h3 font-medium">{project.name}</h3>
                    </div>
                </div>
            ))}
          </div>
        </section>

        <section id="why-join" className="bg-secondary py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-h2 font-bold">What You'll Gain</h2>
                     <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
                       Joining the RC Club is more than a hobby—it's a launchpad for your career.
                    </p>
                </div>
                 <div className="mt-12 grid gap-8 md:grid-cols-3">
                    {benefits.map((benefit) => (
                        <Card key={benefit.title} className="bg-background">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                <benefit.icon className="size-6 text-primary" />
                                <span>{benefit.title}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    {benefit.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-h2 font-bold">About Us</h2>
              <p className="text-muted-foreground">
                Founded in 2008, the BITS Pilani RC Club is a community of passionate enthusiasts dedicated to
                aerospace engineering. We provide the tools, space, and support for members to bring their most ambitious
                projects to life, consistently achieving top ranks in national and international competitions.
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
