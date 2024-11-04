'use client';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTasks } from '@/context/TasksContext';

interface Agent {
    id: string;
    name: string;
    description: string;
    version: string;
    model: string;
    instructions: string;
    actions: string[];
    status: string;
    status_reason: string;
}

interface GroupedAgent {
    name: string;
    versions: Agent[];
}

export default function ComposePage() {
    const [prompt, setPrompt] = useState("")
    const [groupedAgents, setGroupedAgents] = useState<GroupedAgent[]>([])
    const [selectedVersions, setSelectedVersions] = useState<Record<string, Agent>>({})
    const [activeAgent, setActiveAgent] = useState<string | null>(null)
    const router = useRouter()
    const { refreshTasks } = useTasks()

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const response = await fetch('/api/list-agents')
                if (!response.ok) {
                    throw new Error('Failed to fetch agents')
                }
                const data: Agent[] = await response.json()

                // Group agents by name and sort versions
                const grouped = data.reduce((acc: GroupedAgent[], agent) => {
                    const existingGroup = acc.find(g => g.name === agent.name)
                    if (existingGroup) {
                        existingGroup.versions.push(agent)
                    } else {
                        acc.push({ name: agent.name, versions: [agent] })
                    }
                    return acc
                }, [])

                // Sort versions within each group
                grouped.forEach(group => {
                    group.versions.sort((a, b) =>
                        b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' })
                    )
                })

                setGroupedAgents(grouped)

                // Set the default selected version for each group
                const initialSelectedVersions: Record<string, Agent> = {}
                grouped.forEach(group => {
                    initialSelectedVersions[group.name] = group.versions[0]
                })
                setSelectedVersions(initialSelectedVersions)

                // Set the first agent as active
                if (grouped.length > 0) {
                    setActiveAgent(grouped[0].name)
                }
            } catch (error) {
                console.error('Error fetching agents:', error)
            }
        }

        fetchAgents()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const selectedAgent = selectedVersions[activeAgent || '']
        if (prompt.trim() && selectedAgent) {
            try {
                const response = await fetch('/api/create-task', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        agent_name: selectedAgent.name,
                        agent_version: selectedAgent.version,
                        prompt: prompt,
                        require_approval: true,
                    }),
                })

                if (!response.ok) {
                    throw new Error('Failed to create task')
                }

                const task = await response.json()
                refreshTasks();
                router.push(`/tasks/${task.id}`)
            } catch (error) {
                console.error('Error creating task:', error)
                // You might want to show an error message to the user here
            }
        }
    }

    const handleVersionSelect = (groupName: string, agent: Agent) => {
        setSelectedVersions(prev => ({
            ...prev,
            [groupName]: agent
        }))
        setActiveAgent(groupName)
    }

    return (
        <div className="flex-1 p-4 overflow-y-auto h-full">
            <div className="flex flex-col items-center justify-center min-h-full">
                <h3 className="text-2xl font-semibold mb-2 text-center">Create a New Task</h3>
                <p className="text-muted-foreground mb-4 text-center">
                    Select an agent to submit a task to.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-2xl mb-6">
                    {groupedAgents.map((group) => (
                        <DropdownMenu key={group.name}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant={activeAgent === group.name ? "default" : "outline"}
                                    className={`h-auto py-2 px-3 text-sm w-full ${activeAgent === group.name ? "bg-primary text-primary-foreground" : ""
                                        }`}
                                    onClick={() => setActiveAgent(group.name)}
                                >
                                    <div className="flex flex-col items-start text-left break-all">
                                        <span className="font-medium">{group.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            v{selectedVersions[group.name]?.version || group.versions[0].version}
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {group.versions.map((agent) => (
                                    <DropdownMenuItem
                                        key={agent.id}
                                        onSelect={() => handleVersionSelect(group.name, agent)}
                                    >
                                        v{agent.version}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                                        e.preventDefault()
                                        handleSubmit(e)
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
    )
}