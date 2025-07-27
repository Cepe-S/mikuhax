import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";
import { PlayerObject } from "../../model/GameObject/PlayerObject";

export function cmdTier(byPlayer: PlayerObject): void {
    var placeholder = {
        tierAvatarNew: window.gameRoom.config.HElo.avatar.avatar_tier_new
        ,tierAvatar1: window.gameRoom.config.HElo.avatar.avatar_tier_1
        ,tierAvatar2: window.gameRoom.config.HElo.avatar.avatar_tier_2
        ,tierAvatar3: window.gameRoom.config.HElo.avatar.avatar_tier_3
        ,tierAvatar4: window.gameRoom.config.HElo.avatar.avatar_tier_4
        ,tierAvatar5: window.gameRoom.config.HElo.avatar.avatar_tier_5
        ,tierAvatar6: window.gameRoom.config.HElo.avatar.avatar_tier_6
        ,tierAvatarChallenger: window.gameRoom.config.HElo.avatar.avatar_challenger
        ,tierCutoff1: window.gameRoom.config.HElo.tier.class_tier_2
        ,tierCutoff2: window.gameRoom.config.HElo.tier.class_tier_3
        ,tierCutoff3: window.gameRoom.config.HElo.tier.class_tier_4
        ,tierCutoff4: window.gameRoom.config.HElo.tier.class_tier_5
        ,tierCutoff5: window.gameRoom.config.HElo.tier.class_tier_6
        ,tierCutoff6: window.gameRoom.config.HElo.tier.class_tier_7
        ,placementMatches: window.gameRoom.config.HElo.factor.placement_match_chances
    }
    window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.tier, placeholder), byPlayer.id, 0x479947, "normal", 1);
}
