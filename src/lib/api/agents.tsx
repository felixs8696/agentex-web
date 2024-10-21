export const getAgent = async (agentId: string) => {
    try {
        const res = await fetch(`/api/get-agent/${agentId}`);
        if (!res.ok) {
            throw new Error(`Failed to fetch agent: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log("Agent fetched:", data);
        return data;
    } catch (error) {
        console.error("Error in getAgent:", error);
        return null;
    }
}