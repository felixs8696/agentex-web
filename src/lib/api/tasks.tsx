export const createTask = async (
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

export const getTask = async (taskId: string) => {
    try {
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

export const listTasks = async () => {
    try {
        const res = await fetch(`/api/list-tasks`);
        if (!res.ok) {
            throw new Error(`Failed to fetch tasks: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log("Tasks fetched:", data);
        return data;
    } catch (error) {
        console.error("Error in listTasks:", error);
        return null;
    }
}

export const modifyTask = async (taskId: string, modificationType: string, prompt = '') => {
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