// IMPORT MAP FILE
import * as mapFutx2 from "./stadium/futx2.hbs"
import * as mapFutx3 from "./stadium/futx3.hbs"
import * as mapFutx4 from "./stadium/futx4.hbs"
import * as mapFutx5 from "./stadium/futx5.hbs"
import * as mapFutx7 from "./stadium/futx7.hbs"
import * as mapTraining from "./stadium/training.hbs"
/**
* load stadium map (JSON stringified).
*/
export function loadStadiumData(mapName: string): string {
    let stadiumText: string;
    
    // LINK MAP FILE
    switch (mapName) {
        case 'futx2':
            stadiumText = mapFutx2.stadiumText;
            break;
        case 'futx3':
            stadiumText = mapFutx3.stadiumText;
            break;
        case 'futx4':
            stadiumText = mapFutx4.stadiumText;
            break;
        case 'futx5':
            stadiumText = mapFutx5.stadiumText;
            break;
        case 'futx7':
            stadiumText = mapFutx7.stadiumText;
            break;
        case 'training':
        case 'ready':
            stadiumText = mapTraining.stadiumText;
            break;
        default:
            stadiumText = mapFutx4.stadiumText;
            break;
    }
    
    // Replace ball configuration placeholders with settings values
    // Use default values if settings are not available
    let ballRadius = '6.4';
    let ballColor = '0';
    let ballBCoeff = '0.4';
    let ballInvMass = '1.5';
    let ballDamping = '0.99';
    
    if (typeof window !== 'undefined' && window.gameRoom && window.gameRoom.config && window.gameRoom.config.settings) {
        const settings = window.gameRoom.config.settings;
        ballRadius = settings.ballRadius.toString();
        ballColor = settings.ballColor.toString();
        ballBCoeff = settings.ballBCoeff.toString();
        ballInvMass = settings.ballInvMass.toString();
        ballDamping = settings.ballDamping.toString();
    }
    
    stadiumText = stadiumText
        .replace(/%BALL_RADIUS%/g, ballRadius)
        .replace(/%BALL_COLOR%/g, ballColor)
        .replace(/%BALL_BCOEFF%/g, ballBCoeff)
        .replace(/%BALL_INVMASS%/g, ballInvMass)
        .replace(/%BALL_DAMPING%/g, ballDamping);
    
    return stadiumText;
}