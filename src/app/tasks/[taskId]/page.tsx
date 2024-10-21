'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Sparkles, ClipboardList, Activity, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { createTask, getTask, modifyTask } from '@/lib/api/tasks'
import { getAgent } from '@/lib/api/agents'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Define polling interval
const POLL_INTERVAL = 1000;

// Interfaces for data types
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

interface Task {
    id: string;
    agent_id: string;
    messages: Message[];
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

    // Fetch task and agent data on initial render
    useEffect(() => {
        const fetchData = async () => {
            if (taskId) {
                try {
                    const fetchedTask = await getTask(taskId);
                    if (fetchedTask) {
                        const fetchedAgent = await getAgent(fetchedTask.agent_id);
                        setTask(fetchedTask);
                        setAgent(fetchedAgent);
                    } else {
                        setError("Failed to fetch task");
                    }
                } catch (err) {
                    setError("Error fetching task data");
                }
            }
        };
        fetchData();
    }, [taskId]);

    // Function to poll task updates
    const fetchTask = useCallback(async () => {
        if (task && task.id) {
            try {
                const updatedTask = await getTask(task.id);
                pollCount.current += 1;

                if (updatedTask && JSON.stringify(updatedTask) !== JSON.stringify(task)) {
                    setTask(updatedTask);
                    setKey(prevKey => prevKey + 1);
                    setLastUpdateTime(new Date().toLocaleTimeString());
                }
            } catch (err) {
                setError("Failed to fetch task updates");
            }
        }
    }, [task]);

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
            } catch (err) {
                setError("Failed to cancel task");
            } finally {
                setIsCancelling(false);
            }
        }
    };

    // Filter and sort messages based on role
    const agentAndUserMessages = (task: Task, sort: "asc" | "desc" = "asc") => {
        const messages = task.messages.filter(message => message.role === "assistant" || message.role === "user");
        return sort === "asc" ? messages : messages.reverse();
    };

    const renderMessages = (task: Task) => {
        return agentAndUserMessages(task).map((message, index) => (
            (message.role === "assistant") ? (
                (message.content) ? (
                    <MessageCard key={index} message={message} />
                ) : (
                    (message.tool_calls && message?.tool_calls.length > 0) ? (
                        <MessageCard key={index} message={{ ...message, content: "Please wait while I take some actions..." }} glow />
                    ) : null
                )) : (
                <MessageCard key={index} message={message} />
            )
        ))
    };

    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(scrollToBottom, [task])

    return (
        <div className="flex flex-col h-screen bg-gray-100 p-4">
            {task && (
                <>
                    <TaskInfoCard task={task} lastUpdateTime={lastUpdateTime} />
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        <AnimatePresence>
                            {renderMessages(task)}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="w-full">
                        <form onSubmit={handleSubmit} className="mb-6">
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Provide new instructions..."
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    className="flex-grow bg-white"
                                />
                                <Button type="submit" disabled={isThinking}>
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
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    )
}

// Task information component
const TaskInfoCard: React.FC<{ task: Task; lastUpdateTime: string }> = ({ task, lastUpdateTime }) => (
    <Card className="rounded-sm shadow-none">
        <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <div>
                    <p className="text-xs font-medium text-muted-foreground">Task ID</p>
                    <p className="text-sm font-semibold truncate">{task.id}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div>
                    <p className="text-xs font-medium text-muted-foreground">Status</p>
                    <p className="text-sm font-semibold">{task.status}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                    <p className="text-xs font-medium text-muted-foreground">Last Update</p>
                    <p className="text-sm font-semibold">{lastUpdateTime}</p>
                </div>
            </div>
        </CardContent>
    </Card>
);


const MessageCard: React.FC<{ message: Message; glow?: boolean }> = ({ message, glow = false }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`relative flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
        <div
            className={`relative max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl p-3 rounded-lg border-2 
                ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'} 
                ${glow ? 'glow-card' : ''}`}
        >
            {glow ? (
                <div className="inner rounded-sm p-3 z-1 bg-white">
                    {message.content}
                </div>
            ) : (
                <div className="relative z-10">{message.content}</div>
            )}
        </div>
    </motion.div >
);





export default Page;