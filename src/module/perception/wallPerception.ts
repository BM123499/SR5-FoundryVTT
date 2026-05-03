import { FLAGS, SYSTEM_NAME } from '@/module/constants';
import {
    WALL_PRESETS,
    type WallPreset,
    type WallSenseRestrictionChannel
} from './types';

const LINE_EPSILON = 0.0001;

const WALL_ASTRAL_FLAG_BY_CHANNEL = {
    move: FLAGS.WallAstralMove,
    sight: FLAGS.WallAstralSight,
    light: FLAGS.WallAstralLight,
    sound: FLAGS.WallAstralSound
} as const;

type WallLike = WallDocument.Implementation | foundry.canvas.placeables.Wall;
type Point = { x: number; y: number };
export type WallSenseType = typeof CONST.WALL_SENSE_TYPES[keyof typeof CONST.WALL_SENSE_TYPES];
export type WallMovementType = typeof CONST.WALL_MOVEMENT_TYPES[keyof typeof CONST.WALL_MOVEMENT_TYPES];
export type WallDirectionType = typeof CONST.WALL_DIRECTIONS[keyof typeof CONST.WALL_DIRECTIONS];
const WALL_SENSE_TYPES = new Set(Object.values(CONST.WALL_SENSE_TYPES) as WallSenseType[]);
const WALL_MOVEMENT_TYPES = new Set(Object.values(CONST.WALL_MOVEMENT_TYPES) as WallMovementType[]);
const WALL_DIRECTION_TYPES = new Set(Object.values(CONST.WALL_DIRECTIONS) as WallDirectionType[]);

const wallDocument = (wall: WallLike): WallDocument.Implementation => {
    return wall instanceof WallDocument ? wall : wall.document;
};

const isWallSenseType = (value: unknown): value is WallSenseType => {
    return WALL_SENSE_TYPES.has(value as WallSenseType);
};

const isWallMovementType = (value: unknown): value is WallMovementType => {
    return WALL_MOVEMENT_TYPES.has(value as WallMovementType);
};

const isWallDirectionType = (value: unknown): value is WallDirectionType => {
    return WALL_DIRECTION_TYPES.has(value as WallDirectionType);
};

export const normalizeWallSenseType = (
    value: unknown,
    fallback: WallSenseType = CONST.WALL_SENSE_TYPES.NONE
): WallSenseType => {
    if (isWallSenseType(value)) return value;
    if (typeof value === 'string' && value !== '') {
        const parsed = Number(value);
        if (isWallSenseType(parsed)) return parsed;
    }
    return fallback;
};

export const normalizeWallMovementType = (
    value: unknown,
    fallback: WallMovementType = CONST.WALL_MOVEMENT_TYPES.NONE
): WallMovementType => {
    if (isWallMovementType(value)) return value;
    if (typeof value === 'string' && value !== '') {
        const parsed = Number(value);
        if (isWallMovementType(parsed)) return parsed;
    }
    return fallback;
};

export const normalizeWallDirectionType = (
    value: unknown,
    fallback: WallDirectionType = CONST.WALL_DIRECTIONS.BOTH
): WallDirectionType => {
    if (isWallDirectionType(value)) return value;
    if (typeof value === 'string' && value !== '') {
        const parsed = Number(value);
        if (isWallDirectionType(parsed)) return parsed;
    }
    return fallback;
};

export const normalizeWallPreset = (wallPreset: unknown): WallPreset => {
    if (typeof wallPreset !== 'string') return 'none';
    return (WALL_PRESETS as readonly string[]).includes(wallPreset) ? wallPreset as WallPreset : 'none';
};

export const getWallPreset = (wall: WallLike | null | undefined): WallPreset => {
    if (!wall) return 'none';
    const document = wallDocument(wall);
    return normalizeWallPreset(document.getFlag(SYSTEM_NAME, FLAGS.WallPreset));
};

const setWallFlag = (update: WallDocument.UpdateData, key: string, value: unknown) => {
    foundry.utils.setProperty(update, `flags.${SYSTEM_NAME}.${key}`, value);
};

export const getWallPresetUpdate = (wallPreset: WallPreset): Partial<WallDocument.UpdateData> => {
    const update: WallDocument.UpdateData = {};

    if (wallPreset === 'physicalBarrier') {
        update.move = CONST.WALL_MOVEMENT_TYPES.NORMAL;
        update.sight = CONST.WALL_SENSE_TYPES.LIMITED;
        update.light = CONST.WALL_SENSE_TYPES.LIMITED;

        setWallFlag(update, FLAGS.WallAstralMove, CONST.WALL_MOVEMENT_TYPES.NORMAL);
        setWallFlag(update, FLAGS.WallAstralSight, CONST.WALL_SENSE_TYPES.LIMITED);
        setWallFlag(update, FLAGS.WallAstralLight, CONST.WALL_SENSE_TYPES.LIMITED);
    }

    if (wallPreset === 'manaBarrier') {
        update.move = CONST.WALL_MOVEMENT_TYPES.NONE;
        update.sight = CONST.WALL_SENSE_TYPES.NONE;
        update.light = CONST.WALL_SENSE_TYPES.NONE;

        setWallFlag(update, FLAGS.WallAstralMove, CONST.WALL_MOVEMENT_TYPES.NORMAL);
        setWallFlag(update, FLAGS.WallAstralSight, CONST.WALL_SENSE_TYPES.LIMITED);
        setWallFlag(update, FLAGS.WallAstralLight, CONST.WALL_SENSE_TYPES.LIMITED);
    }

    return update;
};

export const getWallAstralMoveType = (wall: WallLike | null | undefined): WallMovementType => {
    if (!wall) return CONST.WALL_MOVEMENT_TYPES.NONE;

    const document = wallDocument(wall);

    const explicitAstralMove = document.getFlag(SYSTEM_NAME, WALL_ASTRAL_FLAG_BY_CHANNEL.move);
    if (explicitAstralMove !== undefined) return normalizeWallMovementType(explicitAstralMove, CONST.WALL_MOVEMENT_TYPES.NONE);

    return normalizeWallMovementType(document.move, CONST.WALL_MOVEMENT_TYPES.NONE);
};

export const getWallAstralSenseType = (
    wall: WallLike | null | undefined,
    channel: WallSenseRestrictionChannel
): WallSenseType => {
    if (!wall) return CONST.WALL_SENSE_TYPES.NONE;

    const document = wallDocument(wall);

    const explicitAstralSense = document.getFlag(SYSTEM_NAME, WALL_ASTRAL_FLAG_BY_CHANNEL[channel]);
    if (explicitAstralSense !== undefined) return normalizeWallSenseType(explicitAstralSense, CONST.WALL_SENSE_TYPES.NONE);

    return normalizeWallSenseType(document[channel], CONST.WALL_SENSE_TYPES.NONE);
};

export const getWallAstralDirection = (wall: WallLike | null | undefined): WallDirectionType => {
    if (!wall) return CONST.WALL_DIRECTIONS.BOTH;

    const document = wallDocument(wall);
    const explicitAstralDirection = document.getFlag(SYSTEM_NAME, FLAGS.WallAstralDirection);
    if (explicitAstralDirection !== undefined) {
        return normalizeWallDirectionType(explicitAstralDirection, CONST.WALL_DIRECTIONS.BOTH);
    }

    return normalizeWallDirectionType(document.dir, CONST.WALL_DIRECTIONS.BOTH);
};

const wallEndpoints = (wall: WallDocument.Implementation): [Point, Point] | null => {
    const [x1, y1, x2, y2] = wall.c;
    if ([x1, y1, x2, y2].some(value => !Number.isFinite(value))) return null;

    return [
        { x: x1, y: y1 },
        { x: x2, y: y2 }
    ];
};

const orientPointAgainstWall = (wall: WallDocument.Implementation, point: Point): WallDirectionType => {
    const segment = wallEndpoints(wall);
    if (!segment) return CONST.WALL_DIRECTIONS.BOTH;

    const [start, end] = segment;
    const cross = ((end.x - start.x) * (point.y - start.y)) - ((end.y - start.y) * (point.x - start.x));
    if (Math.abs(cross) <= LINE_EPSILON) return CONST.WALL_DIRECTIONS.BOTH;

    return cross > 0 ? CONST.WALL_DIRECTIONS.LEFT : CONST.WALL_DIRECTIONS.RIGHT;
};

const wallBlocksByAstralDirection = (
    wall: WallDocument.Implementation,
    origin: Point,
    wallDirection: WallDirectionType
): boolean => {
    if (wallDirection === CONST.WALL_DIRECTIONS.BOTH) return true;
    return orientPointAgainstWall(wall, origin) === wallDirection;
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

export const isAstralLineBlocked = (
    origin: Point,
    destination: Point,
    channel: WallSenseRestrictionChannel = 'sight'
): boolean => {
    for (const wall of sceneWalls()) {
        const astralSense = getWallAstralSenseType(wall, channel);
        if (astralSense === CONST.WALL_SENSE_TYPES.NONE) continue;
        const astralDirection = getWallAstralDirection(wall);
        if (!wallBlocksByAstralDirection(wall, origin, astralDirection)) continue;
        if (wallIntersectsLine(wall, origin, destination)) return true;
    }
    return false;
};

export const isAstralMovementLineBlocked = (origin: Point, destination: Point): boolean => {
    for (const wall of sceneWalls()) {
        const astralMove = getWallAstralMoveType(wall);
        if (astralMove === CONST.WALL_MOVEMENT_TYPES.NONE) continue;
        const astralDirection = getWallAstralDirection(wall);
        if (!wallBlocksByAstralDirection(wall, origin, astralDirection)) continue;
        if (wallIntersectsLine(wall, origin, destination)) return true;
    }
    return false;
};
