import { FLAGS, SYSTEM_NAME } from '@/module/constants';
import { SR5Actor } from '@/module/actor/SR5Actor';
import { type PerceptionSyncUpdateOperation, refreshPerception, normalizeVisibilityType, syncActorTokenVisionModes, syncTokenVisionMode } from './perceptionState';
import { getWallPresetUpdate, normalizeWallPreset } from './wallPerception';

const renderVisibilityTypeConfig = (
    html: HTMLElement,
    appId: string,
    currentValue: string
) => {
    const id = `${appId}-${FLAGS.VisibilityType}`;

    return $(`
        <div class="form-group">
            <label for="${id}">${game.i18n.localize("SR5.Perception.VisibilityType.Label")}</label>
            <div class="form-fields">
                <select name="flags.${SYSTEM_NAME}.${FLAGS.VisibilityType}" id="${id}">
                    <option value="default" ${currentValue === 'default' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.VisibilityType.Default")}</option>
                    <option value="astral" ${currentValue === 'astral' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.VisibilityType.Astral")}</option>
                    <option value="ar" ${currentValue === 'ar' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.VisibilityType.AR")}</option>
                </select>
            </div>
            <p class="hint">${game.i18n.localize("SR5.Perception.VisibilityType.Hint")}</p>
        </div>
    `);
};

const renderWallPresetConfig = (
    html: HTMLElement,
    appId: string,
    currentValue: string
) => {
    const id = `${appId}-${FLAGS.WallPreset}`;

    return $(`
        <div class="form-group">
            <label for="${id}">${game.i18n.localize("SR5.Perception.WallPreset.Label")}</label>
            <div class="form-fields">
                <select name="flags.${SYSTEM_NAME}.${FLAGS.WallPreset}" id="${id}">
                    <option value="none" ${currentValue === 'none' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.WallPreset.None")}</option>
                    <option value="physicalBarrier" ${currentValue === 'physicalBarrier' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.WallPreset.PhysicalBarrier")}</option>
                    <option value="manaBarrier" ${currentValue === 'manaBarrier' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.WallPreset.ManaBarrier")}</option>
                </select>
            </div>
            <p class="hint">${game.i18n.localize("SR5.Perception.WallPreset.Hint")}</p>
        </div>
    `);
};

const appendConfigSetting = (html: HTMLElement, group: JQuery<HTMLElement>) => {
    const anchor = $(html).find('input[name="hidden"], select[name="sight"], select[name="move"]').first().closest('div.form-group');
    if (anchor.length) {
        anchor.after(group);
        return;
    }

    const form = $(html).find('form').first();
    if (form.length) {
        form.append(group);
    }
};

const isTokenPerceptionUpdate = (changed: TokenDocument.UpdateData): boolean => {
    return foundry.utils.hasProperty(changed, `flags.${SYSTEM_NAME}.${FLAGS.TokenPerceptionModeOverride}`)
        || foundry.utils.hasProperty(changed, `flags.${SYSTEM_NAME}.${FLAGS.TokenPerceptionAROverride}`)
        || foundry.utils.hasProperty(changed, `flags.${SYSTEM_NAME}.${FLAGS.TokenAstralVisibilityType}`)
        || foundry.utils.hasProperty(changed, 'actorId');
};

const isActorPerceptionUpdate = (changed: Actor.UpdateData): boolean => {
    return foundry.utils.hasProperty(changed, 'system.perception');
};

const shouldRefreshForVisibilityFlag = (changed: Record<string, unknown>): boolean => {
    return foundry.utils.hasProperty(changed, `flags.${SYSTEM_NAME}.${FLAGS.VisibilityType}`);
};

export class PerceptionHooks {
    static async canvasReady() {
        if (!canvas?.ready) return;

        await Promise.all((canvas.tokens?.placeables ?? []).map(async token => {
            await syncTokenVisionMode(token.document, { sr5PerceptionSync: true });
        }));

        refreshPerception();
    }

    static async updateActor(
        actor: Actor.Implementation,
        changed: Actor.UpdateData,
        _options: Actor.Database.UpdateOperation
    ) {
        if (!isActorPerceptionUpdate(changed)) return;
        if (!(actor instanceof SR5Actor)) return;

        const sr5Actor = actor as SR5Actor;
        await syncActorTokenVisionModes(sr5Actor, { sr5PerceptionSync: true });
        refreshPerception();
    }

    static async createToken(token: TokenDocument.Implementation) {
        await syncTokenVisionMode(token, { sr5PerceptionSync: true });
        refreshPerception();
    }

    static async updateToken(
        token: TokenDocument.Implementation,
        changed: TokenDocument.UpdateData,
        options: TokenDocument.Database.UpdateOperation
    ) {
        const typedOptions = options as PerceptionSyncUpdateOperation;
        if (typedOptions.sr5PerceptionSync) return;
        if (!isTokenPerceptionUpdate(changed)) return;

        await syncTokenVisionMode(token, { ...typedOptions, sr5PerceptionSync: true });
        refreshPerception();
    }

    static updateTile(_tile: TileDocument.Implementation, changed: TileDocument.UpdateData) {
        if (!shouldRefreshForVisibilityFlag(changed as Record<string, unknown>)) return;
        refreshPerception();
    }

    static updateDrawing(_drawing: DrawingDocument.Implementation, changed: DrawingDocument.UpdateData) {
        if (!shouldRefreshForVisibilityFlag(changed as Record<string, unknown>)) return;
        refreshPerception();
    }

    static updateWall(_wall: WallDocument.Implementation, changed: WallDocument.UpdateData) {
        if (foundry.utils.hasProperty(changed, `flags.${SYSTEM_NAME}.${FLAGS.WallPreset}`)) {
            refreshPerception();
        }
    }

    static renderTileConfig(
        app: foundry.applications.sheets.TileConfig,
        html: HTMLElement
    ) {
        const value = normalizeVisibilityType(app.document.getFlag(SYSTEM_NAME, FLAGS.VisibilityType));
        const setting = renderVisibilityTypeConfig(html, app.id, value);
        appendConfigSetting(html, setting);
    }

    static renderDrawingConfig(
        app: foundry.applications.sheets.DrawingConfig,
        html: HTMLElement
    ) {
        const value = normalizeVisibilityType(app.document.getFlag(SYSTEM_NAME, FLAGS.VisibilityType));
        const setting = renderVisibilityTypeConfig(html, app.id, value);
        appendConfigSetting(html, setting);
    }

    static renderWallConfig(
        app: foundry.applications.sheets.WallConfig,
        html: HTMLElement
    ) {
        const value = normalizeWallPreset(app.document.getFlag(SYSTEM_NAME, FLAGS.WallPreset));
        const setting = renderWallPresetConfig(html, app.id, value);
        appendConfigSetting(html, setting);
    }

    static preUpdateWall(
        _wall: WallDocument.Implementation,
        changed: WallDocument.UpdateData
    ) {
        const presetValue = foundry.utils.getProperty(changed, `flags.${SYSTEM_NAME}.${FLAGS.WallPreset}`);
        if (presetValue === undefined) return;

        const wallPreset = normalizeWallPreset(presetValue);
        const presetUpdates = getWallPresetUpdate(wallPreset);
        foundry.utils.mergeObject(changed, presetUpdates, { inplace: true, overwrite: true });
    }

    static preCreateWall(
        wall: WallDocument.Implementation,
        data: WallDocument.CreateData
    ) {
        const presetValue = foundry.utils.getProperty(data, `flags.${SYSTEM_NAME}.${FLAGS.WallPreset}`);
        if (presetValue === undefined) return;

        const wallPreset = normalizeWallPreset(presetValue);
        const presetUpdates = getWallPresetUpdate(wallPreset);
        wall.updateSource(presetUpdates as WallDocument.UpdateData);
    }
}
