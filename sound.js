//========================
// Haven audio controller — iPhone-safe verified version
//========================

let roomSoundsActive = false;
let lastLivingSoundKey = null;
let deskSoundTimer = null;
let humanSoundTimer = null;
let sleepBreathIdleTimer = null;
let coughStopTimer = null;
let audioGestureReady = false;

const roomSound = new Audio("sound/clockloop2.mp3");
const bgm = new Audio("music/bgm.mp3");
const breakBgm = new Audio("music/break.mp3");
const sleepBreath = new Audio("sound/sleep_breath.mp3");
const penSound = new Audio("sound/pen.mp3");
const pageSound = new Audio("sound/page.mp3");
const breathIdleSound = new Audio("sound/breath_idle.mp3");
const coughingSound = new Audio("sound/coughing.mp3");
const stepSound = new Audio("sound/step.mp3");

roomSound.loop = true;
bgm.loop = true;
breakBgm.loop = true;
sleepBreath.loop = true;

[roomSound,bgm,breakBgm,sleepBreath,penSound,pageSound,breathIdleSound,coughingSound,stepSound].forEach(function(audio){
    audio.preload = "auto";
    audio.playsInline = true;
});

function applyWorkVolumes(){
    roomSound.volume = 0.12;
    bgm.volume = 0.20;
    breakBgm.volume = 0.16;
    penSound.volume = 0.16;
    pageSound.volume = 0.18;
    coughingSound.volume = 0.10;
    stepSound.volume = 0.14;
}

function applySleepVolumes(){
    // Code-level fixed balance requested by user.
    sleepBreath.volume = 0.72;
    breathIdleSound.volume = 0.055;
}

applyWorkVolumes();
applySleepVolumes();

function isSleepMode(){return document.body.classList.contains("sleep-mode")}
function randomBetween(min,max){return min+Math.random()*(max-min)}

function safePlay(audio){
    if(!audio) return Promise.resolve(false);
    try{
        const p=audio.play();
        if(p&&typeof p.catch==="function"){
            return p.then(function(){return true}).catch(function(error){
                console.warn("Audio playback blocked:",audio.src,error);
                return false;
            });
        }
        return Promise.resolve(true);
    }catch(error){
        console.warn("Audio playback failed:",audio.src,error);
        return Promise.resolve(false);
    }
}

function replaySound(audio){
    if(!audio) return;
    audio.pause();
    try{audio.currentTime=0}catch(error){}
    safePlay(audio);
}

function stopAudio(audio,reset=true){
    if(!audio) return;
    audio.pause();
    if(reset){try{audio.currentTime=0}catch(error){}}
}

// Compatibility function. Never call load() here: on iOS it cancels the user gesture.
function unlockAudio(){
    audioGestureReady=true;
}

function chooseDifferent(items){
    const candidates=items.filter(function(item){return item.key!==lastLivingSoundKey});
    const pool=candidates.length?candidates:items;
    const total=pool.reduce(function(sum,item){return sum+item.weight},0);
    let value=Math.random()*total;
    for(const item of pool){value-=item.weight;if(value<=0){lastLivingSoundKey=item.key;return item}}
    return pool[0];
}

function playCoughingExcerpt(){
    if(!roomSoundsActive||isSleepMode()) return;
    clearTimeout(coughStopTimer);
    replaySound(coughingSound);
    coughStopTimer=setTimeout(function(){stopAudio(coughingSound)},3000);
}

function scheduleDeskSound(){
    clearTimeout(deskSoundTimer);
    if(!roomSoundsActive||isSleepMode()) return;
    deskSoundTimer=setTimeout(function(){
        if(!roomSoundsActive||isSleepMode()) return;
        const choice=chooseDifferent([{key:"pen",audio:penSound,weight:46},{key:"page",audio:pageSound,weight:54}]);
        replaySound(choice.audio);
        scheduleDeskSound();
    },randomBetween(20000,55000));
}

function scheduleHumanSound(){
    clearTimeout(humanSoundTimer);
    if(!roomSoundsActive||isSleepMode()) return;
    humanSoundTimer=setTimeout(function(){
        if(!roomSoundsActive||isSleepMode()) return;
        const choice=chooseDifferent([{key:"breath",audio:breathIdleSound,weight:86},{key:"cough",audio:coughingSound,weight:14}]);
        if(choice.key==="cough") playCoughingExcerpt(); else replaySound(choice.audio);
        scheduleHumanSound();
    },randomBetween(55000,140000));
}

function startLivingSounds(){roomSoundsActive=true;scheduleDeskSound();scheduleHumanSound()}
function stopLivingSounds(){
    roomSoundsActive=false;
    clearTimeout(deskSoundTimer);clearTimeout(humanSoundTimer);clearTimeout(coughStopTimer);
    deskSoundTimer=humanSoundTimer=coughStopTimer=null;
    stopAudio(penSound);stopAudio(pageSound);stopAudio(breathIdleSound);stopAudio(coughingSound);
}

function startRoomSounds(){
    unlockAudio();
    stopBreakBgm();stopSleepBgm();applyWorkVolumes();
    replaySound(roomSound);replaySound(bgm);startLivingSounds();
}
function stopRoomSounds(){stopAudio(roomSound);stopAudio(bgm);stopLivingSounds()}

function startBreakBgm(){unlockAudio();stopRoomSounds();stopSleepBgm();applyWorkVolumes();replaySound(breakBgm)}
function stopBreakBgm(){stopAudio(breakBgm)}

function scheduleSleepBreathIdle(){
    clearTimeout(sleepBreathIdleTimer);
    if(!isSleepMode()) return;
    sleepBreathIdleTimer=setTimeout(function(){
        if(!isSleepMode()) return;
        applySleepVolumes();
        replaySound(breathIdleSound);
        scheduleSleepBreathIdle();
    },randomBetween(60000,150000));
}

function startSleepBgm(){
    unlockAudio();
    stopRoomSounds();stopBreakBgm();
    if(typeof stopAlarmSound==="function") stopAlarmSound();
    clearTimeout(sleepBreathIdleTimer);
    applySleepVolumes();
    replaySound(sleepBreath);
    scheduleSleepBreathIdle();
}

function stopSleepBgm(){
    clearTimeout(sleepBreathIdleTimer);sleepBreathIdleTimer=null;
    stopAudio(sleepBreath);stopAudio(breathIdleSound);
}

function playPageStepSound(){if(!isSleepMode()){applyWorkVolumes();replaySound(stepSound)}}
function stopAllSounds(){stopRoomSounds();stopBreakBgm();stopSleepBgm()}

// If a running session was restored after reload, iOS blocked its automatic sound.
// The first real tap resumes the correct mode.
function resumeAudioForCurrentMode(){
    if(audioGestureReady) return;
    audioGestureReady=true;
    if(isSleepMode()){
        startSleepBgm();
        return;
    }
    if(typeof sessionState!=="undefined"){
        if(sessionState==="work") startRoomSounds();
        else if(sessionState==="break") startBreakBgm();
    }
}

document.addEventListener("pointerdown",resumeAudioForCurrentMode,{once:true,capture:true});
document.addEventListener("touchend",resumeAudioForCurrentMode,{once:true,capture:true,passive:true});
