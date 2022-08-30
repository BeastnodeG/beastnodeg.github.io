import { EffectManager } from "./effects.mjs"

export class Toon {
    constructor(settings) {
        this.health = this.max_health = settings.max_health
        this.tracks = settings.tracks
        this.prestiges = settings.prestiges
        this.effects = new EffectManager(this)
        this.position = -1
        this.dealt_damage = 0

        this.gags = []
        this.max_gags = []
        for (let i = 0; i < 8; i++)
            if (this.tracks.indexOf(i) === -1) {
                this.gags[i] = [0, 0, 0, 0, 0, 0, 0, 0]
                this.max_gags[i] = [0, 0, 0, 0, 0, 0, 0, 0]
            }
            else {
                this.gags[i] = [30, 25, 20, 15, 7, 3, 2, 1]
                this.max_gags[i] = [30, 25, 20, 15, 7, 3, 2, 1]
            }

        this.stage = 0
        this.unites = []
    }

    restock(max_level) {
        for (let i = 0; i < 8; i++)
            for (let j = 0; j < this.effects.getOverload("Restock", max_level); j++)
                this.gags[i][j] = this.max_gags[i][j]
    }

    getHealth() {
        return Math.min(this.max_health, this.health + this.unites.reduce((x, y) => x + y, 0))
    }

    heal(n) {
        this.health = Math.min(this.max_health, this.health + n)
    }

    cleanup() {
        this.effects.cleanup()
        this.stage = 0
        this.heal(this.unites.reduce((x, y) => x + y, 0))
        this.unites = []
    }

    dealDamage(n) {
        const dmg = Math.floor(this.effects.getOverload("TakeDamage", n))
        while (this.health <= dmg && this.unites.length > 0) {
            this.heal(this.unites.shift())
            this.stage++
        }
        this.health -= dmg
    }

    canBeAttacked(stage) {
        return this.health > 0 && this.stage < stage
    }
}