import { VersionMigration } from "../VersionMigration";

const VALID_TEMPERATURE_TIERS = new Set(["neutral", "gelid", "cool", "warm", "boiling"]);

export class Version0_34_1 extends VersionMigration {
    readonly TargetVersion = "0.34.1";

    override migrateActor(actor: any): void {
        const tierPath = "system.visibilityChecks.meat.temperatureTier";
        const existingTier = foundry.utils.getProperty(actor, tierPath);

        if (typeof existingTier === "string" && VALID_TEMPERATURE_TIERS.has(existingTier)) return;

        const hasHeat = !!foundry.utils.getProperty(actor, "system.visibilityChecks.meat.hasHeat");
        foundry.utils.setProperty(actor, tierPath, hasHeat ? "warm" : "neutral");
    }
}
