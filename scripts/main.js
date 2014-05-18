var GameState = function(game){};

GameState.prototype.preload = function() {
  this.game.load.image('beat', 'images/beat.png');
  
  // Add all the drum def assets
  for (var key in DrumDefs) {
    if (DrumDefs.hasOwnProperty(key)) {
      var drumdef= DrumDefs[key];
      // Sounds
      for (var i = 0; i < drumdef.length; i++) {
        this.game.load.audio(drumdef.name(i),
                             drumdef.filenameAudio(i));
      }
      // Sprites
      this.game.load.image(drumdef.basename,
                           drumdef.filenameImage());
    }
  }
};

GameState.prototype.create = function() {
  this.game.stage.backgroundColor = 0x333333;
  
  this.timeLast = this.game.time.now;
  this.beats = this.game.add.group();
  this.drums = this.game.add.group();
  this.draggedDrum = null;
  // Load the level
  for (var y = 0; y < GRID_SIZE; y++) {
    var row = level1.cells[y];
    for (var x = 0; x < GRID_SIZE; x++) {
      var ch = row.charAt(x);
      if (ch !== "0") {
        var drumdef = level1[ch].drum;
        var beats = null;
        if (level1[ch].beat !== undefined) {
          var beatDirs = level1[ch].beat;
          beats = [];
          for (var i = 0; i < level1[ch].beat.length; i++) {
            var dir = level1[ch].beat[i];
            if (dir === "up") {
              beats.push({x: 0, y: -1});
            } else if (dir === "right") {
              beats.push({x: 1, y: 0});
            } else if (dir === "down") {
              beats.push({x: 0, y: 1});
            } else {
              beats.push({x: -1, y: 0});
            }
          }
        }
        this.drums.add(new Drum(this, {x:x, y:y}, drumdef, beats));
      }
    }
  }
  
  // FPS timer
  // Turn off in prod
  this.game.time.advancedTiming = true;
  this.fpsText = this.game.add.text(
    20, 20, '', { font: '16px Arial', fill: '#ffffff' }
  );
};

GameState.prototype.update = function() {
  var i;
  // Update FPS
  if (this.game.time.fps !== 0) {
    this.fpsText.setText(this.game.time.fps + ' FPS');
  }
  
  // Check input: drag drums around
  var getDrumAt = function(drums, grid) {
    for (i = 0; i < drums.length; i++) {
      var drum = drums.getAt(i);
      var drumGrid = p2g(drum);
      if (drumGrid.x == grid.x &&
          drumGrid.y == grid.y) {
        return drum;
      }
    }
    return null;
  };
  if (this.game.input.activePointer.isDown) {
    var mouseGrid = p2g(this.game.input);
    // Find the drum under the mouse
    if (this.draggedDrum === null) {
      this.draggedDrum = getDrumAt(this.drums, mouseGrid);
    }
    if (this.draggedDrum) {
      // Move drum around
      if (getDrumAt(this.drums, mouseGrid) === null) {
        var pixel = g2p(mouseGrid);
        this.draggedDrum.x = pixel.x;
        this.draggedDrum.y = pixel.y;
      }
    }
  } else {
    this.draggedDrum = null;
  }
  
  // Move the beat
  if (this.game.time.elapsedSince(this.timeLast) > MS_PER_MINIBEAT) {
    while (this.timeLast + MS_PER_MINIBEAT < this.game.time.now) {
      this.timeLast += MS_PER_MINIBEAT;
    }
    for (i = 0; i < this.drums.length; i++) {
      this.drums.getAt(i).updateBeat(this.timeLast);
    }
    for (i = 0; i < this.beats.length; i++) {
      this.beats.getAt(i).updateBeat();
    }
  }
  
  // Check collisions between beats and drums
  // Activate drums that collide with beats
  for (i = 0; i < this.drums.length; i++) {
    var drum = this.drums.getAt(i);
    var drumGrid = p2g(drum);
    for (var j = 0; j < this.beats.length; j++) {
      var beat = this.beats.getAt(j);
      var beatGrid = p2g(beat);
      if (drumGrid.x == beatGrid.x && drumGrid.y == beatGrid.y) {
        drum.hit = true;
        break;
      }
    }
  }
};

var game = new Phaser.Game(GRID_SIZE*PIXEL_SIZE, GRID_SIZE*PIXEL_SIZE, Phaser.AUTO, 'game');
game.state.add('game', GameState, true);
