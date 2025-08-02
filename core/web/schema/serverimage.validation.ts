import Joi from 'joi';

export const createImageSchema = Joi.object().keys({
    name: Joi.string().required().min(1).max(100),
    description: Joi.string().required().min(1).max(500),
    ruid: Joi.string().required().min(1).max(50).pattern(/^[a-zA-Z0-9_-]+$/),
    version: Joi.string().optional().default('1.0.0'),
    createdAt: Joi.date().optional().default(() => new Date()),
    config: Joi.object().keys({
        roomName: Joi.string().required(),
        playerName: Joi.string().optional().default('Host'),
        password: Joi.string().optional().allow('', null),
        maxPlayers: Joi.number().required().min(1).max(30),
        public: Joi.boolean().required(),
        noPlayer: Joi.boolean().optional().default(false),
        geo: Joi.object().optional()
    }).required(),
    settings: Joi.object().required(),
    rules: Joi.object().keys({
        ruleName: Joi.string().optional(),
        ruleDescription: Joi.string().optional(),
        requisite: Joi.object().keys({
            minimumPlayers: Joi.number().required(),
            eachTeamPlayers: Joi.number().required(),
            timeLimit: Joi.number().required(),
            scoreLimit: Joi.number().required(),
            teamLock: Joi.boolean().required()
        }).required(),
        autoAdmin: Joi.boolean().required(),
        autoOperating: Joi.boolean().required(),
        statsRecord: Joi.boolean().required(),
        defaultMapName: Joi.string().required(),
        readyMapName: Joi.string().required(),
        customJSONOptions: Joi.string().optional().allow(null, '').default('{}')
    }).required(),
    helo: Joi.object().required(),
    commands: Joi.object().required(),
    stadiums: Joi.object().keys({
        default: Joi.string().required(),
        ready: Joi.string().required()
    }).required(),
    webhooks: Joi.object().keys({
        discord: Joi.object().keys({
            replayUrl: Joi.string().optional().allow(null, '').pattern(/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+$/),
            adminCallUrl: Joi.string().optional().allow(null, '').pattern(/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+$/),
            replayUpload: Joi.boolean().required()
        }).optional()
    }).optional()
});

export const deployRequestSchema = Joi.object().keys({
    imageId: Joi.string().required(),
    token: Joi.string().required(),
    overrides: Joi.object().keys({
        roomName: Joi.string().optional(),
        password: Joi.string().optional().allow(null, ''),
        maxPlayers: Joi.number().optional().min(1).max(30),
        public: Joi.boolean().optional()
    }).optional()
});