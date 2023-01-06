export const names = {
    "Toon-Up": ["Feather", "Megaphone", "Lipstick", "Bamboo Cane", "Pixie Dust", "Juggling Cubes", "Confetti Cannon", "High Dive"],
    "Trap": ["Banana Peel", "Rake", "Springboard", "Marbles", "Quicksand", "Trapdoor", "Wrecking Ball", "TNT"],
    "Lure": ["$1 Bill", "Small Magnet", "$5 Bill", "Big Magnet", "$10 Bill", "Hypno Goggles", "$50 Bill", "Presentation"],
    "Sound": ["Kazoo", "Bike Horn", "Whistle", "Bugle", "Aoogah", "Elephant Trunk", "Foghorn", "Opera Singer"],
    "Squirt": ["Squirting Flower", "Glass of Water", "Squirt Gun", "Water Balloon", "Seltzer Bottle", "Fire Hose", "Storm Cloud", "Geyser"],
    "Zap": ["Joybuzzer", "Rug", "Lightbulb", "Broken Radio", "Kart Battery", "Broken Television", "Stagelight", "Tesla Coil", "Lightning"],
    "Throw": ["Cupcake", "Fruit Pie Slice", "Cream Pie Slice", "Birthday Cake Slice", "Whole Fruit Pie", "Whole Cream Pie", "Birthday Cake", "Wedding Cake"],
    "Drop": ["Flower Pot", "Sandbag", "Bowling Ball", "Anvil", "Big Weight", "Safe", "Boulder", "Piano"],
    "Special": ["Fire", "Sue", "Rain"]
}

export const sos_names = {
    "Toon-Up": ["Madam Chuckles", "Daffy Don", "Flippy"],
    "Trap": ["Will", "Penny", "Clara"],
    "Lure": ["Stinky Ned", "Nancy Gas", "Lil Oldman"],
    "Sound": ["Barbara Seville", "Sid Sonata", "Moe Zart"],
    "Squirt": ["Sid Squid", "Sanjay Splash", "Sharky Jones"],
    "Zap": ["Dentist Daniel", "Electra Eel", "Nat"],
    "Throw": ["Cleff", "Cindy Sprinkles", "Pierce"],
    "Drop": ["Clumsy Ned", "Franz Neckvein", "Barnacle Bessie"]
}

export const sos_damages = {
    "Toon-Up": [25, 35, 60],
    "Trap": [65, 90, 170],
    "Lure": [15, 18, 30],
    "Sound": [15, 20, 35],
    "Squirt": [25, 35, 60],
    "Zap": [25, 35, 60],
    "Throw": [30, 40, 70],
    "Drop": [35, 45, 80]
}

export const short_names = {
    "Trap": ["Banana", "Rake", "Springboard", "Marbles", "Sand", "Door", "Wreck", "TNT"],
    "Sound": ["Kazoo", "Bike Horn", "Whistle", "Bugle", "Aoogah", "Trunk", "Fog", "Opera"],
    "Squirt": ["Flower", "Water Glass", "Squirtgun", "Balloon", "Seltzer", "Hose", "Cloud", "Geyser"],
    "Zap": ["Joybuzzer", "Bulb", "Radio", "Battery", "TV", "Stage", "Tesla", "Lightning"],
    "Throw": ["Cupcake", "Fruit Slice", "Cream Slice", "Birthday Slice", "Fruit Pie", "Cream Pie", "Birthday Cake", "Wedding Cake"],
    "Drop": ["Flower Pot", "Sandbag", "Bowling Ball", "Anvil", "Big Weight", "Safe", "Boulder", "Piano"],
    "Special": ["Fire", "Sue", "Rain"]
}

export const damages = {
    "Toon-Up": [8, 15, 26, 45, 60, 84, 90, 135],
    "Trap": [20, 35, 50, 75, 115, 160, 220, 280],
    "Lure": [5, 10, 15, 30, 55, 45, 100, 75],
    "Sound": [5, 10, 16, 23, 30, 50, 70, 90],
    "Squirt": [4, 8, 12, 21, 30, 56, 85, 115],
    "Zap": [12, 20, 36, 60, 90, 140, 190, 240],
    "Throw": [8, 13, 20, 35, 56, 90, 130, 170],
    "Drop": [15, 25, 40, 60, 90, 140, 200, 240],
}

export const rounds = {
    "Lure": [2, 2, 3, 3, 4, 4, 5, 5],
    "Squirt": [3, 3, 3, 3, 4, 4, 4, 4],
}

export const accuracies = {
    "Lure": [0.7, 0.65, 0.75, 0.7, 0.8, 0.75, 0.85, 0.8]
}

export function isMultiTarget(track, level) {
    return track === 3 || (level % 2 === 1 && (track === 2 || track === 0))
}

export function weightedRandom(arr, key = false) {
    const r = key ? arr.map(x => x[key]) : arr
    const s = r.reduce((x, y) => x + y, 0)
    if (s <= 0) return false
    let n = Math.floor(Math.random() * s)
    for (let i = 0; i < r.length; i++) {
        if (n < r[i]) return arr[i]
        n -= r[i]
    }
    return arr[arr.length - 1]
}

export function printRoman(n) {
    if (n > 1099) return ""
    const start = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM", "M"][Math.floor(n / 100)]
    const mid = ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"][Math.floor((n % 100) / 10)]
    const end = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"][n % 10]
    return start + mid + end
}

export function calculateDamage(state, parameters) {
    let { track, level, prestige, target } = parameters
    let value = damages[track][level]
    if (prestige && track === "Squirt")
        value = Math.ceil(1.2 * value)

    if (prestige && track === "Lure")
        value = Math.ceil((level % 2 === 1 ? 1.25 : 1.15) * value)

    if (track === "Trap") {
        const targetCog = state.cogs[target]
        if (targetCog.executive)
            value *= 1.3
        if (prestige)
            value *= 1.2
        value = Math.ceil(value)
    }

    return value
}
