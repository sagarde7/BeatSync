console.log('Lets write JavaScript');
let currentsong = new Audio();
let songs = [];
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    songs = []; // Reset songs array before fetching new data

    try {
        let response = await fetch(`/${folder}/`);
        if (!response.ok) {
            throw new Error(`Error fetching ${folder}: ${response.status} ${response.statusText}`);
        }
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");

        for (let element of as) {
            if (element.href.endsWith(".mp3")) {
                let songName = element.href.split(`/${folder}/`).pop();
                if (songName) {
                    songs.push(songName);
                } else {
                    console.warn("Undefined song detected in folder:", folder);
                }
            }
        }

        let songUL = document.querySelector(".songlist ul");
        songUL.innerHTML = "";
        for (const song of songs) {
            songUL.innerHTML += `
                <li>
                    <img class="invert" width="30px" src="img/music.svg" alt="">
                    <div class="info">
                        <div>${song.replaceAll("%20", " ")}</div>
                        <div>NXT</div>
                    </div>
                    <div class="playnow">
                        <span>Play</span>
                        <img class="invert" width="30px" src="img/play.svg" alt="">
                    </div>
                </li>`;
        }

        document.querySelectorAll(".songlist li").forEach(e => {
            e.addEventListener("click", () => playMusic(e.querySelector(".info div").textContent.trim()));
        });

    } catch (error) {
        console.error("Error in getSongs:", error);
    }
}

const playMusic = (track, pause = false) => {
    if (!track) {
        console.error("Track not found:", track);
        return;
    }
    currentsong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentsong.play();
        document.querySelector("#play").src = "img/pause.svg";
    }
    document.querySelector(".songInfo").textContent = decodeURI(track);
    document.querySelector(".songtime").textContent = "00:00 / 00:00";
};

async function displayAlbums() {
    let Cardcontainer = document.querySelector(".Cardcontainer");

    try {
        let response = await fetch("/songs/");
        if (!response.ok) {
            throw new Error(`Error fetching albums: ${response.status} ${response.statusText}`);
        }
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let anchors = div.getElementsByTagName("a");

        for (let e of anchors) {
            if (e.href.includes("/songs/")) {
                let folder = e.href.split("/").slice(-2)[1];

                try {
                    let infoResponse = await fetch(`/songs/${folder}/info.json`);
                    if (!infoResponse.ok) continue;
                    let info = await infoResponse.json();

                    Cardcontainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <div class="play">
                                <svg>...</svg>
                            </div>
                            <img src="/songs/${folder}/cover.jpg" alt="">
                            <h2>${info.title}</h2>
                            <p>${info.description}</p>
                        </div>`;
                } catch (error) {
                    console.warn(`Skipping album ${folder}, info.json not found.`);
                }
            }
        }

        document.querySelectorAll(".card").forEach(e => {
            e.addEventListener("click", async (item) => {
                songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
                playMusic(songs[0]);
            });
        });

    } catch (error) {
        console.error("Error fetching albums:", error);
    }
}

async function main() {
    await getSongs("songs/ncs");

    if (songs.length > 0) {
        playMusic(songs[0], true);
    } else {
        console.warn("No songs found in default folder.");
    }

    displayAlbums();

    document.querySelector("#play").addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            document.querySelector("#play").src = "img/pause.svg";
        } else {
            currentsong.pause();
            document.querySelector("#play").src = "img/playB.svg";
        }
    });

    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").textContent = 
            `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left = 
            (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = (currentsong.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    document.querySelector("#previous").addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").pop());
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    document.querySelector("#next").addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").pop());
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    document.querySelector(".range input").addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100;
    });

    document.querySelector(".volume img").addEventListener("click", (e) => {
        if (e.target.src.includes("img/volume.svg")) {
            e.target.src = "img/mute.svg";
            currentsong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = "img/volume.svg";
            currentsong.volume = 0.10;
            document.querySelector(".range input").value = 10;
        }
    });
}

main();
