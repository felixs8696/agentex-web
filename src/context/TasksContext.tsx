import { createContext, useContext, useEffect, useState } from 'react';
import { listTasks } from '@/lib/api/tasks';
import { Task } from '@/types/Task';

interface TasksContextProps {
    tasks: Task[];
    selectedTask: Task | null;
    refreshTasks: () => Promise<void>;
    setSelectedTask: (task: Task) => void;
}

// Create the context with default values
const TasksContext = createContext<TasksContextProps>({
    tasks: [],
    selectedTask: null,
    refreshTasks: async () => { },
    setSelectedTask: () => { },
});

// Create a provider to manage tasks
export const TasksProvider = ({ children }: { children: React.ReactNode }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const fetchTasks = async () => {
        try {
            const tasks = await listTasks();
            setTasks(tasks.reverse());
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    return (
        <TasksContext.Provider value={{ tasks, selectedTask, setSelectedTask, refreshTasks: fetchTasks }}>
            {children}
        </TasksContext.Provider>
    );
};

// Create a custom hook for using tasks
export const useTasks = () => useContext(TasksContext);
