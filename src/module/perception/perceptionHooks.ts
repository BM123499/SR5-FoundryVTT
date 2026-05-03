import { FLAGS, SYSTEM_NAME } from '@/module/constants';
import { SR5Actor } from '@/module/actor/SR5Actor';
import { type PerceptionSyncUpdateOperation, refreshPerception, normalizeVisibilityType, syncActorTokenVisionModes, syncTokenVisionMode } from './perceptionState';
import {
    getWallAstralMoveType,
    getWallAstralSenseType,
    getWallPresetUpdate,
    normalizeWallMovementType,
    normalizeWallPreset,
    normalizeWallSenseType,
    type WallMovementType,
    type WallSenseType
} from './wallPerception';
import { type WallSenseRestrictionChannel } from './types';

const WALL_TOOL_PRESETS = {
    sr5PhysicalBarrierPreset: 'physicalBarrier',
    sr5ManaBarrierPreset: 'manaBarrier'
} as const;

const WALL_ASTRAL_FLAGS = {
    move: FLAGS.WallAstralMove,
    sight: FLAGS.WallAstralSight,
    light: FLAGS.WallAstralLight,
    sound: FLAGS.WallAstralSound
} as const;

const WALL_ASTRAL_THRESHOLD_FLAGS = {
    sight: FLAGS.WallAstralThresholdSight,
    light: FLAGS.WallAstralThresholdLight,
    sound: FLAGS.WallAstralThresholdSound
} as const;

const WALL_CHANNEL_LABEL_FALLBACK = {
    move: 'Movement',
    sight: 'Sight',
    light: 'Light',
    sound: 'Sound'
} as const;

const SENSE_CHANNELS = ['sight', 'light', 'sound'] as const satisfies readonly WallSenseRestrictionChannel[];
const WALL_CHANNEL_NAMES = ['move', 'sight', 'light', 'sound'] as const;
const ASTRAL_THRESHOLD_SENSE_TYPES = new Set<number>(
    [CONST.WALL_SENSE_TYPES.PROXIMITY, CONST.WALL_SENSE_TYPES.DISTANCE]
        .map(value => Number(value))
        .filter(value => Number.isFinite(value))
);

const wallFlagPath = (flag: string): string => `flags.${SYSTEM_NAME}.${flag}`;

const resolveConfigForm = (html: HTMLElement): JQuery<HTMLElement> => {
    const root = $(html);
    if (root.is('form')) return root;
    return root.find('form').first();
};

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

const appendConfigSetting = (html: HTMLElement, group: JQuery<HTMLElement>) => {
    const form = resolveConfigForm(html);
    if (!form.length) return;

    const anchor = form.find('input[name="hidden"], select[name="sight"], select[name="move"]').first().closest('div.form-group');
    if (anchor.length) {
        anchor.after(group);
        return;
    }

    form.append(group);
};

const uniqueGroups = (groups: (HTMLElement | null | undefined)[]): HTMLElement[] => {
    const unique = new Set<HTMLElement>();
    for (const group of groups) {
        if (group) unique.add(group);
    }
    return [...unique];
};

const groupForSelector = (form: JQuery<HTMLElement>, selector: string): HTMLElement | null => {
    const group = form.find(selector).first().closest('div.form-group');
    return group.length ? group.get(0) as HTMLElement : null;
};

const groupsForSelectors = (form: JQuery<HTMLElement>, selectors: string[]): HTMLElement[] => {
    return uniqueGroups(selectors.map(selector => groupForSelector(form, selector)));
};

const getWallChannelLabel = (
    form: JQuery<HTMLElement>,
    channel: typeof WALL_CHANNEL_NAMES[number]
): string => {
    const group = groupForSelector(form, `select[name="${channel}"]`);
    if (!group) return WALL_CHANNEL_LABEL_FALLBACK[channel];
    const labelText = $(group).find('label').first().text().trim();
    return labelText || WALL_CHANNEL_LABEL_FALLBACK[channel];
};

const getWallThresholdUnitLabel = (
    form: JQuery<HTMLElement>,
    channel: WallSenseRestrictionChannel
): string => {
    const group = groupForSelector(form, `select[name="${channel}"]`);
    if (!group) return 'm';
    const unit = $(group).find('.units').first().text().trim();
    return unit || 'm';
};

const findDirectionGroup = (form: JQuery<HTMLElement>): HTMLElement | null => {
    const bySelector = groupForSelector(form, 'select[name="dir"], select[name="direction"], select[name="restrictionDirection"]');
    if (bySelector) return bySelector;

    const byLabel = form.find('div.form-group').filter((_index, element) => {
        const labelText = $(element).find('label').first().text().trim().toLowerCase();
        return labelText.includes('restriction direction') || labelText.includes('direction');
    }).first();

    return byLabel.length ? byLabel.get(0) as HTMLElement : null;
};

const cloneAsAstralFlagGroup = (
    sourceGroupElement: HTMLElement,
    appId: string,
    suffix: string,
    flag: string,
    currentValue: unknown
): JQuery<HTMLElement> | null => {
    const sourceGroup = $(sourceGroupElement);
    const sourceField = sourceGroup.find('input, select, textarea').first();
    if (!sourceField.length) return null;

    const sourceId = String(sourceField.attr('id') ?? `${appId}-${suffix}-${flag}`);
    const proxyId = `${sourceId}-${suffix}-proxy`;
    const proxyName = wallFlagPath(flag);

    const proxyGroup = sourceGroup.clone(false, false);
    const proxyField = proxyGroup.find('input, select, textarea').first();
    if (!proxyField.length) return null;

    proxyField.attr('id', proxyId);
    proxyField.attr('name', proxyName);
    proxyGroup.find(`label[for="${sourceId}"]`).attr('for', proxyId);

    if (proxyField.is(':checkbox')) {
        const fallback = sourceField.is(':checked');
        const checked = currentValue === undefined ? fallback : !!currentValue;
        proxyField.prop('checked', checked);
    } else {
        const fallback = String(sourceField.val() ?? '');
        proxyField.val(currentValue === undefined ? fallback : String(currentValue));
    }

    return proxyGroup;
};

const groupLabelText = (groupElement: HTMLElement): string => {
    return $(groupElement).find('label').first().text().trim().toLowerCase();
};

const findCoordinateGroups = (form: JQuery<HTMLElement>): HTMLElement[] => {
    const fromCoordinateInputs = uniqueGroups(form.find('input[name^="c."], input[name^="c["], input[name="c"], input[name="coordinates"]').toArray().map(input => {
        const group = $(input).closest('div.form-group');
        return group.length ? group.get(0) as HTMLElement : null;
    }));
    if (fromCoordinateInputs.length) return fromCoordinateInputs;

    const fromLabel = form.find('div.form-group').filter((_index, element) => {
        const labelText = $(element).find('label').first().text().trim().toLowerCase();
        return labelText.includes('coordinate');
    }).toArray().map(element => element as HTMLElement);

    return uniqueGroups(fromLabel);
};

const astralSelectOptions = (nativeSelect: JQuery<HTMLElement>, currentValue: number): string => {
    const options: string[] = [];
    nativeSelect.find('option').each((_index, optionElement) => {
        const option = optionElement as HTMLOptionElement;
        const selected = String(option.value) === String(currentValue) ? 'selected' : '';
        options.push(`<option value="${option.value}" ${selected}>${option.text}</option>`);
    });
    return options.join('');
};

const astralMoveGroup = (
    appId: string,
    nativeSelect: JQuery<HTMLElement>,
    currentValue: WallMovementType,
    label: string
): JQuery<HTMLElement> => {
    const id = `${appId}-${FLAGS.WallAstralMove}`;
    return $(`
        <div class="form-group">
            <label for="${id}">${label}</label>
            <div class="form-fields">
                <select name="flags.${SYSTEM_NAME}.${FLAGS.WallAstralMove}" id="${id}">
                    ${astralSelectOptions(nativeSelect, currentValue)}
                </select>
            </div>
        </div>
    `);
};

const finiteNumberValue = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
};

const getAstralThresholdValue = (
    wall: WallDocument.Implementation,
    channel: WallSenseRestrictionChannel
): number | undefined => {
    const explicitThreshold = wall.getFlag(SYSTEM_NAME, WALL_ASTRAL_THRESHOLD_FLAGS[channel]);
    const explicitValue = finiteNumberValue(explicitThreshold);
    if (explicitValue !== undefined) return explicitValue;

    return finiteNumberValue(foundry.utils.getProperty(wall, `threshold.${channel}`));
};

const getAstralAttenuationValue = (wall: WallDocument.Implementation): boolean => {
    const explicitAttenuation = wall.getFlag(SYSTEM_NAME, FLAGS.WallAstralAttenuation);
    if (explicitAttenuation !== undefined) return !!explicitAttenuation;
    return !!foundry.utils.getProperty(wall, 'threshold.attenuation');
};

const astralSenseGroup = (
    appId: string,
    channel: WallSenseRestrictionChannel,
    nativeSelect: JQuery<HTMLElement>,
    currentValue: WallSenseType,
    label: string,
    thresholdValue: number | undefined,
    thresholdUnit: string
): JQuery<HTMLElement> => {
    const flag = WALL_ASTRAL_FLAGS[channel];
    const thresholdFlag = WALL_ASTRAL_THRESHOLD_FLAGS[channel];
    const id = `${appId}-${flag}`;
    const thresholdId = `${appId}-${thresholdFlag}`;
    const thresholdText = thresholdValue === undefined ? '' : String(thresholdValue);

    return $(`
        <div class="form-group">
            <label for="${id}">${label}</label>
            <div class="form-fields">
                <select name="flags.${SYSTEM_NAME}.${flag}" id="${id}">
                    ${astralSelectOptions(nativeSelect, currentValue)}
                </select>
                <input
                    type="number"
                    name="flags.${SYSTEM_NAME}.${thresholdFlag}"
                    id="${thresholdId}"
                    value="${thresholdText}"
                    min="0"
                    step="0.1"
                    data-sr5-astral-threshold="${channel}"
                />
                <label class="units" for="${thresholdId}" data-sr5-astral-threshold-unit="${channel}">${thresholdUnit}</label>
            </div>
        </div>
    `);
};

const astralAttenuationGroup = (
    appId: string,
    currentValue: boolean
): JQuery<HTMLElement> => {
    const id = `${appId}-${FLAGS.WallAstralAttenuation}`;

    return $(`
        <div class="form-group">
            <label for="${id}">Proximity Threshold Attenuation</label>
            <div class="form-fields">
                <input type="checkbox" name="flags.${SYSTEM_NAME}.${FLAGS.WallAstralAttenuation}" id="${id}" ${currentValue ? 'checked' : ''} />
            </div>
        </div>
    `);
};

const activateWallConfigTab = (container: JQuery<HTMLElement>, tabId: string) => {
    container.find('[data-sr5-wall-tab]')
        .removeClass('active')
        .css({
            color: '',
            background: '',
            borderBottom: '2px solid transparent'
        });
    container.find(`[data-sr5-wall-tab="${tabId}"]`)
        .addClass('active')
        .css({
            color: '#f2dcc2',
            background: 'rgba(211, 167, 106, 0.10)',
            borderBottom: '2px solid #d3a76a'
        });
    container.find('[data-sr5-wall-panel]').hide();
    container.find(`[data-sr5-wall-panel="${tabId}"]`).show();
};

const shouldRefreshForWallPerceptionUpdate = (changed: WallDocument.UpdateData): boolean => {
    const flagPaths = [
        FLAGS.WallPreset,
        FLAGS.WallAstralMove,
        FLAGS.WallAstralSight,
        FLAGS.WallAstralLight,
        FLAGS.WallAstralSound,
        FLAGS.WallAstralDirection,
        FLAGS.WallAstralThresholdSight,
        FLAGS.WallAstralThresholdLight,
        FLAGS.WallAstralThresholdSound,
        FLAGS.WallAstralAttenuation
    ].map(flag => wallFlagPath(flag));

    if (flagPaths.some(path => foundry.utils.hasProperty(changed, path))) return true;

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
        const form = resolveConfigForm(html);
        if (!form.length) return;

        const moveSelect = form.find('select[name="move"]').first();
        const sightSelect = form.find('select[name="sight"]').first();
        const lightSelect = form.find('select[name="light"]').first();
        const soundSelect = form.find('select[name="sound"]').first();

        const wallRestrictionsFieldset = moveSelect.closest('fieldset');
        const doorFieldset = form.find('select[name="door"]').first().closest('fieldset');
        const directionGroup = findDirectionGroup(form);
        const wallRestrictionGroups = wallRestrictionsFieldset.find('div.form-group').toArray() as HTMLElement[];
        const attenuationGroup = wallRestrictionGroups.find(group => groupLabelText(group).includes('attenuation')) ?? null;

        const coordinateGroups = findCoordinateGroups(form);
        const doorGroup = groupForSelector(form, 'select[name="door"]');

        const physicalGroups = groupsForSelectors(form, [
            'select[name="move"]',
            'select[name="sight"]',
            'select[name="light"]',
            'select[name="sound"]'
        ]);
        const moveLabel = getWallChannelLabel(form, 'move');
        const sightLabel = getWallChannelLabel(form, 'sight');
        const lightLabel = getWallChannelLabel(form, 'light');
        const soundLabel = getWallChannelLabel(form, 'sound');
        const sightThresholdUnit = getWallThresholdUnitLabel(form, 'sight');
        const lightThresholdUnit = getWallThresholdUnitLabel(form, 'light');
        const soundThresholdUnit = getWallThresholdUnitLabel(form, 'sound');

        const astralGroups: JQuery<HTMLElement>[] = [];
        if (moveSelect.length) {
            const current = getWallAstralMoveType(app.document);
            astralGroups.push(astralMoveGroup(app.id, moveSelect, normalizeWallMovementType(current), moveLabel));
        }
        if (lightSelect.length) {
            const current = getWallAstralSenseType(app.document, 'light');
            const threshold = getAstralThresholdValue(app.document, 'light');
            astralGroups.push(astralSenseGroup(
                app.id,
                'light',
                lightSelect,
                normalizeWallSenseType(current),
                lightLabel,
                threshold,
                lightThresholdUnit
            ));
        }
        if (sightSelect.length) {
            const current = getWallAstralSenseType(app.document, 'sight');
            const threshold = getAstralThresholdValue(app.document, 'sight');
            astralGroups.push(astralSenseGroup(
                app.id,
                'sight',
                sightSelect,
                normalizeWallSenseType(current),
                sightLabel,
                threshold,
                sightThresholdUnit
            ));
        }
        if (soundSelect.length) {
            const current = getWallAstralSenseType(app.document, 'sound');
            const threshold = getAstralThresholdValue(app.document, 'sound');
            astralGroups.push(astralSenseGroup(
                app.id,
                'sound',
                soundSelect,
                normalizeWallSenseType(current),
                soundLabel,
                threshold,
                soundThresholdUnit
            ));
        }

        const tabContainer = $(`
            <section class="sr5-wall-config">
                <nav class="sheet-tabs tabs sr5-wall-config-tabs">
                    <a class="item active" data-sr5-wall-tab="basic"><i class="fa-solid fa-sliders"></i> ${game.i18n.localize("SR5.Perception.WallConfigTabs.Basic")}</a>
                    <a class="item" data-sr5-wall-tab="physical"><i class="fa-solid fa-person-walking"></i> ${game.i18n.localize("SR5.Perception.WallConfigTabs.Physical")}</a>
                    <a class="item" data-sr5-wall-tab="astral"><i class="fa-solid fa-wand-magic-sparkles"></i> ${game.i18n.localize("SR5.Perception.WallConfigTabs.Astral")}</a>
                </nav>
                <div data-sr5-wall-panel="basic"></div>
                <div data-sr5-wall-panel="physical"></div>
                <div data-sr5-wall-panel="astral"></div>
            </section>
        `);
        tabContainer.find('.sr5-wall-config-tabs').css('margin-bottom', '0.75rem');

        const firstGroup = form.find('div.form-group').first();
        if (firstGroup.length) {
            firstGroup.before(tabContainer);
        } else {
            form.append(tabContainer);
        }

        const basicPanel = tabContainer.find('[data-sr5-wall-panel="basic"]').first();
        const physicalPanel = tabContainer.find('[data-sr5-wall-panel="physical"]').first();
        const astralPanel = tabContainer.find('[data-sr5-wall-panel="astral"]').first();

        for (const group of coordinateGroups) basicPanel.append(group);
        if (doorFieldset.length) {
            basicPanel.append(doorFieldset);
        } else if (doorGroup) {
            basicPanel.append(doorGroup);
        }

        if (directionGroup) {
            physicalPanel.append(directionGroup);
        }
        if (wallRestrictionsFieldset.length) {
            physicalPanel.append(wallRestrictionsFieldset);
        } else {
            for (const group of physicalGroups) physicalPanel.append(group);
        }

        const referenceLegend = wallRestrictionsFieldset.find('legend').first().text().trim();
        const referenceClasses = wallRestrictionsFieldset.attr('class') ?? '';
        const astralFieldset = $('<fieldset></fieldset>');
        if (referenceClasses) astralFieldset.addClass(referenceClasses);
        astralFieldset.append($('<legend></legend>').text(referenceLegend || 'Astral Restrictions'));
        for (const group of astralGroups) astralFieldset.append(group);

        const astralAttenuationSetting = getAstralAttenuationValue(app.document);
        const astralAttenuationConfig = attenuationGroup
            ? cloneAsAstralFlagGroup(
                attenuationGroup,
                app.id,
                'astral-attenuation',
                FLAGS.WallAstralAttenuation,
                astralAttenuationSetting
            )
            : astralAttenuationGroup(app.id, astralAttenuationSetting);

        if (directionGroup) {
            const astralDirectionGroup = cloneAsAstralFlagGroup(
                directionGroup,
                app.id,
                'astral-direction',
                FLAGS.WallAstralDirection,
                app.document.getFlag(SYSTEM_NAME, FLAGS.WallAstralDirection)
            );
            if (astralDirectionGroup) astralPanel.append(astralDirectionGroup);
        }
        if (astralAttenuationConfig) astralFieldset.append(astralAttenuationConfig);
        astralPanel.append(astralFieldset);

        const astralSenseSelects = astralFieldset.find(`select[name="${wallFlagPath(FLAGS.WallAstralLight)}"], select[name="${wallFlagPath(FLAGS.WallAstralSight)}"], select[name="${wallFlagPath(FLAGS.WallAstralSound)}"]`);
        const syncAstralProximityControls = () => {
            let usesAnyThreshold = false;
            for (const channel of SENSE_CHANNELS) {
                const select = astralFieldset.find(`select[name="${wallFlagPath(WALL_ASTRAL_FLAGS[channel])}"]`).first();
                if (!select.length) continue;
                const usesThreshold = ASTRAL_THRESHOLD_SENSE_TYPES.has(Number(select.val()));
                astralFieldset.find(`[data-sr5-astral-threshold="${channel}"]`).toggle(usesThreshold);
                astralFieldset.find(`[data-sr5-astral-threshold-unit="${channel}"]`).toggle(usesThreshold);
                usesAnyThreshold ||= usesThreshold;
            }
            if (astralAttenuationConfig) astralAttenuationConfig.toggle(usesAnyThreshold);
        };
        astralSenseSelects.on('change', syncAstralProximityControls);
        syncAstralProximityControls();

        const panels = [basicPanel.get(0), physicalPanel.get(0), astralPanel.get(0)].filter(Boolean) as HTMLElement[];
        form.children('div.form-group, fieldset').each((_index, element) => {
            const node = element as HTMLElement;
            const isInsidePanel = panels.some(panel => panel.contains(node));
            if (!isInsidePanel) $(node).hide();
        });

        tabContainer.on('click', '[data-sr5-wall-tab]', event => {
            event.preventDefault();
            const clicked = event.currentTarget as HTMLElement;
            const tabId = clicked.dataset.sr5WallTab;
            if (!tabId) return;
            activateWallConfigTab(tabContainer, tabId);
        });

        activateWallConfigTab(tabContainer, 'basic');
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
        _wall: WallDocument.Implementation,
        changed: WallDocument.UpdateData
    ) {
        const presetValue = foundry.utils.getProperty(changed, wallFlagPath(FLAGS.WallPreset));
        if (presetValue === undefined) return;

        const wallPreset = normalizeWallPreset(presetValue);
        const presetUpdates = getWallPresetUpdate(wallPreset);
        foundry.utils.mergeObject(changed, presetUpdates, { inplace: true, overwrite: true });
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

        if (presetValue === undefined) return;

        const wallPreset = normalizeWallPreset(presetValue);
        const presetUpdates = getWallPresetUpdate(wallPreset);
        foundry.utils.mergeObject(data, presetUpdates, { inplace: true, overwrite: true });
        wall.updateSource(presetUpdates as WallDocument.UpdateData);
    }
}
