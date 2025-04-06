
import { Task } from "@/types";

// Cette fonction convertit une tâche de la base de données en objet Task avec des propriétés pour la rétrocompatibilité
export function adaptTaskFromDB(dbTask: any): Task {
  return {
    ...dbTask,
    // Rétrocompatibilité pour les propriétés en camelCase
    requestedBy: dbTask.requested_by,
    requestedByName: "", // Sera rempli plus tard si nécessaire
    requestedDate: dbTask.requested_date,
    helperAssigned: dbTask.helper_assigned
  };
}

// Cette fonction convertit un tableau de tâches de la base de données en tableau d'objets Task
export function adaptTasksFromDB(dbTasks: any[]): Task[] {
  return dbTasks.map(adaptTaskFromDB);
}
