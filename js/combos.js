import { SimulationState } from "./calculator/simulation-state.mjs"
import * as common from "./common.mjs"
import * as toon_attacks from "./calculator/toon-attack.mjs"
import { Card, Image, Text, Toast } from "./bootwrap.mjs"
import { names } from "./calculator/constants.mjs"

import { soundTest, soundDropTest, soundDoubleDropTest } from "./combos/sound.mjs"
import { syphonTest, soundZapTest } from "./combos/syphon.mjs"
import { fullZapTest } from "./combos/zap.mjs"

const context = {
    attacks: [],
    client_attacks: [],
    state: new SimulationState(1500),
}

const track_numbers = {
    "Toon-Up": 0, "Trap": 1, "Lure": 2, "Sound": 3,
    "Squirt": 4, "Zap": 5, "Throw": 6, "Drop": 7, "Special": 8
}

function play(strategy) {
    context.state.saveState(1)
    const fixed_strategy = strategy.map(x => new toon_attacks[x.id](x.target, { prestige: x.prestige, level: x.level }))
    context.state.simulate(fixed_strategy)
}

const positions = ["Right", "Mid right", "Mid left", "Left"]
async function copy(combo) {
    const texts = combo.strategy.map(x => x.target > -1 ? `${names[x.id][x.level]} ${positions[x.target]}` : names[x.id][x.level])
    if (combo.description)
        texts.push(combo.description)
    const str = texts.join(" ")
    await navigator.clipboard.writeText(str)

    Toast(
        "Combo Calculator",
        "Description copied to clipboard!"
    )
}

function createCombo(combo) {
    const container = document.createElement("div")
    container.classList.add("mb-1", "row", "row-cols-lg-6")
    const cog_count = context.state.cogs.length
    for (let j = combo.strategy.length - 1; j >= 0; j--) {
        const i = combo.strategy[j]
        const symbol = i.prestige ? "O" : "X"
        const image = Image("sprites/blank.png")
        image.setAttribute("style", `background-position: ${-64 * i.level}px ${-64 * track_numbers[i.id]}px`)
        let target_line = i.target === -1 ? symbol.repeat(cog_count) : "-".repeat(cog_count - i.target - 1) + symbol + "-".repeat(i.target)
        const element = Card(
            image,
            Text(target_line))
        element.classList.add("small-gag")
        container.append(element)
    }

    const desc = document.createElement("div")
    desc.innerHTML = `Cost: ${combo.cost}<br>Accuracy: ${combo.accuracy}%<br>${combo.description}`
    container.append(desc)

    const horizontal = document.createElement("div")
    horizontal.classList.add("combo-gag-panel")
    horizontal.append(container)

    const replay = document.createElement("button")
    replay.classList.add("btn", "btn-info", "mb-2")
    replay.innerHTML = "Replay"
    replay.addEventListener("click", () => play(combo.strategy))
    horizontal.append(replay)

    const copy_b = document.createElement("button")
    copy_b.classList.add("btn", "btn-info", "mb-2", "ms-2")
    copy_b.innerHTML = "Copy to clipboard"
    copy_b.addEventListener("click", () => copy(combo))
    horizontal.append(copy_b)

    document.querySelector("#combos-found").append(horizontal)
}

function generateCombos() {
    if (context.state.cogs.length > 4) {
        alert("Too many cogs!")
        return
    }
    context.state.saveState()

    const sound = document.querySelector("#control-sound").checked,
        zap = document.querySelector("#control-cringe-zap").checked,
        double_squirt = document.querySelector("#control-double-pres-squirt").checked,
        syphon = document.querySelector("#control-syphon").checked,
        sound_count = document.querySelector("#control-sound-count").value,
        prestige_sound_count = document.querySelector("#control-prestige-sound-count").value

    const parameters = { sound: sound_count, prestige_sound: prestige_sound_count, double_squirt }
    const strategies = []
    if (sound) {
        strategies.push(soundTest(context.state, parameters))
        if (sound_count > 2) strategies.push(soundDropTest(context.state, parameters))
        if (sound_count > 1) strategies.push(soundDoubleDropTest(context.state, parameters))
    }
    if (syphon) {
        strategies.push(syphonTest(context.state, parameters))
        strategies.push(soundZapTest(context.state, parameters))
    }
    if (zap) strategies.push(fullZapTest(context.state, parameters))
    strategies.sort((x, y) => x.cost - y.cost)

    document.querySelectorAll(".combo-gag-panel").forEach(x => x.remove())
    for (const i of strategies.filter(x => x.strategy))
        createCombo(i)
}

document.addEventListener("simulation-finish", () => {
    context.state.loadState(1)
    common.redrawState(context)
})
document.addEventListener("simulation-turn", () => {
    common.redrawState(context)
})

document.addEventListener("DOMContentLoaded", () => {
    common.initialize(context)
    document.querySelector("#control-run").addEventListener("click", generateCombos)
})
