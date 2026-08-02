(function () {
    "use strict";
    const $ = id => document.getElementById(id);

    const rail = document.createElement("div");
    rail.className = "haven-side-rail";
    rail.setAttribute("aria-label", "Havenの記録");
    rail.innerHTML = `
      <button id="openHuella" class="huella-book-button" type="button" aria-label="Vestigioを開く">
        <span class="huella-book-ribbon"></span>
        <span class="huella-book-sigil" aria-hidden="true">
          <svg class="huella-book-orion" viewBox="0 0 62 66" focusable="false">
            <path class="orion-line" d="M17 11 24 29 18 55M17 11 45 14 38 29 47 56M24 29 31 31 38 29M31 31 31 43M18 55 47 56"/>
            <circle class="orion-star orion-star--warm" cx="17" cy="11" r="2.15"/>
            <circle class="orion-star" cx="45" cy="14" r="1.85"/>
            <circle class="orion-star" cx="24" cy="29" r="1.45"/>
            <circle class="orion-star" cx="31" cy="31" r="1.55"/>
            <circle class="orion-star" cx="38" cy="29" r="1.4"/>
            <circle class="orion-star" cx="31" cy="43" r="1.3"/>
            <circle class="orion-star" cx="18" cy="55" r="1.75"/>
            <circle class="orion-star orion-star--blue" cx="47" cy="56" r="2.25"/>
          </svg>
        </span>
      </button>
      <button id="companionDayBadge" class="companion-day-badge" type="button"><span>寄り添い</span><strong id="companionDayNumber">1</strong><small>日目</small></button>
      <div id="companionDayDetail" class="companion-day-detail" hidden><button id="closeCompanionDayDetail" class="companion-day-detail-close" type="button">×</button><div class="companion-day-detail-kicker">TOGETHER</div><p id="companionDayDetailText"></p></div>`;
    document.body.prepend(rail);

    const privateNoteButton = document.createElement("button");
    privateNoteButton.id = "openPrivateNote";
    privateNoteButton.className = "private-note-launcher";
    privateNoteButton.type = "button";
    privateNoteButton.setAttribute("aria-label", "Digaを開く");
    privateNoteButton.innerHTML = `<span class="private-note-launcher-icon" aria-hidden="true"><svg class="diga-lepus" viewBox="0 0 72 48" focusable="false"><path class="diga-lepus-line" d="M10 28 23 19 35 25 48 17 62 23M23 19 19 8M23 19 31 7M35 25 31 39M35 25 48 38M48 17 59 9"/><circle class="diga-lepus-star" cx="10" cy="28" r="1.5"/><circle class="diga-lepus-star" cx="19" cy="8" r="1.25"/><circle class="diga-lepus-star" cx="31" cy="7" r="1.15"/><circle class="diga-lepus-star diga-lepus-star--arneb" cx="23" cy="19" r="2.5"/><circle class="diga-lepus-star" cx="35" cy="25" r="1.45"/><circle class="diga-lepus-star" cx="48" cy="17" r="1.4"/><circle class="diga-lepus-star" cx="62" cy="23" r="1.2"/><circle class="diga-lepus-star" cx="59" cy="9" r="1.1"/><circle class="diga-lepus-star" cx="31" cy="39" r="1.2"/><circle class="diga-lepus-star" cx="48" cy="38" r="1.3"/></svg></span><span>DIGA</span>`;
    document.body.prepend(privateNoteButton);

    const sebas = $("sebas");
    const sleepSebas = $("sleepSebas");
    if (sebas) sebas.src = "assets/companion-normal.jpg";
    if (sleepSebas) sleepSebas.src = "assets/companion-bedtime.jpg";

    const clockCard = document.querySelector(".clock-card");
    const weatherCard = $("weather-card");
    if (clockCard && weatherCard) {
        const location = document.createElement("div");
        location.className = "weather-location";
        const city = $("city"), date = $("date");
        if (city) location.append(city);
        if (date) location.append(date);
        weatherCard.before(location);
        clockCard.remove();
    }
    document.querySelectorAll("[data-page-target=home]").forEach(button => {
        button.setAttribute("aria-label", "Living");
    });
    document.querySelectorAll("[data-page-target=sleep]").forEach(button => {
        button.setAttribute("aria-label", "Bedroom");
    });
    document.querySelectorAll("[data-go-page=home]").forEach(button => button.textContent = "Livingに戻る");
    document.querySelector(".settings-page-header p")?.replaceChildren("この部屋の天気と音を、静かに整える。");
    document.querySelector('[aria-labelledby="profileSettingsTitle"]')?.remove();

    const voicePanel = document.querySelector('[aria-labelledby="voiceSettingsTitle"]');
    if (voicePanel) voicePanel.insertAdjacentHTML("afterend", `
      <section class="settings-panel" aria-labelledby="companionSettingsTitle">
       <div class="settings-section-heading"><div class="settings-label">TOGETHER</div><h2 id="companionSettingsTitle">寄り添いの開始日</h2></div>
       <label class="settings-field" for="companionStartDate"><span>日数を数え始める日</span><input id="companionStartDate" type="date"></label>
       <button id="saveCompanionStartDate" class="settings-inline-button" type="button">開始日を保存</button>
       <p class="settings-note">初日は、出会った日でも、この部屋で暮らし始めた日でも構わない。</p>
      </section>
      <section class="settings-panel" aria-labelledby="backupSettingsTitle">
       <div class="settings-section-heading"><div class="settings-label">BACKUP</div><h2 id="backupSettingsTitle">Havenの保管と復元</h2></div>
       <p class="settings-note">設定・記録・寄り添い日数・Vestigioの思い出を、ひとつのZIPに保存します。</p>
       <div class="backup-actions"><button id="exportHavenBackup" type="button">バックアップを作成</button><button id="restoreHavenBackup" class="quiet-button" type="button">バックアップから復元</button><input id="havenBackupFile" type="file" accept=".zip,application/zip" hidden></div>
       <div id="backupStatus" class="backup-status" role="status" aria-live="polite"></div>
      </section>`);

    document.body.insertAdjacentHTML("beforeend", `
      <div id="huellaOverlay" class="huella-overlay" hidden><section class="huella-journal">
       <header class="huella-header"><div><div class="huella-kicker">A TRACE OF US</div><h2>Vestigio</h2><p>写真も記憶も、失くす前にここへ置いておけ。</p></div><button id="closeHuella" class="huella-close" type="button" aria-label="Vestigioを閉じる">×</button></header>
       <div class="huella-mode-tabs"><button id="huellaAlbumTab" class="active" type="button">写真</button><button id="huellaCalendarTab" type="button">カレンダー</button></div>
       <section id="huellaAlbumPanel"><div class="huella-toolbar"><span id="huellaCount">0枚</span><button id="huellaAddButton" type="button">写真を追加</button><input id="huellaFileInput" type="file" accept="image/*" multiple hidden></div><div id="huellaEmpty" class="huella-empty"><p>まだ何もない。</p><span>残しておきたい一枚から始めろ。</span></div><div id="huellaGrid" class="huella-grid"></div></section>
       <section id="huellaCalendarPanel" hidden><div class="huella-calendar-header"><button id="huellaPrevMonth">‹</button><h3 id="huellaCalendarTitle"></h3><button id="huellaNextMonth">›</button></div><div class="huella-weekdays"><span>日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span>土</span></div><div id="huellaCalendarGrid" class="huella-calendar-grid"></div><section class="huella-day-sheet"><header><h3 id="huellaSelectedDateTitle"></h3><div><button id="huellaAddDiary">日記を書く</button><button id="huellaAddPlan">予定を追加</button></div></header><div id="huellaDayEntries"></div><p id="huellaDayEmpty">この日は、まだ白紙だ。</p></section></section>
       <div class="huella-margin-notes" aria-hidden="true"><span class="huella-margin-note note-one">R. — conservar.</span><span class="huella-margin-note note-two">Volver aquí.</span><span class="huella-margin-note note-three">No perder.</span></div>
      </section></div>
      <div id="huellaPhotoRegister" class="huella-entry-editor" hidden><form id="huellaPhotoRegisterForm" class="huella-entry-card huella-photo-register-card"><button id="huellaPhotoRegisterClose" class="huella-viewer-close" type="button">×</button><div class="huella-kicker">NEW MEMORY</div><h3>写真をVestigioへ置く</h3><div class="huella-register-preview"><img id="huellaPhotoRegisterPreview" alt="登録する写真"><span id="huellaPhotoRegisterCount"></span></div><label><span>日付</span><input id="huellaPhotoRegisterDate" type="date" required></label><label><span>ひとこと</span><textarea id="huellaPhotoRegisterNote" rows="4" placeholder="この日のことを、一言だけ。"></textarea></label><p class="huella-register-help">複数枚を選んだ場合は、同じ日付とひとことを付けて保存します。</p><div class="huella-viewer-actions"><button type="submit">Vestigioへ保存</button><button id="huellaPhotoRegisterCancel" class="quiet-button" type="button">キャンセル</button></div></form></div>
      <div id="huellaViewer" class="huella-viewer" hidden><div class="huella-viewer-card"><button id="huellaViewerClose" class="huella-viewer-close">×</button><div class="huella-viewer-image-wrap"><img id="huellaViewerImage" alt=""></div><p id="huellaSebasComment" class="huella-sebas-comment"></p><div class="huella-viewer-fields"><label><span>日付</span><input id="huellaViewerDate" type="date"></label><label><span>ひとこと</span><textarea id="huellaViewerNote"></textarea></label></div><div class="huella-viewer-actions"><button id="huellaViewerSave">保存</button><button id="huellaViewerDelete" class="danger-quiet-button">削除</button></div></div></div>
      <div id="huellaEntryEditor" class="huella-entry-editor" hidden><form id="huellaEntryForm" class="huella-entry-card"><button id="huellaEntryClose" class="huella-viewer-close" type="button">×</button><div id="huellaEntryKicker" class="huella-kicker">DIARY</div><h3 id="huellaEntryEditorTitle">日記を書く</h3><input id="huellaEntryId" type="hidden"><input id="huellaEntryType" type="hidden"><label><span>日付</span><input id="huellaEntryDate" type="date" required></label><label><span>タイトル</span><input id="huellaEntryTitle"></label><label id="huellaEntryTimeField" hidden><span>時刻</span><input id="huellaEntryTime" type="time"></label><label><span id="huellaEntryBodyLabel">本文</span><textarea id="huellaEntryBody" rows="8"></textarea></label><div class="huella-viewer-actions"><button type="submit">保存</button><button id="huellaEntryDelete" class="danger-quiet-button" type="button" hidden>削除</button></div></form></div>
      <div id="privateNoteOverlay" class="private-note-overlay" hidden><section class="private-note-app" role="dialog" aria-modal="true" aria-labelledby="privateNoteTitle"><header class="private-note-appbar"><span class="private-note-avatar" aria-hidden="true">S</span><div><strong id="privateNoteTitle">Diga</strong><small>SEBAS · AHORA</small></div><button id="closePrivateNote" class="private-note-close" type="button" aria-label="Digaを閉じる">×</button></header><nav class="private-note-tabs" aria-label="個人的な記録"><button id="privateNoteTab" class="active" type="button" aria-selected="true">MENSAJES</button><button id="privatePromiseTab" type="button" aria-selected="false">PROMESAS <i id="privatePromiseSignal" hidden></i></button></nav><div id="privateNoteThread" class="private-note-thread" aria-live="polite"><p id="privateNoteEmpty" class="private-note-empty">まだ伝言はない。<br>置いていけ。俺が預かる。</p></div><div id="privatePromiseThread" class="private-note-thread private-promise-thread" hidden aria-live="polite"><p id="privatePromiseEmpty" class="private-note-empty">まだ約束は交わしていない。</p></div><form id="privateNoteForm" class="private-note-composer"><label for="privateNoteInput">セバスへメッセージを送信する</label><div><textarea id="privateNoteInput" rows="2" maxlength="500" placeholder="入力中…" required></textarea><button type="submit">Enviar</button></div></form></section></div>`);

    if (!document.querySelector('link[data-haven-diga]')) {
        const digaStyles = document.createElement("link");
        digaStyles.rel = "stylesheet";
        digaStyles.href = "css/diga.css?v=2";
        digaStyles.dataset.havenDiga = "";
        document.head.appendChild(digaStyles);
    }

    if (!document.querySelector('script[data-haven-diga]')) {
        const digaScript = document.createElement("script");
        digaScript.src = "js/private-note.js?v=3";
        digaScript.dataset.havenDiga = "";
        document.body.appendChild(digaScript);
    }
})();
