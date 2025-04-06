
import { v4 as uuidv4 } from 'uuid';
import { Task } from '@/types';

// Obtenir toutes les tâches du localStorage
export const getAllTasks = (): Task[] => {
  const storedTasks = localStorage.getItem("tasks");
  if (storedTasks) {
    return JSON.parse(storedTasks);
  }
  return [];
};

// Obtenir les tâches d'un utilisateur spécifique
export const getUserTasks = (userId: string, type: "requestedBy" | "helperAssigned"): Task[] => {
  const allTasks = getAllTasks();
  
  if (type === "requestedBy") {
    return allTasks.filter(task => task.requestedBy === userId);
  } else {
    return allTasks.filter(task => task.helperAssigned === userId);
  }
};

// Obtenir les tâches disponibles pour les helpers (tâches en attente)
export const getAvailableTasks = (): Task[] => {
  const allTasks = getAllTasks();
  return allTasks.filter(task => task.status === "pending");
};

// Create a new task in local storage
export const createLocalTask = (task: Omit<Task, "id">): string => {
  const allTasks = getAllTasks();
  
  const newTask: Task = {
    ...task,
    id: uuidv4()
  };
  
  allTasks.push(newTask);
  localStorage.setItem("tasks", JSON.stringify(allTasks));
  
  return newTask.id;
};

// Mettre à jour une tâche existante
export const updateLocalTask = (taskId: string, updates: Partial<Task>): boolean => {
  const allTasks = getAllTasks();
  const taskIndex = allTasks.findIndex(task => task.id === taskId);
  
  if (taskIndex === -1) return false;
  
  allTasks[taskIndex] = { ...allTasks[taskIndex], ...updates };
  localStorage.setItem("tasks", JSON.stringify(allTasks));
  
  return true;
};

// Mettre à jour les points de l'aidant
export const updateHelperPoints = (helperId: string, pointsToAdd: number): number => {
  const currentPoints = parseInt(localStorage.getItem(`helperPoints_${helperId}`) || "0");
  const newPoints = currentPoints + pointsToAdd;
  localStorage.setItem(`helperPoints_${helperId}`, newPoints.toString());
  return newPoints;
};

// Obtenir les points d'un aidant
export const getHelperPoints = (helperId: string): number => {
  return parseInt(localStorage.getItem(`helperPoints_${helperId}`) || "0");
};
