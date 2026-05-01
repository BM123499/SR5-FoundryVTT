import { FLAGS, SYSTEM_NAME } from '@/module/constants';
import {
    WALL_MOVEMENT_RESTRICTIONS,
    WALL_PRESETS,
    type WallMovementRestriction,
    type WallPreset
} from './types';

const LINE_EPSILON = 0.0001;

export const normalizeWallPreset = (wallPreset: unknown): WallPreset => {
    if (typeof wallPreset !== 'string') return 'none';
    return (WALL_PRESETS as readonly string[]).includes(wallPreset) ? wallPreset as WallPreset : 'none';
};

type WallLike = WallDocument.Implementation | foundry.canvas.placeables.Wall;

export const getWallPreset = (wall: WallLike | null | undefined): WallPreset => {
    if (!wall) return 'none';
    const document = wall instanceof WallDocument ? wall : wall.document;
    return normalizeWallPreset(document.getFlag(SYSTEM_NAME, FLAGS.WallPreset));
};

export const normalizeWallMovementRestriction = (value: unknown): WallMovementRestriction => {
    if (typeof value !== 'string') return 'none';
    return (WALL_MOVEMENT_RESTRICTIONS as readonly string[]).includes(value)
        ? value as WallMovementRestriction
        : 'none';
};

export const getWallMovementRestriction = (wall: WallLike | null | undefined): WallMovementRestriction => {
    if (!wall) return 'none';
    const document = wall instanceof WallDocument ? wall : wall.document;

    const flagRestriction = normalizeWallMovementRestriction(document.getFlag(SYSTEM_NAME, FLAGS.WallMovementRestriction));
    if (flagRestriction !== 'none') return flagRestriction;

    return document.move === CONST.WALL_MOVEMENT_TYPES.NORMAL ? 'physical' : 'none';
};

export const getWallMovementRestrictionUpdate = (
    movementRestriction: WallMovementRestriction
): Partial<WallDocument.UpdateData> => {
    const blocksPhysicalMovement = movementRestriction === 'physical' || movementRestriction === 'astral_physical';

    return {
        move: blocksPhysicalMovement ? CONST.WALL_MOVEMENT_TYPES.NORMAL : CONST.WALL_MOVEMENT_TYPES.NONE
    };
};

export const getWallPresetUpdate = (wallPreset: WallPreset): Partial<WallDocument.UpdateData> => {
    if (wallPreset === 'physicalBarrier') {
        return {
            move: CONST.WALL_MOVEMENT_TYPES.NORMAL,
            sight: CONST.WALL_SENSE_TYPES.LIMITED,
            light: CONST.WALL_SENSE_TYPES.LIMITED,
            flags: {
                [SYSTEM_NAME]: {
                    [FLAGS.WallMovementRestriction]: 'astral_physical'
                }
            }
        };
    }

    if (wallPreset === 'manaBarrier') {
        return {
            move: CONST.WALL_MOVEMENT_TYPES.NONE,
            sight: CONST.WALL_SENSE_TYPES.NONE,
            light: CONST.WALL_SENSE_TYPES.NONE,
            flags: {
                [SYSTEM_NAME]: {
                    [FLAGS.WallMovementRestriction]: 'astral'
                }
            }
        };
    }

    return {};
};

type Point = { x: number; y: number };

const wallEndpoints = (wall: WallDocument.Implementation): [Point, Point] | null => {
    const [x1, y1, x2, y2] = wall.c;
    if ([x1, y1, x2, y2].some(value => !Number.isFinite(value))) return null;

    return [
        { x: x1, y: y1 },
        { x: x2, y: y2 }
    ];
};

const wallIntersectsLine = (wall: WallDocument.Implementation, origin: Point, destination: Point): boolean => {
    const segment = wallEndpoints(wall);
    if (!segment) return false;
    const [start, end] = segment;

    const intersection = foundry.utils.lineSegmentIntersection(origin, destination, start, end);
    if (!intersection) return false;

    return intersection.t0 > LINE_EPSILON && intersection.t0 < (1 - LINE_EPSILON);
};

const sceneWalls = (): WallDocument.Implementation[] => {
    if (!canvas?.ready) return [];
    return (canvas.walls?.placeables ?? []).map(wall => wall.document);
};

export const getActiveWallPresetTool = (user: User.Implementation | null | undefined = game.user): WallPreset => {
    if (!user) return 'none';
    return normalizeWallPreset(user.getFlag(SYSTEM_NAME, FLAGS.ActiveWallPresetTool));
};

export const isAstralLineBlocked = (origin: Point, destination: Point): boolean => {
    for (const wall of sceneWalls()) {
        if (wallIntersectsLine(wall, origin, destination)) return true;
    }
    return false;
};

export const isPhysicalBarrierLineBlocked = (origin: Point, destination: Point): boolean => {
    for (const wall of sceneWalls()) {
        if (getWallPreset(wall) !== 'physicalBarrier') continue;
        if (wallIntersectsLine(wall, origin, destination)) return true;
    }
    return false;
};

export const isAstralMovementLineBlocked = (origin: Point, destination: Point): boolean => {
    for (const wall of sceneWalls()) {
        const movementRestriction = getWallMovementRestriction(wall);
        if (!['astral', 'astral_physical'].includes(movementRestriction)) continue;
        if (wallIntersectsLine(wall, origin, destination)) return true;
    }
    return false;
};
