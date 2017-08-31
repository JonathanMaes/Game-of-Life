var grid,
    s = 15,
    steps = 0,
    position = {x:0,y:0,zoom:1},
    updateRate = Infinity,
    lastCell = {x:0,y:0};
    conditions = {
      aliveLive:function(t) {
        return t===2||t===3;
      },
      deadLive:function(t) {
        return t===3;
      }
    },
    settings = {
      showCell:true,
      constrainZoom:true
    };


function setup() {
  let i = window.innerWidth-125;
  let j = window.innerHeight-78;
  canvas = createCanvas(i, j);
  canvas.parent("canvaswrapper");
  grid = new Grid(true, 20, 15);
  strokeWeight(2);
  noSmooth();
}

function draw() {
  push();
  scale(position.zoom);
  translate(position.x, position.y);
  translate(width/2/position.zoom, height/2/position.zoom);
  if (frameCount%updateRate===0) grid.update();
  grid.display(s);
  if (settings.showCell) {
    strokeWeight(2);
    stroke(51,100);
    fill(127,100);
    rect(getCellAtMouse().x*s, getCellAtMouse().y*s, s, s);
    //stroke(0,100);
    //point(getCellAtMouse().x*s+s/2, getCellAtMouse().y*s+s/2)
  }
  pop();
}

function Grid(randomize=true, w=10, h=10) {
  this.liveCells = [];
  this.updatingCells = [];
  if (randomize) {
    for (let x = -w; x < w; x++) {
      for (let y = -h; y < h; y++) {
        if (random(0, 10) < 1) {
          this.liveCells.push({x:x, y:y});
          for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
              let c = {x:x+i,y:y+j}
              if (!this.updatingCells.find(function(ele) {return ele.x===c.x&&ele.y===c.y})) {
                this.updatingCells.push(c);
              }
            }
          }
        }
      }
    }
  }
  this.update();
}

Grid.prototype.display = function(size) {
  background(0);
  fill(255);
  stroke(127);
  strokeWeight(2);
  for (let i = 0; i < this.liveCells.length; i++) {
    rect(this.liveCells[i].x*size, this.liveCells[i].y*size, size, size);
  }
}

Grid.prototype.update = function() {
  let newLiveCells = [];
  let newDeadCells = [];
  let newUpdatingCells = [];
  for (let a = 0; a < this.updatingCells.length; a++) {
    let cell = this.updatingCells[a];
    let lives = this.liveCells.find(function(ele) {return ele.x===cell.x && ele.y===cell.y})?true:false;
    let becomesAlive = this.willBeAlive(cell.x, cell.y);
    // Add to the new updating cells if the status of the cell changed
    if (becomesAlive && !lives || !becomesAlive && lives) {
      for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
          c = {x:cell.x+i, y:cell.y+j};
          // If it isn't already in there, push it to newUpdatingCells.
          if (!newUpdatingCells.find(function(ele) {return ele.x===c.x && ele.y===c.y})) {
            newUpdatingCells.push(c);
          }
        }
      }
    }
    // Add to the new living cells if it becomes alive, otherwise add it to the new dead cells
    if (becomesAlive && !lives) {
      newLiveCells.push(cell);
    } else if (!becomesAlive && lives) {
      newDeadCells.push(cell)
    }
  }
  // The cells that became alive get added to the live cells. 
  for (let i = 0; i<newLiveCells.length; i++) {
    this.liveCells.push({x:newLiveCells[i].x,y:newLiveCells[i].y})
  }
  // The cells that became dead get removed from the live cells.
  for (let i = 0; i<newDeadCells.length; i++) {
    this.liveCells.splice(this.liveCells.indexOf(this.liveCells.find(function(ele) {return ele.x===newDeadCells[i].x&&ele.y===newDeadCells[i].y})),1)
  }
  // The updatingcells get removed, and replaced by the new ones
  this.updatingCells = newUpdatingCells;
  steps++;
  updateStepsCounter();
}

Grid.prototype.willBeAlive = function(x, y) {
  let t = 0;
  for (let i = -1; i<2; i++) {
    for (let j = -1; j<2; j++) {
      if (i !== 0 || j !== 0) {
        if (this.liveCells.find(function(e) {return e.x===x+i&&e.y===y+j})) {
          t += 1;
        }
      }
    }
  }
  if (this.liveCells.find(function(e) {return e.x===x&&e.y===y})) {
    return conditions.aliveLive(t);
  } else {
    return conditions.deadLive(t);
  }
}

Grid.prototype.toggle = function(x, y) {
  if (this.liveCells.find(function(e) {return e.x===x&&e.y===y})) {
    this.liveCells.splice(this.liveCells.indexOf(this.liveCells.find(function(ele) {return ele.x===x&&ele.y===y})),1)
  } else {
    this.liveCells.push({x:x,y:y});
  }
  for (let i = -1; i<2; i++) {
    for (let j = -1; j<2; j++) {
      c = {x:x+i, y:y+j};
      if (!this.updatingCells.find(function(ele) {return ele.x===c.x && ele.y===c.y})) {
        this.updatingCells.push(c);
      }
    }
  }
}

function mouseDragged() {
  if (keyIsDown(32)) {
    let pos = getCellAtMouse();
    if (pos.x != lastCell.x || pos.y != lastCell.y) {
      grid.toggle(pos.x, pos.y);
    }
    lastCell = pos;
  } else {
    position.x += (mouseX - pmouseX)/position.zoom;
    position.y += (mouseY - pmouseY)/position.zoom;
  }
}

function mousePressed() {
  if (mouseX < width && mouseY < height && keyIsDown(32)) {
    let pos = getCellAtMouse();
    grid.toggle(pos.x, pos.y);
    lastCell = pos;
  }
  redraw();
}

function mouseWheel(e) {
  position.zoom*=e.delta>0?0.9:1.1;
  if (settings.constrainZoom) {
    position.zoom=constrain(position.zoom, 2/s, 5);
  }
  //grid.update();
}

function keyPressed() {
  if (keyCode===CONTROL) {
    nextSpeed();
  } else if (keyCode===BACKSPACE) {
    updateRate=Infinity;
  } else if (keyCode===85) {
    grid.update();
  }
}

function randomizeGrid() {
  grid = new Grid(true, 20, 15);
  grid.display(s);
  steps = 0;
  updateStepsCounter();
}

//
function clearGrid() {
  grid = new Grid(false);
  grid.display(s);
  steps = 0;
  updateStepsCounter();
  updateRate=Infinity;
}

function getCellAtMouse() {
  return {
    x:Math.floor((-position.x+(mouseX-width/2)/position.zoom)/s),
    y:Math.floor((-position.y+(mouseY-height/2)/position.zoom)/s)
  };
}

function updateStepsCounter() {
  document.getElementById('simulationStep').innerHTML = steps;
}

function nextSpeed() {
  updateRate = updateRate===1?Infinity:(updateRate===12?1:12);
}
