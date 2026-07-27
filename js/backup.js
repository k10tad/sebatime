(function () {
    "use strict";

    const $ = id => document.getElementById(id);
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const status = $("backupStatus");
    const localKeys = new Set([
        "havenSettings","haven_companion_start_date","havenAlarmTime","havenAlarmEnabled","havenAlarmLastTriggered",
        "havenAlarmSnoozeUntil","havenSleepStart","havenSleepStartedAt","havenLastSleepDuration","havenLastSleepDate",
        "havenSessionDate","havenWorkSeconds","havenBreakSeconds","havenSessionState","havenSessionLastTick",
        "sleepStartTime","lastSleepDuration","lastSleepDate",
        "todayFocusSeconds","yesterdayFocusSeconds","pomodoroCount","savedDate","sebasMemories","moodLog","todayMood","todayMoodDate"
    ]);

    function setStatus(message, kind="") { if(status){status.textContent=message;status.dataset.kind=kind;} }
    function collectStorage() {
        const data={};
        for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&(key.startsWith("haven")||localKeys.has(key)))data[key]=localStorage.getItem(key);}
        return data;
    }
    function crc32(bytes){let crc=-1;for(const byte of bytes){crc^=byte;for(let j=0;j<8;j++)crc=(crc>>>1)^(0xEDB88320&-(crc&1));}return(crc^-1)>>>0;}
    const u16=n=>new Uint8Array([n&255,n>>>8&255]);
    const u32=n=>new Uint8Array([n&255,n>>>8&255,n>>>16&255,n>>>24&255]);
    function concat(parts){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const part of parts){out.set(part,at);at+=part.length;}return out;}
    function stamp(){const d=new Date(),year=Math.max(1980,d.getFullYear());return{time:d.getHours()<<11|d.getMinutes()<<5|Math.floor(d.getSeconds()/2),date:(year-1980)<<9|(d.getMonth()+1)<<5|d.getDate()};}
    function createZip(files){
        const local=[],central=[],time=stamp();let offset=0;
        for(const file of files){
            const name=encoder.encode(file.name),data=file.data instanceof Uint8Array?file.data:new Uint8Array(file.data),crc=crc32(data);
            const head=concat([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(time.time),u16(time.date),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name]);
            local.push(head,data);
            central.push(concat([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(time.time),u16(time.date),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]));
            offset+=head.length+data.length;
        }
        const directory=concat(central);
        return concat([...local,directory,u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(directory.length),u32(offset),u16(0)]);
    }
    function parseZip(bytes){
        const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),files=new Map();let offset=0;
        while(offset+30<=bytes.length&&view.getUint32(offset,true)===0x04034b50){
            if(view.getUint16(offset+8,true)!==0)throw new Error("非対応の圧縮方式です。");
            const size=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extra=view.getUint16(offset+28,true);
            const nameStart=offset+30,dataStart=nameStart+nameLength+extra,dataEnd=dataStart+size;
            if(dataEnd>bytes.length)throw new Error("ファイルが壊れています。");
            files.set(decoder.decode(bytes.slice(nameStart,nameStart+nameLength)),bytes.slice(dataStart,dataEnd));offset=dataEnd;
        }
        if(!files.size)throw new Error("Havenのバックアップではありません。");return files;
    }
    async function exportBackup(){
        if(!window.HavenHuella)return setStatus("Vestigioの準備が整っていません。","error");
        setStatus("バックアップを作成中…");
        try{
            const files=[],index=[],entries=await window.HavenHuella.getAllEntries();let photos=0;
            for(const entry of entries){
                const record={...entry,imageBlob:undefined};
                if(entry.imageBlob instanceof Blob){photos++;const name=`huella/images/${String(photos).padStart(4,"0")}-${entry.id}.bin`;files.push({name,data:new Uint8Array(await entry.imageBlob.arrayBuffer())});record.backupImage=name;record.mimeType=entry.imageBlob.type||entry.mimeType;}
                index.push(record);
            }
            const manifest={format:"haven-backup",version:1,app:"Haven",createdAt:new Date().toISOString(),huellaEntries:index.length,huellaPhotos:photos};
            files.unshift({name:"manifest.json",data:encoder.encode(JSON.stringify(manifest,null,2))},{name:"local-storage.json",data:encoder.encode(JSON.stringify(collectStorage(),null,2))},{name:"huella/index.json",data:encoder.encode(JSON.stringify(index,null,2))});
            const blob=new Blob([createZip(files)],{type:"application/zip"}),url=URL.createObjectURL(blob),a=document.createElement("a");
            a.href=url;a.download=`haven-backup-${new Date().toISOString().slice(0,10)}.zip`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
            setStatus(`保管完了。Vestigio ${index.length}件（写真${photos}枚）を保存しました。`,"success");
        }catch(error){console.error(error);setStatus("バックアップを作成できませんでした。","error");}
    }
    async function restoreBackup(file){
        if(!file||!confirm("現在のHavenデータをバックアップ内容で置き換えます。続けますか？"))return;
        setStatus("バックアップを確認中…");
        try{
            const files=parseZip(new Uint8Array(await file.arrayBuffer()));
            const manifest=JSON.parse(decoder.decode(files.get("manifest.json")||new Uint8Array()));
            if(manifest.format!=="haven-backup")throw new Error("Havenのバックアップではありません。");
            const storage=JSON.parse(decoder.decode(files.get("local-storage.json"))),index=JSON.parse(decoder.decode(files.get("huella/index.json")));
            const entries=[];
            for(const record of index){const entry={...record};delete entry.backupImage;if(record.backupImage){const image=files.get(record.backupImage);if(!image)throw new Error("Vestigioの画像が不足しています。");entry.imageBlob=new Blob([image],{type:record.mimeType||"application/octet-stream"});}entries.push(entry);}
            [...Array(localStorage.length)].map((_,i)=>localStorage.key(i)).filter(key=>key&&(key.startsWith("haven")||localKeys.has(key))).forEach(key=>localStorage.removeItem(key));
            Object.entries(storage).forEach(([key,value])=>{if(key.startsWith("haven")||localKeys.has(key))localStorage.setItem(key,value);});
            await window.HavenHuella.importEntries(entries,{replace:true});
            setStatus("復元完了。再読み込みします。","success");setTimeout(()=>location.reload(),800);
        }catch(error){console.error(error);setStatus(`復元できませんでした。${error.message||""}`,"error");}
    }
    $("exportHavenBackup")?.addEventListener("click",exportBackup);
    $("restoreHavenBackup")?.addEventListener("click",()=>$("havenBackupFile")?.click());
    $("havenBackupFile")?.addEventListener("change",event=>restoreBackup(event.target.files?.[0]));
})();
