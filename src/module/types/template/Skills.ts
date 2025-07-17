import { ModifiableField } from '../fields/ModifiableField';
import { ModifiableValue, KeyValuePair } from './Base';
import { ActiveSkillData, type ActiveSkillDefinition } from 'src/module/config/ActiveSkills';

const { SchemaField, BooleanField, ArrayField, StringField, TypedObjectField } = foundry.data.fields;

export type SkillCategories = 'active' | 'language' | 'knowledge';

export const SkillField = () => ({
    ...ModifiableValue(),
    name: new StringField({ required: true }),
    hidden: new BooleanField(),
    label: new StringField({ required: true }),
    bonus: new ArrayField(new SchemaField(KeyValuePair())),
    attribute: new StringField({ required: true }),
    _delete: new BooleanField(), // Does it use it?
    specs: new ArrayField(new StringField({ required: true })),
    canDefault: new BooleanField({ initial: true }),
    id: new StringField({ required: true }),
    link: new StringField({ required: true }),
    group: new StringField({ required: true }),
});

function skill(
    createData: foundry.data.fields.SchemaField.CreateData<ReturnType<typeof SkillField>> = {},
): SkillFieldType {
    const initialValue = new ModifiableField(SkillField()).getInitialValue(createData);
    return foundry.utils.mergeObject(initialValue, createData) as SkillFieldType;
}

function createSkillFromSkillData(skillDef: ActiveSkillDefinition) {
    const { linkedAttribute, skillGroupLabel, flags, requires } = skillDef;
    const options: any = {
        attribute: linkedAttribute,
    };
    if (skillGroupLabel) {
        const parts = skillGroupLabel.split('.');
        // fix close combat; TODO: Remove this stuff, and reference the label directly
        options.group = parts[parts.length - 1].replace(/([a-z])([A-Z])/g, '$1 $2');
    }
    if (!flags.canDefault) {
        options.canDefault = false;
    }

    // fix flight
    const needsFlight = requires?.[0]?.characterFlags?.includes('can-fly');
    if (needsFlight) {
        options.hidden = true;
    }

    return options;
}

export const Skills = () =>
    new TypedObjectField(new ModifiableField(SkillField()), {
        required: true,
        initial: Object.fromEntries(
            ActiveSkillData.map((skillDef) => [skillDef.id, skill(createSkillFromSkillData(skillDef))]),
        ) as Record<string, ReturnType<typeof skill>>,
    });

console.log(Skills().getInitialValue());

export const KnowledgeSkillList = (initialAttribute: string) => ({
    attribute: new StringField({
        required: true,
        initial: initialAttribute,
        choices: ['willpower', 'logic', 'intuition', 'charisma'],
    }),
    value: new TypedObjectField(new ModifiableField(SkillField()), { required: true, initial: {} }),
});

export const KnowledgeSkills = () => ({
    street: new SchemaField(KnowledgeSkillList('intuition')),
    academic: new SchemaField(KnowledgeSkillList('logic')),
    professional: new SchemaField(KnowledgeSkillList('logic')),
    interests: new SchemaField(KnowledgeSkillList('intuition')),
});

// Not yet implemented in fvtt-types curently
export type SkillsType = Record<string, SkillFieldType>;
export type SkillFieldType = foundry.data.fields.SchemaField.InitializedData<ReturnType<typeof SkillField>>;
export type KnowledgeSkillsType = foundry.data.fields.SchemaField.InitializedData<ReturnType<typeof KnowledgeSkills>>;

export type KnowledgeSkillCategory = keyof ReturnType<typeof KnowledgeSkills>;
