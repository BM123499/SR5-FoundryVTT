const { SchemaField, BooleanField, StringField } = foundry.data.fields;

const THERMOGRAPHIC_TIER_CHOICES = {
    neutral: 'SR5.Vision.ThermographicTemperatureTier.Neutral',
    gelid: 'SR5.Vision.ThermographicTemperatureTier.Gelid',
    cool: 'SR5.Vision.ThermographicTemperatureTier.Cool',
    warm: 'SR5.Vision.ThermographicTemperatureTier.Warm',
    boiling: 'SR5.Vision.ThermographicTemperatureTier.Boiling',
} as const;

export const VisibilityChecks = (...spaces: (Shadowrun.SpaceTypes | 'astralActive')[]) => {
    // Character/vehicle actors default to warm bodies; matrix/astral-only actors default to neutral.
    const hasHeat = spaces.includes('meatspace');
    const defaultTier = hasHeat ? 'warm' : 'neutral';

    return {
        astral: new SchemaField({
            hasAura: new BooleanField({ initial: spaces.includes('astral') }),
            astralActive: new BooleanField({ initial: spaces.includes('astralActive') }),
            affectedBySpell: new BooleanField(),
        }),
        matrix: new SchemaField({
            hasIcon: new BooleanField({ initial: spaces.includes('matrix') }),
            runningSilent: new BooleanField(),
        }),
        meat: new SchemaField({
            hasHeat: new BooleanField({ initial: hasHeat }),
            temperatureTier: new StringField({
                required: true,
                nullable: false,
                initial: defaultTier,
                choices: THERMOGRAPHIC_TIER_CHOICES,
                label: 'SR5.Vision.ThermographicTemperatureTier.Label',
                hint: 'SR5.Vision.ThermographicTemperatureTier.Hint',
            }),
        }),
    };
};
