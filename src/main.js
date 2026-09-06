import Phaser from 'phaser';
import { bindRollCall, showRollCallView } from './rollcall.js';
import WorldScene, { SCENE_SIZE } from './scenes/WorldScene.js';
import { fetchLeaderboards, recordHighScore } from './game/scoreboard.js';
import { renderLeaderboard } from './ui/leaderboard.js';

let game = null;
let currentProfile = null;

function endSession() {
  const scene = game?.scene.getScene('world');
  const summary = scene?.getSessionSummary();
  if (summary) {
    window.alert(`本次遊玩結果\n答對：${summary.correct} 題\n答錯：${summary.wrong} 題\n分數：${summary.score}`);
    if (currentProfile) {
      recordHighScore(currentProfile.id, currentProfile.name, summary.score).catch(() => {});
    }
  }
  if (game) {
    game.destroy(true);
    game = null;
  }
  currentProfile = null;
  showRollCallView();
}

document.getElementById('game-logout-btn').addEventListener('click', endSession);

bindRollCall({
  onStart(profile) {
    currentProfile = profile;
    document.getElementById('score-value').textContent = '0';

    if (game) {
      game.destroy(true);
      game = null;
    }

    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'phaser-container',
      width: SCENE_SIZE.width,
      height: SCENE_SIZE.height,
      backgroundColor: '#10131a',
      scene: [],
    });
    game.scene.add('world', WorldScene, true, profile);

    fetchLeaderboards().then(renderLeaderboard).catch(() => {});
  },
});
