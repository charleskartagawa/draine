// Localization manager for Indonesian (id) and English (en)

let currentLang = 'id'; // Default to Indonesian

const translations = {
  id: {
    // Opening
    charlesGreeting: 'Hi. Kenalin, aku Charles.',
    typePlaceholder: 'Ketik "Hi Juga Charles"...',
    typeHint: 'Ketik "Hi Juga Charles" untuk menyapa',
    charlesResponse: 'Senang bertemu denganmu! Sebelum kita mulai petualangan ini, pilih bahasamu dulu ya:',
    langChoiceTitle: 'PILIH BAHASA',
    btnNext: 'MULAI PETUALANGAN &rarr;',
    btnNextShort: 'NEXT &rarr;',

    // Controls
    controlsHint: '<span class="hint-label">WASD</span> untuk Bergerak',
    tapToContinue: 'Ketuk layar untuk lanjut',
    pressEOrTap: 'Ketuk atau tekan [E] &bull; Otomatis tutup dalam 5s',

    // Prompts
    promptInspect: 'Periksa',
    promptTalk: 'Bicara',
    promptOpenGate: 'Buka Gerbang',
    promptTakeDrone: 'Ambil Buster Drone',
    promptInteract: 'Interaksi',
    promptReadNote: 'Baca Catatan',
    promptExamineSeal: 'Periksa Segel',

    // Objectives
    objCh1Initial: 'Temukan jalan melewati taman bunga. (Ambil Buster Drone!)',
    objCh1DroneTaken: 'Selidiki petunjuk-petunjuk di taman.',
    objCh1GateReady: 'Lanjutkan melewati gerbang taman.',
    objCh2Initial: 'Ikuti jejak Draine di dalam hutan.',
    objCh2CluesFound: 'Ketiga petunjuk pasti mengarah ke suatu tempat.',
    objCh2OpenHellGate: 'Buka Gerbang Neraka.',
    objCh3Initial: 'Temui Penjaga Gerbang Api.',
    objCh3Trial: 'Selesaikan ujian sang Penjaga Gerbang.',
    objCh3GatePassed: 'Masuki Gerbang Neraka.',
    objCh4Initial: 'Cari Draine di dalam penjara.',
    objCh4FindDraine: 'Cari Draine.',
    objCh4ExamineDoor: 'Periksa pintu terakhir.',
    objCh4Found: 'Pecahkan segel terakhir untuk membebaskan Draine.',
    objCh4Sanctuary: 'Masuki Tempat Peristirahatan Terakhir.',

    // Dialogues
    ch1DroneText: [
      'Sebuah Buster Drone!',
      'Drone ini mengaktifkan pendorongnya dan melayang di bahu kananku.',
      'Lampu sorotnya yang terang benderang akan menerangi jalan gelap di depan.'
    ],
    ch1Clue1: 'Draine pernah berada di sini.',
    ch1Clue2: 'Dia meninggalkan sesuatu di belakangnya...',
    ch1Clue3: 'Gerbang taman terkunci rapat tanpa tiga simbol.',
    ch1GateNoDrone: 'Tunggu, aku harus mengambil Buster Drone dulu. Jalan di depan sangat gelap gulita.',
    ch1GateLocked: 'Gerbang masih terkunci.',
    ch1GateOpen: 'Firasatku mengatakan Draine pergi ke arah sini.',

    ch2Narration: [
      'BAB II — HUTAN KABUT',
      'Hutan ini begitu sunyi...',
      'Tapi ada bekas langkah kaki di tanah lembab.'
    ],
    ch2Campfire: ['Draine sempat beristirahat di sini...', 'Apinya masih terasa hangat.'],
    ch2Ribbon: ['Ini milik Draine...', 'Pita ini pasti terjatuh saat dia berjalan.'],
    ch2Marker: ['Dia meninggalkan sebuah tanda.', 'Tapi apa artinya?'],
    ch2Shrine: [
      'Draine pernah ke sini.',
      'Dia tidak bermaksud bersembunyi dariku.',
      'Dia ingin membawaku ke suatu tempat.'
    ],
    ch2HellGateNarration: ['GERBANG NERAKA', 'Draine pasti melewati gerbang ini.'],
    ch2GateOpening: [
      'Gerbang mulai terbuka...',
      'Ada sesuatu yang menunggu di balik sana.'
    ],

    ch3Narration: [
      'BAB III — GERBANG NERAKA',
      'Udara berubah panas dan berapi.',
      'Seseorang sedang berjaga di depan gerbang.'
    ],
    ch3GatekeeperGreeting: [
      'PENJAGA GERBANG: Berhenti, Charles!',
      'Hanya mereka yang berfikir jernih yang boleh melangkah melewati gerbang api ini.',
      'Jawab 3 teka-teki logika berikut ini jika ingin menyelamatkan Draine.'
    ],
    ch3GatekeeperPass: ['…', 'Kamu berhasil. Silakan lewat.'],
    ch3CharlesHoldOn: ['Draine...', 'Tunggu aku di sana.'],

    ch4Narration: [
      'BAB IV — PENJARA KATA',
      'Dia pasti ada di sini.'
    ],
    pClue1Text: [
      'Ini milik Draine...',
      'Tapi di mana dia sekarang?'
    ],
    pClue2Text: [
      'Dia tidak dikurung di sini.',
      'Dia sedang menuju ke suatu tempat.'
    ],
    pNoteText: [
      'Charles.',
      'Kalau kamu membaca ini...',
      'Aku tahu kamu pasti menyusulku.',
      'Jangan khawatir.',
      'Aku berada lebih dekat dari yang kamu kira.',
      'Pintu terakhir sedang menunggumu.'
    ],
    pDoorOpen: 'Tempat peristirahatan telah terbuka.',
    pDoorLocked: [
      'Ada sesuatu yang kurang.',
      'Mungkin jawabannya bukan sekadar angka biasa.'
    ],
    ch4DraineDialogue: [
      { speaker: 'DRAINE', text: 'Kamu beneran nyelesaiin semuanya?' },
      { speaker: 'CHARLES', text: 'Jelas dong. Demi kamu apa sih yang nggak.' },
      { speaker: 'DRAINE', text: '...bahkan teka-teki matematika tadi?' },
      { speaker: 'CHARLES', text: 'Itu mah gampang kalau motivasinya kamu.' },
      { speaker: 'DRAINE', text: 'Kalau gitu... akhirnya kamu nemuin aku.' }
    ],
    ch4MeetLine1: 'Kamu datang.',
    ch4MeetLine2: 'Kan sudah kubilang, aku pasti bakal nemuin kamu.',
    ch4MeetLine3: 'Kamu beneran nyelesaiin semuanya?',
    ch4MeetLine4: 'Jelas dong.',
    ch4MeetLine5: '...bahkan teka-teki matematika tadi?',
    ch4MeetLine6: 'Itu mah gampang kalau motivasinya kamu.',
    ch4MeetLine7: 'Kalau gitu... akhirnya kamu nemuin aku.',

    // Math Puzzle
    mathTitle: 'UJIAN PENJAGA GERBANG',
    mathSubtitle: 'Selesaikan perhitungan untuk membuka segel',
    mathPlaceholder: 'Jawaban',
    mathSubmit: 'Kirim',
    mathCheatHint: 'Gatau jawabannya? Ketik "charles ganteng"',
    mathCorrect: 'Benar!',
    mathWrong: 'Jawaban salah, coba lagi!',

    // Prison Puzzle
    prisonTitle: 'SEGEL TERAKHIR - THE SIX CIPHERS',
    prisonSubtitle: 'Pecahkan 6 sandi untuk mengungkap namanya',
    prisonPlaceholder: 'Jawaban',
    prisonSubmit: 'Buka Kunci',
    prisonCheatHint: 'Gatau jawabannya? Ketik "charles ganteng"',
    prisonRevealed: 'Kunci Jawaban',

    // Chapter transitions
    ch1Title: 'BAB I SELESAI',
    ch1Sub: 'PENCARIAN BERLANJUT...',
    ch2Title: 'BAB II SELESAI',
    ch2Sub: 'GERBANG MENUNGGU...',
    ch3Title: 'BAB III SELESAI',
    ch3Sub: 'PENJARA KATA...',
    ch4Title: 'AKHIRNYA MENEMUKANMU.',

    // Girl Day Ending
    gdDate: '01.10.2026',
    gdTitle: 'HAPPY GIRL DAY',
    gdFrom: 'Dari Charles.',
    gdBtnRead: 'Lanjut Baca &rarr;',
    gdLines: [
      '"Bisa aja sih aku cuma bilang Happy Girl\'s Day lewat chat."',
      '"Tapi mana serunya kalau cuma gitu?"',
      '"Makanya aku bikin kamu bertualang lewat taman, hutan, gerbang api, dan penjara kata..."',
      '"...cuma buat bilang satu hal."',
      'Happy Girl Day, Draine. ❤️'
    ],
    gdBtnRestart: 'MAIN LAGI DARI AWAL'
  },

  en: {
    // Opening
    charlesGreeting: "Hi. Kenalin, aku Charles.",
    typePlaceholder: 'Type "Hi Juga Charles"...',
    typeHint: 'Type "Hi Juga Charles" to reply',
    charlesResponse: "Nice to meet you! Before we start this adventure, please select your language:",
    langChoiceTitle: 'SELECT LANGUAGE',
    btnNext: 'START ADVENTURE &rarr;',
    btnNextShort: 'NEXT &rarr;',

    // Controls
    controlsHint: '<span class="hint-label">WASD</span> to Move',
    tapToContinue: 'Tap to continue',
    pressEOrTap: 'Tap or [E] &bull; Auto closes in 5s',

    // Prompts
    promptInspect: 'Inspect',
    promptTalk: 'Talk',
    promptOpenGate: 'Open Gate',
    promptTakeDrone: 'Take Buster Drone',
    promptInteract: 'Interact',
    promptReadNote: 'Read Note',
    promptExamineSeal: 'Examine Seal',

    // Objectives
    objCh1Initial: 'Find a way through the garden. (Take the Buster Drone!)',
    objCh1DroneTaken: 'Investigate the clues in the garden.',
    objCh1GateReady: 'Proceed through the garden gate.',
    objCh2Initial: "Follow Draine's trail in the forest.",
    objCh2CluesFound: 'The three clues must lead somewhere.',
    objCh2OpenHellGate: 'Open the Gates of Hell.',
    objCh3Initial: 'Meet the Gatekeeper of Fire.',
    objCh3Trial: "Pass the gatekeeper's trial.",
    objCh3GatePassed: 'Enter the Gates of Hell.',
    objCh4Initial: 'Search the prison for Draine.',
    objCh4FindDraine: 'Find Draine.',
    objCh4ExamineDoor: 'Examine the final door.',
    objCh4Found: 'Break the final seal to free Draine.',
    objCh4Sanctuary: 'Enter the Sanctuary.',

    // Dialogues
    ch1DroneText: [
      'A Buster Drone!',
      'It activates its thrusters and hovers above my right shoulder.',
      'Its wide, powerful searchlight will illuminate the dark paths ahead.'
    ],
    ch1Clue1: 'Draine was here.',
    ch1Clue2: 'She left something behind...',
    ch1Clue3: "A garden gate won't open without the three symbols.",
    ch1GateNoDrone: 'Wait, I must take the Buster Drone first. The path ahead will be pitch dark.',
    ch1GateLocked: 'The gate is locked.',
    ch1GateOpen: 'Something tells me Draine went this way.',

    ch2Narration: [
      'CHAPTER II — THE MISTY FOREST',
      'The forest is eerily quiet...',
      'Yet fresh footprints lead into the gloom.'
    ],
    ch2Campfire: ['Draine stayed here...', 'The fire is still warm.'],
    ch2Ribbon: ["This is Draine's...", 'She must have dropped it while running.'],
    ch2Marker: ['She left a mark.', 'But what does it mean?'],
    ch2Shrine: [
      'Draine came here.',
      "She wasn't trying to hide from me.",
      'She was trying to lead me somewhere.'
    ],
    ch2HellGateNarration: ['THE GATES OF HELL', 'Draine went through there.'],
    ch2GateOpening: [
      'The gate is opening...',
      'Something is waiting on the other side.'
    ],

    ch3Narration: [
      'CHAPTER III — THE GATES OF HELL',
      'The air turns searing and thick with ash.',
      'Someone stands sentinel before the infernal gate.'
    ],
    ch3GatekeeperGreeting: [
      'GATEKEEPER: Halt, Charles!',
      'Only those with sharp minds may pass through these flames.',
      'Answer these 3 numerical trials if you wish to rescue Draine.'
    ],
    ch3GatekeeperPass: ['…', 'You may pass.'],
    ch3CharlesHoldOn: ['Draine...', 'Hold on.'],

    ch4Narration: [
      'CHAPTER IV — THE PRISON',
      'She has to be here.'
    ],
    pClue1Text: [
      "This was Draine's...",
      'But where is she?'
    ],
    pClue2Text: [
      "She wasn't locked in.",
      'She was trying to get somewhere.'
    ],
    pNoteText: [
      'Charles.',
      "If you're reading this...",
      "I knew you'd follow me.",
      "Don't be afraid.",
      "I'm closer than you think.",
      'The final door is waiting.'
    ],
    pDoorOpen: 'The Sanctuary is open.',
    pDoorLocked: [
      'Something is missing.',
      'Maybe the answers were never just answers.'
    ],
    ch4DraineDialogue: [
      { speaker: 'DRAINE', text: 'You really solved all of that?' },
      { speaker: 'CHARLES', text: 'Obviously. Anything for you.' },
      { speaker: 'DRAINE', text: '...even the math puzzles?' },
      { speaker: 'CHARLES', text: 'That was the easy part when you are my goal.' },
      { speaker: 'DRAINE', text: 'Then you finally found me.' }
    ],
    ch4MeetLine1: 'You came.',
    ch4MeetLine2: "I told you I'd find you.",
    ch4MeetLine3: 'You really solved all of that?',
    ch4MeetLine4: 'Obviously.',
    ch4MeetLine5: '...even the math?',
    ch4MeetLine6: 'That was the easy part.',
    ch4MeetLine7: 'Then you finally found me.',

    // Math Puzzle
    mathTitle: "GATEKEEPER'S TRIAL",
    mathSubtitle: 'Solve numerical equations to break the seal',
    mathPlaceholder: 'Answer',
    mathSubmit: 'Confirm',
    mathCheatHint: 'Don\'t know the answer? Type "charles ganteng"',
    mathCorrect: 'Correct!',
    mathWrong: 'Incorrect answer, try again!',

    // Prison Puzzle
    prisonTitle: 'FINAL SEAL - THE SIX CIPHERS',
    prisonSubtitle: 'Decipher 6 letters to unlock her cage',
    prisonPlaceholder: 'Answer',
    prisonSubmit: 'Unlock',
    prisonCheatHint: 'Don\'t know the answer? Type "charles ganteng"',
    prisonRevealed: 'Answer Key',

    // Chapter transitions
    ch1Title: 'CHAPTER I COMPLETE',
    ch1Sub: 'THE SEARCH CONTINUES...',
    ch2Title: 'CHAPTER II COMPLETE',
    ch2Sub: 'THE GATES AWAIT...',
    ch3Title: 'CHAPTER III COMPLETE',
    ch3Sub: 'THE PRISON OF WORDS...',
    ch4Title: 'FOUND YOU.',

    // Girl Day Ending
    gdDate: '01.10.2026',
    gdTitle: 'HAPPY GIRL DAY',
    gdFrom: 'From Charles.',
    gdBtnRead: 'Continue &rarr;',
    gdLines: [
      '"I could\'ve just said Happy Girl Day."',
      '"But where\'s the fun in that?"',
      '"So I made you solve your way through a garden, a forest, hell, and a prison..."',
      '"...just so I could say one thing."',
      'Happy Girl Day, Draine. ❤️'
    ],
    gdBtnRestart: 'START OVER'
  }
};

export function setLanguage(lang) {
  if (lang === 'id' || lang === 'en') {
    currentLang = lang;
    window.currentLang = lang;
  }
}

export function getLanguage() {
  return currentLang;
}

export function t(key) {
  const dict = translations[currentLang] || translations.id;
  return dict[key] !== undefined ? dict[key] : (translations.id[key] || '');
}

export function getDict() {
  return translations[currentLang] || translations.id;
}
