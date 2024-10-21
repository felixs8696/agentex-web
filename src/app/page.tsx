'use client';

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Circle, CheckCircle2, XCircle, Send, Cpu, PenSquare, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
    Sidebar,
    SidebarContent,
    SidebarProvider,
} from "@/components/ui/sidebar"

type Task = {
    id: string
    title: string
    status: "pending" | "completed" | "failed"
    agent: string
}

const initialTasks: Task[] = [
    { id: "1", title: "Analyze market trends", status: "completed", agent: "Data Analyst" },
    { id: "2", title: "Develop new product features", status: "pending", agent: "Product Manager" },
    { id: "3", title: "Optimize database queries", status: "failed", agent: "Database Engineer" },
    { id: "4", title: "Create marketing campaign", status: "pending", agent: "Marketing Specialist" },
    { id: "5", title: "Update user documentation", status: "completed", agent: "Technical Writer" },
]

const agents = [
    "Data Analyst", "Product Manager", "Database Engineer", "Marketing Specialist",
    "Technical Writer", "UX Designer", "Frontend Developer", "Backend Developer",
    "DevOps Engineer", "AI Specialist", "Cybersecurity Expert", "Project Manager"
]

export default function Component() {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [prompt, setPrompt] = useState("")
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
    const [isComposing, setIsComposing] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

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
        if (prompt.trim() && selectedAgent) {
            const newTask: Task = {
                id: Date.now().toString(),
                title: prompt,
                status: "pending",
                agent: selectedAgent,
            }
            setTasks([newTask, ...tasks])
            setPrompt("")
            setSelectedTaskId(newTask.id)
            setIsComposing(false)
            setSelectedAgent(null)
        }
    }

    const handleCompose = () => {
        setIsComposing(true)
        setSelectedTaskId(null)
        setSelectedAgent(null)
    }

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 5 * 24)}px`
        }
    }, [prompt])

    const SidebarContents = () => (
        <SidebarContent className="h-full bg-muted/50">
            <div className="p-4 flex items-center justify-between border-b">
                <div className="flex items-center space-x-2">
                    <Cpu className="w-6 h-6 text-primary" />
                    <h2 className="text-lg font-semibold">Agentex</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCompose}>
                    <PenSquare className="h-5 w-5" />
                </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)]">
                <div className="px-4 py-2">
                    <h3 className="mb-2 px-2 text-lg font-semibold tracking-tight">
                        Tasks
                    </h3>
                    {tasks.map((task) => (
                        <button
                            key={task.id}
                            onClick={() => {
                                setSelectedTaskId(task.id)
                                setIsComposing(false)
                            }}
                            className={`flex items-center p-2 rounded-md hover:bg-muted mb-1 w-full text-left ${selectedTaskId === task.id ? "bg-muted" : ""
                                }`}
                        >
                            {getStatusIcon(task.status)}
                            <span className="ml-2 text-sm truncate">{task.title}</span>
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </SidebarContent>
    )

    return (
        <div className="flex flex-col h-screen bg-background lg:flex-row">
            {/* Mobile header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-2">
                    <Cpu className="w-6 h-6 text-primary" />
                    <h2 className="text-lg font-semibold">Agentex</h2>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" onClick={handleCompose}>
                        <PenSquare className="h-5 w-5" />
                    </Button>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64">
                            <SidebarProvider>
                                <Sidebar>
                                    <SidebarContents />
                                </Sidebar>
                            </SidebarProvider>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Sidebar - hidden on mobile, visible on larger screens */}
            <div className="hidden lg:block lg:w-64 border-r">
                <SidebarProvider>
                    <Sidebar>
                        <SidebarContents />
                    </Sidebar>
                </SidebarProvider>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto">
                    {isComposing || !selectedTaskId ? (
                        <div className="flex flex-col items-center justify-center min-h-full">
                            <h3 className="text-2xl font-semibold mb-2 text-center">
                                {isComposing ? "Create a New Task" : "Welcome to Agentex"}
                            </h3>
                            <p className="text-muted-foreground mb-4 text-center">
                                Select an agent to start a new task, or click on a task to revisit an existing one.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-2xl mb-6">
                                {agents.map((agent) => (
                                    <Button
                                        key={agent}
                                        variant={selectedAgent === agent ? "default" : "outline"}
                                        className="h-auto py-2 px-4 text-sm"
                                        onClick={() => setSelectedAgent(agent)}
                                    >
                                        {agent}
                                    </Button>
                                ))}
                            </div>
                            {selectedAgent && (
                                <div className="w-full max-w-2xl">
                                    <form onSubmit={handleSubmit} className="relative">
                                        <Textarea
                                            ref={textareaRef}
                                            placeholder={`Type your task for ${selectedAgent} here...`}
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            className="pr-16 rounded-xl min-h-[48px] resize-none"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault()
                                                    handleSubmit(e)
                                                }
                                            }}
                                        />
                                        <Button
                                            type="submit"
                                            size="icon"
                                            className="absolute right-3 bottom-3 rounded-full w-10 h-10"
                                        >
                                            <Send className="w-5 h-5" />
                                            <span className="sr-only">Send</span>
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">
                            Task details for ID: {selectedTaskId}
                            {/* Replace this with your actual task details component */}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}