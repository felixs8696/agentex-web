'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTasks } from '@/context/TasksContext';

interface Agent {
    id: string;
    name: string;
    description: string;
    status: string;
    status_reason: string;
}

export default function ComposePage() {
    const [prompt, setPrompt] = useState("");
    const [agents, setAgents] = useState<Agent[]>([]);
    const [activeAgent, setActiveAgent] = useState<string | null>(null);
    const router = useRouter();
    const { refreshTasks } = useTasks();

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const response = await fetch('/api/list-agents');
                if (!response.ok) {
                    throw new Error('Failed to fetch agents');
                }
                const data: Agent[] = await response.json();
                const readyAgents = data.filter(agent => agent.status.toLowerCase() === 'ready');

                setAgents(readyAgents);

                // Set the first agent as active if available
                if (readyAgents.length > 0) {
                    setActiveAgent(readyAgents[0].name);
                }
            } catch (error) {
                console.error('Error fetching agents:', error);
            }
        };

        fetchAgents();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && activeAgent) {
            try {
                const response = await fetch('/api/create-task', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        agent_name: activeAgent,
                        prompt: prompt,
                        require_approval: true,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to create task');
                }

                const task = await response.json();
                refreshTasks();
                router.push(`/tasks/${task.id}`);
            } catch (error) {
                console.error('Error creating task:', error);
            }
        }
    };

    return (
        <div className="flex-1 p-4 overflow-y-auto h-full">
            <div className="flex flex-col items-center justify-center min-h-full">
                <h3 className="text-2xl font-semibold mb-2 text-center">Create a New Task</h3>
                <p className="text-muted-foreground mb-4 text-center">
                    Select an agent to submit a task to.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-2xl mb-6">
                    {agents.map((agent) => (
                        <Button
                            key={agent.id}
                            variant={activeAgent === agent.name ? "default" : "outline"}
                            className={`h-auto py-2 px-3 text-sm w-full ${activeAgent === agent.name ? "bg-primary text-primary-foreground" : ""}`}
                            onClick={() => setActiveAgent(agent.name)}
                        >
                            <div className="flex flex-col items-start text-left break-all">
                                <span className="font-medium">{agent.name}</span>
                            </div>
                        </Button>
                    ))}
                </div>
                {activeAgent && (
                    <div className="w-full max-w-2xl">
                        <form onSubmit={handleSubmit} className="relative">
                            <Textarea
                                placeholder={`Enter a task for the ${activeAgent} agent to perform...`}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="pr-16 rounded-xl min-h-[48px] resize-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="absolute right-2 top-2 rounded-lg w-8 h-8"
                            >
                                <Send className="w-5 h-5" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
