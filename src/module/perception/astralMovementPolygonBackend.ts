import { FLAGS, SYSTEM_NAME } from '@/module/constants';
import { resolveTokenPerceptionState } from './perceptionState';
import { normalizeWallDirectionType, normalizeWallMovementType } from './wallPerception';

type MoveBackendClass = CONFIG.Canvas.PolygonBackends['move'];

let originalMovePolygonBackend: MoveBackendClass | null = null;

const getSourceToken = (
    source: foundry.canvas.sources.PointMovementSource.Any | undefined
): foundry.canvas.placeables.Token | null => {
    const object = source?.object;
    return object instanceof Token ? object : null;
};

const getEdgeWallDocument = (
    edge: foundry.canvas.geometry.edges.Edge
): WallDocument.Implementation | null => {
    const edgeWall = edge.object;
    if (!(edgeWall instanceof foundry.canvas.placeables.Wall)) return null;
    return edgeWall.document;
};

const getExplicitAstralMoveType = (wallDocument: WallDocument.Implementation) => {
    const explicitAstralMove = wallDocument.getFlag(SYSTEM_NAME, FLAGS.WallAstralMove);
    return normalizeWallMovementType(explicitAstralMove, CONST.WALL_MOVEMENT_TYPES.NONE);
};

const getEffectiveAstralDirection = (wallDocument: WallDocument.Implementation) => {
    const explicitAstralDirection = wallDocument.getFlag(SYSTEM_NAME, FLAGS.WallAstralDirection);
    return normalizeWallDirectionType(explicitAstralDirection, CONST.WALL_DIRECTIONS.BOTH);
};

export class SR5AstralMovementPolygonBackend extends foundry.canvas.geometry.ClockwiseSweepPolygon {
    protected override _testEdgeInclusion(
        edge: foundry.canvas.geometry.edges.Edge,
        edgeTypes: foundry.canvas.geometry.ClockwiseSweepPolygon.EdgeTypesConfiguration
    ): boolean {
        const sourceToken = getSourceToken(this.config.source as foundry.canvas.sources.PointMovementSource.Any | undefined);
        if (!sourceToken) return super._testEdgeInclusion(edge, edgeTypes);

        const perceptionState = resolveTokenPerceptionState(sourceToken.document);
        if (!perceptionState.isProjecting) return super._testEdgeInclusion(edge, edgeTypes);

        const wallDocument = getEdgeWallDocument(edge);
        if (!wallDocument) return super._testEdgeInclusion(edge, edgeTypes);

        const astralMove = getExplicitAstralMoveType(wallDocument);
        if (astralMove === CONST.WALL_MOVEMENT_TYPES.NONE) return false;

        const astralDirection = getEffectiveAstralDirection(wallDocument);

        const originalMove = edge.move;
        const originalDirection = edge.direction;
        edge.move = astralMove as unknown as typeof edge.move;
        edge.direction = astralDirection as typeof edge.direction;

        try {
            return super._testEdgeInclusion(edge, edgeTypes);
        } finally {
            edge.move = originalMove;
            edge.direction = originalDirection;
        }
    }
}

export const registerSR5AstralMovementPolygonBackend = (): void => {
    const currentMoveBackend = CONFIG.Canvas.polygonBackends.move;
    const sr5MoveBackend = SR5AstralMovementPolygonBackend as unknown as MoveBackendClass;
    if (currentMoveBackend === sr5MoveBackend) return;

    originalMovePolygonBackend ??= currentMoveBackend;
    CONFIG.Canvas.polygonBackends.move = sr5MoveBackend;
};

export const getOriginalMovePolygonBackend = (): MoveBackendClass | null => {
    return originalMovePolygonBackend;
};
