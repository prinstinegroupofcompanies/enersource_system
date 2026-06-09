export interface ProjectSummary {
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  totalProjects: number;
  totalBudget: number;
  totalSpent: number;
  budgetPerformance: number;
  recent: {
    id: string;
    projectNumber: string;
    title: string;
    status: string;
    customer?: string;
    progressPercent: number;
    isDelayed: boolean;
  }[];
}

export interface ProjectListItem {
  id: string;
  projectNumber: string;
  title: string;
  type: string;
  status: string;
  budget: number;
  actualCost: number;
  progressPercent: number;
  targetEndDate?: string;
  isDelayed: boolean;
  budgetUsedPercent: number;
  customer?: { companyName: string };
  _count?: { tasks: number; milestones: number };
}

export interface ProjectDetail extends ProjectListItem {
  description?: string;
  location?: string;
  startDate?: string;
  budgetRemaining: number;
  taskProgress: number;
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  materialUsage: ProjectMaterial[];
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedToId?: string;
  dueDate?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate?: string;
  status: string;
  completedAt?: string;
}

export interface ProjectMaterial {
  id: string;
  description: string;
  quantity: number;
  unitCost: number;
  amount: number;
  usedAt: string;
  inventoryItem?: { sku: string; name: string };
}
