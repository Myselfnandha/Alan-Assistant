
import { ActionPlan, AlanTask, TaskStatus, ThoughtProcess } from "../types";
import { TOOLS } from "./toolRegistry";

/**
 * Layer 6: Action Planning & Decision Layer
 * Parses XML plans from Reasoning Engine and coordinates execution.
 */

export const parseActionPlan = (thoughtProcess: ThoughtProcess): ActionPlan | null => {
    // Find the planner step
    const planStep = thoughtProcess.steps.find(s => s.layer === 'PLANNER');
    if (!planStep) return null;

    const rawPlan = planStep.content;
    const tasks: AlanTask[] = [];
    
    // Regex to extract <step tool="..." params='...'>Desc</step>
    // Note: This is a robust regex for the specific format requested in System Prompt
    const stepRegex = /<step(?:\s+tool="([^"]*)")?(?:\s+params='([^']*)')?>([\s\S]*?)<\/step>/g;
    
    let match;
    let index = 1;

    while ((match = stepRegex.exec(rawPlan)) !== null) {
        let tool = match[1] || 'NONE';
        let paramsRaw = match[2] || '{}';
        let description = match[3];
        let params = {};

        try {
            params = JSON.parse(paramsRaw);
        } catch (e) {
            console.warn("Failed to parse task params", paramsRaw);
        }

        tasks.push({
            id: `TASK_${Date.now()}_${index++}`,
            description: description.trim(),
            tool: tool.toUpperCase(),
            params: params,
            status: TaskStatus.PENDING
        });
    }

    if (tasks.length === 0) return null;

    return {
        id: `PLAN_${Date.now()}`,
        goal: "Execute Complex User Request",
        tasks: tasks,
        status: TaskStatus.PENDING,
        progress: 0
    };
};

export const executeNextTask = async (plan: ActionPlan): Promise<ActionPlan> => {
    const nextTaskIndex = plan.tasks.findIndex(t => t.status === TaskStatus.PENDING);
    if (nextTaskIndex === -1) {
        return { ...plan, status: TaskStatus.COMPLETED, progress: 100 };
    }

    const task = plan.tasks[nextTaskIndex];
    
    // Update to In Progress
    const updatedTasks = [...plan.tasks];
    updatedTasks[nextTaskIndex] = { ...task, status: TaskStatus.IN_PROGRESS };
    
    // Check Tool Registry
    const toolDef = TOOLS[task.tool] || TOOLS['NONE'];
    
    try {
        // EXECUTE (Layer 8 Interface)
        const result = await toolDef.execute(task.params);
        
        updatedTasks[nextTaskIndex] = { 
            ...task, 
            status: TaskStatus.COMPLETED,
            result: result
        };
    } catch (error) {
        updatedTasks[nextTaskIndex] = { 
            ...task, 
            status: TaskStatus.FAILED,
            result: `Error: ${error}`
        };
    }

    // Calculate Progress
    const completed = updatedTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const progress = Math.round((completed / updatedTasks.length) * 100);

    const newStatus = updatedTasks.some(t => t.status === TaskStatus.FAILED) 
        ? TaskStatus.FAILED 
        : (progress === 100 ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS);

    return {
        ...plan,
        tasks: updatedTasks,
        status: newStatus,
        progress
    };
};
