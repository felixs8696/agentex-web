'use client';

import React, { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Activity, CheckCircleIcon, ClipboardList, Clock, Loader2, RotateCw, Send, XCircleIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/router";

interface Message {
    role: string
    content: string
}

interface Task {
    id: string
    messages: Message[]
    status: string
    state?: {
        status: string
    }
}

const createTask = async (
    taskInput: string,
    agentName: string = "hello-world",
    agentVersion: string = "0.0.10",
    requireApproval: boolean = false
) => {
    try {
        const res = await fetch(`/api/create-task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                agent_name: agentName,
                agent_version: agentVersion,
                prompt: taskInput,
                require_approval: requireApproval,
            }),
        });

        if (!res.ok) {
            throw new Error(`Failed to create task: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log("Task created:", data);
        return data;
    } catch (error) {
        console.error("Error in createTask:", error);
        return null;
    }
}

const getTask = async (taskId: string) => {
    try {
        // Add a timestamp to the URL to prevent caching
        const timestamp = new Date().getTime();
        const res = await fetch(`/api/get-task/${taskId}`);
        if (!res.ok) {
            throw new Error(`Failed to fetch task status: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log("Task fetched:", data);
        return data;
    } catch (error) {
        console.error("Error in getTask:", error);
        return null;
    }
}

const modifyTask = async (taskId: string, modificationType: string, prompt = '') => {
    try {
        const res = await fetch(`/api/modify-task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                task_id: taskId,
                modification_type: modificationType,
                prompt,
            }),
        });

        if (!res.ok) {
            throw new Error('Failed to modify the task');
        }

        return await res.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};

export default function Page({ params }: { params: { taskId: string } }) {
    const { taskId } = params

    const [isThinking, setIsThinking] = useState(false)
    const [userInput, setUserInput] = useState("")
    const [task, setTask] = useState<Task | null>(null)
    const [error, setError] = useState<string | null>(null)
    const pollCount = useRef(0)
    const [key, setKey] = useState(0)
    const [lastUpdateTime, setLastUpdateTime] = useState<string>("N/A")

    useEffect(() => {
        if (taskId) {
            console.log("Task ID:", taskId)
            getTask(taskId as string).then((data) => {
                if (data) {
                    setTask(data)
                } else {
                    setError("Failed to fetch task")
                }
            })
        }
    }, [taskId])

    const fetchTask = useCallback(async () => {
        console.log("fetchTask called at:", new Date().toLocaleTimeString());
        if (task && task.id) {
            try {
                const updatedTask = await getTask(task.id)
                pollCount.current += 1
                console.log(`Poll ${pollCount.current} for task ${task.id}:`, updatedTask)

                if (updatedTask) {
                    if (JSON.stringify(updatedTask) !== JSON.stringify(task)) {
                        console.log("Task updated, setting new state")
                        setTask(updatedTask)
                        setKey(prevKey => prevKey + 1)
                        setLastUpdateTime(new Date().toLocaleTimeString())
                    } else {
                        console.log("No changes in task data")
                    }
                } else {
                    console.log("No task data returned")
                }
            } catch (error) {
                console.error("Error in fetchTask:", error)
                setError("Failed to fetch task updates")
            }
        }
    }, [task])

    useEffect(() => {
        console.log("Component rendered at:", new Date().toLocaleTimeString());
    });

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (task) {
            console.log("Setting up polling interval")
            interval = setInterval(fetchTask, 3000)
        }

        return () => {
            if (interval) {
                console.log("Clearing polling interval")
                clearInterval(interval)
            }
        }
    }, [task, fetchTask])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userInput.trim()) return

        setUserInput("")
        setIsThinking(true)
        setError(null)

        try {
            if (task) {
                console.log("Modifying task with new instructions:", userInput)
                console.log("Current task:", task.id)
                console.log("modificationType:", "instruct")
                await modifyTask(task.id, "instruct", userInput)
            } else {
                const newTask = await createTask(userInput, "hello-world", "0.0.10", true)

                if (newTask && newTask.id) {
                    console.log("New task created:", newTask)
                    setTask(newTask)
                    setKey(prevKey => prevKey + 1)
                    setLastUpdateTime(new Date().toLocaleTimeString())
                } else {
                    throw new Error("Failed to create task")
                }
            }
        } catch (error) {
            console.error("Error in handleSubmit:", error)
            setError("Failed to create task")
        } finally {
            setIsThinking(false)
        }

        setTimeout(async () => {
            setIsThinking(true)
            console.log("I'm thinking...")
            await fetchTask()
            setIsThinking(false)
            console.log("I'm done...")
        }
            , 1000)
    }

    const handleApproveTask = async () => {
        if (task && task.id) {
            try {
                console.log("Approving task:", task.id)
                await modifyTask(task.id, "approve")
            } catch (error) {
                console.error("Error in handleApproveTask:", error)
                setError("Failed to approve task")
            }
        }
    }

    const handleCancelTask = async () => {
        if (task && task.id) {
            try {
                console.log("Cancelling task:", task.id)
                await modifyTask(task.id, "cancel")
            } catch (error) {
                console.error("Error in handleCancelTask:", error)
                setError("Failed to cancel task")
            }
        }
    }

    const agentAndUserMessages = (task: Task, sort: "asc" | "desc" = "desc") => {
        const messages = task.messages.filter((message) => message.role === "assistant" || message.role === "user")
        return sort === "asc" ? messages : messages.reverse()
    }

    const renderMessages = (task: Task) => {
        return agentAndUserMessages(task).map((message, index) => (
            (message.role === "assistant") ? (
                (message.content) ? (
                    <MessageCard key={index} message={message} />
                ) : (
                    (message.tool_calls && message?.tool_calls.length > 0) ? (
                        <MessageCard key={index} message={{ role: message.role, content: "Please wait while I take some actions..." }} />
                    ) : null
                )) : (
                <MessageCard key={index} message={message} />
            )
        ))
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-700 to-blue-900 p-8 flex flex-col items-center">
            <h1 className="text-4xl font-bold text-white mb-8">Agentex AI</h1>

            <div className="w-full max-w-2xl mb-8">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="Enter your prompt here..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="flex-grow bg-white"
                    />
                    <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                        <Send className="h-4 w-4 mr-2" />
                        Send
                    </Button>
                </form>
            </div>

            {isThinking && (
                <>
                    <div>
                        <Loader2 className="h-6 w-4 text-blue-400 animate-spin" />
                        <p className="text-white font-semibold">Let me think...</p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="mb-8 w-full max-w-2xl"
                    >
                        <Card className="bg-white/10 backdrop-blur-lg border-none shadow-lg">
                            <CardContent className="p-6 flex items-center space-x-4">
                                <Loader2 className="h-6 w-4 text-blue-400 animate-spin" />
                                <p className="text-white font-semibold">Let me think...</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </>
            )}

            {error && (
                <div className="w-full max-w-2xl mb-8 text-red-500 bg-red-100 p-4 rounded">
                    {error}
                </div>
            )}

            {task && (
                <div key={key} className="w-full max-w-2xl mb-8">
                    <Card className="w-full bg-white/10 backdrop-blur-sm shadow-lg border-0 mb-4">
                        <CardContent className="flex items-center justify-between p-4 text-white/90">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-white/10 p-2">
                                    <ClipboardList className="h-4 w-4 text-white/70" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-white/60">Task ID</p>
                                    <p className="text-sm font-semibold truncate">{task.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-white/10 p-2">
                                    <Activity className="h-4 w-4 text-white/70" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-white/60">Status</p>
                                    <p className="text-sm font-semibold">{task?.state?.status}</p>
                                </div>
                            </div>
                            {/* <div className="flex items-center gap-3">
                                <div className="rounded-full bg-white/10 p-2">
                                    <RotateCw className="h-4 w-4 text-white/70" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-white/60">Poll Count</p>
                                    <p className="text-sm font-semibold">{pollCount.current}</p>
                                </div>
                            </div> */}
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-white/10 p-2">
                                    <Clock className="h-4 w-4 text-white/70" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-white/60">Last Update</p>
                                    <p className="text-sm font-semibold">{lastUpdateTime}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {task && (
                        (task?.state?.status === "COMPLETED" || task?.state?.status === "FAILED") ? (
                            <div className="flex flex gap-2 mb-4 justify-end">
                                <Badge
                                    variant={task?.state?.status === "COMPLETED" ? "default" : "destructive"}
                                    className="flex items-center gap-1"
                                >
                                    {task?.state?.status === "COMPLETED" ? (
                                        <CheckCircleIcon className="h-3 w-3" aria-hidden="true" />
                                    ) : (
                                        <XCircleIcon className="h-3 w-3" aria-hidden="true" />
                                    )}
                                    <span>{task?.state?.status === "COMPLETED" ? "AI Response Approved" : "AI Encountered Failure"}</span>
                                </Badge>
                            </div>
                        ) : (
                            <div className="flex flex gap-2 mb-4 justify-end">
                                <Button className={`bg-primary focus:ring-2 focus:ring-offset-2 ${task?.state?.status === "COMPLETED" ? "disabled" : ""}`} onClick={handleApproveTask}>
                                    Approve Response
                                </Button>
                                <Button className="bg-red-500 hover:bg-red-600" onClick={handleCancelTask}>
                                    Cancel Task
                                </Button>
                            </div>
                        )
                    )}
                    {task.messages && task.messages.length > 0 && (
                        <AnimatePresence>
                            {renderMessages(task)}
                        </AnimatePresence>
                    )}
                </div>
            )}
        </div>
    )
}

function MessageCard({ message }: { message: Message }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl mb-4"
        >
            <Card className="bg-white/10 backdrop-blur-lg border-none shadow-lg overflow-hidden">
                <CardContent className="p-6">
                    <p className="text-white text-lg leading-relaxed">{message.content}</p>
                    <div className="mt-4 flex justify-end">
                        <span className={`text-sm ${message.role === "assistant" ? "text-blue-300" : "text-green-300"}`}>
                            {message.role === "assistant" ? "AI Assistant" : "You"}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}