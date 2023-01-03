import { Track } from "./toon-attack.mjs"

export class State {
    constructor(max_level = 8) {
        this.cogs = []
        this.globalStuns = 0
        this.max_level = max_level
        this.accuracy = 1
    }

    spawnCog(cog) {
        cog.position = this.cogs.length
        this.cogs.push(cog)
    }

    reverse() {
        this.cogs.reverse()
        for (let i = 0; i < this.cogs.length; i++)
            this.cogs[i].position = i
    }

    reset() {
        this.cogs = []
        this.accuracy = 1
    }

    cleanup() {
        for (let i = 0; i < this.cogs.length; i++) {
            this.cogs[i].cleanup()
            if (this.cogs[i].health <= 0) {
                this.cogs.splice(i, 1)
                i--
            }
        }
        this.globalStuns = 0
    }

    singleTurn(k, i) {
        if (!k[i])
            return
        if (k[i] instanceof Track && k[i].author)
            k[i].author.effects.trigger("Gag", k[i].parameters)
        this.accuracy *= k[i].calculateAccuracy(this)
        k[i].apply(this)
        if (i === k.length - 1 || k[i].id !== k[i + 1].id)
            k[i].cleanup(this)
    }

    turn(picks) {
        let k = picks.map((el, index) => ({ el, index }))
        k.sort((x, y) => x.el.priority(x.index) - y.el.priority(y.index))
        k = k.map(x => x.el)

        for (let i = 0; i < k.length; i++)
            this.singleTurn(k, i)
        return Math.round(this.accuracy * 1e4) / 1e4
    }
}