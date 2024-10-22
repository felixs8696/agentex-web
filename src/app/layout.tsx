'use client'

import { useEffect, useState } from "react"
import localFont from "next/font/local"
import "./globals.css"
import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Circle, CheckCircle2, XCircle, Cpu, PenSquare, Menu, CircleEllipsis } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { listTasks } from "@/lib/api/tasks"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

interface Task {
  id: string
  prompt: string
  status: string
}

const BREAKPOINT = "md"

const statusIcons: Record<string, { icon: React.ComponentType, color: string }> = {
  COMPLETED: { icon: CheckCircle2, color: 'text-green-500' },
  FAILED: { icon: XCircle, color: 'text-red-500' },
  RUNNING: { icon: CircleEllipsis, color: 'text-blue-500' },
  PENDING: { icon: Circle, color: 'text-yellow-500' },
};

const SidebarContents = ({ tasks }: { tasks: Task[] }) => (
  <div className="h-full bg-background">
    <div className="p-4 flex items-center justify-between border-b">
      <Link href="/">
        <div className="flex items-center space-x-2">
          <Cpu className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold">Agentex</h2>
        </div>
      </Link>
      <Link href="/">
        <Button variant="ghost" size="icon">
          <PenSquare className="h-5 w-5" />
        </Button>
      </Link>
    </div>
    <ScrollArea className={`h-[calc(100vh-64px)] ${BREAKPOINT}:h-[calc(100vh-80px)]`}>
      <div className="px-4 py-2">
        <h3 className="mb-2 px-2 text-lg font-semibold tracking-tight">
          Tasks
        </h3>
        {tasks.map((task) => {
          const { icon: StatusIcon, color } = statusIcons[task.status] || { icon: CircleEllipsis, color: 'text-blue-500' }; // Fallback to default if status is missing
          return (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="flex items-center p-2 rounded-md hover:bg-muted mb-1 w-full text-left"
            >
              <div className="flex-shrink-0">
                <StatusIcon className={`w-4 h-4 ${color}`} />
              </div>
              <span className="ml-2 text-sm truncate flex-grow">{task.prompt}</span>
            </Link>
          )
        })}
      </div>
    </ScrollArea>
  </div>
)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tasks = await listTasks()
        setTasks(tasks.reverse())
        console.log('Fetched tasks:', tasks);
      } catch (error) {
        console.error('Error fetching tasks:', error)
      }
    }

    fetchTasks()
  }, [])

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex h-screen bg-background">
          {/* Sidebar - hidden on mobile, visible on larger screens */}
          <div className={`hidden ${BREAKPOINT}:block w-64 border-r`}>
            <SidebarProvider>
              <Sidebar>
                <SidebarContent>
                  <SidebarContents tasks={tasks} />
                </SidebarContent>
              </Sidebar>
            </SidebarProvider>
          </div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile header */}
            <div className={`${BREAKPOINT}:hidden flex items-center justify-between p-4 border-b`}>
              <Link href="/">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-6 h-6 text-primary" />
                  <h2 className="text-lg font-semibold">Agentex</h2>
                </div>
              </Link>
              <div className="flex items-center space-x-2">
                <Link href="/">
                  <Button variant="ghost" size="icon">
                    <PenSquare className="h-5 w-5" />
                  </Button>
                </Link>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64">
                    <SidebarProvider>
                      <Sidebar>
                        <SidebarContent>
                          <SidebarContents tasks={tasks} />
                        </SidebarContent>
                      </Sidebar>
                    </SidebarProvider>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Page content */}
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}