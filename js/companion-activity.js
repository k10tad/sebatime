//========================
// Sebas current activity
// 通常のLiving画面に、曜日と時間帯に沿った生活の気配を表示する
//========================
(function () {
    "use strict";

    const ACTIVITIES = {
        working: {
            id: "working",
            image: "assets/activity-working.jpg",
            label: "書斎で仕事中"
        },
        reading: {
            id: "reading",
            image: "assets/activity-reading.jpg",
            label: "読書中"
        },
        afterShower: {
            id: "after-shower",
            image: "assets/activity-after-shower.jpg",
            label: "シャワー中"
        },
        drinking: {
            id: "drinking",
            image: "assets/activity-drinking.jpg",
            label: "マッカランを一杯"
        },
        sofaNap: {
            id: "sofa-nap",
            image: "assets/activity-sofa-nap.jpg",
            label: "ソファで寝落ち"
        }
    };

    let current = null;
    let currentSlot = "";
    let soundTimer = null;

    const SOUND_DELAYS = {
        working: [20, 46],
        reading: [18, 42],
        "after-shower": [24, 52],
        drinking: [28, 58],
        "sofa-nap": [34, 70]
    };

    function localDateKey(date) {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function stableNumber(seed) {
        let hash = 2166136261;
        for (let index = 0; index < seed.length; index += 1) {
            hash ^= seed.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0) / 4294967296;
    }

    function choose(seed, choices) {
        const roll = stableNumber(seed);
        let total = 0;
        for (const choice of choices) {
            total += choice.weight;
            if (roll < total) return choice.activity;
        }
        return choices[choices.length - 1].activity;
    }

    function resolveActivity(value = new Date()) {
        const date = new Date(value);
        const hour = date.getHours();
        const weekday = date.getDay();
        const weekend = weekday === 0 || weekday === 6;
        const dateKey = localDateKey(date);

        if (weekend) {
            if (hour < 5) {
                return { activity: ACTIVITIES.reading, slot: `${dateKey}:weekend-late` };
            }
            if (hour < 10) {
                return { activity: ACTIVITIES.reading, slot: `${dateKey}:weekend-morning` };
            }
            if (hour < 13) {
                return {
                    activity: choose(`${dateKey}:weekend-noon`, [
                        { activity: ACTIVITIES.reading, weight: 0.78 },
                        { activity: ACTIVITIES.working, weight: 0.22 }
                    ]),
                    slot: `${dateKey}:weekend-noon`
                };
            }
            if (hour < 16) {
                return {
                    activity: choose(`${dateKey}:weekend-afternoon`, [
                        { activity: ACTIVITIES.sofaNap, weight: 0.68 },
                        { activity: ACTIVITIES.reading, weight: 0.32 }
                    ]),
                    slot: `${dateKey}:weekend-afternoon`
                };
            }
            if (hour < 18) {
                return { activity: ACTIVITIES.reading, slot: `${dateKey}:weekend-evening` };
            }
            if (hour < 20) {
                return { activity: ACTIVITIES.afterShower, slot: `${dateKey}:weekend-shower` };
            }
            return {
                activity: choose(`${dateKey}:weekend-night`, [
                    { activity: ACTIVITIES.drinking, weight: 0.72 },
                    { activity: ACTIVITIES.reading, weight: 0.28 }
                ]),
                slot: `${dateKey}:weekend-night`
            };
        }

        if (hour < 6) {
            return { activity: ACTIVITIES.reading, slot: `${dateKey}:weekday-late` };
        }
        if (hour < 8) {
            return { activity: ACTIVITIES.reading, slot: `${dateKey}:weekday-morning` };
        }
        if (hour < 18) {
            return { activity: ACTIVITIES.working, slot: `${dateKey}:weekday-work` };
        }
        if (hour < 20) {
            return { activity: ACTIVITIES.afterShower, slot: `${dateKey}:weekday-shower` };
        }
        if (hour < 23) {
            return {
                activity: choose(`${dateKey}:weekday-night`, [
                    { activity: ACTIVITIES.drinking, weight: 0.7 },
                    { activity: ACTIVITIES.reading, weight: 0.3 }
                ]),
                slot: `${dateKey}:weekday-night`
            };
        }
        return { activity: ACTIVITIES.reading, slot: `${dateKey}:weekday-bedtime` };
    }

    function renderStatus(visible = true) {
        const status = document.getElementById("sebasActivity");
        if (!status) return;
        status.hidden = !visible || !current;
        if (current) {
            status.textContent = current.label;
            status.dataset.activity = current.id;
        }
    }

    function currentPageIsLiving() {
        return (document.body.dataset.havenPage || "home") === "home";
    }

    function sessionIsIdle() {
        return !window.getHavenSessionState ||
            window.getHavenSessionState() === "idle";
    }

    function canPlayActivitySound() {
        return Boolean(current) &&
            currentPageIsLiving() &&
            sessionIsIdle() &&
            !document.hidden &&
            !document.body.classList.contains("a-mi-lado-mode");
    }

    function scheduleActivitySound(initial = false) {
        window.clearTimeout(soundTimer);
        if (!current) return;

        const range = SOUND_DELAYS[current.id] || [22, 52];
        const delaySeconds = initial
            ? 4 + Math.random() * 5
            : range[0] + Math.random() * (range[1] - range[0]);

        soundTimer = window.setTimeout(function () {
            if (
                canPlayActivitySound() &&
                typeof window.playHavenActivitySound === "function"
            ) {
                window.playHavenActivitySound(current.id);
            }
            scheduleActivitySound(false);
        }, delaySeconds * 1000);
    }

    function recordActivity(activity, slot) {
        const rhythm = window.HavenLifeRhythm;
        if (!rhythm) return;

        const today = rhythm.getDay();
        const previous = today?.currentActivity;
        if (previous?.slot === slot && previous?.id === activity.id) return;

        const detail = {
            id: activity.id,
            label: activity.label,
            slot,
            since: new Date().toISOString()
        };
        rhythm.setDayValue("currentActivity", detail);
        rhythm.recordEvent("sebas-activity", detail);
    }

    function refresh(value = new Date()) {
        const resolved = resolveActivity(value);
        const changed = !current ||
            current.id !== resolved.activity.id ||
            currentSlot !== resolved.slot;

        current = resolved.activity;
        currentSlot = resolved.slot;

        if (changed) recordActivity(current, currentSlot);
        if (changed || !soundTimer) scheduleActivitySound(changed);

        if (typeof window.syncSessionCompanionImage === "function") {
            window.syncSessionCompanionImage();
        } else {
            const image = document.getElementById("sebas");
            if (image) image.src = current.image;
            renderStatus(true);
        }

        return { ...current, slot: currentSlot };
    }

    window.HavenActivity = {
        activities: ACTIVITIES,
        getCurrent: function () {
            if (!current) refresh();
            return { ...current, slot: currentSlot };
        },
        resolve: function (value) {
            const resolved = resolveActivity(value);
            return { ...resolved.activity, slot: resolved.slot };
        },
        refresh,
        renderStatus
    };

    refresh();
    window.setInterval(refresh, 60 * 1000);

    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) {
            refresh();
            scheduleActivitySound(true);
        }
    });
})();
