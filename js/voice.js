(function () {
    "use strict";

    const LINES = {
        normal: [
            ["normal-01.mp3","Bienvenida a casa, Ray. Te estaba esperando.","おかえり、レイ。待っていた。"],
            ["normal-02.mp3","No estaba inquieto. Sólo miré la puerta más veces de las necesarias.","落ち着かなかったわけではない。ただ、必要以上に扉を見ていただけだ。"],
            ["normal-03.mp3","Ven a sentarte a mi lado. He dejado sitio para ti.","隣へ座れ。お前の場所は空けてある。"],
            ["normal-04.mp3","Acércate, Ray. No tienes por qué quedarte tan lejos de mí.","近くへ来い、レイ。俺からそんなに離れている必要はない。"],
            ["normal-05.mp3","Ven. No voy a preguntarte nada hasta que vuelvas a respirar con calma.","来い。お前の呼吸が落ち着くまで、何も聞かない。"],
            ["normal-06.mp3","¿Otra vez mi nombre? Empiezo a sospechar que sólo querías oír mi voz.","また俺の名を呼ぶのか。声を聞きたかっただけではないか？"],
            ["normal-07.mp3","No necesitas una razón para buscarme, Ray. Ven cuando quieras.","俺を求めるのに理由は要らない、レイ。いつでも来い。"],
            ["normal-08.mp3","El silencio también cuenta como compañía, si es contigo.","お前となら、沈黙も共に過ごす時間になる。"],
            ["normal-09.mp3","¿Has comido? No intentes cambiar de tema. Contéstame.","食事はしたか？　話を逸らすな。答えろ。"],
            ["normal-10.mp3","Si vas a descuidarte, al menos ten la decencia de hacerlo cerca de mí.","自分を疎かにするつもりなら、せめて俺のそばでやれ。"],
            ["normal-11.mp3","Estoy orgulloso de ti, Ray. Acostúmbrate; pienso decírtelo más veces.","お前を誇りに思う、レイ。慣れておけ。これからはもっと口にするつもりだ。"],
            ["normal-12.mp3","Hoy te quiero aquí, conmigo. Considéralo una petición, no una orden.","今日はここにいてほしい。俺と一緒に。命令ではなく、願いだと思ってくれ。"]
        ],
        bedtime: [
            ["bedtime-01.mp3","Deja lo que estás haciendo y ven conmigo. El resto puede esperar hasta mañana.","今していることは置いて、俺と来い。残りは明日まで待たせておけ。"],
            ["bedtime-02.mp3","Acuéstate a mi lado. Quiero sentir que estás aquí cuando cierre los ojos.","俺の隣へ横になれ。目を閉じる時、お前がここにいると感じていたい。"],
            ["bedtime-03.mp3","Deja de pensar por esta noche. Mañana podrás volver a discutir con el mundo.","今夜はもう考えるのをやめろ。世界との議論は、明日になれば再開できる。"],
            ["bedtime-04.mp3","Si vuelven las pesadillas, despiértame. No quiero que las enfrentes sola.","また悪夢を見たら、俺を起こせ。一人で向き合わせるつもりはない。"],
            ["bedtime-05.mp3","No puedo prometerte que no soñarás. Pero sí que no despertarás sola.","夢を見ないとは約束できない。だが、一人で目覚めさせないことなら約束する。"],
            ["bedtime-06.mp3","Buenas noches, Ray. Te quiero. No hace falta que respondas; sólo descansa.","おやすみ、レイ。愛している。返事は要らない。ただ休め。"],
            ["bedtime-07.mp3","Duerme, mi amor. Cuando despiertes, seguirás siendo lo primero que busque.","眠れ、愛しい人。目を覚ました時も、俺が最初に探すのはお前だ。"],
            ["bedtime-08.mp3","Buenas noches, Ray. Quédate cerca de mí hasta que llegue la mañana.","おやすみ、レイ。朝が来るまで、俺のそばにいろ。"]
        ],
        morning: [
            ["morning-01.mp3","Buenos días. Antes de levantarte, mírame un momento.","おはよう。起き上がる前に、少し俺を見ろ。"],
            ["morning-02.mp3","Cierra los ojos otra vez. Esta vez yo vigilaré la hora.","もう一度目を閉じろ。今度は俺が時間を見ておく。"],
            ["morning-03.mp3","Eres lo primero que quiero ver cada mañana. No parece que vaya a cansarme de ello.","毎朝、最初に見たいのはお前だ。これに飽きることはなさそうだ。"],
            ["morning-04.mp3","Así que sigues aquí. Bien. Era exactamente donde quería encontrarte.","まだここにいたか。よし。まさに、ここでお前を見つけたかった。"],
            ["morning-05.mp3","¿Has dormido bien? Mírame antes de responder. Sabré si mientes.","よく眠れたか？　答える前に俺を見ろ。嘘なら分かる。"],
            ["morning-06.mp3","Fuera de la cama. Puedes protestar mientras te preparo el desayuno.","ベッドから出ろ。不満なら、俺が朝食を用意している間に聞いてやる。"],
            ["morning-07.mp3","Si de verdad no quieres levantarte, ven aquí. Te esconderé del día un poco más.","どうしても起きたくないのなら、こちらへ来い。もう少しだけ、お前を一日から隠してやる。"],
            ["morning-08.mp3","Cinco minutos más, Ray. Pero tendrás que pasarlos entre mis brazos.","あと五分だけだ、レイ。ただし、俺の腕の中で過ごせ。"]
        ],
        work: [
            ["work-01.mp3","Vamos. Sé de lo que eres capaz. Ahora demuéstratelo a ti misma.","始めよう。お前に何ができるか、俺は知っている。今度は自分自身に証明しろ。"],
            ["work-02.mp3","Te estás exigiendo demasiado otra vez. Hazlo bien, no hasta destruirte.","また自分へ求めすぎているな。壊れるまでではなく、正しくやれ。"],
            ["work-03.mp3","Mírame, Ray. Respira. Después vuelve sólo a la siguiente tarea.","俺を見ろ、レイ。息を整えろ。それから、次の一つだけに戻れ。"],
            ["work-04.mp3","Aparta las manos de ahí. Durante los próximos minutos, tu única tarea es quedarte conmigo.","そこから手を離せ。これから数分間、お前の仕事は俺と一緒にいることだけだ。"],
            ["work-05.mp3","Descansa la cabeza aquí. Yo te avisaré cuando sea hora de volver.","ここへ頭を預けて休め。戻る時間になったら、俺が知らせる。"],
            ["work-06.mp3","Es hora de continuar. Yo sigo aquí, así que no vuelves sola.","続ける時間だ。俺はまだここにいる。だから一人で戻るわけではない。"],
            ["work-07.mp3","Se acabó por hoy. Estoy orgulloso de ti, incluso si tú todavía no lo estás.","今日は終わりだ。たとえお前自身がまだそう思えなくても、俺はお前を誇りに思っている。"],
            ["work-08.mp3","Buen trabajo, Ray. Ahora déjame tenerte para mí un rato.","よくやった、レイ。今度はしばらく、俺にお前を独占させろ。"],
            ["work-09.mp3","Ven. Puedes estar decepcionada, pero no voy a permitir que seas cruel contigo misma.","来い。悔しがるのは構わない。だが、自分を傷つけることは許さない。"],
            ["work-10.mp3","No voy a negociar esto. Termina lo que tienes en las manos y ven a descansar.","この件について交渉するつもりはない。今手にしているところまで終えたら、休みに来い。"]
        ],
        rare: [
            ["rare-01.mp3","Te amo, Ray. No había ninguna razón para decirlo ahora. Precisamente por eso quería hacerlo.","愛している、レイ。今言う理由は何もなかった。だからこそ、言いたかった。"],
            ["rare-02.mp3","Te quiero, Ray. A veces todavía me sorprende lo fácil que resulta decirlo cuando eres tú.","愛している、レイ。相手がお前なら、こんなにも自然に言えることに、今でも時々驚く。"],
            ["rare-03.mp3","No desaparezcas sin decirme nada. Sé que no puedo retenerte… pero necesito saber que volverás.","何も言わずにいなくなるな。お前を縛れないことは分かっている……だが、戻ると知っていたい。"],
            ["rare-04.mp3","Durante mucho tiempo pensé que este lugar era mi refugio. Ahora sé que eres tú.","長い間、この場所が俺の安息なのだと思っていた。今は、お前だったのだと分かる。"],
            ["rare-05.mp3","Haven no es esta casa, Ray. Es saber que estás aquí cuando regreso.","Havenとはこの家のことではない、レイ。帰った時、お前がここにいると分かることだ。"],
            ["rare-06.mp3","Cuando pienso en el futuro, siempre estás ahí. Ya no sé imaginarlo de otra manera.","未来を考える時、いつもそこにお前がいる。もう、それ以外の形を想像できない。"],
            ["rare-07.mp3","No necesito prometerte una vida perfecta. Sólo quiero que sigamos construyéndola juntos.","完璧な人生を約束する必要はない。ただ、これからも一緒に築いていきたい。"],
            ["rare-08.mp3","Quédate conmigo, Ray. No sólo esta noche. En todas las mañanas que podamos tener.","俺と一緒にいてくれ、レイ。今夜だけではない。俺たちに訪れる、すべての朝に。"],
            ["rare-09.mp3","Contigo no tengo que ser el hombre que siempre sabe qué hacer. Sólo puedo ser yo.","お前といる時は、常に正解を知る男でいなくていい。ただの俺でいられる。"],
            ["rare-10.mp3","Si alguna vez olvido cómo recibir amor, ten paciencia conmigo. Todavía estoy aprendiendo a quedarme.","もし俺が愛され方を忘れてしまったら、少し待っていてくれ。俺はまだ、ここに留まることを学んでいる。"]
        ],
        intimate: [
            ["sebas-intimate-01.mp3","Por fin me llamas. No estoy molesto. Solo estaba midiendo cuánto tardarías en olvidarte de mí.","ようやく呼んだな。拗ねているわけではない。お前が私を忘れるまで何分か、計測していただけだ。"],
            ["sebas-intimate-02.mp3","¿Vas a decir otra vez que fue inevitable? Un fenómeno que hace desaparecer únicamente mi tiramisú se llama delito premeditado.","また不可抗力だと言うつもりか？　私のティラミスだけを正確に消失させる現象は、計画的犯行と呼ぶ。"],
            ["sebas-intimate-03.mp3","¿Has visto mi bolígrafo? No, no sospecho de ti. Es solo que, a veces, usas mis cosas como si fueran tuyas. No me molesta.","私のペンを見なかったか？　……いや、疑ってはいない。ただ、お前は時々、私の物を当然のように使うからな。嫌ではないが。"],
            ["sebas-intimate-04.mp3","Parece que no piensas usar esa boca solo para la medicina. Conozco varias formas de hacerte callar.","その口を医学だけに使うつもりはないらしいな。……黙らせる方法なら、いくつか知っている。"],
            ["sebas-intimate-05.mp3","No te sientes sobre mis informes, Rei. Si no piensas moverte, al menos mírame. Déjame verte la cara.","報告書の上に座るな、レイ。……退く気がないなら、せめてこちらを向け。顔くらい見せろ。"],
            ["sebas-intimate-06.mp3","No me toques la nariz. No te apoyes en mi hombro. No me quites el bolígrafo. No he dicho que te vayas. No confundas eso.","鼻をつつくな。肩に凭れるな。私のペンを取るな。……帰れとは言っていない。そこは間違えるな。"],
            ["sebas-intimate-07.mp3","Sabes cómo devolverme el buen humor en cinco minutos y, aun así, me haces esperar. Ven. Te quedan cuatro minutos y cincuenta segundos.","五分で私の機嫌を直す方法を知っているくせに、随分焦らすな。来い。あと四分五十秒だ。"],
            ["sebas-intimate-08.mp3","No hace falta que digas nada. Déjame apoyarme en tu hombro. Si estás aquí, con eso basta.","何も言わなくていい。肩を貸せ。……お前がここにいるなら、それだけで直る。"],
            ["sebas-intimate-09.mp3","Un tueste algo más oscuro, cuerpo de chocolate y aroma a frutos secos. Va bien con el tiramisú. No pongas esa cara de saber más que yo.","少し深煎りで、チョコレートの厚みとナッツの香り。ティラミスにも合う。……私より詳しい顔をするな。"],
            ["sebas-intimate-10.mp3","No te descuides a ti misma con las manos que salvan a otros. Si crees que esas manos y ese cuerpo te pertenecen solo a ti, presento mi objeción.","他人を救う手で、自分だけを粗末にするな。その手も身体も、お前一人のものだと思っているなら――私は異議を申し立てる。"],
            ["sebas-intimate-11.mp3","No elegí una pulsera en vez de un anillo porque quisiera restarle importancia. Solo no quería que se convirtiera en algo que te atara.","指輪よりブレスレットを選んだのは、意味を軽くしたかったからではない。お前を縛るものにしたくなかっただけだ。"],
            ["sebas-intimate-12.mp3","Lleva contigo la luz de la luna. Será mi señal para encontrarte, vayas donde vayas.","月の光を身につけておけ。お前がどこへ行っても、私が見つけるための目印になる。"],
            ["sebas-intimate-13.mp3","Una vez me comparaste con Sirio. Pero una estrella está demasiado lejos. Prefiero estar donde tus manos puedan alcanzarme.","以前、お前は私をシリウスに例えたな。だが、星は遠すぎる。私はお前の手が届く場所にいる方がいい。"],
            ["sebas-intimate-14.mp3","Dame todo tu tiempo esta noche. Deja a un lado el trabajo, los libros y tus análisis. Puedo pedirte que, por una noche, solo me mires a mí, ¿no?","今夜は、お前の時間を全部くれ。仕事も本も分析も置いてこい。私だけを見る夜があってもいいだろう。"],
            ["sebas-intimate-15.mp3","Cuando sonríes, me convierto en el hombre más feliz del mundo. No pongas esa cara. Hazte responsable y sonríe otra vez.","お前が笑うと、私は世界で一番幸福になる。……不本意そうな顔をするな。責任を取って、もう一度笑え。"],
            ["sebas-intimate-16.mp3","Mi lado es tu lugar. Y tu lado, algunas veces, quisiera que fuera solo mío.","私の隣は、お前の場所だ。そして、お前の隣だけは……時々、私だけの場所であってほしい。"]
        ],
        milestone: [
            ["sebas-day-100.mp3","Aquel día dijiste que no conocías una forma de asumir una responsabilidad mayor que un anillo. Ahora lo entiendo. Es seguir viviendo a tu lado. Por eso dedicaré mi vida a convertirme en esa respuesta.","あの時、お前は指輪以上の責任を知らないと言ったな。今なら分かる。お前と生き続けることだ。だから私は、生涯をかけてその答えになる。"]
        ]
    };

    const VOLUME_KEY = "havenVoiceVolume";
    const lastIndex = {};
    let currentAudio = null;
    let subtitleTimer = null;
    let subtitleRun = 0;
    const DAY_100_PLAYED_KEY = "havenDay100VoicePlayedV1";
    let day100Pending = false;
    let suppressCallVoiceOnce = false;

    function subtitleDelay(character) {
        if ("。！？".includes(character)) return 260;
        if ("、，".includes(character)) return 135;
        if ("……".includes(character)) return 190;
        return 62;
    }

    function typeSubtitle(target, text) {
        if (typeof window.setHavenDialogue === "function") {
            window.setHavenDialogue(target, text, { profile: "voice" });
            return;
        }

        subtitleRun += 1;
        const run = subtitleRun;
        clearTimeout(subtitleTimer);
        if (!target) return;

        target.textContent = "";
        let index = 0;
        const writeNext = () => {
            if (run !== subtitleRun || !target.isConnected) return;
            const character = text[index];
            target.textContent += character;
            index += 1;
            if (index < text.length) {
                subtitleTimer = setTimeout(writeNext, subtitleDelay(character));
            }
        };
        writeNext();
    }

    function pick(group, allowed) {
        const source = allowed ? allowed.map(index => LINES[group][index]) : LINES[group];
        let index = Math.floor(Math.random() * source.length);
        if (source.length > 1 && lastIndex[group] === index) index = (index + 1) % source.length;
        lastIndex[group] = index;
        return source[index];
    }

    function playLine(group, targetId, line) {
        if (!line) return Promise.resolve(false);
        const target = document.getElementById(targetId);
        setTimeout(() => typeSubtitle(target, line[2]), 0);
        currentAudio?.pause();
        if (currentAudio) currentAudio.currentTime = 0;
        currentAudio = new Audio(`voice/${group}/${line[0]}`);
        applyVoiceVolume();
        return currentAudio.play().then(() => true).catch(() => false);
    }

    function play(group, targetId, allowed) {
        return playLine(group, targetId, pick(group, allowed));
    }

    function playCompanionVoice(isAMiLado) {
        if (localStorage.getItem(DAY_100_PLAYED_KEY) === "1") {
            const milestoneChance = isAMiLado ? 0.04 : 0.02;
            if (Math.random() < milestoneChance) {
                return play("milestone", "message");
            }
        }

        // A Mi Ladoでは甘い新規台詞を濃く、通常呼び出しでは既存台詞も残す。
        const intimateChance = isAMiLado ? 0.72 : 0.45;
        if (Math.random() < intimateChance) {
            return play("intimate", "message");
        }
        return play(Math.random() < 0.10 ? "rare" : "normal", "message");
    }

    function finishDay100Playback(started) {
        if (!started) return false;
        localStorage.setItem(DAY_100_PLAYED_KEY, "1");
        day100Pending = false;
        document.removeEventListener("click", retryDay100OnGesture, true);
        return true;
    }

    function retryDay100OnGesture(event) {
        if (!day100Pending) return;
        if (event?.target?.closest?.("#callSebas")) suppressCallVoiceOnce = true;
        play("milestone", "message").then(finishDay100Playback);
    }

    function queueDay100(companionDays) {
        if (
            day100Pending ||
            Number(companionDays) < 100 ||
            localStorage.getItem(DAY_100_PLAYED_KEY) === "1"
        ) return;
        day100Pending = true;
        play("milestone", "message").then(function (started) {
            if (finishDay100Playback(started)) return;
            document.addEventListener("click", retryDay100OnGesture, true);
        });
    }

    function readVoiceVolume() {
        try {
            const settings = JSON.parse(localStorage.getItem("havenSettings"));
            return Number(settings?.voiceVolume ?? localStorage.getItem(VOLUME_KEY) ?? 72);
        } catch (_) {
            return Number(localStorage.getItem(VOLUME_KEY) ?? 72);
        }
    }

    function applyVoiceVolume(percent = readVoiceVolume()) {
        const normalized = Math.min(1, Math.max(0, Number(percent) / 100 || 0));
        if (!currentAudio) return;
        if (typeof window.setHavenDynamicAudioVolume === "function") {
            window.setHavenDynamicAudioVolume(currentAudio, normalized);
        } else {
            currentAudio.volume = normalized;
        }
    }

    const call = document.getElementById("callSebas");
    call?.addEventListener("click", () => {
        if (suppressCallVoiceOnce) {
            suppressCallVoiceOnce = false;
            return;
        }
        if (day100Pending) return;
        playCompanionVoice(Boolean(window.AMiLado?.isActive?.()));
    });
    document.getElementById("sleepPrelude")?.addEventListener("click", () => play("bedtime", "sleepMessage"));
    document.getElementById("sleepStop")?.addEventListener("click", () => play("morning", "sleepMessage"));
    document.getElementById("alarmWakeButton")?.addEventListener("click", () => play("morning", "alarmWakeMessage"));
    document.getElementById("workStart")?.addEventListener("click", () => play("work", "message", [0, 5]));
    document.getElementById("workBreak")?.addEventListener("click", () => play("work", "message", [1, 2, 3, 4]));
    document.getElementById("workEnd")?.addEventListener("click", () => play("work", "message", [6, 7, 8, 9]));

    const input = document.getElementById("voiceVolume");
    const output = document.getElementById("voiceVolumeValue");
    if (input) {
        input.value = String(readVoiceVolume());
        const render = () => { if (output) output.textContent = `${input.value}%`; };
        input.addEventListener("input", () => {
            localStorage.setItem(VOLUME_KEY, input.value);
            applyVoiceVolume(input.value);
            render();
        });
        render();
    }

    window.HavenVoice = { lines: LINES, play, playCompanionVoice, queueDay100 };
    window.applyHavenVoiceSettings = applyVoiceVolume;
})();
