/*
 * ActiveSkills.ts
 * => Contains Shadowrun 5th Edition raw data for ActiveSkills
 * to interface with the rest of the app
 */

// to be expanded, internal type to hide certain content
// not only skills, added it here atm
// TODO: Once used, move to its own file
export interface Requirement {
    isInverted?: boolean;
    combine?: 'every' | 'some';
    chainMode?: 'and' | 'or';
    characterFlags?: string[];
    attributes?: Record<string, number>;
    activeSkills?: Record<string, number>;
}

// mapping of skill data, so we do not need to fracture all
// skills across 3+ files
export interface ActiveSkillDefinition {
    id: string;
    label: string;
    skillGroupLabel: string;
    specializations: string[];
    linkedAttribute: string;
    flags: {
        canDefault: boolean;
        isSpecific: boolean;
    };
    category: string;
    requires: Requirement[];
}

// TODO: Change categories to labels for cosmetic purposes?
export const ActiveSkillData: ActiveSkillDefinition[] = [
    {
        id: 'archery',
        label: 'SR5.Skill.Archery',
        skillGroupLabel: '',
        specializations: ['Bow', 'Crossbow', 'Non-Standard Ammunition', 'Slingshot'],
        linkedAttribute: 'agility',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Combat',
        requires: [],
    },
    {
        id: 'automatics',
        label: 'SR5.Skill.Automatics',
        skillGroupLabel: 'SR5.SkillGroup.Firearms',
        specializations: ['Assault Rifles', 'Cyber-Implant', 'Machine Pistols', 'Submachine Guns'],
        linkedAttribute: 'agility',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Combat',
        requires: [],
    },
    {
        id: 'blades',
        label: 'SR5.Skill.Blades',
        skillGroupLabel: 'SR5.SkillGroup.CloseCombat',
        specializations: ['Axes', 'Knives', 'Swords', 'Parrying'],
        linkedAttribute: 'agility',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Combat',
        requires: [],
    },
    {
        id: 'clubs',
        label: 'SR5.Skill.Clubs',
        skillGroupLabel: 'SR5.SkillGroup.CloseCombat',
        specializations: ['Batons', 'Hammers', 'Saps', 'Staves', 'Parrying'],
        linkedAttribute: 'agility',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Combat',
        requires: [],
    },
    {
        id: 'exotic_melee',
        label: 'SR5.Skill.ExoticMelee',
        skillGroupLabel: '',
        specializations: [],
        linkedAttribute: 'agility',
        flags: {
            canDefault: false,
            isSpecific: true,
        },
        category: 'Combat',
        requires: [],
    },
    {
        id: 'exotic_range',
        label: 'SR5.Skill.ExoticRange',
        skillGroupLabel: '',
        specializations: [],
        linkedAttribute: 'agility',
        flags: {
            canDefault: false,
            isSpecific: true,
        },
        category: 'Combat',
        requires: [],
    },
    {
        id: 'heavy_weapons',
        label: 'SR5.Skill.HeavyWeapons',
        skillGroupLabel: '',
        specializations: [
            'Assault Cannons',
            'Grenade Launchers',
            'Guided Missiles',
            'Machine Guns',
            'Rocket Launchers',
        ],
        linkedAttribute: 'agility',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Combat',
        requires: [],
    },
    {
        id: 'longarms',
        label: 'SR5.Skill.Longarms',
        skillGroupLabel: 'SR5.SkillGroup.Firearms',
        specializations: ['Extended-Range Shots', 'Long-Range Shots', 'Shotguns', 'Sniper Rifles'],
        linkedAttribute: 'agility',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Combat',
        requires: [],
    },
    {
        id: 'pistols',
        label: 'SR5.Skill.Pistols',
        skillGroupLabel: 'SR5.SkillGroup.Firearms',
        specializations: ['Holdouts', 'Revolvers', 'Semi-Automatics', 'Tasers'],
        linkedAttribute: 'agility',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Combat',
        requires: [],
    },
    {
        id: 'throwing_weapons',
        label: 'SR5.Skill.ThrowingWeapons',
        skillGroupLabel: '',
        specializations: ['Aerodynamic', 'Blades', 'Non-Aerodynamic'],
        linkedAttribute: 'agility',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Combat',
        requires: [],
    },
    {
        id: 'unarmed_combat',
        label: 'SR5.Skill.UnarmedCombat',
        skillGroupLabel: 'SR5.SkillGroup.CloseCombat',
        specializations: ['Blocking', 'Cyber-Implants', 'Subduing Combat', 'Specific Martial Art'],
        linkedAttribute: 'agility',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Combat',
        requires: [],
    },
    {
        id: 'disguise',
        label: 'SR5.Skill.Disguise',
        skillGroupLabel: 'SR5.SkillGroup.Stealth',
        specializations: ['Camouflage', 'Cosmetic', 'Theatrical', 'Trideo & Video'],
        linkedAttribute: 'intuition',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Physical',
        requires: [],
    },
    {
        id: 'diving',
        label: 'SR5.Skill.Diving',
        skillGroupLabel: '',
        specializations: ['By Breathing Apparatus', 'By Condition', 'Controlled Hyperventilation'],
        linkedAttribute: 'body',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Physical',
        requires: [],
    },
    {
        id: 'escape_artist',
        label: 'SR5.Skill.EscapeArtist',
        skillGroupLabel: '',
        specializations: ['By Restraint', 'Contortionism'],
        linkedAttribute: 'agility',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Physical',
        requires: [],
    },
    {
        id: 'free_fall',
        label: 'SR5.Skill.FreeFall',
        skillGroupLabel: '',
        specializations: [
            'BASE Jumping',
            'Break-Fall',
            'Bungee',
            'HALO',
            'Low Altitude',
            'Parachute',
            'Static Line',
            'Wingsuit',
            'Zipline',
        ],
        linkedAttribute: 'body',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Physical',
        requires: [],
    },
    {
        id: 'gymnastics',
        label: 'SR5.Skill.Gymnastics',
        skillGroupLabel: 'SR5.SkillGroup.Athletics',
        specializations: ['Balance', 'Climbing', 'Dance', 'Leaping', 'Parkour', 'Rolling'],
        linkedAttribute: 'agility',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Physical',
        requires: [],
    },
    {
        id: 'palming',
        label: 'SR5.Skill.Palming',
        skillGroupLabel: 'SR5.SkillGroup.Stealth',
        specializations: ['Legerdemain', 'Pickpocket', 'Pilfering'],
        linkedAttribute: 'agility',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Physical',
        requires: [],
    },
    {
        id: 'perception',
        label: 'SR5.Skill.Perception',
        skillGroupLabel: '',
        specializations: ['Hearing', 'Scent', 'Searching', 'Taste', 'Touch', 'Visual'],
        linkedAttribute: 'intuition',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Physical',
        requires: [],
    },
    {
        id: 'running',
        label: 'SR5.Skill.Running',
        skillGroupLabel: 'SR5.SkillGroup.Athletics',
        specializations: ['Distance', 'Sprinting', 'By Terrain'],
        linkedAttribute: 'strength',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Physical',
        requires: [],
    },
    {
        id: 'sneaking',
        label: 'SR5.Skill.Sneaking',
        skillGroupLabel: 'SR5.SkillGroup.Stealth',
        specializations: ['By Terrain'],
        linkedAttribute: 'agility',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Physical',
        requires: [],
    },
    {
        id: 'survival',
        label: 'SR5.Skill.Survival',
        skillGroupLabel: 'SR5.SkillGroup.Outdoors',
        specializations: ['By Terrain'],
        linkedAttribute: 'willpower',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Physical',
        requires: [],
    },
    {
        id: 'swimming',
        label: 'SR5.Skill.Swimming',
        skillGroupLabel: 'SR5.SkillGroup.Athletics',
        specializations: ['Dash', 'Long Distance'],
        linkedAttribute: 'strength',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Physical',
        requires: [],
    },
    {
        id: 'tracking',
        label: 'SR5.Skill.Tracking',
        skillGroupLabel: 'SR5.SkillGroup.Outdoors',
        specializations: ['By Terrain'],
        linkedAttribute: 'intuition',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Physical',
        requires: [],
    },
    {
        id: 'con',
        label: 'SR5.Skill.Con',
        skillGroupLabel: 'SR5.SkillGroup.Acting',
        specializations: ['Fast Talking', 'Seduction'],
        linkedAttribute: 'charisma',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Social',
        requires: [],
    },
    {
        id: 'etiquette',
        label: 'SR5.Skill.Etiquette',
        skillGroupLabel: 'SR5.SkillGroup.Influence',
        specializations: ['By Culture', 'By Subculture'],
        linkedAttribute: 'charisma',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Social',
        requires: [],
    },
    {
        id: 'impersonation',
        label: 'SR5.Skill.Impersonation',
        skillGroupLabel: 'SR5.SkillGroup.Acting',
        specializations: ['By Metahuman Type'],
        linkedAttribute: 'charisma',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Social',
        requires: [],
    },
    {
        id: 'instruction',
        label: 'SR5.Skill.Instruction',
        skillGroupLabel: '',
        specializations: ['By Active Skill Category', 'By Knowledge Skill Category'],
        linkedAttribute: 'charisma',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Social',
        requires: [],
    },
    {
        id: 'intimidation',
        label: 'SR5.Skill.Intimidation',
        skillGroupLabel: '',
        specializations: ['Interrogation', 'Mental', 'Physical', 'Torture'],
        linkedAttribute: 'charisma',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Social',
        requires: [],
    },
    {
        id: 'leadership',
        label: 'SR5.Skill.Leadership',
        skillGroupLabel: 'SR5.SkillGroup.Influence',
        specializations: ['Command', 'Direct', 'Inspire', 'Rally'],
        linkedAttribute: 'charisma',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Social',
        requires: [],
    },
    {
        id: 'negotiation',
        label: 'SR5.Skill.Negotiation',
        skillGroupLabel: 'SR5.SkillGroup.Influence',
        specializations: ['Bargaining', 'Contracts', 'Diplomacy'],
        linkedAttribute: 'charisma',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Social',
        requires: [],
    },
    {
        id: 'performance',
        label: 'SR5.Skill.Performance',
        skillGroupLabel: 'SR5.SkillGroup.Acting',
        specializations: ['By Performance Art'],
        linkedAttribute: 'charisma',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Social',
        requires: [],
    },
    {
        id: 'alchemy',
        label: 'SR5.Skill.Alchemy',
        skillGroupLabel: 'SR5.SkillGroup.Enchanting',
        specializations: ['By Trigger', 'By Spell Type'],
        linkedAttribute: 'magic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Magic',
        requires: [{ characterFlags: ['can-enchant'] }],
    },
    {
        id: 'arcana',
        label: 'SR5.Skill.Arcana',
        skillGroupLabel: '',
        specializations: ['Spell Design', 'Focus Design', 'Spirit Formula'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Magic',
        // TODO?: keep or remove the requirement
        requires: [{ attributes: { magic: 1 } }],
    },
    {
        id: 'artificing',
        label: 'SR5.Skill.Artificing',
        skillGroupLabel: 'SR5.SkillGroup.Enchanting',
        specializations: ['Focus Analysis', 'By Focus Type'],
        linkedAttribute: 'magic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Magic',
        requires: [{ characterFlags: ['can-enchant'] }],
    },
    {
        id: 'assensing',
        label: 'SR5.Skill.Assensing',
        skillGroupLabel: '',
        specializations: ['Aura Reading', 'Astral Signatures', 'By Aura Type'],
        linkedAttribute: 'intuition',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Magic',
        requires: [{ characterFlags: ['can-astrally-percieve'] }],
    },
    {
        id: 'astral_combat',
        label: 'SR5.Skill.AstralCombat',
        skillGroupLabel: '',
        specializations: ['By Weapon Focus Type', 'By Opponents'],
        linkedAttribute: 'willpower',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Magic',
        requires: [{ characterFlags: ['can-astrally-percieve'] }],
    },
    {
        id: 'banishing',
        label: 'SR5.Skill.Banishing',
        skillGroupLabel: 'SR5.SkillGroup.Conjuring',
        specializations: ['By Spirit Type'],
        linkedAttribute: 'magic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Magic',
        requires: [{ characterFlags: ['can-summon'] }],
    },
    {
        id: 'binding',
        label: 'SR5.Skill.Binding',
        skillGroupLabel: 'SR5.SkillGroup.Conjuring',
        specializations: ['By Spirit Type'],
        linkedAttribute: 'magic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Magic',
        requires: [{ characterFlags: ['can-summon'] }],
    },
    {
        id: 'counterspelling',
        label: 'SR5.Skill.Counterspelling',
        skillGroupLabel: 'SR5.SkillGroup.Sorcery',
        specializations: ['By Spell Type'],
        linkedAttribute: 'magic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Magic',
        requires: [{ characterFlags: ['can-spellcast'] }],
    },
    {
        id: 'disenchanting',
        label: 'SR5.Skill.Disenchanting',
        skillGroupLabel: 'SR5.SkillGroup.Enchanting',
        specializations: ['By Artifact Type'],
        linkedAttribute: 'magic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Magic',
        requires: [{ characterFlags: ['can-enchant'] }],
    },
    {
        id: 'ritual_spellcasting',
        label: 'SR5.Skill.RitualSpellcasting',
        skillGroupLabel: 'SR5.SkillGroup.Sorcery',
        specializations: ['By Magic Keyword'],
        linkedAttribute: 'magic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Magic',
        requires: [{ characterFlags: ['can-spellcast'] }],
    },
    {
        id: 'spellcasting',
        label: 'SR5.Skill.Spellcasting',
        skillGroupLabel: 'SR5.SkillGroup.Sorcery',
        specializations: ['By Spell Type'],
        linkedAttribute: 'magic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Magic',
        requires: [{ characterFlags: ['can-spellcast'] }],
    },
    {
        id: 'summoning',
        label: 'SR5.Skill.Summoning',
        skillGroupLabel: 'SR5.SkillGroup.Conjuring',
        specializations: ['By Spirit Type'],
        linkedAttribute: 'magic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Magic',
        requires: [{ characterFlags: ['can-summon'] }],
    },
    {
        id: 'compiling',
        label: 'SR5.Skill.Compiling',
        skillGroupLabel: 'SR5.SkillGroup.Tasking',
        specializations: ['By sprite type'],
        linkedAttribute: 'resonance',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Resonance',
        requires: [{ attributes: { resonance: 1 } }],
    },
    {
        id: 'decompiling',
        label: 'SR5.Skill.Decompiling',
        skillGroupLabel: 'SR5.SkillGroup.Tasking',
        specializations: ['By sprite type'],
        linkedAttribute: 'resonance',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Resonance',
        requires: [{ attributes: { resonance: 1 } }],
    },
    {
        id: 'registering',
        label: 'SR5.Skill.Registering',
        skillGroupLabel: 'SR5.SkillGroup.Tasking',
        specializations: ['By sprite type'],
        linkedAttribute: 'resonance',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Resonance',
        requires: [{ attributes: { resonance: 1 } }],
    },
    {
        id: 'aeronautics_mechanic',
        label: 'SR5.Skill.AeronauticsMechanic',
        skillGroupLabel: 'SR5.SkillGroup.Engineering',
        specializations: ['Aerospace', 'Fixed Wing', 'LTA', 'Rotary Wing', 'Tilt Wing', 'Vector Thrust'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'animal_handling',
        label: 'SR5.Skill.AnimalHandling',
        skillGroupLabel: '',
        specializations: ['By animal', 'Herding', 'Riding', 'Training'],
        linkedAttribute: 'charisma',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'armorer',
        label: 'SR5.Skill.Armorer',
        skillGroupLabel: '',
        specializations: [
            'Armor',
            'Artillery',
            'Explosives',
            'Firearms',
            'Melee Weapons',
            'Heavy Weapons',
            'Weapon Accessories',
        ],
        linkedAttribute: 'logic',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'artisan',
        label: 'SR5.Skill.Artisan',
        skillGroupLabel: '',
        specializations: ['By artisinal discipline'],
        linkedAttribute: 'intuition',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'automotive_mechanic',
        label: 'SR5.Skill.AutomotiveMechanic',
        skillGroupLabel: 'SR5.SkillGroup.Engineering',
        specializations: ['Walker', 'Hover', 'Tracked', 'Wheeled'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'biotechnology',
        label: 'SR5.Skill.Biotechnology',
        skillGroupLabel: 'SR5.SkillGroup.Biotech',
        specializations: ['Bioinformatics', 'Bioware', 'Cloning', 'Gene Therapy', 'Vat Maintenance'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'chemistry',
        label: 'SR5.Skill.Chemistry',
        skillGroupLabel: '',
        specializations: ['Analytical', 'Biochemistry', 'Inorganic', 'Organic', 'Physical'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'computer',
        label: 'SR5.Skill.Computer',
        skillGroupLabel: 'SR5.SkillGroup.Electronics',
        specializations: ['By Matrix Action'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'cybercombat',
        label: 'SR5.Skill.Cybercombat',
        skillGroupLabel: 'SR5.SkillGroup.Cracking',
        specializations: ['By cybercombat target type'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'cybertechnology',
        label: 'SR5.Skill.Cybertechnology',
        skillGroupLabel: 'SR5.SkillGroup.Biotech',
        specializations: ['Bodyware', 'Cyberlimbs', 'Headware', 'Repair'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'demolitions',
        label: 'SR5.Skill.Demolitions',
        skillGroupLabel: '',
        specializations: ['Commercial Explosives', 'Defusing', 'Improvised Explosives', 'Plastic Explosives'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'electronic_warfare',
        label: 'SR5.Skill.ElectronicWarfare',
        skillGroupLabel: 'SR5.SkillGroup.Cracking',
        specializations: ['Communications', 'Encryption', 'Jamming', 'Sensor Operations'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'first_aid',
        label: 'SR5.Skill.FirstAid',
        skillGroupLabel: 'SR5.SkillGroup.Biotech',
        specializations: ['By wound type'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'forgery',
        label: 'SR5.Skill.Forgery',
        skillGroupLabel: '',
        specializations: ['Counterfeiting', 'Credstick Forgery', 'False ID', 'Image Doctoring', 'Paper Forgery'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'hacking',
        label: 'SR5.Skill.Hacking',
        skillGroupLabel: 'SR5.SkillGroup.Cracking',
        specializations: ['Devices', 'Files', 'Hosts', 'Personas'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'hardware',
        label: 'SR5.Skill.Hardware',
        skillGroupLabel: 'SR5.SkillGroup.Electronics',
        specializations: ['By hardware type'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'industrial_mechanic',
        label: 'SR5.Skill.IndustrialMechanic',
        skillGroupLabel: 'SR5.SkillGroup.Engineering',
        specializations: [
            'Electrical Power Systems',
            'Hydraulics',
            'HVAC',
            'Industrial Robotics',
            'Structural',
            'Welding',
        ],
        linkedAttribute: 'logic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'locksmith',
        label: 'SR5.Skill.Locksmith',
        skillGroupLabel: '',
        specializations: ['By lock type'],
        linkedAttribute: 'agility',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'medicine',
        label: 'SR5.Skill.Medicine',
        skillGroupLabel: 'SR5.SkillGroup.Biotech',
        specializations: [
            'Cosmetic Surgery',
            'Extended Care',
            'Implant Surgery',
            'Magical Health',
            'Organ Culture',
            'Trauma Surgery',
        ],
        linkedAttribute: 'logic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'nautical_mechanic',
        label: 'SR5.Skill.NauticalMechanic',
        skillGroupLabel: 'SR5.SkillGroup.Engineering',
        specializations: ['Motorboat', 'Sailboat', 'Ship', 'Submarine'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'navigation',
        label: 'SR5.Skill.Navigation',
        skillGroupLabel: 'SR5.SkillGroup.Outdoors',
        specializations: ['Augmented Reality Markers', 'Celestial', 'Compass', 'Maps', 'GPS'],
        linkedAttribute: 'intuition',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'software',
        label: 'SR5.Skill.Software',
        skillGroupLabel: 'SR5.SkillGroup.Electronics',
        specializations: ['Data Bombs', 'By complex form'],
        linkedAttribute: 'logic',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Technical',
        requires: [],
    },
    {
        id: 'gunnery',
        label: 'SR5.Skill.Gunnery',
        skillGroupLabel: '',
        specializations: ['Artillery', 'Ballistic', 'Energy', 'Guided Missile', 'Rocket'],
        linkedAttribute: 'agility',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Vehicle',
        requires: [],
    },
    {
        id: 'pilot_aerospace',
        label: 'SR5.Skill.PilotAerospace',
        skillGroupLabel: '',
        specializations: ['Deep Space', 'Launch Craft', 'Remote Operation', 'Semiballistic', 'Suborbital'],
        linkedAttribute: 'reaction',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Vehicle',
        requires: [],
    },
    {
        id: 'pilot_aircraft',
        label: 'SR5.Skill.PilotAircraft',
        skillGroupLabel: '',
        specializations: [
            'Fixed-Wing',
            'Lighter-Than-Air',
            'Remote Operation',
            'Rotary Wing',
            'Tilt Wing',
            'Vectored Thrust',
        ],
        linkedAttribute: 'reaction',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Vehicle',
        requires: [],
    },
    {
        id: 'pilot_walker',
        label: 'SR5.Skill.PilotWalker',
        skillGroupLabel: '',
        specializations: ['Biped', 'Multiped', 'Quadruped', 'Remote'],
        linkedAttribute: 'reaction',
        flags: {
            canDefault: false,
            isSpecific: false,
        },
        category: 'Vehicle',
        requires: [],
    },
    {
        id: 'pilot_exotic_vehicle',
        label: 'SR5.Skill.PilotExoticVehicle',
        skillGroupLabel: '',
        specializations: [],
        linkedAttribute: 'reaction',
        flags: {
            canDefault: false,
            isSpecific: true,
        },
        category: 'Vehicle',
        requires: [],
    },
    {
        id: 'pilot_ground_craft',
        label: 'SR5.Skill.PilotGroundCraft',
        skillGroupLabel: '',
        specializations: ['Bike', 'Hovercraft', 'Remote Operation', 'Tracked', 'Wheeled'],
        linkedAttribute: 'reaction',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Vehicle',
        requires: [],
    },
    {
        id: 'pilot_water_craft',
        label: 'SR5.Skill.PilotWaterCraft',
        skillGroupLabel: '',
        specializations: ['Hydrofoil', 'Motorboat', 'Remote Operation', 'Sail', 'Ship', 'Submarine'],
        linkedAttribute: 'reaction',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Vehicle',
        requires: [],
    },
    // Special skill for critters with the flight power CRB p394
    {
        id: 'flight',
        label: 'SR5.Skill.Flight',
        skillGroupLabel: 'SR5.SkillGroup.Athletics',
        specializations: [],
        linkedAttribute: 'agility',
        flags: {
            canDefault: true,
            isSpecific: false,
        },
        category: 'Physical',
        requires: [{ characterFlags: ['can-fly'] }],
    },
];

// TODO?: implement maybe lazy loading
export const ActiveSkillGroups: Record<string, ActiveSkillDefinition[]> = {};
export const ActiveSkillsById: Record<string, ActiveSkillDefinition> = {};
export const ActiveSkillCategories: Record<string, ActiveSkillDefinition[]> = {};

for (const skill of ActiveSkillData) {
    Object.freeze(skill);
    ActiveSkillsById[skill.id] = skill;

    const category = skill.category;
    if (category) {
        if (!ActiveSkillCategories[category]) ActiveSkillCategories[category] = [];
        ActiveSkillCategories[category].push(skill);
    }

    const group = skill.skillGroupLabel;
    if (group) {
        if (!ActiveSkillGroups[group]) ActiveSkillGroups[group] = [];
        ActiveSkillGroups[group].push(skill);
    }
}

// Freeze the computed content
Object.freeze(ActiveSkillData);
Object.freeze(ActiveSkillGroups);
Object.freeze(ActiveSkillsById);
Object.freeze(ActiveSkillCategories);
