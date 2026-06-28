export type QuestStatus = "available" | "active" | "completed";

export interface QuestObjective {
  description: string;
  type: "kill" | "collect" | "talk";
  targetId?: string;
  targetCount?: number;
  currentCount: number;
}

export interface QuestReward {
  xp?: number;
  items?: Array<{ id: string; name: string; type: string; quantity?: number }>;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  giver: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
  status: QuestStatus;
}

export class QuestLog {
  private quests = new Map<string, Quest>();

  add(quest: Quest): void {
    this.quests.set(quest.id, quest);
  }

  get(questId: string): Quest | undefined {
    return this.quests.get(questId);
  }

  getAll(): Quest[] {
    return Array.from(this.quests.values());
  }

  getActive(): Quest[] {
    return this.getAll().filter((q) => q.status === "active");
  }

  getCompleted(): Quest[] {
    return this.getAll().filter((q) => q.status === "completed");
  }

  getAvailable(): Quest[] {
    return this.getAll().filter((q) => q.status === "available");
  }

  accept(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== "available") return false;
    quest.status = "active";
    return true;
  }

  updateObjective(questId: string, objectiveIndex: number, increment = 1): boolean {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== "active") return false;

    const objective = quest.objectives[objectiveIndex];
    if (!objective) return false;

    objective.currentCount = Math.min(
      (objective.targetCount ?? 1),
      objective.currentCount + increment,
    );

    return this.checkCompletion(questId);
  }

  incrementKillObjective(questId: string, enemyName: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest || quest.status !== "active") return false;

    let updated = false;
    for (let i = 0; i < quest.objectives.length; i++) {
      const obj = quest.objectives[i];
      if (obj.type === "kill" && obj.targetId === enemyName) {
        obj.currentCount = Math.min(obj.targetCount ?? 1, obj.currentCount + 1);
        updated = true;
      }
    }

    if (updated) {
      return this.checkCompletion(questId);
    }
    return false;
  }

  private checkCompletion(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest) return false;

    const allComplete = quest.objectives.every(
      (obj) => obj.currentCount >= (obj.targetCount ?? 1),
    );

    if (allComplete && quest.status === "active") {
      quest.status = "completed";
      return true;
    }

    return false;
  }

  isCompleted(questId: string): boolean {
    const quest = this.quests.get(questId);
    return quest != null && quest.status === "completed";
  }

  canTurnIn(questId: string): boolean {
    return this.isCompleted(questId);
  }
}
