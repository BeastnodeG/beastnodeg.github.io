import { Card, FunctionImage, Text, Title } from "./bootwrap.mjs"
import {accuracies, calculateDamage, damages, names, sos_names} from "./calculator/constants.mjs"
import { ModifierCog } from "./calculator/cog.mjs"
import { EffectLure, EffectSoak } from "./calculator/effects.mjs"

export function printEffects(effects) {
    const bar = document.createElement("div")
    bar.classList.add("effect-bar")
    const images = effects.getImages()
    images.forEach(x => {
        const img = document.createElement("img")
        img.title = x.txt
        img.src = `/sprites/effects/${x.img}.png`
        img.dataset.bsToggle = "tooltip"
        img.dataset.bsPlacement = "bottom"
        new bootstrap.Tooltip(img)
        bar.append(img)
    })
    return bar
}

export function drawCog(i, j, cog_button) {
    const cog_panel = document.querySelector("#cog-panel")
    const element = Card(
        FunctionImage(i.image, () => cog_button(j)),
        Title(i.display),
        Text(`${i.getHealth()} / ${i.max_health}`),
        // Text(i.getEffectLine()),
        printEffects(i.effects))
    element.classList.add("cog")

    if (i.getHealth() <= 0)
        element.classList.add("dead-cog")
    else if (i.played)
        element.classList.add("played-cog")
    cog_panel.append(element)
}

export function makeGagCard(state, i, target_line, func = () => {}, shift = 64) {
    const image = FunctionImage("sprites/blank.png", func)
    image.firstChild.setAttribute("style", `background-position: ${-shift * i.level}px ${-shift * i.track_number}px`)

    if (i.sos) {
        if (i.track_number === 8) {
            image.firstChild.setAttribute("style", `background-position: -192px -512px`)
            return [image, Title(names["Special"][2]), Text(target_line)]
        }
        return [image, Title(sos_names[i.track][i.level]), Text(target_line)]
    }
    if (damages[i.track])
        target_line = `${calculateDamage(state, i)} ${target_line}`

    let name = names[i.track][i.level]
    if (i.prestige)
        name = `${name} (P.)`
    return [image, Title(name), Text(target_line)]
}

export function redrawState(context) {
    document.querySelectorAll(".tooltip").forEach(x => x.remove())

    const { cog_button, state, client_attacks, attacks } = context
    document.querySelectorAll(".cog").forEach(x => x.remove())

    for (let j = state.cogs.length - 1; j >= 0; j--)
        drawCog(state.cogs[j], j, cog_button)

    document.querySelectorAll(".gag").forEach(x => x.remove())
    const gag_panel = document.querySelector("#gag-panel")
    for (let j = client_attacks.length - 1; j >= 0; j--) {
        const i = client_attacks[j]
        const element = Card(... makeGagCard(state, client_attacks[j], attacks[j].getTargets(state)))
        element.classList.add("gag")
        if (i.played)
            element.classList.add("played-gag")
        gag_panel.append(element)
    }
}

export function spawnCog(context, level, exe, type) {
    const { state } = context
    const cog = new ModifierCog(level, { executive: exe, type })
    state.spawnCog(cog)
    return cog
}

export function spawnCogDOM(context) {
    let level = document.querySelector("#control-level").value.toLowerCase(),
        exe = document.querySelector("#control-exe").checked,
        type = document.querySelector("#control-type").value
    if (level.indexOf("exe") > -1) exe = true
    if (level.indexOf("a") > -1) type = "attack"
    if (level.indexOf("d") > -1) type = "defense"
    const cog = spawnCog(context, parseInt(level), exe, type)
    if (level.indexOf("pl") > -1) cog.effects.add(new EffectLure(99999, true))
    else if (level.indexOf("l") > -1) cog.effects.add(new EffectLure(99999, false))
    if (level.indexOf("s") > -1) cog.sue()
    if (level.indexOf("w") > -1) cog.effects.add(new EffectSoak(99999))
    redrawState(context)
}

function spawnCogsDOM(context) {
    const { state } = context
    const cogs = document.querySelector("#control-full").value.toLowerCase().split(" ")
    state.reset()
    for (let i = cogs.length - 1; i >= 0; i--) {
        const level = parseInt(cogs[i])
        const exe = cogs[i].indexOf("exe") > -1
        let type = "normal"
        if (cogs[i].indexOf("a") > -1) type = "attack"
        if (cogs[i].indexOf("d") > -1) type = "defense"
        const cog = spawnCog(context, level, exe, type)
        if (cogs[i].indexOf("pl") > -1) cog.effects.add(new EffectLure(99999, true))
        else if (cogs[i].indexOf("l") > -1) cog.effects.add(new EffectLure(99999, false))
        if (cogs[i].indexOf("s") > -1) cog.sue()
        if (cogs[i].indexOf("w") > -1) cog.effects.add(new EffectSoak(99999))
    }
    redrawState(context)
}

export function reset(context) {
    const { state } = context
    state.reset()
    context.attacks = []
    context.client_attacks = []
    redrawState(context)
}

export function randomize(context, min, max, count) {
    reset(context)
    for (let i = 0; i < count; i++)
        spawnCog(context, Math.floor(Math.random() * (max - min + 1) + min), Math.random() < 0.2, "normal")
    redrawState(context)
}

function randomizeDOM(context) {
    let min = parseInt(document.querySelector("#control-random-min").value),
        max = parseInt(document.querySelector("#control-random-max").value),
        count = parseInt(document.querySelector("#control-random-count").value)
    if (isNaN(min)) min = 10
    if (isNaN(max)) max = 16
    if (isNaN(count)) count = 4
    randomize(context, min, max, count)
}

export function initialize(context) {
    document.querySelector("#control-create").addEventListener("click", () => spawnCogDOM(context))
    document.querySelector("#control-save").addEventListener("click", () => spawnCogsDOM(context))
    document.querySelector("#control-randomize").addEventListener("click", () => randomizeDOM(context))
    document.querySelector("#control-reset").addEventListener("click", () => reset(context))
}