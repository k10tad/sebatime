//========================
// 書斎環境音
//========================

const roomSound = new Audio("sound/clockloop.mp3");
roomSound.loop = true;
roomSound.volume = 0.15;

const bgm = new Audio("music/bgm.mp3");
bgm.loop = true;
bgm.volume = 0.18;

const startSound = new Audio("sound/page.mp3");
startSound.volume = 0.4;

const roomEffects = [
    "sound/pen.mp3",
    "sound/page.mp3"
];

let roomEffectTimer = null;

function playRandomRoomEffect(){

    const random =
        roomEffects[Math.floor(Math.random()*roomEffects.length)];

    const sound = new Audio(random);
    sound.volume = 0.18;
    sound.play();

    const next =
        12000 + Math.random()*25000;

    roomEffectTimer =
        setTimeout(playRandomRoomEffect,next);

}

function startRoomSounds(){

    roomSound.play();
    bgm.play();

    if(roomEffectTimer===null){

        const first =
            5000 + Math.random()*8000;

        roomEffectTimer =
            setTimeout(playRandomRoomEffect,first);

    }

}

function stopRoomSounds(){

    roomSound.pause();
    roomSound.currentTime = 0;

    bgm.pause();
    bgm.currentTime = 0;

    clearTimeout(roomEffectTimer);
    roomEffectTimer = null;

}