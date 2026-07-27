(function () {
    "use strict";

    const DB_NAME = "haven-huella-db";
    const STORE_NAME = "memories";
    const $ = id => document.getElementById(id);
    const e = {
        open:$("openHuella"), close:$("closeHuella"), overlay:$("huellaOverlay"),
        albumTab:$("huellaAlbumTab"), calendarTab:$("huellaCalendarTab"), album:$("huellaAlbumPanel"), calendar:$("huellaCalendarPanel"),
        input:$("huellaFileInput"), add:$("huellaAddButton"), grid:$("huellaGrid"), empty:$("huellaEmpty"), count:$("huellaCount"),
        viewer:$("huellaViewer"), image:$("huellaViewerImage"), note:$("huellaViewerNote"), photoDate:$("huellaViewerDate"), comment:$("huellaSebasComment"),
        prev:$("huellaPrevMonth"), next:$("huellaNextMonth"), monthTitle:$("huellaCalendarTitle"), calendarGrid:$("huellaCalendarGrid"),
        selectedTitle:$("huellaSelectedDateTitle"), dayEntries:$("huellaDayEntries"), dayEmpty:$("huellaDayEmpty"),
        editor:$("huellaEntryEditor"), form:$("huellaEntryForm"), entryId:$("huellaEntryId"), entryType:$("huellaEntryType"),
        entryDate:$("huellaEntryDate"), entryTitle:$("huellaEntryTitle"), entryTime:$("huellaEntryTime"), timeField:$("huellaEntryTimeField"),
        entryBody:$("huellaEntryBody"), bodyLabel:$("huellaEntryBodyLabel"), entryDelete:$("huellaEntryDelete"), editorTitle:$("huellaEntryEditorTitle"), editorKicker:$("huellaEntryKicker")
    };
    [e.overlay,e.viewer,e.editor].forEach(layer => { if (layer && layer.parentElement !== document.body) document.body.appendChild(layer); });

    let dbPromise;
    let currentPhoto;
    let selected = new Date();
    let month = new Date(selected.getFullYear(), selected.getMonth(), 1);
    const urls = new Set();
    const comments = [
        "……悪くない。残しておけ。",
        "お前が見ていたものを、俺も覚えておこう。",
        "この一枚には、随分と気を許しているらしい。",
        "消すな。俺が見返す。",
        "写真は記憶より正直だ。だから価値がある。",
        "また一つ増えたな。……歓迎する。"
    ];

    function openDb() {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise((resolve,reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => {
                const store = request.result.createObjectStore(STORE_NAME, { keyPath:"id" });
                store.createIndex("dateKey","dateKey");
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        return dbPromise;
    }
    async function storeAction(mode, action) {
        const db = await openDb();
        return new Promise((resolve,reject) => {
            const tx = db.transaction(STORE_NAME,mode);
            const result = action(tx.objectStore(STORE_NAME));
            tx.oncomplete = () => resolve(result);
            tx.onerror = () => reject(tx.error);
        });
    }
    async function getAllEntries() {
        const db = await openDb();
        return new Promise((resolve,reject) => {
            const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }
    const put = value => storeAction("readwrite", store => store.put(value));
    const remove = id => storeAction("readwrite", store => store.delete(id));
    const clearEntries = () => storeAction("readwrite", store => store.clear());
    const id = () => crypto.randomUUID?.() || `haven-${Date.now()}-${Math.random()}`;
    const key = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    const fromKey = value => { const [y,m,d] = value.split("-").map(Number); return new Date(y,m-1,d,12); };
    const format = date => date.toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric",weekday:"short"});
    const objectUrl = blob => { const url=URL.createObjectURL(blob); urls.add(url); return url; };
    const revoke = () => { urls.forEach(URL.revokeObjectURL); urls.clear(); };

    async function renderAlbum() {
        revoke();
        const photos=(await getAllEntries()).filter(x=>x.entryType==="memory" && x.imageBlob instanceof Blob).sort((a,b)=>b.createdAt-a.createdAt);
        e.grid.replaceChildren(); e.count.textContent=`${photos.length}枚`; e.empty.hidden=photos.length>0;
        photos.forEach(photo => {
            const button=document.createElement("button"); button.type="button"; button.className="huella-photo";
            const image=document.createElement("img"); image.src=objectUrl(photo.imageBlob); image.alt=photo.note || "Vestigioの写真";
            const label=document.createElement("span"); label.textContent=new Date(photo.createdAt).toLocaleDateString("ja-JP",{month:"numeric",day:"numeric"});
            button.append(image,label); button.addEventListener("click",()=>openPhoto(photo)); e.grid.append(button);
        });
    }
    async function renderCalendar() {
        const entries=await getAllEntries(), year=month.getFullYear(), mon=month.getMonth();
        e.monthTitle.textContent=`${year}年 ${mon+1}月`; e.calendarGrid.replaceChildren();
        for(let i=0;i<new Date(year,mon,1).getDay();i++) e.calendarGrid.append(document.createElement("span"));
        for(let day=1;day<=new Date(year,mon+1,0).getDate();day++) {
            const date=new Date(year,mon,day,12), dateKey=key(date), items=entries.filter(x=>x.dateKey===dateKey);
            const button=document.createElement("button"); button.type="button"; button.className="huella-calendar-day";
            button.innerHTML=`<span>${day}</span><small></small>`;
            if(dateKey===key(selected)) button.classList.add("selected");
            if(dateKey===key(new Date())) button.classList.add("today");
            if(items.length) button.classList.add("has-entry");
            button.addEventListener("click",()=>{selected=date;renderCalendar();}); e.calendarGrid.append(button);
        }
        renderDay(entries);
    }
    function renderDay(entries) {
        const items=entries.filter(x=>x.dateKey===key(selected)).sort((a,b)=>(a.time||"99").localeCompare(b.time||"99"));
        e.selectedTitle.textContent=format(selected); e.dayEntries.replaceChildren(); e.dayEmpty.hidden=items.length>0;
        items.forEach(entry => {
            const card=document.createElement("article"); card.className="huella-day-entry";
            const button=document.createElement("button"); button.type="button";
            button.innerHTML=`<span class="huella-entry-tag">${entry.entryType==="memory"?"写真":entry.entryType==="plan"?"予定":"日記"}</span><strong>${entry.title||entry.note||"記録"}</strong> ${entry.time||""}`;
            button.addEventListener("click",()=>entry.entryType==="memory"?openPhoto(entry):openEditor(entry.entryType,entry));
            card.append(button); if(entry.body){const p=document.createElement("p");p.textContent=entry.body;card.append(p);} e.dayEntries.append(card);
        });
    }
    function switchMode(mode) {
        const album=mode==="album"; e.album.hidden=!album;e.calendar.hidden=album;e.albumTab.classList.toggle("active",album);e.calendarTab.classList.toggle("active",!album);
        album?renderAlbum():renderCalendar();
    }
    function openOverlay(){e.overlay.hidden=false;document.body.classList.add("huella-open");switchMode("album");}
    function closeOverlay(){e.overlay.hidden=true;e.viewer.hidden=true;e.editor.hidden=true;document.body.classList.remove("huella-open");}
    function openPhoto(photo){currentPhoto=photo;e.image.src=objectUrl(photo.imageBlob);e.note.value=photo.note||"";e.photoDate.value=photo.dateKey;e.comment.textContent=comments[Math.floor(Math.random()*comments.length)];e.viewer.hidden=false;}
    function closePhoto(){e.viewer.hidden=true;e.image.removeAttribute("src");currentPhoto=null;}
    async function addPhotos(files) {
        for(const file of [...files].filter(x=>x.type.startsWith("image/"))){const now=Date.now();await put({id:id(),entryType:"memory",imageBlob:file,fileName:file.name,mimeType:file.type,createdAt:now,dateKey:key(new Date()),note:"",title:"",body:"",time:""});}
        e.input.value="";renderAlbum();
    }
    async function savePhoto(){if(!currentPhoto)return;await put({...currentPhoto,note:e.note.value.trim(),dateKey:e.photoDate.value,updatedAt:Date.now()});closePhoto();renderAlbum();}
    async function deletePhoto(){if(!currentPhoto||!confirm("この写真をVestigioから削除しますか？"))return;await remove(currentPhoto.id);closePhoto();renderAlbum();}
    function openEditor(type,entry=null){e.entryId.value=entry?.id||"";e.entryType.value=type;e.entryDate.value=entry?.dateKey||key(selected);e.entryTitle.value=entry?.title||"";e.entryTime.value=entry?.time||"";e.entryBody.value=entry?.body||"";e.timeField.hidden=type!=="plan";e.editorKicker.textContent=type==="plan"?"PLAN":"DIARY";e.editorTitle.textContent=entry?"記録を編集":type==="plan"?"予定を追加":"日記を書く";e.entryDelete.hidden=!entry;e.editor.hidden=false;}
    function closeEditor(){e.editor.hidden=true;e.form.reset();}
    async function saveEntry(event){event.preventDefault();const old=(await getAllEntries()).find(x=>x.id===e.entryId.value);await put({...old,id:e.entryId.value||id(),entryType:e.entryType.value,dateKey:e.entryDate.value,title:e.entryTitle.value.trim(),time:e.entryType.value==="plan"?e.entryTime.value:"",body:e.entryBody.value.trim(),createdAt:old?.createdAt||Date.now(),updatedAt:Date.now()});selected=fromKey(e.entryDate.value);month=new Date(selected.getFullYear(),selected.getMonth(),1);closeEditor();renderCalendar();}
    async function deleteText(){if(!e.entryId.value||!confirm("この記録をVestigioから削除しますか？"))return;await remove(e.entryId.value);closeEditor();renderCalendar();}
    async function importEntries(entries,{replace=true}={}){if(replace)await clearEntries();for(const entry of entries||[])if(entry?.id)await put(entry);await renderAlbum();}

    e.open?.addEventListener("click",openOverlay);e.close?.addEventListener("click",closeOverlay);e.albumTab?.addEventListener("click",()=>switchMode("album"));e.calendarTab?.addEventListener("click",()=>switchMode("calendar"));
    e.add?.addEventListener("click",()=>e.input.click());e.input?.addEventListener("change",event=>addPhotos(event.target.files));$("huellaViewerClose")?.addEventListener("click",closePhoto);$("huellaViewerSave")?.addEventListener("click",savePhoto);$("huellaViewerDelete")?.addEventListener("click",deletePhoto);
    e.prev?.addEventListener("click",()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);renderCalendar();});e.next?.addEventListener("click",()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);renderCalendar();});
    $("huellaAddDiary")?.addEventListener("click",()=>openEditor("diary"));$("huellaAddPlan")?.addEventListener("click",()=>openEditor("plan"));$("huellaEntryClose")?.addEventListener("click",closeEditor);e.form?.addEventListener("submit",saveEntry);e.entryDelete?.addEventListener("click",deleteText);
    window.HavenHuella={DB_NAME,STORE_NAME,getAllEntries,importEntries,clearEntries,render:renderAlbum};
})();
