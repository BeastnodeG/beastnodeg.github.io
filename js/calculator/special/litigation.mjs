import { BattleController } from "../interfaces.mjs"
import { ControlledCog, ModifierCog } from "../cog.mjs"
import { CogCheat, CogAttackAll, CogAttackSingle } from "../cog-attack.mjs"
import { printRoman } from "../constants.mjs"
import { Effect, EffectDamageMultiplier, EffectVulnerable, EffectSkip } from "../effects.mjs"

export class BattleControllerLitigation extends BattleController {
    constructor(string) {
        super()
        this.string = string
    }

    initialize() {
        for (const i of Object.keys(arr))
            if (this.string.indexOf(i) > -1 && this.string.indexOf(i) < 4)
                this.state.spawnCog(new arr[i](this.state))
        for (const i of Object.keys(arr))
            if (this.string.indexOf(i) > 3)
                this.state.spawnCog(new arr[i](this.state))

        this.state.max_size = 4
        this.state.increase_size = false
    }

    getTurns() {
        for (const i of this.state.cogs)
            if (i instanceof LitigationMaster)
                i.addCheats(this.state)

        let output = []
        for (const i of this.state.cogs)
            if (i instanceof LitigationMaster && !i.effects.find("Lure")) {
                output = output.concat(i.cheat_queue)
                i.cheat_queue = []
            }

        output = output.concat(super.getTurns())
        return output
    }

    cleanup() {
        if (this.state.turns % 3 !== 0) return
        for (const i of this.state.cogs)
            if (i instanceof Litigator)
                return // bayou bash

        if (this.state.cogs.length >= this.state.max_size) return
        const level = 10 + Math.floor(Math.random() * 9)
        const mc = new ModifierCog(level, { executive: Math.random() < 0.2, type: "normal" })
        this.state.spawnCog(mc)
    }
}

export class LitigationMaster extends ControlledCog {
    constructor(level, state) {
        super(level, { executive: 1, type: "normal" })
        this.effects.add(new EffectDesperate())
        this.state = state
        this.cheat_queue = []
    }

    dealDamage(i) {
        super.dealDamage(i)
        if (this.health <= 0)
            for (const i of this.state.cogs)
                if (i instanceof LitigationMaster && i.health > 0)
                    i.effects.find("Desperate").active = true
    }

    fire() { return false }
    sue() { return false }
    triggerShieldsUp() {}
    addCheats() {}

    cloneInto(clone) {
        clone.cheat_queue = []
        for (const i of this.cheat_queue)
            clone.cheat_queue.push(Object.assign(Object.create(Object.getPrototypeOf(i)), i))
    }
}

export class Litigator extends LitigationMaster {
    constructor(state) {
        super(40, state)
        this.health = this.max_health = 4250
        this.defense = 75
        this.display = "Litigator"
        this.image = "sprites/cogs/litigator.png"
        this.attacks = [
            new CogAttackSingle(this, { damage: 36, accuracy: 0.95, frequency: 1, name: "Evil Eye" }),
            new CogAttackSingle(this, { damage: 40, accuracy: 0.95, frequency: 1, name: "Throw Book" }),
            new CogAttackSingle(this, { damage: 43, accuracy: 0.95, frequency: 1, name: "Chomp" }),
            new CogAttackSingle(this, { damage: 48, accuracy: 0.95, frequency: 1, name: "Fired" }),
            new CogAttackAll(this, { damage: 38, accuracy: 0.95, frequency: 1, name: "Power Trip" }),
        ]
        this.used_bashes = 0
    }

    getIntermission(state) {
        this.found_steno = state.cogs.filter(x => x instanceof Stenographer).length > 0
        if (!this.effects.find("Flame"))
            this.effects.add(new EffectFlame())
    }

    addCheats(state) {
        if (state.turns % 3 === 2 && state.toons && state.toons.length > 0) {
            let max = { key: 0, max: 1 }
            for (let i = 0; i < state.toons.length; i++)
                if (max.max < state.toons[i].dealt_damage) {
                    max.key = i
                    max.max = state.toons[i].dealt_damage
                }
            this.cheat_queue.push(new Snap(this, max.key, 30, this.found_steno ? 1.4 : 1.2))
        }

        const shift = Math.floor(this.targeted_damage.reduce((x, y) => x + y - 1, this.indirect_damage) / 500)
        const turns = 1 + Math.floor((state.turns + shift) / 4)
        while (this.used_bashes < turns) {
            this.used_bashes++
            this.cheat_queue.push(new BayouCall(this, state))
        }
    }

    triggerShieldsUp(state) {
        this.cheat_queue.push(new BayouCall(this, state))
    }
}

class BayouCall extends CogCheat {
    constructor(cog, state) {
        super()
        this.author = cog
        this.name = `Bayou Bash ${printRoman(state.max_size)}`
        this.target_string = "the battle"
    }

    applyBash(state) {
        if (!state.increase_size) state.increase_size = true
        else if (state.max_size < 6) state.max_size++
        for (let i = state.cogs.length; i < state.max_size; i++) {
            const level = 10 + Math.floor(Math.random() * 9)
            const mc = new ModifierCog(level, { executive: Math.random() < 0.2, type: "normal" })
            if (state.cogs.filter(x => x instanceof CaseManager).length > 0)
                mc.effects.add(new EffectInsured())
            state.spawnCog(mc)
        }
    }

    applyBellow(state) {
        this.name = "Bayou Bellow"
        this.target_string = "all cogs"
        for (const i of state.cogs) {
            i.effects.trigger("UnLure")
            if (i.effects.find("Sue"))
                i.effects.add("Skip")
            i.effects.remove("Sue")
            i.effects.remove("Soak")
        }
    }

    apply(state) {
        if (!this.author.effects.find("UsedBash") && state.cogs.length < 6) {
            this.applyBash(state)
            this.author.effects.add(new EffectUsedBash())
        }
        else
            this.applyBellow(state)
    }
}

class Snap extends CogCheat {
    constructor(author, target, damage, multiplier) {
        super()
        this.author = author
        this.target = target
        this.damage = damage
        this.multiplier = multiplier
        this.name = damage > 15 ? "Snap" : "Microsnap"
    }

    apply(state) {
        const toon = state.toons[this.target]
        if (!toon) return
        if (!toon.canBeAttacked(2)) return
        toon.dealDamage(this.damage)
        toon.effects.add(new EffectVulnerable(this.multiplier, 3))
    }
}

export class Stenographer extends LitigationMaster {
    constructor(state) {
        super(35, state)
        this.health = this.max_health = 4000
        this.defense = 75
        this.display = "Stenographer"
        this.image = "sprites/cogs/stenographer.png"
        this.attacks = [
            new CogAttackSingle(this, { damage: 30, accuracy: 0.95, frequency: 1, name: "Buzzword" }),
            new CogAttackSingle(this, { damage: 30, accuracy: 0.95, frequency: 1, name: "Jargon" }),
            new CogAttackSingle(this, { damage: 38, accuracy: 0.95, frequency: 1, name: "Filibuster" }),
            new CogAttackSingle(this, { damage: 45, accuracy: 0.95, frequency: 1, name: "Pound Key" }),
        ]
        this.fee_damage = 24
    }

    getIntermission(state) {
        this.found_gator = state.cogs.filter(x => x instanceof Litigator).length > 0
    }

    addCheats(state) {
        if (state.turns % 4 === 3 && state.toons && state.toons.length > 0) {
            let max = { key: 0, min: 1 }
            for (let i = 0; i < state.toons.length; i++)
                if (max.min > state.toons[i].dealt_damage) {
                    max.key = i
                    max.min = state.toons[i].dealt_damage
                }
            this.cheat_queue.push(new Sanction(this, max.key, 26, this.found_gator ? 0.25 : 0.5))
        }

        if (state.turns % 3 === 2) {
            this.cheat_queue.push(new CourtFees(this, this.fee_damage))
            this.fee_damage += 4
        }

        if (!this.effects.find("Lure"))
            this.cheat_queue.push(new CourtRecord(this, 5 + Math.floor(Math.random() * 3)))
    }
}

class Sanction extends CogCheat {
    constructor(author, target, damage, multiplier) {
        super()
        this.author = author
        this.target = target
        this.damage = damage
        this.multiplier = multiplier
        this.name = damage > 15 ? "Court Sanction" : "Microsanction"
    }

    apply(state) {
        const toon = state.toons[this.target]
        if (!toon) return
        if (!toon.canBeAttacked(2)) return
        toon.dealDamage(this.damage)
        toon.effects.add(new EffectDamageMultiplier(this.multiplier, 2))
    }
}

class CourtRecord extends CogCheat {
    constructor(cog, pick) {
        super()
        this.author = cog
        this.pick = pick
        this.name = `Court Record on ${pick + 1}`
    }

    apply(state) {
        for (const i of state.toons)
            i.effects.add(new EffectPunishment(this.pick))
    }
}

class CourtFees extends CogCheat {
    constructor(author, damage) {
        super()
        this.author = author
        this.damage = damage
        this.name = "Court Fees"
    }

    apply(state) {
        for (const i of state.toons)
            if (i.canBeAttacked(2))
                i.dealDamage(this.damage)
    }
}

export class CaseManager extends LitigationMaster {
    constructor(state) {
        super(35, state)
        this.health = this.max_health = 3750
        this.defense = 75
        this.display = "Case Manager"
        this.image = "sprites/cogs/case.png"
        this.attacks = [
            new CogAttackSingle(this, { damage: 33, accuracy: 0.95, frequency: 1, name: "Fountain Pen" }),
            new CogAttackSingle(this, { damage: 36, accuracy: 0.95, frequency: 1, name: "Rolodex" }),
            new CogAttackSingle(this, { damage: 38, accuracy: 0.95, frequency: 1, name: "Eviction Notice" }),
            new CogAttackSingle(this, { damage: 39, accuracy: 0.95, frequency: 1, name: "Restraining Order" }),
            new CogAttackAll(this, { damage: 31, accuracy: 0.95, frequency: 1, name: "Power Trip" }),
        ]
    }

    getIntermission(state) {
        this.found_steno = state.cogs.filter(x => x instanceof Stenographer)[0]
    }

    addCheats(state) {
        if (state.turns % 3 === 1) {
            const target = Math.floor(Math.random() * state.toons.length)
            if (state.toons[target])
                this.cheat_queue.push(new LegalBinding(this, target))
        }

        if (state.turns % 2 === 0) {
            this.cheat_queue.push(new Insurance(this, this.position))

            if (state.cogs.length > 1) {
                let target = Math.floor(Math.random() * (state.cogs.length - 1))
                if (target >= this.position) target++
                this.cheat_queue.push(new Insurance(this, target))
            }
        }
    }
}

class LegalBinding extends CogCheat {
    constructor(author, target) {
        super()
        this.author = author
        this.target = target
        this.name = "Legal Binding"
    }

    apply(state) {
        if (!state.toons[this.target]) return
        state.toons[this.target].effects.add(new EffectLegallyBound(this.author))
    }
}

class Insurance extends CogCheat {
    constructor(author, target) {
        super()
        this.author = author
        this.target = target
        this.name = "Insurance"
        this.target_string = `cog ${target + 1}`
    }

    apply(state) {
        const cog = state.cogs[this.target]
        if (!cog) return
        if (cog.effects.find("Sue")) cog.effects.add(new EffectSkip())
        cog.effects.remove("Sue")
        cog.effects.add(new EffectInsured(this.author.position === this.target ? 1 : 2))
    }
}

export class Scapegoat extends LitigationMaster {
    constructor(state) {
        super(30, state)
        this.health = this.max_health = 4500
        this.defense = 80
        this.display = "Scapegoat"
        this.image = "sprites/cogs/scapegoat.png"
        this.attacks = [
            new CogAttackSingle(this, { damage: 36, accuracy: 0.95, frequency: 1, name: "Finger Wag" }),
            new CogAttackSingle(this, { damage: 38, accuracy: 0.95, frequency: 1, name: "Bite" }),
            new CogAttackAll(this, { damage: 30, accuracy: 0.95, frequency: 1, name: "Guilt Trip" }),
            new CogAttackAll(this, { damage: 30, accuracy: 0.95, frequency: 1, name: "Tremor" }),
            new CogAttackAll(this, { damage: 31, accuracy: 0.95, frequency: 1, name: "Paradigm Shift" }),
        ]
    }

    dealDamage(i) {
        super.dealDamage(i)
    }

    getIntermission(state) {
        for (const i of state.cogs)
            if (!(i instanceof Scapegoat) && !i.effects.find("EffectGoatAbsorption"))
                i.effects.add(new EffectGoatAbsorption(this))
            else if (i instanceof Scapegoat && !i.effects.find("EffectGoatRise"))
                i.effects.add(new EffectGoatRise())
    }
}

class EffectFlame extends Effect {
    constructor() {
        super()
        this.signals = ["Soak"]
    }

    execSoak(user) {
        if (user !== false && user !== undefined)
            this.parent.cheat_queue.push(new Snap(this.parent, user, 13, this.parent.found_steno ? 1.2 : 1.1))
    }
}

class EffectPunishment extends Effect {
    constructor(k) {
        super()
        this.locks = [k]
        this.enabled = false
        this.signals = ["Gag"]
    }

    getText() {
        return `Using ${this.locks.map(x => x + 1).join(" or ")} level gags will result in a harsh punishment`
    }

    getImage() {
        return "punishment"
    }

    update(new_eff) {
        for (const i of new_eff.locks)
            if (this.locks.indexOf(i) === -1)
                this.locks.push(i)
    }

    execGag(data) {
        if (this.locks.indexOf(data.level) !== -1)
            this.parent.dealDamage(50)
    }

    cleanup() {
        if (!this.enabled) {
            this.enabled = true
            return true
        }
        return false
    }
}

class EffectLegallyBound extends Effect {
    constructor(cog) {
        super()
        this.cog = cog
        this.turns = 3
    }

    getText() {
        return `Legally bound for ${this.turns} turns`
    }

    getImage() {
        return "binding"
    }

    update(new_eff) {
        this.turns = Math.max(this.turns, new_eff.turns)
    }

    cleanup() {
        this.turns--
        if (this.turns < 2)
            this.parent.dealDamage(20)
        if (this.turns <= 0 && this.cog.found_steno)
            this.cog.found_steno.cheat_queue.push(new Sanction(this.cog.found_steno, this.parent.position, 13, 0.75))
        return this.turns > 0
    }
}

class EffectInsured extends Effect {
    constructor(turns = 2) {
        super()
        this.turns = turns
        this.overloads = ["Fire", "Sue"]
    }

    overloadFire() { return false }
    overloadSue() { return false }

    getText() {
        return `Insured for ${this.turns} turns`
    }

    getImage() {
        return "insurance"
    }

    update(new_eff) {
        this.turns = Math.max(this.turns, new_eff.turns)
    }

    cleanup() {
        this.turns--
        this.parent.health += 50
        return this.turns > 0
    }
}

class EffectDesperate extends Effect {
    constructor() {
        super()
        this.overloads = ["LureRounds"]
        this.active = false
    }

    overloadLureRounds() {
        let count = 2
        if (this.active)
            count--
        if (this.parent.effects.find("Desperate").rage)
            count--
        return count
    }
}

class EffectUsedBash extends Effect {
    cleanup() { return false }
}

class EffectGoatAbsorption extends Effect {
    constructor(goat) {
        super()
        this.goat = goat
        this.overloads = ["TakeDamage", "Fire", "Sue"]
    }

    getText() {
        return "Goat absorbs damage from this cog"
    }

    getImage() {
        return "rising"
    }

    overloadFire(x) {
        const e = this.goat.effects.find("GoatRise")
        if (e && !e.rage)
            e.rise += 20
        return x
    }

    overloadSue(x) {
        const e = this.goat.effects.find("GoatRise")
        if (e && !e.rage)
            e.rise += 15
        return x
    }

    overloadTakeDamage(data) {
        if (this.goat.effects.find("GoatRise").rage) return data
        const absorb = Math.floor(data * 0.3)
        this.goat.dealDamage(absorb)
        return data - absorb
    }
}

class EffectGoatRise extends Effect {
    constructor(state) {
        super()
        this.state = state
        this.rage = 0
        this.rise = 0
        this.ignored = 1
        this.overloads = ["TakeDamage", "DealDamage", "LureRounds"]
        this.signals = ["Soak"]
    }

    getText() {
        if (this.rage === 0)
            return `Rage rising: ${this.rise}%`
        else
            return `${this.rage} turns left`
    }

    getImage() {
        if (this.rage === 0)
            return "rising"
        else
            return "enrage"
    }

    overloadTakeDamage(data) {
        this.ignored = 0
        if (this.rage === 0) {
            this.rise += Math.floor(data / 10)
            return data
        } else if (this.parent.effects.find("Desperate").active)
            return data
        else return 0.7 * data
    }

    overloadDealDamage(data) {
        if (this.rage) return 1.3 * data
        return data
    }

    overloadLureRounds() {
        let count = 2
        if (this.parent.effects.find("Desperate").active)
            count--
        if (this.rage)
            count--
        else
            this.rise += 15
        return count
    }

    execSoak() {
        if (this.rage === 0 && !this.parent.effects.find("Soak"))
            this.rise += 15
    }

    cleanup() {
        if (this.rage === 0) {
            this.rise += 10 + 5 * this.ignored
            this.ignored++

            if (this.rise >= 100) {
                this.ignored = 0
                this.rise = 0
                this.rage = 2
            }
        } else {
            this.rage--
            if (this.rage === 0)
                for (const i of this.state.cogs)
                    if (i instanceof LitigationMaster)
                        i.triggerShieldsUp()
        }

        return true
    }
}

const arr = {
    "gator": Litigator,
    "steno": Stenographer,
    "case": CaseManager,
    "goat": Scapegoat
}

export const cheats = { Snap, BayouCall, Sanction, CourtRecord, CourtFees, LegalBinding, Insurance }