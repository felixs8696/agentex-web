'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const fetchTaskStatus = async (taskId: number) => {
  try {
    const res = await fetch(`/api/get-task?task_id=${taskId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch task status');
    }
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

const createTask = async (taskInput: string, agentName: string, agentVersion: string, requireApproval: boolean) => {
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
      throw new Error('Failed to create task');
    }
    return await res.json();
  } catch (error) {
    console.error(error);
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
        taskId,
        modificationType,
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

export default function TaskManager() {
  const [taskInput, setTaskInput] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('hello-world')
  const [selectedAgentVersion, setSelectedAgentVersion] = useState('0.0.10')
  const [requireApproval, setRequireApproval] = useState(false)
  const [currentTask, setCurrentTask] = useState<any>(null)
  const [taskOutput, setTaskOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasInitialResponse, setHasInitialResponse] = useState(false)
  const [newInstructions, setNewInstructions] = useState('')
  const [showInstructionsInput, setShowInstructionsInput] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null); // Ref for the task output container

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (currentTask) {
      const pollTask = async () => {
        setIsLoading(true)
        const updatedTask = await fetchTaskStatus(currentTask.id)
        if (updatedTask) {
          setCurrentTask(updatedTask)
          setTaskOutput(JSON.stringify(updatedTask, null, 2))
          setIsLoading(false)
          setHasInitialResponse(true)

          if (updatedTask.status === 'completed') {
            clearInterval(intervalId)
          }
        }
      }

      pollTask()
      intervalId = setInterval(pollTask, 3000)
    }

    return () => clearInterval(intervalId)
  }, [currentTask])

  useEffect(() => {
    if (outputRef.current) {
      // Scroll to the bottom of the output container when taskOutput changes
      outputRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [taskOutput]);

  const handleCreateTask = async () => {
    if (taskInput && selectedAgent) {
      const newTask = await createTask(taskInput, selectedAgent, selectedAgentVersion, requireApproval)
      if (newTask) {
        setCurrentTask(newTask)
        setTaskInput('')
        setHasInitialResponse(false)
        setShowInstructionsInput(false)
      }
    }
  }

  const handleAddInstructions = () => {
    setShowInstructionsInput(true)
  }

  const handleSubmitInstructions = async () => {
    if (newInstructions && currentTask) {
      const modifiedTask = await modifyTask(currentTask.id, 'instruct', newInstructions);
      if (modifiedTask) {
        setCurrentTask(modifiedTask);
        setNewInstructions('');
        setShowInstructionsInput(false);
      }
    }
  };

  const handleApproveTask = async () => {
    if (currentTask) {
      const modifiedTask = await modifyTask(currentTask.id, 'approve');
      if (modifiedTask) {
        setCurrentTask(null);
        setTaskOutput('');
        setHasInitialResponse(false);
        setShowInstructionsInput(false);
      }
    }
  };

  const handleCancelTask = async () => {
    if (currentTask) {
      const modifiedTask = await modifyTask(currentTask.id, 'cancel');
      if (modifiedTask) {
        setCurrentTask(null);
        setTaskOutput('');
        setHasInitialResponse(false);
        setShowInstructionsInput(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 flex flex-col">
      <Card className="flex-grow flex flex-col shadow-lg border border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-3xl font-bold text-center text-gray-800">AI Task Manager</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex-grow flex flex-col">
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                placeholder="Enter task or instructions"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                className="flex-grow bg-white text-gray-800 placeholder-gray-400 border border-gray-300"
              />
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white text-gray-800 border border-gray-300">
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-800 border border-gray-300">
                  <SelectItem value="hello-world">hello-world</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedAgentVersion} onValueChange={setSelectedAgentVersion}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white text-gray-800 border border-gray-300">
                  <SelectValue placeholder="Select Version" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-800 border border-gray-300">
                  <SelectItem value="0.0.10">0.0.10</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requireApproval"
                  checked={requireApproval}
                  onChange={() => setRequireApproval(!requireApproval)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="requireApproval" className="text-gray-700">Require Approval</label>
              </div>
            </div>
            <Button onClick={handleCreateTask} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              Create New Task
            </Button>
          </div>
          {currentTask && (
            <div className="space-y-4 mb-6">
              <div className="text-lg font-semibold text-gray-700">
                Agent is working on task ID: {currentTask.id}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleAddInstructions} className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white">
                  Add Instructions
                </Button>
                <Button onClick={handleApproveTask} className="flex-grow bg-amber-600 hover:bg-amber-700 text-white">
                  Approve
                </Button>
                <Button onClick={handleCancelTask} className="flex-grow bg-rose-600 hover:bg-rose-700 text-white">
                  Cancel
                </Button>
              </div>
              {showInstructionsInput && (
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter new instructions"
                    value={newInstructions}
                    onChange={(e) => setNewInstructions(e.target.value)}
                    className="flex-grow bg-white text-gray-800 placeholder-gray-400 border border-gray-300"
                  />
                  <Button onClick={handleSubmitInstructions} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Submit
                  </Button>
                </div>
              )}
            </div>
          )}
          {(currentTask && currentTask?.messages?.length > 0) && (
            <Card className="bg-blue-50 border-blue-200 mb-4">
              <CardHeader>
                <CardTitle className="text-blue-800">Agent Response:</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700">{currentTask.messages[currentTask.messages.length - 1].content}</p>
              </CardContent>
            </Card>
          )
          }
          <div className="bg-gray-100 border border-gray-200 rounded p-4 flex-grow overflow-y-auto">
            {isLoading && !hasInitialResponse ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="whitespace-pre-wrap break-words text-sm text-gray-800" ref={outputRef}>
                {taskOutput || 'No task output yet.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
