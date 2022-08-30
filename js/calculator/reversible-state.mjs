import { State } from "./state.mjs"
import { EffectManager } from "./effects.mjs"

export class ReversibleState extends State {
    constructor(delay = 1800, max_level = 8) {
        super(max_level)
        this.cogs_copy = {}
    }

    saveState(id = 0) {
        this.cogs_copy[id] = this.cogs.map(x => this.cloneCog(x))
    }

    loadState(id = 0) {
        if (this.cogs_copy[id])
            this.cogs = this.cogs_copy[id].map(x => this.cloneCog(x))
        this.accuracy = 1
    }

    cloneCog(x) {
        const clone = Object.assign(Object.create(Object.getPrototypeOf(x)), x)
        clone.effects = new EffectManager(clone)
        for (const i of x.effects.getAll())
            clone.effects.add(Object.assign(Object.create(Object.getPrototypeOf(i)), i))

        clone.damageQueue = []
        clone.extraQueue = []
        return clone
    }
}