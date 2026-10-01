import * as THREE from 'three';
import './style.css';
import { WorldScene } from './scene.js';
import { Player } from './player.js';
import { InputManager } from './input.js';
import { Garden } from './garden.js';
import { Forest } from './forest.js';
import { HellGate } from './hellgate.js';
import { Prison } from './prison.js';
import { DialogueManager } from './dialogue.js';
import { MathPuzzle } from './mathpuzzle.js';
import { PrisonPuzzle } from './prisonpuzzle.js';
import { GirlDayEnding } from './girlday.js';
import { BusterDrone } from './drone.js';
import { OpeningManager } from './opening.js';
import { setLanguage, getLanguage, t } from './i18n.js';
import { AudioManager } from './audio.js';

// 1. Initialize Three.js world
const container = document.getElementById('game-container');
const world = new WorldScene(container);

// 1b. Audio Manager — background music per chapter
const audioManager = new AudioManager();

// 2. Build all chapter environments
const garden = new Garden(world.scene);
const forest = new Forest(world.scene);
const hellgate = new HellGate(world.scene);
hellgate.setVisible(false);
const prison = new Prison(world.scene);
prison.setVisible(false);

// 3. Initialize Player (Charles - Ranger)
const player = new Player(world.scene);
const input = new InputManager();

// 3b. Buster Drone (Flying companion with wide searchlight)
const drone = new BusterDrone(world.scene);

// 4. Dialogue & Objective Manager
const dialogueManager = new DialogueManager();

// 4b. Opening Sequence Manager (Charles faces camera, greeting input & language choice)
const openingManager = new OpeningManager({
  world,
  player,
  onStartGame: (chosenLang) => {
    audioManager.playTrack('chapter1');
    dialogueManager.setObjective(t('objCh1Initial'));
    const controlsHintEl = document.getElementById('controls-hint');
    if (controlsHintEl) {
      controlsHintEl.innerHTML = t('controlsHint');
    }
  }
});

// 5. Math Puzzle for Chapter 3
const mathPuzzle = new MathPuzzle(() => {
  // All 3 answers correct — gatekeeper steps aside, gate opens
  onTrialComplete();
});

// 6. Final Mathematical Puzzle & Girl Day Ending for Chapter 4
const prisonPuzzle = new PrisonPuzzle(() => {
  onPrisonPuzzleComplete();
});

const girlDayEnding = new GirlDayEnding(() => {
  startChapter1(true);
});

// Make on-screen interaction prompt tappable on mobile/tablet
const promptEl = document.getElementById('interaction-prompt');
if (promptEl) {
  const triggerFromPrompt = (e) => {
    e.stopPropagation();
    // Don't trigger interact if any puzzle or opening is open
    if (mathPuzzle.isOpen || prisonPuzzle.isOpen || openingManager.isActive) return;
    input.interactPressed = true;
  };
  promptEl.addEventListener('click', triggerFromPrompt);
  promptEl.addEventListener('touchstart', triggerFromPrompt, { passive: true });
}

// Wire up chapter transition buttons
const btnCh1 = document.getElementById('btn-replay-ch1');
const btnCh2 = document.getElementById('btn-replay-ch2');
const btnCh3 = document.getElementById('btn-replay-ch3');
const btnCh4 = document.getElementById('btn-replay-ch4');
if (btnCh1) btnCh1.addEventListener('click', () => startChapter1(false));
if (btnCh2) btnCh2.addEventListener('click', () => startChapter2());
if (btnCh3) btnCh3.addEventListener('click', () => startChapter3());
if (btnCh4) btnCh4.addEventListener('click', () => startChapter4());

// Third-person camera configuration
const cameraOffset = new THREE.Vector3(0, 3.6, 5.8);
const lookTargetOffset = new THREE.Vector3(0, 1.15, 0);

// Game loop clock
const clock = new THREE.Clock();

// Chapter State Management
let currentChapter = window.location.search.includes('chapter=2') ? 2 : 1;
let chapter1Completed = false;
let chapter2Completed = false;

// Chapter 3 state
let ch3TrialStarted = false;       // Gatekeeper cinematic begun
let ch3TrialComplete = false;      // Math puzzle passed
let ch3GateReached = false;        // Player reached beyond the gate
let ch3Complete = false;

// Chapter 4 state
let ch4DraineMet = false;
let ch4EndingStarted = false;

// Initialize starting chapter
if (currentChapter === 1) {
  startChapter1(true);
} else if (currentChapter === 2) {
  startChapter2();
} else if (currentChapter === 4) {
  startChapter4();
} else {
  startChapter3();
}

// -------------------------------------------------------
function startChapter1(showOpening = false) {
  currentChapter = 1;
  chapter1Completed = false;

  garden.group.visible = true;
  forest.setVisible(false);
  hellgate.setVisible(false);
  prison.setVisible(false);
  world.setAtmosphere('garden');
  drone.reset();
  garden.droneCollected = false;

  player.position.set(0, 0, 4);

  if (showOpening) {
    audioManager.playTrack('opening');
    dialogueManager.hideObjective();
    dialogueManager.hideTransition();
    openingManager.start();
  } else {
    audioManager.playTrack('chapter1');
    player.group.rotation.y = Math.PI;
    player.targetRotation = Math.PI;
    world.camera.position.copy(player.position).add(cameraOffset);
    world.camera.lookAt(player.position.clone().add(lookTargetOffset));
    dialogueManager.setObjective(t('objCh1Initial'));
    dialogueManager.hideTransition();
  }
}

function startChapter2() {
  currentChapter = 2;
  chapter2Completed = false;

  garden.group.visible = false;
  forest.setVisible(true);
  hellgate.setVisible(false);
  prison.setVisible(false);
  world.setAtmosphere('forest');
  drone.collect(true);
  drone.setLightEnabled(true);

  audioManager.playTrack('chapter2');

  player.position.set(0, 0, 5);
  player.group.rotation.y = Math.PI;
  player.targetRotation = Math.PI;
  world.camera.position.copy(player.position).add(cameraOffset);
  world.camera.lookAt(player.position.clone().add(lookTargetOffset));

  dialogueManager.setObjective(t('objCh2Initial'));
  dialogueManager.hideTransition();

  dialogueManager.open({
    speaker: 'NARRATION',
    text: t('ch2Narration')
  });
}

function startChapter3() {
  currentChapter = 3;
  chapter2Completed = false;
  ch3TrialStarted = false;
  ch3TrialComplete = false;
  ch3GateReached = false;
  ch3Complete = false;

  garden.group.visible = false;
  forest.setVisible(false);
  hellgate.setVisible(true);
  prison.setVisible(false);
  world.setAtmosphere('hellgate');
  drone.collect(true);
  drone.setLightEnabled(true);

  audioManager.playTrack('chapter3');

  // Place Charles at the entrance of the hell gate area
  player.position.set(0, 0, 8);
  player.group.rotation.y = Math.PI;
  player.targetRotation = Math.PI;
  world.camera.position.copy(player.position).add(cameraOffset);
  world.camera.lookAt(player.position.clone().add(lookTargetOffset));

  dialogueManager.setObjective(t('objCh3Initial'));
  dialogueManager.hideTransition();
}

function startChapter4() {
  currentChapter = 4;
  chapter2Completed = false;
  ch3Complete = false;
  ch4DraineMet = false;
  ch4EndingStarted = false;

  garden.group.visible = false;
  forest.setVisible(false);
  hellgate.setVisible(false);
  prison.setVisible(true);
  world.setAtmosphere('prison');
  drone.collect(true);
  drone.setLightEnabled(true);

  audioManager.playTrack('chapter4');

  // Place Charles at the entrance of the prison corridor
  player.position.set(0, 0, 4.5);
  player.group.rotation.y = Math.PI;
  player.targetRotation = Math.PI;
  world.camera.position.copy(player.position).add(cameraOffset);
  world.camera.lookAt(player.position.clone().add(lookTargetOffset));

  dialogueManager.setObjective(t('objCh4Initial'));
  dialogueManager.hideTransition();

  dialogueManager.open({
    speaker: 'NARRATION',
    text: t('ch4Narration')
  });
}

// Dev shortcut: Press 1, 2, 3, 4 to jump between chapters
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Digit1') startChapter1(false);
  if (e.code === 'Digit2') startChapter2();
  if (e.code === 'Digit3') startChapter3();
  if (e.code === 'Digit4') startChapter4();
});

// -------------------------------------------------------
// GARDEN — Interactables
// -------------------------------------------------------
const gardenInteractables = [
  {
    id: 'drone',
    x: 3.2,
    z: -4.0,
    radius: 2.6,
    get prompt() { return t('promptTakeDrone'); },
    get text() { return t('ch1DroneText'); },
    onInteract: () => {
      drone.collect();
      garden.droneCollected = true;
      if (!garden.allCluesFound()) {
        dialogueManager.setObjective(t('objCh1DroneTaken'));
      } else {
        dialogueManager.setObjective(t('objCh1GateReady'));
      }
    }
  },
  {
    id: 'clue1',
    x: -4.2,
    z: -5.8,
    radius: 2.4,
    get prompt() { return t('promptInspect'); },
    get text() { return t('ch1Clue1'); },
    onInteract: () => {
      garden.clues.clue1 = true;
      if (garden.allCluesFound()) {
        dialogueManager.setObjective(t('objCh1GateReady'));
      }
    }
  },
  {
    id: 'clue2',
    x: 4.8,
    z: -13.5,
    radius: 2.4,
    get prompt() { return t('promptInspect'); },
    get text() { return t('ch1Clue2'); },
    onInteract: () => {
      garden.clues.clue2 = true;
      if (garden.allCluesFound()) {
        dialogueManager.setObjective(t('objCh1GateReady'));
      }
    }
  },
  {
    id: 'clue3',
    x: -3.8,
    z: -20.2,
    radius: 2.4,
    get prompt() { return t('promptInspect'); },
    get text() { return t('ch1Clue3'); },
    onInteract: () => {
      garden.clues.clue3 = true;
      if (garden.allCluesFound()) {
        dialogueManager.setObjective(t('objCh1GateReady'));
      }
    }
  },
  {
    id: 'gate',
    x: 0,
    z: -26.0,
    radius: 3.2,
    get prompt() { return t('promptOpenGate'); },
    getDialogue: () => {
      if (!garden.droneCollected) {
        return t('ch1GateNoDrone');
      }
      if (!garden.allCluesFound()) {
        return t('ch1GateLocked');
      } else {
        if (!garden.gateOpen) {
          garden.openGate();
          // Charles pushes the gate — try common attack/push clip names
          const pushClips = ['Attacking', 'Attack', 'Punch', 'Push', '1H_Melee_Attack_Slice_Diagonal'];
          const available = player.getActionNames();
          const pushClip = pushClips.find(n => available.includes(n))
            || available.find(n => /attack|punch|slash|push|swing/i.test(n));
          if (pushClip) {
            setTimeout(() => player.playOneShot(pushClip), 200);
          }
        }
        return t('ch1GateOpen');
      }
    }
  }
];

function checkForestCluesProgression() {
  if (forest.allCluesFound()) {
    dialogueManager.setObjective(t('objCh2CluesFound'));
  }
}

// -------------------------------------------------------
// Chapter 3 — Gatekeeper Trial callback
// -------------------------------------------------------
function onTrialComplete() {
  // Puzzle passed: gatekeeper steps aside and gate opens
  dialogueManager.open({
    speaker: 'GATEKEEPER',
    text: t('ch3GatekeeperPass'),
    onClosed: () => {
      hellgate.stepAside();
      setTimeout(() => {
        hellgate.openGate();
        dialogueManager.setObjective(t('objCh3GatePassed'));

        // Charles pushes the gate open — try common attack/push clip names
        const pushClips = ['Attacking', 'Attack', 'Punch', 'Push', '1H_Melee_Attack_Slice_Diagonal'];
        const available = player.getActionNames();
        console.log('[Chapter3] Available Ranger clips:', available);
        const pushClip = pushClips.find(name => available.includes(name))
          || available.find(n => /attack|punch|slash|push|swing/i.test(n));

        if (pushClip) {
          player.playOneShot(pushClip);
        }
      }, 1800);
    }
  });
  ch3TrialComplete = true;
}

// -------------------------------------------------------
// PRISON — Interactables (Chapter 4)
// -------------------------------------------------------
const prisonInteractables = [
  {
    id: 'p_clue1',
    x: -8.2,
    z: -13.0,
    radius: 3.2,
    get prompt() { return t('promptInspect'); },
    get text() { return t('pClue1Text'); },
    onInteract: () => {
      prison.clues.clue1 = true;
      dialogueManager.setObjective(t('objCh4FindDraine'));
    }
  },
  {
    id: 'p_clue2',
    x: 5.6,
    z: -18.2,
    radius: 3.0,
    get prompt() { return t('promptInspect'); },
    get text() { return t('pClue2Text'); },
    onInteract: () => {
      prison.clues.clue2 = true;
    }
  },
  {
    id: 'p_note',
    x: 0,
    z: -29.0,
    radius: 3.0,
    get prompt() { return t('promptReadNote'); },
    get text() { return t('pNoteText'); },
    onInteract: () => {
      prison.clues.note = true;
      dialogueManager.setObjective(t('objCh4ExamineDoor'));
    }
  },
  {
    id: 'p_door',
    x: 0,
    z: -35.8,
    radius: 3.2,
    get prompt() { return t('promptExamineSeal'); },
    getDialogue: () => {
      if (prison.doorOpen) {
        return t('pDoorOpen');
      }
      return t('pDoorLocked');
    },
    onInteract: () => {
      if (!prison.doorOpen && !prisonPuzzle.isCompleted) {
        setTimeout(() => {
          prisonPuzzle.open();
        }, 200);
      }
    }
  }
];

function onPrisonPuzzleComplete() {
  prison.openFinalDoor();
  dialogueManager.setObjective(getLanguage() === 'en' ? 'Enter the Sanctuary.' : 'Masuki Tempat Peristirahatan Terakhir.');

  const pushClips = ['Attacking', 'Attack', 'Punch', 'Push', '1H_Melee_Attack_Slice_Diagonal'];
  const available = player.getActionNames();
  const pushClip = pushClips.find(n => available.includes(n))
    || available.find(n => /attack|punch|slash|push|swing/i.test(n));
  if (pushClip) {
    player.playOneShot(pushClip);
  }
}

function triggerFinalCinematic() {
  ch4EndingStarted = true;
  dialogueManager.hidePrompt();

  dialogueManager.triggerChapterEnd({
    title: t('ch4Title'),
    subtitle: '',
    extraSubtitle: '',
    showActions: false
  });

  const cinemCamPos = new THREE.Vector3(0, 3.2, -41.0);
  const cinemTarget = new THREE.Vector3(0, 1.4, -47.0);

  let cinemElapsed = 0;
  const cinemInterval = setInterval(() => {
    cinemElapsed += 0.05;
    world.camera.position.lerp(cinemCamPos, 0.04);
    world.camera.lookAt(cinemTarget);
    if (cinemElapsed >= 3.0) {
      clearInterval(cinemInterval);
      dialogueManager.hideTransition();
      girlDayEnding.show();
    }
  }, 50);
}

// -------------------------------------------------------
// GAME LOOP
// -------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);

  // If opening cinematic is active, keep Charles facing camera and handle idle animation
  if (openingManager.isActive) {
    openingManager.update();
    if (player.isLoaded && player.mixer) {
      if (player.idleActionName) player.playAction(player.idleActionName);
      player.mixer.update(delta);
    }
    world.render();
    return;
  }

  // Block movement while math puzzle open, prison puzzle open, or transition playing
  const isTransitioning =
    (chapter1Completed && currentChapter === 1) ||
    (chapter2Completed && currentChapter === 2) ||
    (ch3Complete && currentChapter === 3) ||
    ch4EndingStarted;
  const blockMovement = isTransitioning || mathPuzzle.isOpen || prisonPuzzle.isOpen;
  const moveDirection = blockMovement ? { x: 0, z: 0 } : input.getMovementVector();
  player.update(delta, moveDirection);

  // ==========================================================
  // CHAPTER 1 (THE GARDEN)
  // ==========================================================
  if (currentChapter === 1) {
    if (!garden.gateOpen || player.position.z > -25.5) {
      player.position.x = Math.max(-7.8, Math.min(7.8, player.position.x));
    }
    if (!garden.gateOpen) {
      player.position.z = Math.max(-25.4, Math.min(5.4, player.position.z));
    } else {
      player.position.z = Math.max(-31.0, Math.min(5.4, player.position.z));
    }

    // Solid collisions for Chapter 1 interactable props & gate pillars
    // Radii are generous so player can never walk THROUGH any object
    const gardenObstacles = [
      { x: 3.2, z: -4.0, r: 1.25 },   // Drone pedestal
      { x: -4.2, z: -5.8, r: 1.2 },   // Clue 1 bench
      { x: 4.8, z: -13.5, r: 1.2 },   // Clue 2 stone
      { x: -3.8, z: -20.2, r: 1.2 },  // Clue 3 marker
      { x: -2.8, z: -26.0, r: 1.0 },  // Left gate post
      { x: 2.8, z: -26.0, r: 1.0 }    // Right gate post
    ];
    for (const obs of gardenObstacles) {
      const dist = Math.hypot(player.position.x - obs.x, player.position.z - obs.z);
      if (dist < obs.r) {
        const push = obs.r - dist;
        const nx = (player.position.x - obs.x) / (dist || 1);
        const nz = (player.position.z - obs.z) / (dist || 1);
        player.position.x += nx * push;
        player.position.z += nz * push;
      }
    }

    garden.update(delta);

    let nearbyItem = null;
    let minDist = Infinity;

    if (!chapter1Completed) {
      for (const item of gardenInteractables) {
        if (item.id === 'gate' && garden.gateOpen) continue;
        if (item.id === 'drone' && garden.droneCollected) continue;
        const dist = Math.hypot(player.position.x - item.x, player.position.z - item.z);
        if (dist <= item.radius && dist < minDist) {
          minDist = dist;
          nearbyItem = item;
        }
      }
    }

    if (nearbyItem) {
      if (!dialogueManager.isOpen) {
        dialogueManager.showPrompt(nearbyItem.prompt);
      }
    } else {
      dialogueManager.hidePrompt();
    }

    if (input.consumeInteract() && !chapter1Completed) {
      if (dialogueManager.isOpen) {
        dialogueManager.advanceOrClose();
      } else if (nearbyItem) {
        const dialogueText = nearbyItem.getDialogue
          ? nearbyItem.getDialogue()
          : nearbyItem.text;

        dialogueManager.open({
          speaker: 'CHARLES',
          text: dialogueText
        });

        if (nearbyItem.onInteract) {
          nearbyItem.onInteract();
        }
      }
    }

    // Chapter 1 End Trigger
    if (!chapter1Completed && garden.gateOpen && player.position.z < -27.6) {
      chapter1Completed = true;
      dialogueManager.triggerChapterEnd({
        title: t('ch1Title'),
        subtitle: t('ch1Sub'),
        onComplete: () => {
          startChapter2();
        }
      });
    }
  }

  // ==========================================================
  // CHAPTER 2 (THE LOST FOREST)
  // ==========================================================
  else if (currentChapter === 2) {
    forest.update(delta);

    // Adapt player height to forest terrain elevation so feet never clip/sink
    const groundElev = forest.getElevation(player.position.x, player.position.z);
    player.position.y += (groundElev - player.position.y) * Math.min(1, 14 * delta);

    // Boulders and logs collision
    const forestObstacles = [
      { x: -3.2, z: 2.5, r: 1.1 },
      { x: 3.5, z: -1.0, r: 1.15 },
      { x: -7.0, z: -7.0, r: 1.25 },
      { x: 8.5, z: -16.0, r: 1.35 },
      { x: -8.0, z: -28.0, r: 1.3 },
      { x: 6.5, z: -34.0, r: 1.25 },
      { x: -8.5, z: -8.2, r: 1.1 }
    ];
    for (const obs of forestObstacles) {
      const dist = Math.hypot(player.position.x - obs.x, player.position.z - obs.z);
      if (dist < obs.r) {
        const push = obs.r - dist;
        const nx = (player.position.x - obs.x) / (dist || 1);
        const nz = (player.position.z - obs.z) / (dist || 1);
        player.position.x += nx * push;
        player.position.z += nz * push;
      }
    }

    // Forest boundary containment
    if (player.position.z > -14) {
      player.position.x = Math.max(-10.5, Math.min(10.5, player.position.x));
      player.position.z = Math.min(6.2, player.position.z);
    } else if (player.position.z > -34) {
      player.position.x = Math.max(-11.5, Math.min(11.5, player.position.x));
    } else if (player.position.z > -44) {
      player.position.x = Math.max(-5.0, Math.min(9.0, player.position.x));
    } else {
      if (forest.shrineDiscovered) {
        player.position.x = Math.max(-4.5, Math.min(4.5, player.position.x));
        player.position.z = Math.max(-58.0, player.position.z);
      } else {
        player.position.z = Math.max(-42.0, player.position.z);
      }
    }

    // Clue and prop collisions in Chapter 2
    const clueObstacles = [
      { x: -8.5, z: -10.5, r: 1.4 },  // Campfire
      { x: 7.5, z: -18.0, r: 1.3 },   // Ribbon
      { x: -6.5, z: -27.0, r: 1.3 },  // Stone marker
      { x: 3.5, z: -37.0, r: 1.7 },   // Shrine
      { x: -3.2, z: -57.0, r: 1.3 },  // Gate pillar left
      { x: 3.2, z: -57.0, r: 1.3 }    // Gate pillar right
    ];
    for (const obs of clueObstacles) {
      const dist = Math.hypot(player.position.x - obs.x, player.position.z - obs.z);
      if (dist < obs.r) {
        const push = obs.r - dist;
        const nx = (player.position.x - obs.x) / (dist || 1);
        const nz = (player.position.z - obs.z) / (dist || 1);
        player.position.x += nx * push;
        player.position.z += nz * push;
      }
    }

    // Closed gate physical stop
    if (!forest.gateOpen && player.position.z < -55.8) {
      player.position.z = -55.8;
    }

    const distCampfire = Math.hypot(player.position.x - (-8.5), player.position.z - (-10.5));
    const distRibbon = Math.hypot(player.position.x - 7.5, player.position.z - (-18.0));
    const distMarker = Math.hypot(player.position.x - (-6.5), player.position.z - (-27.0));
    const distShrine = Math.hypot(player.position.x - 3.5, player.position.z - (-37.0));
    const distHellGate = Math.hypot(player.position.x - 0, player.position.z - (-56.5));

    let activeForestPrompt = null;
    let activeForestAction = null;

    if (!chapter2Completed) {
      if (distCampfire < 2.5 && !forest.clues.campfire) {
        activeForestPrompt = t('promptInspect');
        activeForestAction = () => {
          forest.clues.campfire = true;
          dialogueManager.open({
            speaker: 'CHARLES',
            text: t('ch2Campfire'),
            onClosed: () => checkForestCluesProgression()
          });
        };
      } else if (distRibbon < 2.4 && !forest.clues.ribbon) {
        activeForestPrompt = t('promptInspect');
        activeForestAction = () => {
          forest.clues.ribbon = true;
          dialogueManager.open({
            speaker: 'CHARLES',
            text: t('ch2Ribbon'),
            onClosed: () => checkForestCluesProgression()
          });
        };
      } else if (distMarker < 2.5 && !forest.clues.stoneMarker) {
        activeForestPrompt = t('promptInspect');
        activeForestAction = () => {
          forest.clues.stoneMarker = true;
          dialogueManager.open({
            speaker: 'CHARLES',
            text: t('ch2Marker'),
            onClosed: () => checkForestCluesProgression()
          });
        };
      } else if (distShrine < 3.2 && forest.allCluesFound() && !forest.shrineDiscovered) {
        activeForestPrompt = t('promptInspect');
        activeForestAction = () => {
          forest.shrineDiscovered = true;
          dialogueManager.open({
            speaker: 'CHARLES',
            text: t('ch2Shrine'),
            onClosed: () => {
              setTimeout(() => {
                dialogueManager.open({
                  speaker: 'NARRATION',
                  text: t('ch2HellGateNarration'),
                  onClosed: () => {
                    dialogueManager.setObjective(t('objCh2OpenHellGate'));
                  }
                });
              }, 300);
            }
          });
        };
      } else if (distHellGate < 4.2 && forest.shrineDiscovered && !forest.gateOpen) {
        activeForestPrompt = t('promptOpenGate');
        activeForestAction = () => {
          forest.openGate();
          forest.gateReached = true;
          forest.gateDialogShown = true; // Mark so the walk-through fallback doesn't double-fire

          // Charles pushes the gate open
          const pushClips = ['Attacking', 'Attack', 'Punch', 'Push', '1H_Melee_Attack_Slice_Diagonal'];
          const available = player.getActionNames();
          const pushClip = pushClips.find(n => available.includes(n))
            || available.find(n => /attack|punch|slash|push|swing/i.test(n));
          if (pushClip) {
            player.playOneShot(pushClip);
          }

          dialogueManager.open({
            speaker: 'CHARLES',
            text: t('ch2GateOpening'),
            onClosed: () => {
              chapter2Completed = true;
              dialogueManager.triggerChapterEnd({
                title: t('ch2Title'),
                subtitle: t('ch2Sub'),
                onComplete: () => {
                  startChapter3();
                }
              });
            }
          });
        };
      }
    }

    if (activeForestPrompt && !dialogueManager.isOpen) {
      dialogueManager.showPrompt(activeForestPrompt);
    } else if (!activeForestPrompt && !dialogueManager.isOpen) {
      dialogueManager.hidePrompt();
    }

    if (input.consumeInteract() && !chapter2Completed) {
      if (dialogueManager.isOpen) {
        dialogueManager.advanceOrClose();
      } else if (activeForestAction) {
        activeForestAction();
      }
    }

    // Walking through opened gate fallback (only if dialogue hasn't already taken over)
    if (
      !chapter2Completed &&
      forest.gateOpen &&
      !forest.gateDialogShown &&   // dialogue path hasn't fired yet
      player.position.z < -57.5 &&
      Math.abs(player.position.x) < 4.0
    ) {
      chapter2Completed = true;
      forest.gateDialogShown = true;
      dialogueManager.triggerChapterEnd({
        title: t('ch2Title'),
        subtitle: t('ch2Sub'),
        onComplete: () => {
          startChapter3();
        }
      });
    }
  }

  // ==========================================================
  // CHAPTER 3 (THE GATES OF HELL)
  // ==========================================================
  else if (currentChapter === 3) {
    hellgate.update(delta);

    // Boundary: keep Charles on path, allow passing through gate after trial
    player.position.x = Math.max(-6.5, Math.min(6.5, player.position.x));
    const minZ = (ch3TrialComplete && hellgate.steppedAside) ? -38.0 : -26.0;
    player.position.z = Math.max(minZ, Math.min(10.0, player.position.z));

    // Gatekeeper interaction distance
    // Gatekeeper is placed at z=-22 (world-relative) by hellgate.js
    const gatekeeperWorldZ = -22;
    const distToGatekeeper = Math.hypot(
      player.position.x,
      player.position.z - gatekeeperWorldZ
    );

    if (!ch3TrialStarted && !ch3TrialComplete && !ch3Complete) {
      if (distToGatekeeper < 4.0) {
        if (!dialogueManager.isOpen) {
          dialogueManager.showPrompt(t('promptTalk'));
        }
      } else {
        dialogueManager.hidePrompt();
      }

      // Trigger opening dialogue with Gatekeeper
      if (input.consumeInteract() && distToGatekeeper < 4.0) {
        ch3TrialStarted = true;
        dialogueManager.hidePrompt();
        dialogueManager.open({
          speaker: 'GATEKEEPER',
          text: t('ch3GatekeeperGreeting'),
          onClosed: () => {
            // Open the math puzzle immediately after dialogue
            setTimeout(() => {
              mathPuzzle.open();
            }, 200);
          }
        });
      }
    }

    // Once puzzle done and gatekeeper has stepped aside, let Charles walk through
    if (ch3TrialComplete && hellgate.steppedAside && !ch3GateReached && !ch3Complete) {
      if (player.position.z < -26.5) {
        ch3GateReached = true;
        ch3Complete = true;

        let ch3EndTriggered = false;
        const doChapter3End = () => {
          if (ch3EndTriggered) return;
          ch3EndTriggered = true;
          dialogueManager.triggerChapterEnd({
            title: t('ch3Title'),
            subtitle: t('ch3Sub'),
            extraSubtitle: '',
            onComplete: () => {
              startChapter4();
            }
          });
        };

        // If a dialogue is already open (e.g. mobile player walked through while
        // dialogue was showing), close it then transition
        if (dialogueManager.isOpen) {
          dialogueManager.advanceOrClose();
          setTimeout(doChapter3End, 600);
        } else {
          dialogueManager.open({
            speaker: 'CHARLES',
            text: t('ch3CharlesHoldOn'),
            onClosed: doChapter3End
          });
        }
        // Safety fallback: if onClosed somehow never fires on mobile, force it
        // after 5.5s (slightly longer than the 5s auto-dismiss)
        setTimeout(() => {
          if (currentChapter === 3) doChapter3End();
        }, 5500);
      }
    }

    // Consume any unused interact to avoid carry-over
    if (!ch3TrialStarted && distToGatekeeper >= 4.0) {
      input.consumeInteract();
    }
  }

  // ==========================================================
  // CHAPTER 4 (THE PRISON)
  // ==========================================================
  else if (currentChapter === 4) {
    prison.update(delta);

    // Collision boundaries (wide spacious hall)
    player.position.z = Math.min(10.0, player.position.z);

    if (player.position.z > -24.0) {
      // Prison corridor: width ~ 14m with cell alcoves
      if (player.position.z < -10.5 && player.position.z > -15.5) {
        // Open cell on the left (Draine's ribbon)
        player.position.x = Math.max(-9.8, Math.min(6.5, player.position.x));
      } else if (player.position.z < -16.0 && player.position.z > -20.5) {
        // Cell alcove on the right (Dropped cloth)
        player.position.x = Math.max(-6.5, Math.min(8.5, player.position.x));
      } else {
        // Main corridor
        player.position.x = Math.max(-6.5, Math.min(6.5, player.position.x));
      }
    } else if (player.position.z > -36.0) {
      // Central Chamber (x: -6.5 to 6.5)
      player.position.x = Math.max(-6.5, Math.min(6.5, player.position.x));

      // Collision with stone table under the note at (0, 0, -29.0)
      const tHalfW = 1.25;
      const tHalfD = 0.95;
      if (Math.abs(player.position.x) < tHalfW && Math.abs(player.position.z - (-29.0)) < tHalfD) {
        const dx = player.position.x;
        const dz = player.position.z - (-29.0);
        if (Math.abs(dx) / tHalfW > Math.abs(dz) / tHalfD) {
          player.position.x = Math.sign(dx || 1) * tHalfW;
        } else {
          player.position.z = -29.0 + Math.sign(dz || 1) * tHalfD;
        }
      }

      // Chamber pillars collision
      const pillars = [
        { x: -4.5, z: -26 }, { x: 4.5, z: -26 },
        { x: -4.5, z: -34 }, { x: 4.5, z: -34 }
      ];
      for (const p of pillars) {
        const dist = Math.hypot(player.position.x - p.x, player.position.z - p.z);
        if (dist < 0.9) {
          const push = 0.9 - dist;
          const nx = (player.position.x - p.x) / (dist || 1);
          const nz = (player.position.z - p.z) / (dist || 1);
          player.position.x += nx * push;
          player.position.z += nz * push;
        }
      }
    } else {
      // Door area & Sanctuary
      if (!prison.doorOpen) {
        player.position.z = Math.max(-35.4, player.position.z);
        player.position.x = Math.max(-3.0, Math.min(3.0, player.position.x));
      } else {
        // Sanctuary chamber (z down to -55.0)
        player.position.z = Math.max(-55.0, player.position.z);
        player.position.x = Math.max(-6.5, Math.min(6.5, player.position.x));
      }
    }

    // Proximity check for prison interactables
    let nearbyItem = null;
    let minDist = Infinity;

    if (!ch4DraineMet && !ch4EndingStarted) {
      for (const item of prisonInteractables) {
        if (item.id === 'p_door' && prison.doorOpen) continue;
        const dist = Math.hypot(player.position.x - item.x, player.position.z - item.z);
        if (dist <= item.radius && dist < minDist) {
          minDist = dist;
          nearbyItem = item;
        }
      }
    }

    if (nearbyItem) {
      if (!dialogueManager.isOpen && !prisonPuzzle.isOpen) {
        dialogueManager.showPrompt(nearbyItem.prompt);
      }
    } else if (!dialogueManager.isOpen) {
      dialogueManager.hidePrompt();
    }

    if (input.consumeInteract() && !ch4DraineMet && !ch4EndingStarted) {
      if (dialogueManager.isOpen) {
        dialogueManager.advanceOrClose();
      } else if (nearbyItem) {
        const dialogueText = nearbyItem.getDialogue
          ? nearbyItem.getDialogue()
          : nearbyItem.text;

        dialogueManager.open({
          speaker: 'CHARLES',
          text: dialogueText
        });

        if (nearbyItem.onInteract) {
          nearbyItem.onInteract();
        }
      }
    }

    // Meeting Draine in the sanctuary
    if (prison.doorOpen && !ch4DraineMet && !ch4EndingStarted) {
      const distDraine = Math.hypot(player.position.x - 0, player.position.z - (-47.0));
      if (distDraine < 3.2) {
        ch4DraineMet = true;
        dialogueManager.hidePrompt();
        dialogueManager.open({
          speaker: 'DRAINE',
          text: t('ch4MeetLine1'),
          onClosed: () => {
            dialogueManager.open({
              speaker: 'CHARLES',
              text: t('ch4MeetLine2'),
              onClosed: () => {
                dialogueManager.open({
                  speaker: 'DRAINE',
                  text: t('ch4MeetLine3'),
                  onClosed: () => {
                    dialogueManager.open({
                      speaker: 'CHARLES',
                      text: t('ch4MeetLine4'),
                      onClosed: () => {
                        dialogueManager.open({
                          speaker: 'DRAINE',
                          text: t('ch4MeetLine5'),
                          onClosed: () => {
                            dialogueManager.open({
                              speaker: 'CHARLES',
                              text: t('ch4MeetLine6'),
                              onClosed: () => {
                                dialogueManager.open({
                                  speaker: 'DRAINE',
                                  text: t('ch4MeetLine7'),
                                  onClosed: () => {
                                    triggerFinalCinematic();
                                  }
                                });
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    }
  }

  // ==========================================================
  // CAMERA — follows Charles with 360° touch/mouse orbit
  // ==========================================================
  const camDist = 5.8;
  const camHeight = 3.6 + (input.cameraPitch || 0) * 1.5;
  const camAngle = input.cameraAngle || 0;
  const targetCameraPos = new THREE.Vector3(
    player.position.x + Math.sin(camAngle) * camDist,
    player.position.y + camHeight,
    player.position.z + Math.cos(camAngle) * camDist
  );
  const cameraLerpSpeed = 1 - Math.exp(-9.0 * delta);
  world.camera.position.lerp(targetCameraPos, cameraLerpSpeed);

  const currentLookTarget = player.position.clone().add(lookTargetOffset);
  currentLookTarget.y += (input.cameraPitch || 0) * 0.4;
  world.camera.lookAt(currentLookTarget);

  // Keep directional light aligned with Charles
  if (world.dirLight) {
    world.dirLight.position.set(
      player.position.x + 16,
      22,
      player.position.z + 14
    );
    world.dirLight.target.position.copy(player.position);
    world.dirLight.target.updateMatrixWorld();
  }

  // Update Buster Drone companion (flies above/right of Charles, wide bright beam)
  const isMoving = Boolean(moveDirection.x || moveDirection.z);
  drone.update(delta, player.position, player.group.rotation.y, isMoving);

  world.render();
}

// Start loop
animate();
