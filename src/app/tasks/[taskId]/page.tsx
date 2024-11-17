'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Sparkles, ClipboardList, Activity, Clock, Loader2, Hash, Copy, Check, Ellipsis, Paperclip, File, GripVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { createTask, getTask, modifyTask } from '@/lib/api/tasks'
import { getAgent } from '@/lib/api/agents'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from "@/hooks/use-toast"
import { useTasks } from '@/context/TasksContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import MessageCard from '@/components/message-card'

const Editor = dynamic(() => import('@/components/editor/markdown-editor'), { ssr: false })

// Define polling interval
const POLL_INTERVAL = 1000;

// Interfaces for data types
interface Artifact {
    name: string;
    description: string;
    content: string;
}

interface Message {
    role: 'assistant' | 'user';
    content: string;
    tool_calls?: any[];
}

interface Agent {
    id: string;
    name: string;
    description: string;
    version: string;
    model: string;
    instructions: string;
    actions: any[];
    status: string;
    status_reason: string;
}

interface Thread {
    messages: Message[];
}

interface Task {
    id: string;
    agent_id: string;
    threads: Map<string, Thread>;
    context: {
        artifacts: Artifact[];
    };
    status?: string;
    status_reason?: string;
}

interface PageProps {
    params: {
        taskId: string;
    };
}

// Main Page component
const Page: React.FC<PageProps> = ({ params: { taskId } }) => {
    const { toast } = useToast()
    const { refreshTasks, setSelectedTask } = useTasks();

    // State variables
    const [isThinking, setIsThinking] = useState(false);
    const [userInput, setUserInput] = useState<string>("");
    const [task, setTask] = useState<Task | null>(null);
    const [agent, setAgent] = useState<Agent | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pollCount = useRef<number>(0);
    const [key, setKey] = useState(0);
    const [lastUpdateTime, setLastUpdateTime] = useState<string>("N/A");
    const [isApproving, setIsApproving] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    const handleArtifactClick = (artifact: Artifact) => {
        setSelectedArtifact(artifact)
        console.log("Artifact clicked:", artifact)
        setIsSheetOpen(true)
    }

    // Fetch task and agent data on initial render
    useEffect(() => {
        const fetchData = async () => {
            if (taskId) {
                try {
                    const fetchedTask = await getTask(taskId);
                    if (fetchedTask) {
                        const fetchedAgent = await getAgent(fetchedTask.agent_id);
                        setTask(fetchedTask);
                        setSelectedTask(fetchedTask);
                        setAgent(fetchedAgent);
                        console.log("Task fetched:", fetchedTask);
                    } else {
                        setError("Failed to fetch task");
                    }
                } catch (err) {
                    setError("Error fetching task data");
                }
            }
        };
        fetchData();
    }, [taskId, setSelectedTask]);

    // Function to poll task updates
    const fetchTask = useCallback(async () => {
        if (task && task.id) {
            try {
                const updatedTask = await getTask(task.id);
                pollCount.current += 1;

                if (updatedTask && JSON.stringify(updatedTask) !== JSON.stringify(task)) {
                    setTask(updatedTask);
                    setSelectedTask(updatedTask);
                    setKey(prevKey => prevKey + 1);
                    setLastUpdateTime(new Date().toLocaleTimeString());
                }
            } catch (err) {
                setError("Failed to fetch task updates");
            }
        }
    }, [task, setSelectedTask]);

    // Polling logic with useEffect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (task) {
            interval = setInterval(fetchTask, POLL_INTERVAL);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [task, fetchTask]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim()) return;

        setUserInput("");
        setIsThinking(true);
        setError(null);

        try {
            if (task) {
                await modifyTask(task.id, "instruct", userInput);
            } else if (agent) {
                const newTask = await createTask(userInput, agent.name, agent.version, true);
                if (newTask && newTask.id) {
                    setTask(newTask);
                    setKey(prevKey => prevKey + 1);
                    setLastUpdateTime(new Date().toLocaleTimeString());
                } else {
                    throw new Error("Failed to create task");
                }
            }
            await fetchTask(); // Immediately refresh the task after submission
        } catch (err) {
            setError("Failed to create task");
        } finally {
            setIsThinking(false);
        }
    };

    // Handle task approval
    const handleApproveTask = async () => {
        if (task?.id) {
            try {
                setIsApproving(true);
                await modifyTask(task.id, "approve");
                await fetchTask(); // Refresh task after approval
                await refreshTasks(); // Refresh tasks list
            } catch (err) {
                setError("Failed to approve task");
            } finally {
                setIsApproving(false);
            }
        }
    };

    // Handle task cancellation
    const handleCancelTask = async () => {
        if (task?.id) {
            try {
                setIsCancelling(true);
                await modifyTask(task.id, "cancel");
                await fetchTask(); // Refresh task after cancellation
                await refreshTasks(); // Refresh tasks list
            } catch (err) {
                setError("Failed to cancel task");
            } finally {
                setIsCancelling(false);
            }
        }
    };

    // Filter and sort messages based on role
    const agentAndUserMessages = (task: Task, sort: "asc" | "desc" = "asc") => {
        if (!task || !task.threads) return [];
        const flattendMessages: Message[] = Object.values(task.threads || {}).reduce((acc, thread) => {
            acc.push(...(thread.messages || []));
            return acc;
        }, []); // Add an empty array as the initial value
        const messages = flattendMessages.filter(message => message.role === "assistant" || message.role === "user");
        return sort === "asc" ? messages : messages.reverse();
    };

    const renderMessages = (task: Task) => {
        return agentAndUserMessages(task).map((message, index) => {
            const actionTaken = message.role === "assistant" && message.tool_calls && message.tool_calls.length > 0;
            return <MessageCard
                key={index}
                title={actionTaken ? "Thinking..." : message.role === "assistant" ? "Agent" : "User"}
                content={message.content}
                position={message.role === "user" ? "right" : "left"}
                aiActionTaken={actionTaken}
            />
        });
    };

    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(scrollToBottom, [task])

    const copyTaskId = () => {
        navigator.clipboard.writeText(taskId).then(() => {
            setIsCopied(true)
            toast({
                title: "Copied!",
                description: `Task ID ${taskId} copied to clipboard`,
            })
            setTimeout(() => setIsCopied(false), 2000)
        })
    }

    const taskInTerminalState = task?.status === "FAILED" || task?.status === "COMPLETED" || task?.status === "CANCELED";

    return (
        <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={100} >
                <div className="flex flex-col h-full bg-gray-100 p-4 pt-0">
                    {task && (
                        <>
                            <div className="flex-grow overflow-y-auto p-4 pt-8 space-y-4">
                                <AnimatePresence>
                                    {renderMessages(task)}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>
                            <Artifacts task={task} onArtifactClick={handleArtifactClick} />
                            <Badges toast={toast} isCopied={isCopied} task={task} lastUpdateTime={lastUpdateTime} copyTaskId={copyTaskId} />
                            <div className="w-full">
                                <form onSubmit={handleSubmit} className="mb-6">
                                    <div className="flex gap-2">
                                        <Input
                                            type="text"
                                            placeholder="Provide new instructions..."
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            className="flex-grow bg-white"
                                            disabled={taskInTerminalState}
                                        />
                                        <Button type="submit" disabled={taskInTerminalState || isThinking}>
                                            {isThinking ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Thinking...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4 mr-2" />
                                                    Send
                                                </>
                                            )}
                                        </Button>
                                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleApproveTask} disabled={taskInTerminalState || isApproving}>
                                            {isApproving ? (
                                                <Ellipsis className="h-4 w-4 animate-pulse" />
                                            ) : (
                                                <Check className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button className="bg-red-500 hover:bg-red-600" onClick={handleCancelTask} disabled={taskInTerminalState || isCancelling}>
                                            {isCancelling ? (
                                                <Ellipsis className="h-4 w-4 animate-pulse" />
                                            ) : (
                                                <X className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </ResizablePanel>
            {/* <ResizableHandle /> */}
            <ResizablePanel maxSize={isSheetOpen ? 60 : 0} defaultSize={0} minSize={isSheetOpen ? 60 : 0} className="transition-all duration-1000 ease-out">
                {isSheetOpen && selectedArtifact && (
                    <div className="h-full flex flex-col bg-white p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">{selectedArtifact.name}</h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">{selectedArtifact.description}</p>
                        <ScrollArea className="flex-grow">
                            <Suspense fallback={<div>Loading...</div>}>
                                <Editor
                                    markdown={selectedArtifact.content || ''}
                                    contentEditableClassName="!p-0"
                                />
                            </Suspense>
                        </ScrollArea>
                    </div>
                )}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}

const getStatusColor = (status: string | undefined) => {
    switch (status) {
        case "RUNNING":
            return "bg-blue-100 text-blue-800 border-blue-300"
        case "COMPLETED":
            return "bg-green-100 text-green-800 border-green-300"
        case "FAILED":
            return "bg-red-100 text-red-800 border-red-300"
        default:
            return "bg-gray-100 text-gray-800 border-gray-300"
    }
}

const Artifacts: React.FC<{ task: Task; onArtifactClick: (artifact: Artifact) => void }> = ({ task, onArtifactClick }) => (
    (task && task?.context?.artifacts) && (
        <div className="flex flex-wrap items-center justify-start gap-2 p-3">
            {Object.entries(task?.context?.artifacts || {}).map(([_, { name, description, content }], index) => (
                <Card key={index} className="overflow-hidden shadow-none rounded-lg">
                    <CardContent className="p-0">
                        <button
                            onClick={() => onArtifactClick({ name, description, content })}
                            className="flex items-center space-x-2 w-full text-left p-3 hover:bg-muted transition-colors"
                        >
                            <File className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm truncate">{name}</span>
                        </button>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
);

const Badges: React.FC<{ toast: any; isCopied: boolean; task: Task; lastUpdateTime: string; copyTaskId: () => void }> = ({ isCopied, task, lastUpdateTime, copyTaskId }) => (
    task && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3">
            <Badge variant="secondary" className="text-sm flex items-center space-x-1 pr-1">
                <Hash className="w-4 h-4" />
                <span className="font-mono">Task ID: {task?.id.substring(0, 8)}</span>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6  ml-1 transition-colors ${isCopied
                        ? "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900"
                        : "hover:bg-gray-200 hover:text-gray-900"
                        }`}
                    onClick={copyTaskId}
                >
                    <Copy className="h-3 w-3" />
                    <span className="sr-only">Copy Task ID</span>
                </Button>
            </Badge>
            <div className="flex flex-wrap items-center justify-end gap-2 ml-auto">
                <Badge
                    variant="outline"
                    className={`text-sm flex items-center gap-1 border ${getStatusColor(task.status)}`}
                >
                    Status: {task.status}
                </Badge>
                <Badge variant="outline" className="text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Last Updated: {lastUpdateTime}
                </Badge>
            </div>
        </div>
    )
)

const messageContent = (message: Message) => {
    if (message.content) return message.content;
    if (message.tool_calls && message.tool_calls.length > 0) {
        const preface = "Please wait while I perform the following actions...\n\n"
        const tool_calls = message.tool_calls.map((tool_call) => {
            return `**${tool_call.function.name}**`;
        }).join(", ");
        return preface + tool_calls;
    }
    return "";
}

export default Page;