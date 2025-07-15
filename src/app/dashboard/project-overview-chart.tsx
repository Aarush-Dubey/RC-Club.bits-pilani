"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ProjectStatusData = {
  name: string
  value: number
}

interface ProjectOverviewChartProps {
  data: ProjectStatusData[]
}

export function ProjectOverviewChart({ data }: ProjectOverviewChartProps) {
  return (
    <div className="col-span-4">
        <h3 className="text-2xl font-headline font-bold mb-4">Project Overview</h3>
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                />
                <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
            </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  )
}
