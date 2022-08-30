import { BattleController } from "./interfaces.mjs"
import { ModifierCog } from "./cog.mjs"

export class BattleControllerStandard extends BattleController {
    constructor(min, max, exe) {
        super()
        this.min_level = min
        this.max_level = max
        this.executive_chance = exe
    }

    spawnSingle(level = 0) {
        const attributes = { type: "normal" }
        attributes.executive = Math.random() < this.executive_chance
        if (!level) level = this.min_level + Math.floor(Math.random() * (this.max_level - this.min_level + 1))
        this.state.spawnCog(new ModifierCog(level, attributes))
    }

    initialize() {
        if (Math.random() > 0.5) this.spawnSingle()
        this.spawnSingle(this.max_level)
        if (Math.random() > 0.4) {
            this.spawnSingle()
            if (Math.random() > 0.3) this.spawnSingle()
        }
    }

    cleanup() {
        const n = 4 - this.state.cogs.length
        for (let i = 0; i < n; i++) this.spawnSingle()
    }
}