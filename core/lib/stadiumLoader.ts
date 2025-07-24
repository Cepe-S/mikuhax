// IMPORT MAP FILE
import * as mapFutx2 from "./stadium/futx2.hbs"
import * as mapFutx3 from "./stadium/futx3.hbs"
import * as mapFutx4 from "./stadium/futx4.hbs"
import * as mapFutx5 from "./stadium/futx5.hbs"
import * as mapFutx7 from "./stadium/futx7.hbs"

/**
* load stadium map (JSON stringified).
*/
export function loadStadiumData(mapName: string): string {
    // LINK MAP FILE
    switch (mapName) {
        case 'futx2':
            return mapFutx2.stadiumText;
        case 'futx3':
            return mapFutx3.stadiumText;
        case 'futx4':
            return mapFutx4.stadiumText;
        case 'futx5':
            return mapFutx5.stadiumText;
        case 'futx7':
            return mapFutx7.stadiumText;

        default:
            return mapFutx4.stadiumText;
    }
}