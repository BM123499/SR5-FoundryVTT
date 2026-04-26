import { FLAGS, SYSTEM_NAME } from '../constants';
import { RoutingLibIntegration } from '../integrations/routingLibIntegration';
import { resolveTokenPerceptionState } from '@/module/perception/perceptionState';
import PrototypeTokenConfig = foundry.applications.sheets.PrototypeTokenConfig;

export class SR5Token extends foundry.canvas.placeables.Token {
    override _drawBar(number: number, bar: PIXI.Graphics, data: NonNullable<TokenDocument.GetBarAttributeReturn>) {
        const tokenHealthBars = game.settings.get(SYSTEM_NAME, FLAGS.TokenHealthBars);
        // FoundryVTT draws resource bars as full/good when the value is the
        // same as the max and empty/bad at 0 (colored along a gradient).
        // Shadowrun condition trackers count up from 0 to the maximum.
        // We flip the values from Shadowrun format to FoundryVTT format here
        // for drawing.
        if (tokenHealthBars && data.type === 'bar' && data.attribute.startsWith('track')) {
            data.value = data.max - data.value;
        }
        return super._drawBar(number, bar, data);
    }

    override findMovementPath(
        waypoints: Token.FindMovementPathWaypoint[],
        options?: Token.FindMovementPathOptions & { skipRoutingLib?: boolean; }
    ) {
        const isProjecting = resolveTokenPerceptionState(this.document).isProjecting;
        const resolvedOptions = isProjecting ? { ...options, ignoreWalls: true } : options;

        const movement = this.actor?.system.movement;
        const useRoutLib = this.document.getFlag(SYSTEM_NAME, FLAGS.TokenUseRoutingLib) ?? true;
        if (RoutingLibIntegration.ready && movement && useRoutLib && !resolvedOptions?.skipRoutingLib && !resolvedOptions?.ignoreWalls) {
            return RoutingLibIntegration.routinglibPathfinding(waypoints, this, movement);
        }

        return super.findMovementPath(waypoints, resolvedOptions);
    }

    static tokenConfig(
        app: any, // TokenConfig | PrototypeTokenConfig, Stubs on FVTT-Types
        html: HTMLElement,
        data: TokenConfig.RenderContext | PrototypeTokenConfig.RenderContext,
        options: TokenConfig.RenderOptions | PrototypeTokenConfig.RenderOptions
    ) {
        const actor = app.actor as Actor.Implementation | null | undefined;
        const anchor = $(html).find('label[for$="-movementAction"]').closest('div.form-group');
        if (!anchor.length) return;

        const token = app.token as TokenDocument.Implementation;
        const modeOverride = token.getFlag(SYSTEM_NAME, FLAGS.TokenPerceptionModeOverride) ?? 'inherit';
        const arOverride = token.getFlag(SYSTEM_NAME, FLAGS.TokenPerceptionAROverride) ?? 'inherit';

        const modeId = `${app.id}-${FLAGS.TokenPerceptionModeOverride}`;
        const arId = `${app.id}-${FLAGS.TokenPerceptionAROverride}`;

        const modeSelectDiv = $(`
            <div class="form-group">
                <label for="${modeId}">${game.i18n.localize("SR5.Perception.TokenOverride.ModeLabel")}</label>
                <div class="form-fields">
                    <select id="${modeId}" name="flags.${SYSTEM_NAME}.${FLAGS.TokenPerceptionModeOverride}">
                        <option value="inherit" ${modeOverride === 'inherit' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.TokenOverride.Inherit")}</option>
                        <option value="physical" ${modeOverride === 'physical' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.Mode.Physical")}</option>
                        <option value="astral_perception" ${modeOverride === 'astral_perception' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.Mode.AstralPerception")}</option>
                        <option value="astral_projection" ${modeOverride === 'astral_projection' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.Mode.AstralProjection")}</option>
                    </select>
                </div>
                <p class="hint">${game.i18n.localize("SR5.Perception.TokenOverride.ModeHint")}</p>
            </div>
        `);

        const arSelectDiv = $(`
            <div class="form-group">
                <label for="${arId}">${game.i18n.localize("SR5.Perception.TokenOverride.ARLabel")}</label>
                <div class="form-fields">
                    <select id="${arId}" name="flags.${SYSTEM_NAME}.${FLAGS.TokenPerceptionAROverride}">
                        <option value="inherit" ${arOverride === 'inherit' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.TokenOverride.Inherit")}</option>
                        <option value="enabled" ${arOverride === 'enabled' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.TokenOverride.Enabled")}</option>
                        <option value="disabled" ${arOverride === 'disabled' ? 'selected' : ''}>${game.i18n.localize("SR5.Perception.TokenOverride.Disabled")}</option>
                    </select>
                </div>
                <p class="hint">${game.i18n.localize("SR5.Perception.TokenOverride.ARHint")}</p>
            </div>
        `);

        anchor.after(modeSelectDiv, arSelectDiv);

        if (!RoutingLibIntegration.ready || !actor?.system.movement) return;

        const flagValue = app.token.getFlag(SYSTEM_NAME, FLAGS.TokenUseRoutingLib) ?? true;
        const id = `${app.id}-${FLAGS.TokenUseRoutingLib}`;

        const routingLibDiv = $(`
            <div class="form-group">
                <label for="${id}">${game.i18n.localize("SETTINGS.TokenUseRoutingLib")}</label>
                <div class="form-fields">
                    <input type="checkbox"
                        name="flags.${SYSTEM_NAME}.${FLAGS.TokenUseRoutingLib}"
                        id="${id}"
                        ${flagValue ? 'checked' : ''}>
                </div>
            </div>
        `);

        arSelectDiv.after(routingLibDiv);
    }
}
