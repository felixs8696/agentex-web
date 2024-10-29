'use client'

import localFont from "next/font/local"
import "./globals.css"
import '@mdxeditor/editor/style.css'
import { Sidebar, SidebarContent, SidebarProvider, SidebarRail, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Circle, CheckCircle2, XCircle, Cpu, PenSquare, Menu, StopCircle, CircleEllipsis } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { TasksProvider, useTasks } from '@/context/TasksContext'

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

const statusIcons: Record<string, { icon: React.ComponentType, color: string }> = {
  COMPLETED: { icon: CheckCircle2, color: 'text-green-500' },
  FAILED: { icon: XCircle, color: 'text-red-500' },
  CANCELED: { icon: StopCircle, color: 'text-red-500' },
  RUNNING: { icon: CircleEllipsis, color: 'text-blue-500' },
  PENDING: { icon: Circle, color: 'text-yellow-500' },
};

const SidebarContents = () => {
  const { tasks, selectedTask, setSelectedTask } = useTasks();
  const { open } = useSidebar()

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b">
        <Link href="/" className="flex items-center space-x-2 cursor-pointer">
          <Cpu className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold">Agentex</h2>
        </Link>
        <Link href="/">
          <Button variant="ghost" size="icon" aria-label="New Task">
            <PenSquare className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      <div className="px-4 py-2">
        <h3 className="mb-2 px-2 text-lg font-semibold tracking-tight">
          Tasks
        </h3>
      </div>
      <ScrollArea className="flex-grow px-4">
        {tasks.map((task) => {
          const isSelected = selectedTask && selectedTask.id === task.id;
          const { icon: StatusIcon, color } = statusIcons[task.status] || statusIcons.PENDING;
          return (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className={`flex items-center p-2 rounded-md mb-1 w-full text-left ${isSelected ? 'bg-muted' : 'hover:bg-muted'}`}
              onClick={() => setSelectedTask(task)}
            >
              <StatusIcon className={`w-4 h-4 ${color} flex-shrink-0`} />
              <span className="ml-2 text-sm truncate">{task.prompt}</span>
            </Link>
          )
        })}
      </ScrollArea>
      <SidebarRail />
    </div>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <TasksProvider>
          <SidebarProvider>
            <div className="flex w-screen h-screen bg-background">
              {/* Collapsible Sidebar - hidden on mobile, visible on larger screens */}
              <Sidebar className="hidden lg:block w-64">
                <SidebarContent>
                  <SidebarContents />
                </SidebarContent>
              </Sidebar>

              {/* Main content area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile header - ONLY visible on small screens */}
                <header className="flex lg:hidden items-center justify-between p-4 border-b">
                  <Link href="/" className="flex items-center space-x-2 cursor-pointer">
                    <Cpu className="w-6 h-6 text-primary" />
                    <h2 className="text-lg font-semibold">Agentex</h2>
                  </Link>
                  <div className="flex items-center space-x-2">
                    <Link href="/">
                      <Button variant="ghost" size="icon" aria-label="New Task">
                        <PenSquare className="h-5 w-5" />
                      </Button>
                    </Link>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Open Menu">
                          <Menu className="h-6 w-6" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="p-0 w-64">
                        <Sidebar>
                          <SidebarContent>
                            <SidebarContents />
                          </SidebarContent>
                        </Sidebar>
                      </SheetContent>
                    </Sheet>
                  </div>
                </header>

                {/* Desktop header with SidebarTrigger - ONLY visible on large screens */}
                {/* <header className="hidden lg:block relative items-center h-0 bg-gray-100 z-10">
                  <SidebarTrigger className="absolute left-4 bottom-5 bg-gray-100 z-10 hover:bg-white" />
                </header> */}

                {/* Page content - takes full height on larger screens */}
                <main className="flex-1 overflow-auto">
                  {children}
                </main>
              </div>
            </div>
          </SidebarProvider>
        </TasksProvider>
      </body>
    </html>
  )
}