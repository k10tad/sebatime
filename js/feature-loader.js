(function () {
    "use strict";
    const $ = id => document.getElementById(id);

    const rail = document.createElement("div");
    rail.className = "haven-side-rail";
    rail.setAttribute("aria-label", "Havenの記録");
    rail.innerHTML = `
      <button id="openHuella" class="huella-book-button" type="button" aria-label="Vestigioを開く"><span class="huella-book-ribbon"></span><span class="huella-book-title">Vestigio</span><span class="huella-book-mark">✦</span></button>
      <button id="companionDayBadge" class="companion-day-badge" type="button"><span>寄り添い</span><strong id="companionDayNumber">1</strong><small>日目</small></button>
      <div id="companionDayDetail" class="companion-day-detail" hidden><button id="closeCompanionDayDetail" class="companion-day-detail-close" type="button">×</button><div class="companion-day-detail-kicker">TOGETHER</div><p id="companionDayDetailText"></p></div>`;
    document.body.prepend(rail);

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
        weatherCard.prepend(location);
        clockCard.remove();
    }
    document.querySelectorAll("[data-page-target=home]").forEach(button => button.textContent = "Living");
    document.querySelectorAll("[data-page-target=sleep]").forEach(button => button.textContent = "Bedroom");
    document.querySelectorAll("[data-go-page=home]").forEach(button => button.textContent = "Livingに戻る");
    document.querySelector(".settings-page-header p")?.replaceChildren("この部屋の天気と音を、静かに整える。");
    document.querySelector('[aria-labelledby="profileSettingsTitle"]')?.remove();

    const voicePanel = document.querySelector('[aria-labelledby="voiceSettingsTitle"]');
    const soundPanel = document.querySelector('[aria-labelledby="soundSettingsTitle"]');
    soundPanel?.insertAdjacentHTML("beforeend", `
      <label class="volume-setting" for="voiceVolume">
       <span>セバスのボイス</span><output id="voiceVolumeValue">72%</output>
       <input id="voiceVolume" type="range" min="0" max="100" step="1" value="72">
      </label>`);
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
      </section></div>
      <div id="huellaViewer" class="huella-viewer" hidden><div class="huella-viewer-card"><button id="huellaViewerClose" class="huella-viewer-close">×</button><div class="huella-viewer-image-wrap"><img id="huellaViewerImage" alt=""></div><p id="huellaSebasComment" class="huella-sebas-comment"></p><div class="huella-viewer-fields"><label><span>日付</span><input id="huellaViewerDate" type="date"></label><label><span>ひとこと</span><textarea id="huellaViewerNote"></textarea></label></div><div class="huella-viewer-actions"><button id="huellaViewerSave">保存</button><button id="huellaViewerDelete" class="danger-quiet-button">削除</button></div></div></div>
      <div id="huellaEntryEditor" class="huella-entry-editor" hidden><form id="huellaEntryForm" class="huella-entry-card"><button id="huellaEntryClose" class="huella-viewer-close" type="button">×</button><div id="huellaEntryKicker" class="huella-kicker">DIARY</div><h3 id="huellaEntryEditorTitle">日記を書く</h3><input id="huellaEntryId" type="hidden"><input id="huellaEntryType" type="hidden"><label><span>日付</span><input id="huellaEntryDate" type="date" required></label><label><span>タイトル</span><input id="huellaEntryTitle"></label><label id="huellaEntryTimeField" hidden><span>時刻</span><input id="huellaEntryTime" type="time"></label><label><span id="huellaEntryBodyLabel">本文</span><textarea id="huellaEntryBody" rows="8"></textarea></label><div class="huella-viewer-actions"><button type="submit">保存</button><button id="huellaEntryDelete" class="danger-quiet-button" type="button" hidden>削除</button></div></form></div>`);
})();
