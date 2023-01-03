import { BattleController } from "../interfaces.mjs"
import { ControlledCog } from "../cog.mjs"
import { CogCheat, CogAttackAll, CogAttackSingle } from "../cog-attack.mjs"
import { Effect, EffectDamageMultiplier, EffectSkip } from "../effects.mjs"
import { printRoman } from "../constants.mjs"

export class BattleControllerDOPA extends BattleController {
    initialize() {
        this.state.spawnCog(new DerrickHand())
        this.state.spawnCog(new DirectorOfLandDevelopment())
        this.state.spawnCog(new DirectorOfPublicAffairs())
    }
}

export class DerrickHand extends ControlledCog {
    constructor() {
        super(25, { executive: 1, v2: 1, type: "normal", health: 1100 })
        this.display = "The Derrick Hand"
        this.image = "sprites/cogs/derrickhand.png"
        this.attacks = [
            new CogAttackSingle(this, { damage: 25.9, accuracy: 0.75, frequency: 1, name: "Fountain Pen" }),
            new CogAttackSingle(this, { damage: 24.9, accuracy: 0.95, frequency: 1, name: "Liquidate" }),
            new CogAttackSingle(this, { damage: 27.9, accuracy: 0.8, frequency: 1, name: "Withdrawal" }),
            new CogAttackSingle(this, { damage: 30.9, accuracy: 0.85, frequency: 1, name: "Freeze Assets" }),
            new CogAttackAll(this, { damage: 27.9, accuracy: 0.75, frequency: 1, name: "Quake" }),
        ]
    }

    getIntermission(state) {
        if (state.turns % 4 === 3)
            return new Refinement(this)
        return false
    }

    fire() { return false }
    sue() { return false }
}

export class DirectorOfLandDevelopment extends ControlledCog {
    constructor() {
        super(25, { executive: 1, type: "normal", health: 1250 })
        this.display = "D. of Land Dev."
        this.image = "sprites/cogs/dold.png"
        this.attacks = [
            new CogAttackSingle(this, { damage: 32, accuracy: 0.75, frequency: 2, name: "Re-Org" }),
            new CogAttackSingle(this, { damage: 30, accuracy: 0.95, frequency: 1, name: "Brainstorm" }),
            new CogAttackSingle(this, { damage: 31, accuracy: 0.8, frequency: 2, name: "Eviction Notice" }),
            new CogAttackAll(this, { damage: 26, accuracy: 0.85, frequency: 2, name: "Tremor" }),
            new CogAttackAll(this, { damage: 28, accuracy: 0.75, frequency: 3, name: "Quake" }),
        ]
    }

    getIntermission(state) {
        if (state.turns % 3 === 1)
            return new InkDrain(this)
        return false
    }

    fire() { return false }
    sue() { return false }
}

export class DirectorOfPublicAffairs extends ControlledCog {
    constructor() {
        super(30, { executive: 1, type: "normal", health: 1500 })
        this.display = "D. of Public Affairs"
        this.image = "sprites/cogs/dopa.png"
        this.attacks = [
            new CogAttackSingle(this, { damage: 36, accuracy: 0.75, frequency: 1, name: "Schmooze" }),
            new CogAttackSingle(this, { damage: 32, accuracy: 0.95, frequency: 1, name: "Brain Storm" }),
            new CogAttackAll(this, { damage: 27, accuracy: 0.8, frequency: 1, name: "Guilt Trip" }),
            new CogAttackAll(this, { damage: 30, accuracy: 0.75, frequency: 1, name: "Synergy" }),
        ]
    }

    getIntermission(state) {
        if (state.turns === 0)
            return new Authority(this)
        return false
    }

    getExtras(state) {
        const answer = []
        const effect = this.effects.find("Marketing")
        if (!effect) return []
        for (let j = 0; j < effect.rounds - effect.skipped; j++) {
            const gp = new CogAttackSingle(this, { damage: 22, accuracy: 0.7, name: "Glower Power" })
            gp.setTarget(state)
            answer.push(gp)
        }
        return answer
    }

    fire() { return false }
    sue() { return false }
}

class InkDrain extends CogCheat {
    constructor(cog) {
        super()
        this.author = cog
        this.name = "Ink Drain"
    }

    apply(state) {
        this.author.effects.trigger("UnLure")
        for (const i of state.toons)
            i.effects.add(new EffectDamageMultiplier(0.75, 2))
    }
}

class Refinement extends CogCheat {
    constructor(cog) {
        super()
        this.author = cog
        this.name = "Refinement"
        this.target_string = "all cogs"
    }

    apply(state) {
        this.author.effects.trigger("UnLure")
        for (const i of state.cogs)
            i.health += 275
    }
}

class Authority extends CogCheat {
    constructor(cog) {
        super()
        this.author = cog
        this.name = "Overwhelming Authority"
    }

    apply(state) {
        this.author.effects.add(new EffectDisruption(this.author))
        for (const i of state.toons)
            i.effects.add(new EffectAuthority())
    }
}

class EffectDisruption extends Effect {
    constructor(cog) {
        super()
        this.health = cog.health
        this.rounds = 2
    }

    cleanup() {
        const cog = this.parent
        if (cog.health === this.health) {
            this.rounds--
            if (this.rounds === 0) {
                cog.effects.add(new EffectMarketing())
                this.rounds = 2
            } else {
                if (cog.effects.find("Lure"))
                    cog.effects.add(new EffectSkip(0))
                cog.effects.trigger("UnLure")
            }
        } else this.rounds = 2
        this.health = cog.health
        return true
    }

    getText() { return `Disruptive Advertisement - ${this.rounds} turns left` }
    getImage() { return "disruption" }
}

class EffectMarketing extends Effect {
    constructor() {
        super()
        this.rounds = 1
        this.skipped = 1
    }

    update(newEffect) {
        this.rounds += newEffect.rounds
        this.skipped = 1
    }

    cleanup() {
        this.skipped = 0
        return true
    }

    getText() { return `Multi-Level Marketing ${printRoman(this.rounds)}` }
    getImage() { return "marketing" }
}

class EffectAuthority extends Effect {
    constructor() {
        super()
        this.overloads = ["Unite"]
    }

    overloadUnite() {
        return 0
    }

    getText() { return "Overwhelming Authority" }
    getImage() { return "unauthorized" }
}