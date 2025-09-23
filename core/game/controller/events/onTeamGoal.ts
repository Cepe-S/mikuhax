import { TeamID } from "../../model/GameObject/TeamID";
import { MatchEvent } from "../../model/GameObject/MatchEvent";
import { MatchEventHolder } from "../../model/GameObject/MatchEventHolder";
import { getUnixTimestamp } from "../Statistics";

export async function onTeamGoalListener(team: TeamID): Promise<void> {
    window.gameRoom.logger.i('onTeamGoal', `Team ${team === TeamID.Red ? 'Red' : 'Blue'} scored a goal.`);
    
    // Get ball stack for goal tracking
    const ballStack = window.gameRoom.ballStack;
    if (!ballStack) return;
    
    const scores = window.gameRoom._room.getScores();
    if (!scores) return;
    
    // Get the last player who touched the ball
    const lastTouchPlayerId = ballStack.getLastTouchPlayerID();
    if (!lastTouchPlayerId || !window.gameRoom.playerList.has(lastTouchPlayerId)) return;
    
    const scorerPlayer = window.gameRoom.playerList.get(lastTouchPlayerId)!;
    
    // Check if it's an own goal
    const isOwnGoal = scorerPlayer.team !== team;
    
    if (isOwnGoal) {
        // Own goal
        scorerPlayer.matchRecord.ogs++;
        window.gameRoom.logger.i('onTeamGoal', `Own goal by ${scorerPlayer.name}#${scorerPlayer.id}`);
        
        // Create match event holder for own goal
        const matchEventHolder = {
            type: 'ownGoal' as const,
            playerAuth: scorerPlayer.auth,
            playerTeamId: scorerPlayer.team,
            matchTime: scores.time || 0,
            assistPlayerAuth: undefined
        };
        
        window.gameRoom.matchEventsHolder.push(matchEventHolder);
        
        // Create match event for database
        const matchEvent = {
            matchId: `match_${Date.now()}`,
            playerAuth: scorerPlayer.auth,
            playerTeamId: scorerPlayer.team,
            matchTime: scores.time || 0,
            timestamp: getUnixTimestamp(),
            eventType: 'ownGoal' as const
        };
        
        // Save to database
        try {
            await window._createMatchEventDB(window.gameRoom.config._RUID, matchEvent);
        } catch (error) {
            window.gameRoom.logger.w('onTeamGoal', `Failed to save own goal event: ${error}`);
        }
    } else {
        // Regular goal
        scorerPlayer.matchRecord.goals++;
        
        // Simple assist detection - check if there was a pass before the goal
        let assistPlayer = null;
        if (ballStack.passJudgment(team)) {
            // This was a pass play, but we need a more sophisticated way to detect assists
            // For now, we'll skip assist detection and just count the goal
        }
        
        window.gameRoom.logger.i('onTeamGoal', `Goal by ${scorerPlayer.name}#${scorerPlayer.id}${assistPlayer ? ` (assist by ${assistPlayer.name}#${assistPlayer.id})` : ''}`);
        
        // Create match event holder for goal
        const matchEventHolder = {
            type: 'goal' as const,
            playerAuth: scorerPlayer.auth,
            playerTeamId: scorerPlayer.team,
            matchTime: scores.time || 0,
            assistPlayerAuth: assistPlayer?.auth
        };
        
        window.gameRoom.matchEventsHolder.push(matchEventHolder);
        
        // Create match event for database
        const matchEvent = {
            matchId: `match_${Date.now()}`,
            playerAuth: scorerPlayer.auth,
            playerTeamId: scorerPlayer.team,
            matchTime: scores.time || 0,
            timestamp: getUnixTimestamp(),
            eventType: 'goal' as const
        };
        
        // Save to database
        try {
            await window._createMatchEventDB(window.gameRoom.config._RUID, matchEvent);
        } catch (error) {
            window.gameRoom.logger.w('onTeamGoal', `Failed to save goal event: ${error}`);
        }
    }
}