import { TeamID } from "../../model/GameObject/TeamID";

export async function onTeamGoalListener(team: TeamID): Promise<void> {
    window.gameRoom.logger.i('onTeamGoal', `Team ${team === TeamID.Red ? 'Red' : 'Blue'} scored a goal.`);
    
    // Simple goal tracking - just log it
    // More complex stats tracking removed for simplicity
}