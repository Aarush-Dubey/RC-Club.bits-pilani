/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProjectCard, type Project, type User } from '@/app/dashboard/projects/project-card';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { AppUser } from '@/context/auth-context';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockProject: Project = {
  id: 'proj-1',
  title: 'Test Project Title',
  description: 'This is a test project description.',
  status: 'active',
  leadId: 'user-1',
  memberIds: ['user-1', 'user-2'],
  createdAt: { toDate: () => new Date() } as any,
};

const mockUsers: User[] = [
  { id: 'user-1', name: 'Test Lead', email: 'lead@test.com' },
  { id: 'user-2', name: 'Test Member', email: 'member@test.com' },
];

const mockCurrentUser: AppUser = {
  uid: 'user-1',
  displayName: 'Test Lead',
  email: 'lead@test.com',
  permissions: { canCloseProjects: true },
} as AppUser;


describe('ProjectCard', () => {
  it('renders project title and description correctly', () => {
    render(
      <TooltipProvider>
        <ProjectCard project={mockProject} users={mockUsers} currentUser={mockCurrentUser} />
      </TooltipProvider>
    );

    // Check for the title
    expect(screen.getByText('Test Project Title')).toBeInTheDocument();

    // Check for the description
    expect(screen.getByText('This is a test project description.')).toBeInTheDocument();
  });

  it('displays the correct number of members and the project lead', () => {
    render(
      <TooltipProvider>
        <ProjectCard project={mockProject} users={mockUsers} currentUser={mockCurrentUser} />
      </TooltipProvider>
    );

    // Check for member count
    expect(screen.getByText('2 members')).toBeInTheDocument();

    // Check for project lead's name
    expect(screen.getByText('Test Lead')).toBeInTheDocument();
  });

  it('renders the "View Project" button', () => {
     render(
      <TooltipProvider>
        <ProjectCard project={mockProject} users={mockUsers} currentUser={mockCurrentUser} />
      </TooltipProvider>
    );

    // Check for the "View Project" button
    const viewButton = screen.getByRole('button', { name: /view project/i });
    expect(viewButton).toBeInTheDocument();
  });
    
  it('shows the close button for users with permission', () => {
    render(
      <TooltipProvider>
        <ProjectCard project={mockProject} users={mockUsers} currentUser={mockCurrentUser} />
      </TooltipProvider>
    );

    const closeButton = screen.getByRole('button', { name: /close project/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('does not show the close button for users without permission', () => {
    const nonAdminUser = { ...mockCurrentUser, permissions: { canCloseProjects: false } };
    render(
      <TooltipProvider>
        <ProjectCard project={mockProject} users={mockUsers} currentUser={nonAdminUser} />
      </TooltipProvider>
    );

    const closeButton = screen.queryByRole('button', { name: /close project/i });
    expect(closeButton).not.toBeInTheDocument();
  });

});
