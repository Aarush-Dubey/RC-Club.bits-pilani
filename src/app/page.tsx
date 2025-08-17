
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
    <div className="flex flex-col min-h-screen bg-white text-black">
      <PublicHeader />

      <main className="flex-grow">
        <section className="bg-white text-black py-20 md:py-32">
          <div className="container px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
              BITS Pilani RC Club
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-neutral-600">
              Building autonomous aircraft, pushing boundaries, and training the next generation of aerospace innovators.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" variant="default" className="bg-black text-white hover:bg-neutral-800 rounded-none">
                <Link href="#our-work">Explore Our Work</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="our-work" className="bg-brutalist-secondary-light py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Our Work</h2>
              <p className="mx-auto mt-2 max-w-xl text-neutral-600">
                A selection of our most innovative projects and competition entries.
              </p>
            </div>
            <div className="grid gap-px md:grid-cols-3 bg-brutalist-border-light border-y border-brutalist-border-light">
              {projects.map((project) => (
                  <div key={project.name} className="bg-brutalist-secondary-light group border-x border-brutalist-border-light">
                      <div className="relative overflow-hidden aspect-video">
                           <Image
                              src={project.image}
                              alt={project.name}
                              data-ai-hint={project.hint}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-none"
                          />
                      </div>
                      <div className="p-6">
                          <h3 className="text-xl font-medium">{project.name}</h3>
                      </div>
                  </div>
              ))}
            </div>
          </div>
        </section>

        <section id="why-join" className="bg-white py-16 md:py-24">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">What You'll Gain</h2>
                     <p className="mx-auto mt-2 max-w-xl text-neutral-600">
                       Joining the RC Club is more than a hobby—it's a launchpad for your career.
                    </p>
                </div>
                 <div className="grid gap-px md:grid-cols-3 bg-brutalist-border-light border border-brutalist-border-light">
                    {benefits.map((benefit) => (
                        <div key={benefit.title} className="bg-white p-6 border-brutalist-border-light">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-brutalist-secondary-light p-3 border border-brutalist-border-light">
                                    <benefit.icon className="size-6 text-black" />
                                </div>
                                <h3 className="text-xl font-medium">{benefit.title}</h3>
                            </div>
                            <p className="text-neutral-600">
                                {benefit.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <section className="py-16 md:py-24 bg-brutalist-secondary-light border-y border-brutalist-border-light">
          <div className="container px-4 md:px-6 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">About Us</h2>
              <p className="text-neutral-600">
                Founded in 2008, the BITS Pilani RC Club is a community of passionate enthusiasts dedicated to
                aerospace engineering. We provide the tools, space, and support for members to bring their most ambitious
                projects to life, consistently achieving top ranks in national and international competitions.
              </p>
              <Button asChild size="lg" variant="default" className="bg-black text-white hover:bg-neutral-800 rounded-none">
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
                className="w-full border border-brutalist-border-light"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="container px-4 md:px-6 py-6 text-center text-neutral-500 text-sm border-t border-brutalist-border-light">
          <p>&copy; {new Date().getFullYear()} RC-Club. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
