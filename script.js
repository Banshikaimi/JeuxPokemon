// ----------------- CHOIX DU JEU -----------------
document.getElementById("hlBtn").addEventListener("click", () => {
    document.getElementById("gameChoice").classList.add("hidden");
    document.getElementById("hlGame").classList.remove("hidden");
});

document.getElementById("cryBtn").addEventListener("click", () => {
    document.getElementById("gameChoice").classList.add("hidden");
    document.getElementById("cryGame").classList.remove("hidden");
    checkDailyPokemon();
    newRoundCry();
});

// ----------------- HIGHER / LOWER -----------------
let score = 0;
let bestScore = localStorage.getItem("bestPokeScore") || 0;
document.getElementById("best").textContent = bestScore;

let p1, p2;
let currentStat;

async function getRandomPokemon() {
    const id = Math.floor(Math.random() * 1017) + 1;
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();

    return {
        name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
        img: data.sprites.other["official-artwork"].front_default,
        stats: {
            hp: data.stats[0].base_stat,
            attack: data.stats[1].base_stat,
            defense: data.stats[2].base_stat,
            "special-attack": data.stats[3].base_stat,
            "special-defense": data.stats[4].base_stat,
            speed: data.stats[5].base_stat
        }
    };
}

function updateUI() {
    document.getElementById("img1").src = p1.img;
    document.getElementById("name1").textContent = p1.name;

    document.getElementById("img2").src = p2.img;
    document.getElementById("name2").textContent = p2.name;
    document.getElementById("stat2").textContent = "???";

    if (currentStat === "all") {
        const sum1 = Object.values(p1.stats).reduce((a,b)=>a+b,0);
        document.getElementById("stat1").textContent = `TOTAL : ${sum1}`;
        document.getElementById("currentStat").textContent = "TOTAL";
    } else {
        document.getElementById("stat1").textContent = `${currentStat.toUpperCase()} : ${p1.stats[currentStat]}`;
        document.getElementById("currentStat").textContent = currentStat.toUpperCase();
    }
}

async function newRoundHL() {
    p1 = p2 || await getRandomPokemon();
    p2 = await getRandomPokemon();
    updateUI();
}

async function guess(isHigher) {
    let s1, s2;

    if (currentStat === "all") {
        s1 = Object.values(p1.stats).reduce((a,b)=>a+b,0);
        s2 = Object.values(p2.stats).reduce((a,b)=>a+b,0);
        document.getElementById("stat2").textContent = `TOTAL : ${s2}`;
    } else {
        s1 = p1.stats[currentStat];
        s2 = p2.stats[currentStat];
        document.getElementById("stat2").textContent = `${currentStat.toUpperCase()} : ${s2}`;
    }

    const correct = (isHigher && s2 >= s1) || (!isHigher && s2 <= s1);

    if (correct) {
        score++;
        document.getElementById("score").textContent = score;
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem("bestPokeScore", bestScore);
            document.getElementById("best").textContent = bestScore;
        }
        setTimeout(newRoundHL, 800);
    } else {
        document.getElementById("loseMessage").textContent =
            currentStat === "all"
            ? `${p2.name} a TOTAL ${s2}.`
            : `${p2.name} a ${s2} en ${currentStat.toUpperCase()}.`;
        document.getElementById("loseOverlay").classList.remove("hidden");
        score = 0;
        document.getElementById("score").textContent = 0;
    }
}

function restartHL() {
    document.getElementById("loseOverlay").classList.add("hidden");
    p2 = null;
    newRoundHL();
}

document.getElementById("startBtn").addEventListener("click", () => {
    currentStat = document.getElementById("statSelector").value;
    document.getElementById("statChoice").classList.add("hidden");
    document.getElementById("scoreBox").classList.remove("hidden");
    document.querySelector(".game").classList.remove("hidden");
    document.querySelector(".buttons").classList.remove("hidden");
    newRoundHL();
});

// ----------------- DEVINE LE CRI -----------------
let currentPokemon = null;
let historyCry = [];

function getDailyPokemonId() {
    const today = new Date();
    const dayString = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate();
    let hash = 0;
    for (let i = 0; i < dayString.length; i++) {
        hash = (hash << 5) - hash + dayString.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % 1017 + 1;
}

async function getDailyPokemon() {
    const id = getDailyPokemonId();
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();
    return {
        name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
        id: data.id
    };
}

function checkDailyPokemon() {
    const lastDate = localStorage.getItem("dailyPokemonDate");
    const today = new Date().toISOString().split('T')[0];
    if (lastDate !== today) {
        localStorage.setItem("dailyPokemonDate", today);
        currentPokemon = null;
        historyCry = [];
        updateHistoryCry();
    }
}

function updateHistoryCry() {
    const ul = document.getElementById("historyCry");
    ul.innerHTML = "";
    historyCry.forEach(p => {
        const li = document.createElement("li");
        li.textContent = p;
        ul.appendChild(li);
    });
}

async function newRoundCry() {
    if (!currentPokemon) {
        currentPokemon = await getDailyPokemon();
    }
    document.getElementById("guessInput").value = "";
    document.getElementById("cryResult").textContent = "";
}

document.getElementById("submitGuess").addEventListener("click", async () => {
    const guess = document.getElementById("guessInput").value.trim();
    if (!guess) return;
    if (!historyCry.includes(guess)) historyCry.push(guess);
    updateHistoryCry();

    if (guess.toLowerCase() === currentPokemon.name.toLowerCase()) {
        document.getElementById("cryResult").textContent = `Bravo ! C'était ${currentPokemon.name} !`;
    } else {
        document.getElementById("cryResult").textContent = "Faux ! Essaie encore.";
    }
});

document.getElementById("playCryBtn").addEventListener("click", () => {
    if (!currentPokemon) return;
    const audio = new Audio(`https://play.pokemonshowdown.com/audio/cries/${currentPokemon.name.toLowerCase()}.mp3`);
    audio.play();
});
