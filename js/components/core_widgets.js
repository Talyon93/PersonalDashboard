/**
 * General Widgets - UTILITY SUITE
 * Include: Orologi, Calendario, Timer Pomodoro, Meteo Live, Forecast e Super Dashboard.
 */

const GeneralWidgets = {
    intervalId: null,
    timerInterval: null,
    
    // Stato del Timer (Pomodoro)
    timerState: {
        minutes: 25,
        seconds: 0,
        isRunning: false,
        totalSeconds: 25 * 60
    },

    // Stato Meteo con Persistenza e Forecast
    weatherState: {
        temp: '--',
        condition: 'Caricamento...',
        city: localStorage.getItem('gw_weather_city') || 'Milano',
        lat: localStorage.getItem('gw_weather_lat') || 45.46,
        lon: localStorage.getItem('gw_weather_lon') || 9.19,
        visual: `<svg class="w-full h-full text-slate-500 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/></svg>`,
        forecast: [] 
    },

    // --- LOGICA AUDIO ---
    playNotificationSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const playBeep = (startTime) => {
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.type = 'square'; 
                oscillator.frequency.setValueAtTime(987.77, startTime); 
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
                gainNode.gain.setValueAtTime(0.1, startTime + 0.15);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.2);
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.2);
            };
            const now = audioCtx.currentTime;
            playBeep(now);
            playBeep(now + 0.3);
            playBeep(now + 0.6);
        } catch (e) { console.error("Audio non supportato", e); }
    },

    // --- LOGICA METEO VISUAL (SVG DINAMICI) ---
    getWeatherVisual(code, sizeClass = "w-full h-full") {
        const icons = {
            sunny: `
                <svg class="${sizeClass} text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="5" fill="currentColor" fill-opacity="0.2" class="animate-pulse" />
                    <g class="animate-spin-slow" style="transform-origin: center;">
                        <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M17.78 6.22l1.42-1.42"/>
                    </g>
                </svg>`,
            cloudy: `
                <svg class="${sizeClass} text-slate-200 drop-shadow-[0_0_15px_rgba(203,213,225,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.3-1.7-4.2-4-4.5-1.2-3.2-4.4-5.5-8-5.5-4.7 0-8.5 3.8-8.5 8.5S5.3 21.5 10 21.5h7.5c1.4 0 2.5-1.1 2.5-2.5z" stroke-linejoin="round" fill="currentColor" fill-opacity="0.1" class="animate-bounce-slow" />
                </svg>`,
            rain: `
                <svg class="${sizeClass} text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M17 10a5 5 0 0 0-10 0 3.5 3.5 0 0 0 0 7h5" stroke-linejoin="round" fill="currentColor" fill-opacity="0.1"/>
                    <line x1="8" y1="18" x2="8" y2="22" class="animate-rain-drop-1" stroke-linecap="round" />
                    <line x1="12" y1="19" x2="12" y2="23" class="animate-rain-drop-2" stroke-linecap="round" />
                    <line x1="16" y1="18" x2="16" y2="22" class="animate-rain-drop-3" stroke-linecap="round" />
                </svg>`,
            storm: `
                <svg class="${sizeClass} text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" stroke-linecap="round" fill="currentColor" fill-opacity="0.1"/>
                    <path class="animate-pulse" d="M13 11l-4 6h6l-4 6" stroke="yellow" stroke-width="2" stroke-linejoin="round" />
                </svg>`
        };

        if (code === 0) return icons.sunny;
        if (code <= 3) return icons.cloudy;
        if (code <= 67) return icons.rain;
        return icons.storm;
    },

    // --- LOGICA METEO & GEOLOCALIZZAZIONE ---
    async searchLocation() {
        const cityInput = prompt("Inserisci la città:", this.weatherState.city);
        if (!cityInput) return;

        document.querySelectorAll('.gw-weather-cond').forEach(el => el.textContent = "Ricerca...");

        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput)}&count=1&language=it&format=json`);
            const data = await res.json();
            
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                this.weatherState.city = result.name;
                this.weatherState.lat = result.latitude;
                this.weatherState.lon = result.longitude;
                
                localStorage.setItem('gw_weather_city', this.weatherState.city);
                localStorage.setItem('gw_weather_lat', this.weatherState.lat);
                localStorage.setItem('gw_weather_lon', this.weatherState.lon);
                
                this.fetchWeather();
            } else {
                alert("Città non trovata.");
                this.updateWeatherUI();
            }
        } catch (e) { console.error("Errore ricerca:", e); }
    },

    async fetchWeather() {
        try {
            const { lat, lon } = this.weatherState;
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
            const data = await response.json();
            
            if (data && data.current_weather) {
                this.weatherState.temp = Math.round(data.current_weather.temperature);
                const code = data.current_weather.weathercode;
                
                if (code === 0) this.weatherState.condition = "Sereno";
                else if (code <= 3) this.weatherState.condition = "Nuvoloso";
                else if (code <= 67) this.weatherState.condition = "Pioggia";
                else this.weatherState.condition = "Temporale";

                this.weatherState.visual = this.getWeatherVisual(code);

                if (data.daily) {
                    this.weatherState.forecast = [];
                    for (let i = 1; i < 6; i++) {
                        const date = new Date(data.daily.time[i]);
                        this.weatherState.forecast.push({
                            day: date.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase().replace('.', ''),
                            max: Math.round(data.daily.temperature_2m_max[i]),
                            code: data.daily.weathercode[i]
                        });
                    }
                }
                this.updateWeatherUI();
            }
        } catch (error) { console.error("Errore meteo:", error); }
    },

    updateWeatherUI() {
        document.querySelectorAll('.gw-weather-temp').forEach(el => el.textContent = `${this.weatherState.temp}°`);
        document.querySelectorAll('.gw-weather-cond').forEach(el => el.textContent = this.weatherState.condition);
        document.querySelectorAll('.gw-weather-city').forEach(el => el.textContent = this.weatherState.city);
        document.querySelectorAll('.gw-weather-icon-container').forEach(el => {
            if (!el.innerHTML || el.querySelector('circle[stroke-dasharray]')) {
                el.innerHTML = this.weatherState.visual;
            }
        });

        document.querySelectorAll('.gw-forecast-list-el').forEach(container => {
            if (this.weatherState.forecast.length > 0) {
                container.innerHTML = this.weatherState.forecast.map(item => `
                    <div class="flex-1 flex flex-col items-center justify-center p-2 rounded-2xl bg-white/5 border border-white/5">
                        <span class="text-[9px] font-black text-slate-500 mb-1">${item.day}</span>
                        <div class="w-7 h-7 mb-1">${this.getWeatherVisual(item.code)}</div>
                        <span class="text-[11px] font-bold text-white">${item.max}°</span>
                    </div>
                `).join('');
            }
        });
    },

    // --- LOGICA DINAMICA OROLOGIO ---
    getGreeting(hours) {
        const h = parseInt(hours);
        if (h >= 5 && h < 12) return 'Buongiorno';
        if (h >= 12 && h < 18) return 'Buon Pomeriggio';
        if (h >= 18 && h < 22) return 'Buonasera';
        return 'Buonanotte';
    },

    updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        const dayNameRaw = now.toLocaleDateString('it-IT', { weekday: 'long' });
        const dayName = dayNameRaw.charAt(0).toUpperCase() + dayNameRaw.slice(1);
        const dayNum = now.getDate();
        const monthRaw = now.toLocaleDateString('it-IT', { month: 'long' });
        const month = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);
        
        const greeting = this.getGreeting(hours);

        document.querySelectorAll('.gw-clock-time').forEach(el => el.textContent = `${hours}:${minutes}`);
        document.querySelectorAll('.gw-clock-sec').forEach(el => el.textContent = seconds);
        document.querySelectorAll('.gw-day-name').forEach(el => el.textContent = dayName);
        document.querySelectorAll('.gw-date-only').forEach(el => el.textContent = `${dayNum} ${month}`);
        document.querySelectorAll('.gw-day-num').forEach(el => el.textContent = dayNum);
        document.querySelectorAll('.gw-month').forEach(el => el.textContent = month);
        document.querySelectorAll('.gw-greeting').forEach(el => el.textContent = greeting);

        this.updateWeatherUI();
    },

    // --- LOGICA TIMER POMODORO ---
    toggleTimer() {
        this.timerState.isRunning = !this.timerState.isRunning;
        const btn = document.getElementById('gw-timer-btn');
        const icon = document.getElementById('gw-timer-icon');
        if (this.timerState.isRunning) {
            if(btn) btn.classList.add('bg-rose-500/20', 'text-rose-400');
            if(icon) icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />`;
            this.timerInterval = setInterval(() => {
                if (this.timerState.seconds === 0) {
                    if (this.timerState.minutes === 0) {
                        this.playNotificationSound();
                        this.toggleTimer();
                        return;
                    }
                    this.timerState.minutes--;
                    this.timerState.seconds = 59;
                } else { this.timerState.seconds--; }
                this.updateTimerDisplay();
            }, 1000);
        } else {
            if(btn) btn.classList.remove('bg-rose-500/20', 'text-rose-400');
            if(icon) icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
            clearInterval(this.timerInterval);
        }
    },

    updateTimerDisplay() {
        const m = String(this.timerState.minutes).padStart(2, '0');
        const s = String(this.timerState.seconds).padStart(2, '0');
        const el = document.getElementById('gw-timer-display');
        if(el) el.textContent = `${m}:${s}`;
        const currentTotal = (this.timerState.minutes * 60) + this.timerState.seconds;
        const percent = ((this.timerState.totalSeconds - currentTotal) / this.timerState.totalSeconds) * 100;
        const bar = document.getElementById('gw-timer-bar');
        if(bar) bar.style.width = `${percent}%`;
    },

    resetTimer() {
        this.timerState.isRunning = false;
        clearInterval(this.timerInterval);
        this.timerState.minutes = 25;
        this.timerState.seconds = 0;
        this.updateTimerDisplay();
        const btn = document.getElementById('gw-timer-btn');
        const icon = document.getElementById('gw-timer-icon');
        if(btn) btn.classList.remove('bg-rose-500/20', 'text-rose-400');
        if(icon) icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
        const bar = document.getElementById('gw-timer-bar');
        if(bar) bar.style.width = `0%`;
    },

    start() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.updateClock();
        setTimeout(() => {
            this.fetchWeather();
            this.updateClock();
        }, 1200);
        this.intervalId = setInterval(() => this.updateClock(), 1000);
        setInterval(() => this.fetchWeather(), 15 * 60 * 1000);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
            @keyframes rain-drop { 0% { transform: translateY(-15px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(15px); opacity: 0; } }
            .animate-spin-slow { animation: spin-slow 20s linear infinite; }
            .animate-bounce-slow { animation: bounce-slow 5s ease-in-out infinite; }
            .animate-rain-drop-1 { animation: rain-drop 0.6s linear infinite; }
            .animate-rain-drop-2 { animation: rain-drop 0.6s linear infinite 0.2s; }
            .animate-rain-drop-3 { animation: rain-drop 0.6s linear infinite 0.4s; }
        `;
        document.head.appendChild(style);
    },

    getDefinitions() {
        return [
            // 1. ORARIO SMART (1x1)
            {
                id: 'gen_clock_small',
                name: 'Orario Smart',
                description: 'Solo ora e data compatta',
                size: { cols: 1, rows: 1 },
                type: 'kpi',
                render: () => `
                    <div class="h-full relative overflow-hidden bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] p-5 border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center group">
                        <div class="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-[50px]"></div>
                        <div class="relative z-10 mb-1"><div class="text-sm font-black uppercase tracking-[0.25em] text-indigo-400 gw-day-name">--</div></div>
                        <div class="relative z-10 mb-2"><span class="text-6xl font-black text-white tracking-tighter leading-none gw-clock-time drop-shadow-2xl">--:--</span></div>
                        <div class="relative z-10 bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">
                            <div class="text-lg font-black text-white gw-date-only tracking-tight">--</div>
                        </div>
                    </div>`
            },

            // 2. ORARIO, DATA E METEO (2x1)
            {
                id: 'gen_clock_wide',
                name: 'Orario Data e Meteo Wide',
                description: 'Layout orizzontale completo',
                size: { cols: 2, rows: 1 },
                type: 'kpi',
                render: () => `
                    <div class="h-full bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] p-0 border border-white/5 shadow-2xl flex relative overflow-hidden group">
                        <div class="w-1/4 bg-white/5 border-r border-white/5 flex flex-col items-center justify-center p-4 relative">
                            <span class="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1 gw-month">--</span>
                            <span class="text-6xl font-black text-white leading-none gw-day-num">--</span>
                            <span class="text-lg font-black text-slate-400 mt-2 capitalize gw-day-name">--</span>
                        </div>
                        <div class="flex-1 flex flex-col justify-center px-8 relative">
                            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 gw-greeting">--</span>
                            <div class="flex items-baseline gap-2">
                                <span class="text-7xl font-black text-white tracking-tighter leading-none gw-clock-time">--:--</span>
                            </div>
                        </div>
                        <div class="w-1/3 border-l border-white/5 flex flex-row items-center justify-between px-6 bg-slate-950/30 backdrop-blur-md cursor-pointer group/weather" onclick="GeneralWidgets.searchLocation()">
                            <div class="absolute top-4 right-4 text-slate-500 opacity-40 group-hover/weather:opacity-100"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                            <div class="flex flex-col justify-center">
                                <div class="text-5xl font-black text-white gw-weather-temp">--°</div>
                                <div class="text-[14px] font-black uppercase tracking-[0.2em] text-indigo-400 gw-weather-city">--</div>
                                <div class="text-[12px] font-bold text-slate-400 uppercase gw-weather-cond leading-none">--</div>
                            </div>
                            <div class="w-20 h-20 gw-weather-icon-container ml-2"></div>
                        </div>
                    </div>`
            },

            // 3. METEO ORA (1x1)
            {
                id: 'gen_weather_smart',
                name: 'Meteo Ora',
                description: 'Solo condizioni attuali con ricerca',
                size: { cols: 1, rows: 1 },
                type: 'kpi',
                render: () => `
                    <div class="h-full relative overflow-hidden bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] p-7 border border-white/10 shadow-2xl flex flex-col justify-between group cursor-pointer" onclick="GeneralWidgets.searchLocation()">
                        <div class="flex justify-between items-start relative z-10 w-full h-full">
                            <div class="flex flex-col justify-between h-full py-1">
                                <div class="flex flex-col">
                                    <div class="text-[14px] font-black uppercase tracking-[0.3em] text-indigo-400 gw-weather-city">--</div>
                                    <div class="flex items-center gap-2 mt-2 text-slate-400 hover:text-amber-400 transition-colors">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        <span class="text-[9px] font-black tracking-widest uppercase">Cerca</span>
                                    </div>
                                </div>
                                <div class="mt-auto">
                                    <div class="text-[13px] font-black text-slate-400 uppercase tracking-[0.25em] gw-weather-cond mb-1">--</div>
                                    <div class="text-7xl font-black text-white gw-weather-temp leading-none tracking-tighter drop-shadow-2xl">--°</div>
                                </div>
                            </div>
                            <div class="w-1/2 h-full flex items-center justify-center p-2">
                                <div class="w-full h-full max-w-[120px] max-h-[120px] gw-weather-icon-container"></div>
                            </div>
                        </div>
                    </div>`
            },

            // 4. METEO PROSSIMI GIORNI (2x1)
            {
                id: 'gen_weather_forecast',
                name: 'Meteo Prossimi Giorni',
                description: 'Previsioni della settimana',
                size: { cols: 2, rows: 1 },
                type: 'generic',
                render: () => `
                    <div class="h-full bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] p-6 border border-white/10 shadow-2xl flex flex-col justify-between relative overflow-hidden group/forecast cursor-pointer" onclick="GeneralWidgets.searchLocation()">
                        <div class="flex items-center justify-between mb-4 px-2">
                            <div class="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400">Weekly Forecast</div>
                            <div class="flex items-center gap-2 text-slate-500 hover:text-amber-400 transition-colors">
                                <div class="text-[12px] font-black uppercase tracking-widest gw-weather-city">--</div>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        </div>
                        <div class="flex gap-3 h-full gw-forecast-list-el">
                            <div class="flex-1 flex items-center justify-center text-slate-500 text-[10px] font-bold uppercase animate-pulse">Caricamento...</div>
                        </div>
                    </div>`
            },

            // 5. SUPER DASHBOARD 2x2
            {
                id: 'gen_weather_dashboard_2x2',
                name: 'Super Dashboard 2x2',
                description: 'Tutto in uno (Data, Ora, Meteo, Previsioni)',
                size: { cols: 2, rows: 2 },
                type: 'kpi',
                render: () => `
                    <div class="h-full bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] p-0 border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                        <div class="flex flex-1 border-b border-white/5">
                            <div class="w-1/2 bg-white/5 border-r border-white/5 flex flex-col justify-center p-8 relative">
                                <span class="text-xs font-black uppercase tracking-[0.25em] text-indigo-300 mb-2 gw-month">--</span>
                                <span class="text-8xl font-black text-white leading-none gw-day-num tracking-tighter">--</span>
                                <span class="text-2xl font-black text-slate-400 mt-2 capitalize gw-day-name">--</span>
                            </div>
                            <div class="w-1/2 flex flex-col justify-center p-8 bg-slate-950/20 backdrop-blur-md relative cursor-pointer group/weather" onclick="GeneralWidgets.searchLocation()">
                                <div class="absolute top-6 right-6 text-slate-500 opacity-60 group-hover/weather:opacity-100 hover:text-amber-400 transition-colors">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <div class="flex items-center justify-between mb-2">
                                    <div class="w-20 h-20 gw-weather-icon-container"></div>
                                    <div class="text-6xl font-black text-white gw-weather-temp tracking-tighter">--°</div>
                                </div>
                                <div class="text-[15px] font-black uppercase tracking-[0.2em] text-indigo-400 gw-weather-city">--</div>
                                <div class="text-xs font-bold text-slate-400 uppercase gw-weather-cond">--</div>
                            </div>
                        </div>
                        <div class="flex flex-1">
                            <div class="w-1/2 border-r border-white/5 flex flex-col justify-center p-8">
                                <div class="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-2 gw-greeting">--</div>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-8xl font-black text-white tracking-tighter leading-none gw-clock-time drop-shadow-2xl">--:--</span>
                                    <span class="text-2xl font-medium text-slate-500 gw-clock-sec mb-2">00</span>
                                </div>
                            </div>
                            <div class="w-1/2 p-8 flex flex-col justify-center bg-slate-950/10">
                                <div class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 px-1">Weekly Outlook</div>
                                <div class="flex justify-between items-center gap-3 gw-forecast-list-el"></div>
                            </div>
                        </div>
                    </div>`
            },
            
            // BONUS: FOCUS TIMER
            {
                id: 'gen_focus_timer',
                name: 'Focus Timer',
                description: 'Pomodoro 25min con allarme sveglia',
                size: { cols: 1, rows: 1 },
                type: 'generic',
                render: () => `
                    <div class="h-full bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white/5 shadow-2xl flex flex-col items-center justify-between relative overflow-hidden">
                        <div class="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-1000" style="width: 0%" id="gw-timer-bar"></div>
                        <div class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Focus Session</div>
                        <div class="text-5xl font-black text-white tracking-tighter tabular-nums" id="gw-timer-display">25:00</div>
                        <div class="flex gap-3">
                            <button id="gw-timer-btn" onclick="GeneralWidgets.toggleTimer()" class="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all active:scale-95 border border-white/5"><svg id="gw-timer-icon" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                            <button onclick="GeneralWidgets.resetTimer()" class="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95 border border-white/5"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                        </div>
                    </div>`
            },
        ];
    }
};

window.GeneralWidgets = GeneralWidgets;
setTimeout(() => { GeneralWidgets.start(); }, 500);