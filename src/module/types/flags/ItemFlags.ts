import { SR5 } from "@/module/config";

const { NumberField, BooleanField, StringField } = foundry.data.fields;

export const FireModeData = () => ({
    value: new NumberField({ required: true, nullable: false, integer: true, initial: 0 }),
    label: new StringField({ required: true }),
    defense: new NumberField({ required: true, nullable: false, integer: true, initial: 0 }),
    recoil: new BooleanField(),
    suppression: new BooleanField(),
    mode: new StringField({
        required: true,
        initial: 'single_shot',
        choices: SR5.rangeWeaponMode
    }),
    action: new StringField({
        required: true,
        initial: 'simple',
        choices: ['free', 'simple', 'complex']
    })
});

export type SpellForceType = {
    value: number;
    reckless?: boolean;
};

export type ComplexFormLevelType = {
    value: number;
};

export type FireRangeType = {
    value: number;
};

export type FireModeType = foundry.data.fields.SchemaField.InitializedData<ReturnType<typeof FireModeData>>;
