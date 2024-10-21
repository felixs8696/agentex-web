import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Circle, CheckCircle2, XCircle, Send } from "lucide-react"
import Link from "next/link"

type Task = {
  id: string
  title: string
  status: "pending" | "completed" | "failed"
}

const initialTasks: Task[] = [
  { id: "1", title: "Analyze market trends", status: "completed" },
  { id: "2", title: "Develop new product features", status: "pending" },
  { id: "3", title: "Optimize database queries", status: "failed" },
  { id: "4", title: "Create marketing campaign", status: "pending" },
  { id: "5", title: "Update user documentation", status: "completed" },
]

export default function Component() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [prompt, setPrompt] = useState("")

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "pending":
        return <Circle className="w-4 h-4 text-yellow-500" />
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: prompt,
        status: "pending",
      }
      setTasks([newTask, ...tasks])
      setPrompt("")
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/50">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Your Tasks</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="px-4">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/task/${task.id}`}
                className="flex items-center p-2 rounded-md hover:bg-muted mb-1"
              >
                {getStatusIcon(task.status)}
                <span className="ml-2 text-sm truncate">{task.title}</span>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4">
          {/* This is where your existing page content will go */}
          <p className="text-muted-foreground">Select a task from the sidebar to view details</p>
        </div>
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex items-center">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Type your task here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="pr-10 rounded-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8"
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}