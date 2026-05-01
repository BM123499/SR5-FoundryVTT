import { FLAGS, SYSTEM_NAME } from '@/module/constants';
import { SR5Actor } from '@/module/actor/SR5Actor';
import { type PerceptionSyncUpdateOperation, refreshPerception, normalizeVisibilityType, syncActorTokenVisionModes, syncTokenVisionMode } from './perceptionState';
import {
    deriveWallMoveRestrictionFromNative,
    deriveWallSenseRestrictionFromNative,
    getWallMoveRestriction,
    getWallPresetUpdate,
    getWallSenseDefault,
    getWallSenseRestriction,
    normalizeWallPreset,
    normalizeWallRestriction,
    type WallSenseType,
    normalizeWallSenseDefault,
    restrictionBlocksPhysical
} from './wallPerception';
import { type WallRestriction, type WallSenseRestrictionChannel } from './types';

const WALL_TOOL_PRESETS = {
    sr5PhysicalBarrierPreset: 'physicalBarrier',
    sr5ManaBarrierPreset: 'manaBarrier'
} as const;

const WALL_RESTRICTION_FLAGS = {
    move: FLAGS.WallMoveRestriction,
    sight: FLAGS.WallSightRestriction,
    light: FLAGS.WallLightRestriction,
    sound: FLAGS.WallSoundRestriction
} as const;

const WALL_DEFAULT_FLAGS = {
    sight: FLAGS.WallSightDefault,
    light: FLAGS.WallLightDefault,
    sound: FLAGS.WallSoundDefault
} as const;

const WALL_RESTRICTION_LABEL_KEYS = {
    move: 'SR5.Perception.WallRestriction.MoveLabel',
    sight: 'SR5.Perception.WallRestriction.SightLabel',
    light: 'SR5.Perception.WallRestriction.LightLabel',
    sound: 'SR5.Perception.WallRestriction.SoundLabel'
} as const;

const WALL_RESTRICTION_HINT_KEYS = {
    move: 'SR5.Perception.WallRestriction.MoveHint',
    sight: 'SR5.Perception.WallRestriction.SightHint',
    light: 'SR5.Perception.WallRestriction.LightHint',
    sound: 'SR5.Perception.WallRestriction.SoundHint'
} as const;

const WALL_DEFAULT_LABEL_KEYS = {
    sight: 'SR5.Perception.WallRestriction.SightDefaultLabel',
    light: 'SR5.Perception.WallRestriction.LightDefaultLabel',
    sound: 'SR5.Perception.WallRestriction.SoundDefaultLabel'
} as const;

const WALL_DEFAULT_HINT_KEYS = {
    sight: 'SR5.Perception.WallRestriction.SightDefaultHint',
    light: 'SR5.Perception.WallRestriction.LightDefaultHint',
    sound: 'SR5.Perception.WallRestriction.SoundDefaultHint'
} as const;

const SENSE_CHANNELS = ['sight', 'light', 'sound'] as const satisfies readonly WallSenseRestrictionChannel[];

type WallRestrictionChangeData = WallDocument.UpdateData | WallDocument.CreateData;

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
                    <option value="physical" ${currentValue === 'physical' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.VisibilityType.Physical")}</option>
                    <option value="astral" ${currentValue === 'astral' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.VisibilityType.Astral")}</option>
                    <option value="ar" ${currentValue === 'ar' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.VisibilityType.AR")}</option>
                </select>
            </div>
            <p class="hint">${game.i18n.localize("SR5.Perception.VisibilityType.Hint")}</p>
        </div>
    `);
};

const renderWallRestrictionOptions = (currentValue: WallRestriction): string => {
    return [
        ['none', 'SR5.Perception.WallRestriction.None'],
        ['physical', 'SR5.Perception.WallRestriction.Physical'],
        ['astral', 'SR5.Perception.WallRestriction.Astral'],
        ['astral_physical', 'SR5.Perception.WallRestriction.AstralPhysical']
    ].map(([value, label]) => {
        const selected = currentValue === value ? 'selected' : '';
        return `<option value="${value}" ${selected}>${game.i18n.localize(label)}</option>`;
    }).join('');
};

const renderWallRestrictionSelect = (
    appId: string,
    flag: string,
    currentValue: WallRestriction,
    labelKey: string,
    hintKey: string
) => {
    const id = `${appId}-${flag}`;

    return $(`
        <div class="form-group">
            <label for="${id}">${game.i18n.localize(labelKey)}</label>
            <div class="form-fields">
                <select name="flags.${SYSTEM_NAME}.${flag}" id="${id}">
                    ${renderWallRestrictionOptions(currentValue)}
                </select>
            </div>
            <p class="hint">${game.i18n.localize(hintKey)}</p>
        </div>
    `);
};

const renderSenseDefaultOptions = (nativeSelect: JQuery<HTMLElement>, currentValue: WallSenseType): string => {
    const options: string[] = [];

    nativeSelect.find('option').each((_index, element) => {
        const option = element as HTMLOptionElement;
        const selected = String(option.value) === String(currentValue) ? 'selected' : '';
        options.push(`<option value="${option.value}" ${selected}>${option.text}</option>`);
    });

    return options.join('');
};

const renderSenseDefaultSelect = (
    appId: string,
    channel: WallSenseRestrictionChannel,
    currentValue: WallSenseType,
    nativeSelect: JQuery<HTMLElement>
) => {
    const flag = WALL_DEFAULT_FLAGS[channel];
    const id = `${appId}-${flag}`;

    return $(`
        <div class="form-group sr5-wall-default-setting" data-sr5-wall-default-channel="${channel}">
            <label for="${id}">${game.i18n.localize(WALL_DEFAULT_LABEL_KEYS[channel])}</label>
            <div class="form-fields">
                <select name="flags.${SYSTEM_NAME}.${flag}" id="${id}">
                    ${renderSenseDefaultOptions(nativeSelect, currentValue)}
                </select>
            </div>
            <p class="hint">${game.i18n.localize(WALL_DEFAULT_HINT_KEYS[channel])}</p>
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

const wallFlagPath = (flag: string): string => `flags.${SYSTEM_NAME}.${flag}`;

const getWallFlagFromData = (data: WallRestrictionChangeData, flag: string): unknown => {
    return foundry.utils.getProperty(data, wallFlagPath(flag));
};

const hasWallSettingChange = (data: WallRestrictionChangeData): boolean => {
    if (foundry.utils.hasProperty(data, wallFlagPath(FLAGS.WallPreset))) return true;

    const flags = [
        FLAGS.WallMoveRestriction,
        FLAGS.WallSightRestriction,
        FLAGS.WallLightRestriction,
        FLAGS.WallSoundRestriction,
        FLAGS.WallSightDefault,
        FLAGS.WallLightDefault,
        FLAGS.WallSoundDefault
    ];

    return flags.some(flag => foundry.utils.hasProperty(data, wallFlagPath(flag)));
};

const resolveMoveRestrictionForData = (
    data: WallRestrictionChangeData,
    wall?: WallDocument.Implementation
): WallRestriction => {
    const rawRestriction = getWallFlagFromData(data, FLAGS.WallMoveRestriction);
    if (rawRestriction !== undefined) return normalizeWallRestriction(rawRestriction);
    if (wall) return getWallMoveRestriction(wall);
    return deriveWallMoveRestrictionFromNative(foundry.utils.getProperty(data, 'move'));
};

const resolveSenseRestrictionForData = (
    data: WallRestrictionChangeData,
    channel: WallSenseRestrictionChannel,
    wall?: WallDocument.Implementation
): WallRestriction => {
    const rawRestriction = getWallFlagFromData(data, WALL_RESTRICTION_FLAGS[channel]);
    if (rawRestriction !== undefined) return normalizeWallRestriction(rawRestriction);
    if (wall) return getWallSenseRestriction(wall, channel);
    return deriveWallSenseRestrictionFromNative(foundry.utils.getProperty(data, channel));
};

const resolveSenseDefaultForData = (
    data: WallRestrictionChangeData,
    channel: WallSenseRestrictionChannel,
    wall?: WallDocument.Implementation
): WallSenseType => {
    const rawDefault = getWallFlagFromData(data, WALL_DEFAULT_FLAGS[channel]);
    if (rawDefault !== undefined) {
        const fallback = wall
            ? getWallSenseDefault(wall, channel)
            : normalizeWallSenseDefault(foundry.utils.getProperty(data, channel), CONST.WALL_SENSE_TYPES.LIMITED);
        return normalizeWallSenseDefault(rawDefault, fallback);
    }

    if (wall) return getWallSenseDefault(wall, channel);
    return normalizeWallSenseDefault(foundry.utils.getProperty(data, channel), CONST.WALL_SENSE_TYPES.LIMITED);
};

const buildNativeWallUpdates = (
    data: WallRestrictionChangeData,
    wall?: WallDocument.Implementation
): WallDocument.UpdateData => {
    const moveRestriction = resolveMoveRestrictionForData(data, wall);
    const updates: WallDocument.UpdateData = {
        move: restrictionBlocksPhysical(moveRestriction) ? CONST.WALL_MOVEMENT_TYPES.NORMAL : CONST.WALL_MOVEMENT_TYPES.NONE
    };

    for (const channel of SENSE_CHANNELS) {
        const restriction = resolveSenseRestrictionForData(data, channel, wall);
        const senseDefault = resolveSenseDefaultForData(data, channel, wall);

        updates[channel] = restrictionBlocksPhysical(restriction) ? senseDefault : CONST.WALL_SENSE_TYPES.NONE;
    }

    return updates;
};

const hideNativeWallControl = (html: HTMLElement, fieldName: string): JQuery<HTMLElement> => {
    const group = $(html).find(`select[name="${fieldName}"]`).first().closest('div.form-group');
    group.hide();
    return group;
};

const insertAfterOrAppend = (
    html: HTMLElement,
    anchor: JQuery<HTMLElement>,
    group: JQuery<HTMLElement>
) => {
    if (anchor.length) {
        anchor.after(group);
        return;
    }

    const form = $(html).find('form').first();
    if (form.length) form.append(group);
};

const configureSenseDefaultVisibility = (
    html: HTMLElement,
    channel: WallSenseRestrictionChannel
) => {
    const restrictionSelect = $(html).find(`select[name="flags.${SYSTEM_NAME}.${WALL_RESTRICTION_FLAGS[channel]}"]`).first();
    const defaultGroup = $(html).find(`[data-sr5-wall-default-channel="${channel}"]`).first();

    const syncVisibility = () => {
        defaultGroup.toggle(String(restrictionSelect.val() ?? 'none') !== 'none');
    };

    restrictionSelect.on('change', syncVisibility);
    syncVisibility();
};

const shouldRefreshForWallPerceptionUpdate = (changed: WallDocument.UpdateData): boolean => {
    if (hasWallSettingChange(changed)) return true;

    return foundry.utils.hasProperty(changed, 'move')
        || foundry.utils.hasProperty(changed, 'sight')
        || foundry.utils.hasProperty(changed, 'light')
        || foundry.utils.hasProperty(changed, 'sound');
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
        if (shouldRefreshForWallPerceptionUpdate(changed)) {
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
        const moveAnchor = hideNativeWallControl(html, 'move');
        const moveRestriction = getWallMoveRestriction(app.document);
        const moveSelect = renderWallRestrictionSelect(
            app.id,
            WALL_RESTRICTION_FLAGS.move,
            moveRestriction,
            WALL_RESTRICTION_LABEL_KEYS.move,
            WALL_RESTRICTION_HINT_KEYS.move
        );
        insertAfterOrAppend(html, moveAnchor, moveSelect);

        let previous = moveSelect;
        for (const channel of SENSE_CHANNELS) {
            const nativeGroup = hideNativeWallControl(html, channel);
            const restriction = getWallSenseRestriction(app.document, channel);
            const senseDefault = getWallSenseDefault(app.document, channel);

            const restrictionSelect = renderWallRestrictionSelect(
                app.id,
                WALL_RESTRICTION_FLAGS[channel],
                restriction,
                WALL_RESTRICTION_LABEL_KEYS[channel],
                WALL_RESTRICTION_HINT_KEYS[channel]
            );

            const nativeSelect = $(html).find(`select[name="${channel}"]`).first();
            const defaultSelect = renderSenseDefaultSelect(app.id, channel, senseDefault, nativeSelect);

            if (nativeGroup.length) {
                nativeGroup.after(restrictionSelect);
            } else {
                insertAfterOrAppend(html, previous, restrictionSelect);
            }

            restrictionSelect.after(defaultSelect);
            configureSenseDefaultVisibility(html, channel);
            previous = defaultSelect;
        }
    }

    static renderAmbientLightConfig(
        app: foundry.applications.sheets.AmbientLightConfig.Any,
        html: HTMLElement
    ) {
        const value = normalizeVisibilityType(app.document.getFlag(SYSTEM_NAME, FLAGS.VisibilityType));
        const setting = renderVisibilityTypeConfig(html, app.id, value);
        appendConfigSetting(html, setting);
    }

    static updateAmbientLight(
        _light: AmbientLightDocument.Implementation,
        changed: AmbientLightDocument.UpdateData
    ) {
        if (!shouldRefreshForVisibilityFlag(changed as Record<string, unknown>)) return;
        refreshPerception();
    }

    static preUpdateWall(
        wall: WallDocument.Implementation,
        changed: WallDocument.UpdateData
    ) {
        const presetValue = foundry.utils.getProperty(changed, wallFlagPath(FLAGS.WallPreset));
        if (presetValue !== undefined) {
            const wallPreset = normalizeWallPreset(presetValue);
            const presetUpdates = getWallPresetUpdate(wallPreset);
            foundry.utils.mergeObject(changed, presetUpdates, { inplace: true, overwrite: true });
        }

        if (!hasWallSettingChange(changed)) return;

        const nativeUpdates = buildNativeWallUpdates(changed, wall);
        foundry.utils.mergeObject(changed, nativeUpdates, { inplace: true, overwrite: true });
    }

    static preCreateWall(
        wall: WallDocument.Implementation,
        data: WallDocument.CreateData
    ) {
        let presetValue = foundry.utils.getProperty(data, wallFlagPath(FLAGS.WallPreset));
        if (presetValue === undefined) {
            const activeTool = game.activeTool as keyof typeof WALL_TOOL_PRESETS;
            const mappedPreset = WALL_TOOL_PRESETS[activeTool];
            if (mappedPreset) {
                foundry.utils.setProperty(data, wallFlagPath(FLAGS.WallPreset), mappedPreset);
                presetValue = mappedPreset;
            }
        }

        if (presetValue !== undefined) {
            const wallPreset = normalizeWallPreset(presetValue);
            const presetUpdates = getWallPresetUpdate(wallPreset);
            foundry.utils.mergeObject(data, presetUpdates, { inplace: true, overwrite: true });
        }

        if (!hasWallSettingChange(data)) return;

        const nativeUpdates = buildNativeWallUpdates(data);
        wall.updateSource(nativeUpdates as WallDocument.UpdateData);
    }
}
