import { FLAGS, SYSTEM_NAME } from '@/module/constants';
import {
    WALL_PRESETS,
    WALL_RESTRICTIONS,
    type WallPreset,
    type WallRestriction,
    type WallSenseRestrictionChannel
} from './types';

const LINE_EPSILON = 0.0001;

const WALL_RESTRICTION_FLAG_BY_CHANNEL = {
    move: FLAGS.WallMoveRestriction,
    sight: FLAGS.WallSightRestriction,
    light: FLAGS.WallLightRestriction,
    sound: FLAGS.WallSoundRestriction
} as const;

const WALL_DEFAULT_FLAG_BY_CHANNEL = {
    sight: FLAGS.WallSightDefault,
    light: FLAGS.WallLightDefault,
    sound: FLAGS.WallSoundDefault
} as const;

type WallLike = WallDocument.Implementation | foundry.canvas.placeables.Wall;
type Point = { x: number; y: number };
export type WallSenseType = typeof CONST.WALL_SENSE_TYPES[keyof typeof CONST.WALL_SENSE_TYPES];
const WALL_SENSE_TYPES = new Set(Object.values(CONST.WALL_SENSE_TYPES) as WallSenseType[]);

const wallDocument = (wall: WallLike): WallDocument.Implementation => {
    return wall instanceof WallDocument ? wall : wall.document;
};

export const normalizeWallPreset = (wallPreset: unknown): WallPreset => {
    if (typeof wallPreset !== 'string') return 'none';
    return (WALL_PRESETS as readonly string[]).includes(wallPreset) ? wallPreset as WallPreset : 'none';
};

export const normalizeWallRestriction = (restriction: unknown): WallRestriction => {
    if (typeof restriction !== 'string') return 'none';
    return (WALL_RESTRICTIONS as readonly string[]).includes(restriction)
        ? restriction as WallRestriction
        : 'none';
};

export const restrictionBlocksPhysical = (restriction: WallRestriction): boolean => {
    return restriction === 'physical' || restriction === 'astral_physical';
};

export const restrictionBlocksAstral = (restriction: WallRestriction): boolean => {
    return restriction === 'astral' || restriction === 'astral_physical';
};

const isWallSenseType = (value: unknown): value is WallSenseType => {
    return WALL_SENSE_TYPES.has(value as WallSenseType);
};

export const normalizeWallSenseDefault = (
    value: unknown,
    fallback: WallSenseType = CONST.WALL_SENSE_TYPES.LIMITED
): WallSenseType => {
    return isWallSenseType(value) ? value : fallback;
};

export const deriveWallMoveRestrictionFromNative = (move: unknown): WallRestriction => {
    return move === CONST.WALL_MOVEMENT_TYPES.NONE ? 'none' : 'astral_physical';
};

export const deriveWallSenseRestrictionFromNative = (senseType: unknown): WallRestriction => {
    return senseType === CONST.WALL_SENSE_TYPES.NONE ? 'none' : 'astral_physical';
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
        setWallFlag(update, FLAGS.WallMoveRestriction, 'astral_physical');
        setWallFlag(update, FLAGS.WallSightRestriction, 'astral_physical');
        setWallFlag(update, FLAGS.WallLightRestriction, 'astral_physical');
        setWallFlag(update, FLAGS.WallSightDefault, CONST.WALL_SENSE_TYPES.LIMITED);
        setWallFlag(update, FLAGS.WallLightDefault, CONST.WALL_SENSE_TYPES.LIMITED);
    }

    if (wallPreset === 'manaBarrier') {
        setWallFlag(update, FLAGS.WallMoveRestriction, 'astral');
        setWallFlag(update, FLAGS.WallSightRestriction, 'astral');
        setWallFlag(update, FLAGS.WallLightRestriction, 'astral');
        setWallFlag(update, FLAGS.WallSightDefault, CONST.WALL_SENSE_TYPES.LIMITED);
        setWallFlag(update, FLAGS.WallLightDefault, CONST.WALL_SENSE_TYPES.LIMITED);
    }

    return update;
};

export const getWallMoveRestriction = (wall: WallLike | null | undefined): WallRestriction => {
    if (!wall) return 'none';
    const document = wallDocument(wall);
    const raw = document.getFlag(SYSTEM_NAME, WALL_RESTRICTION_FLAG_BY_CHANNEL.move);
    if (raw === undefined) return deriveWallMoveRestrictionFromNative(document.move);
    return normalizeWallRestriction(raw);
};

export const getWallSenseRestriction = (
    wall: WallLike | null | undefined,
    channel: WallSenseRestrictionChannel
): WallRestriction => {
    if (!wall) return 'none';
    const document = wallDocument(wall);
    const raw = document.getFlag(SYSTEM_NAME, WALL_RESTRICTION_FLAG_BY_CHANNEL[channel]);
    if (raw === undefined) return deriveWallSenseRestrictionFromNative(document[channel]);
    return normalizeWallRestriction(raw);
};

export const getWallSenseDefault = (
    wall: WallLike | null | undefined,
    channel: WallSenseRestrictionChannel
): WallSenseType => {
    if (!wall) return CONST.WALL_SENSE_TYPES.LIMITED;

    const document = wallDocument(wall);
    const nativeDefault = normalizeWallSenseDefault(document[channel], CONST.WALL_SENSE_TYPES.LIMITED);
    const raw = document.getFlag(SYSTEM_NAME, WALL_DEFAULT_FLAG_BY_CHANNEL[channel]);
    if (raw === undefined) return nativeDefault;
    return normalizeWallSenseDefault(raw, nativeDefault);
};

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

export const isAstralLineBlocked = (
    origin: Point,
    destination: Point,
    channel: WallSenseRestrictionChannel = 'sight'
): boolean => {
    for (const wall of sceneWalls()) {
        const restriction = getWallSenseRestriction(wall, channel);
        if (!restrictionBlocksAstral(restriction)) continue;

        const defaultSense = getWallSenseDefault(wall, channel);
        if (defaultSense === CONST.WALL_SENSE_TYPES.NONE) continue;

        if (wallIntersectsLine(wall, origin, destination)) return true;
    }
    return false;
};

export const isAstralMovementLineBlocked = (origin: Point, destination: Point): boolean => {
    for (const wall of sceneWalls()) {
        const restriction = getWallMoveRestriction(wall);
        if (!restrictionBlocksAstral(restriction)) continue;
        if (wallIntersectsLine(wall, origin, destination)) return true;
    }
    return false;
};
