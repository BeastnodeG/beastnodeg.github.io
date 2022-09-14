export const names = {
    "Toon-Up": ["Feather", "Megaphone", "Lipstick", "Bamboo Cane", "Pixie Dust", "Juggling Cubes", "Confetti Cannon", "High Dive"],
    "Trap": ["Banana Peel", "Rake", "Springboard", "Marbles", "Quicksand", "Trapdoor", "Wrecking Ball", "TNT"],
    "Lure": ["$1 Bill", "Small Magnet", "$5 Bill", "Big Magnet", "$10 Bill", "Hypno Goggles", "$50 Bill", "Presentation"],
    "Sound": ["aoogah", "aoogah", "aoogah", "aoogah", "aoogah", "trunk", "fog", "opera"],
    "Squirt": ["soak", "soak", "soak", "soak", "seltzer", "hose", "cloud", "geyser"],
    "Zap": ["battery", "battery", "battery", "battery", "taser", "tv", "tesla", "lightning"],
    "Throw": ["Cupcake", "Fruit Pie Slice", "Cream Pie Slice", "Birthday Cake Slice", "Whole Fruit Pie", "Whole Cream Pie", "Birthday Cake", "Wedding Cake"],
    "Drop": ["weight", "weight", "weight", "weight", "weight", "safe", "boulder", "piano"],
    "Special": ["Fire", "Sue", "Professor Pete", "Rain"]
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

export const sos_multipliers = {
    "Toon-Up": [1.2, 1.3, 1.4],
    "Trap": [1.2, 1.3, 1.4],
    "Lure": [1.05, 1.10, 1.15],
    "Sound": [1.05, 1.10, 1.15],
    "Squirt": [1.10, 1.15, 1.20],
    "Zap": [1.10, 1.15, 1.20],
    "Throw": [1.10, 1.15, 1.20],
    "Drop": [1.10, 1.15, 1.20]
}

export const short_names = {
    "Trap": ["Banana", "Rake", "Springboard", "Marbles", "Sand", "Door", "Wreck", "TNT"],
    "Sound": ["Kazoo", "Bike Horn", "Whistle", "Bugle", "Aoogah", "Trunk", "Fog", "Opera"],
    "Squirt": ["Flower", "Water Glass", "Squirtgun", "Balloon", "Seltzer", "Hose", "Cloud", "Geyser"],
    "Zap": ["Joybuzzer", "Rug", "Balloon", "Battery", "Taser", "TV", "Tesla", "Lightning"],
    "Throw": ["Cupcake", "Fruit Slice", "Cream Slice", "Birthday Slice", "Fruit Pie", "Cream Pie", "Birthday Cake", "Wedding Cake"],
    "Drop": ["Flower Pot", "Sandbag", "Bowling Ball", "Anvil", "Big Weight", "Safe", "Boulder", "Piano"],
    "Special": ["Fire", "Sue", "Pete"]
}

export const damages = {
    "Toon-Up": [8, 15, 26, 39, 50, 78, 95, 135],
    "Trap": [20, 35, 50, 75, 115, 160, 220, 280],
    "Sound": [4, 7, 11, 16, 21, 32, 50, 65],
    "Squirt": [4, 8, 12, 21, 30, 56, 80, 115],
    "Zap": [4, 6, 10, 16, 24, 40, 66, 80],
    "Throw": [8, 13, 20, 35, 50, 90, 130, 170],
    "Drop": [12, 20, 35, 55, 80, 125, 180, 220]
}

export const rounds = {
    "Lure": [3, 3, 4, 4, 5, 5, 6, 6],
    "Squirt": [3, 3, 4, 4, 5, 5, 6, 6]
}

export const accuracies = {
    "Lure": [0.65, 0.65, 0.7, 0.7, 0.75, 0.75, 0.8, 0.8]
}

export function isMultiTarget(track, level) {
    return track === 3 || (level % 2 === 1 && (track === 2 || track === 0)) || (track === 8 && (level === 2 || level === 3))
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
