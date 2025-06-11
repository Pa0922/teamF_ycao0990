let allCircles = [];  // Array to store all apple circles
let lines = [];       // Array to store tree branch line segments
let generateBtn;      // Button to generate apple tree
let playBtn;          // Button to play/pause music
let sound;            // Sound object
let fft;              // Audio spectrum analyzer

function preload() {
  // Preload audio file
  sound = loadSound("/red_velvet_dumb_dumb.mp3");
}

function setup() {
  // Create 600x800 canvas
  createCanvas(600, 800);
  drawBackground();

  // Initialize tree branch line data
  lines = [
    {x1: 0, y1: -340, x2: 0, y2: 0}, // trunk (top to bottom)
    {x1: -120, y1: -250, x2: 130, y2: -250}, // main horizontal branch
    {x1: -135, y1: -430, x2: -120, y2: -250}, // left main branch
    {x1: 130, y1: -420, x2: 130, y2: -250}, // right main branch
    {x1: -54, y1: -340, x2: 54, y2: -340}, // upper horizontal branch
    {x1: -54, y1: -340, x2: -54, y2: -380}, // left small branch
    {x1: 54, y1: -340, x2: 54, y2: -370}, // right small branch
    {x1: -100, y1: 0, x2: 100, y2: 0}, // bottom base branch
    {x1: -220, y1: -410, x2: -135, y2: -430}, // far left branch
    {x1: 130, y1: -420, x2: 180, y2: -421}, // far right branch
    {x1: 180, y1: -421, x2: 190, y2: -520}, // top rightmost branch
    {x1: -220, y1: -410, x2: -220, y2: -440}, // top leftmost branch
  ];

  // Create UI buttons
  generateBtn = createButton('🌲 Generate Apple Tree 🍎');
  generateBtn.position(80, 700);
  generateBtn.mousePressed(drawApple); // Bind apple tree generation function
  styleButton(generateBtn);

  playBtn = createButton('▶️ Play/Pause Music');
  playBtn.position(350, 700);
  playBtn.mousePressed(toggleSound); // Bind music control function
  styleButton(playBtn);

  // Initialize audio FFT analyzer
  fft = new p5.FFT();
}

function styleButton(btn) {
  // Set button visual styles
  btn.style('background-color', '#FFB6B9');
  btn.style('color', '#ffffff');
  btn.style('font-size', '16px');
  btn.style('padding', '10px 20px');
  btn.style('border', 'none');
  btn.style('border-radius', '12px');
  btn.style('cursor', 'pointer');
  btn.style('box-shadow', '2px 2px 8px rgba(0, 0, 0, 0.2)');
  btn.style('transition', 'all 0.3s ease-in-out');
  btn.style('font-family', 'Helvetica, sans-serif');
  
  // Set hover effect
  btn.mouseOver(() => btn.style('background-color', '#ff9aa2'));
  btn.mouseOut(() => btn.style('background-color', '#FFB6B9'));
}

function drawBackground() {
  background(199, 244, 255); // 整体背景填充（外部）

  let bgX = 37;
  let bgY = 35;
  let bgW = 525;
  let bgH = 718;
  let pixelSize = 8;

  // 计算时间 t (0–1), 昼夜周期 60 秒
  let t = (millis() % 60000) / 60000;

  // 渐变背景颜色
  let colorStops = [
    color(255, 200, 150),  // 清晨
    color(199, 244, 255),  // 白天
    color(255, 150, 120),  // 傍晚
    color(20, 24, 82),     // 夜晚
    color(255, 200, 150)   // 清晨
  ];
  let index = floor(t * (colorStops.length - 1));
  let lerpT = (t * (colorStops.length - 1)) % 1;
  let bgTop = lerpColor(colorStops[index], colorStops[index + 1], lerpT);

  // 判断当前是否是夜晚
  let isNight = t > 0.65 || t < 0.15;

  // 像素风格背景绘制（渐变）
  for (let y = bgY; y < bgY + bgH; y += pixelSize) {
    for (let x = bgX; x < bgX + bgW; x += pixelSize) {
      let yRatio = (y - bgY) / bgH;
      let bgColor = lerpColor(bgTop, isNight ? color(20, 24, 82) : color(80, 120, 180), yRatio);
      noStroke();
      fill(bgColor);
      rect(x, y, pixelSize, pixelSize);
    }
  }

  // ☀️ Draw sun (像素风格太阳)
  if (!isNight) {
    let sunX = map(t, 0, 1, bgX, bgX + bgW);
    let sunY = bgY + 150 + sin(t * TWO_PI) * 50;
    sunX = floor(sunX / pixelSize) * pixelSize;
    sunY = floor(sunY / pixelSize) * pixelSize;

    fill(255, 204, 0);
    // 中心圆（3x3）
    for (let y = -1; y <= 1; y++) {
      for (let x = -1; x <= 1; x++) {
        rect(sunX + x * pixelSize, sunY + y * pixelSize, pixelSize, pixelSize);
      }
    }

    // 光线（8方向）
    for (let i = 0; i < 8; i++) {
      let angle = i * PI / 4;
      let dx = round(cos(angle)) * 2 * pixelSize;
      let dy = round(sin(angle)) * 2 * pixelSize;
      rect(sunX + dx, sunY + dy, pixelSize, pixelSize);
    }
  }

  // 🌙 Draw moon (像素风格弯月)
  if (isNight) {
    let moonX = map(t, 0, 1, bgX + bgW, bgX);
    let moonY = bgY + 150 + cos(t * TWO_PI) * 40;
    moonX = floor(moonX / pixelSize) * pixelSize;
    moonY = floor(moonY / pixelSize) * pixelSize;

    // 主体月亮形状
    fill(255, 230, 150);
    let moonPattern = [
      "00110",
      "01111",
      "11110",
      "01111",
      "00110"
    ];
    for (let y = 0; y < moonPattern.length; y++) {
      for (let x = 0; x < moonPattern[y].length; x++) {
        if (moonPattern[y][x] === '1') {
          rect(moonX + (x - 2) * pixelSize, moonY + (y - 2) * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    // 阴影遮挡，形成月牙
    fill(20, 24, 82);
    let maskPattern = [
      "00010",
      "00110",
      "01100",
      "00110",
      "00010"
    ];
    for (let y = 0; y < maskPattern.length; y++) {
      for (let x = 0; x < maskPattern[y].length; x++) {
        if (maskPattern[y][x] === '1') {
          rect(moonX + (x - 2) * pixelSize, moonY + (y - 2) * pixelSize, pixelSize, pixelSize);
        }
      }
    }
  }

  // ☁️ Draw clouds (white, pixel-style)
  if (!isNight) {
    let cloudY = bgY + 100;
    for (let i = 0; i < 2; i++) {
      let cloudX = (millis() / (1000 + i * 300)) % (bgW + 100) + bgX - 100;
      fill(255);
      noStroke();
      rect(floor(cloudX / pixelSize) * pixelSize, cloudY, pixelSize * 3, pixelSize);
      rect(floor((cloudX + 10) / pixelSize) * pixelSize, cloudY - pixelSize, pixelSize * 2, pixelSize);
    }
  }

  // ✨ Draw stars (if night)
  if (isNight) {
    randomSeed(99); // 固定星星分布
    for (let i = 0; i < 40; i++) {
      let starX = floor(random(bgX, bgX + bgW) / pixelSize) * pixelSize;
      let starY = floor(random(bgY, bgY + 300) / pixelSize) * pixelSize;
      let alpha = map(sin(millis() / 500 + i), -1, 1, 100, 255);
      fill(255, 255, 255, alpha);
      rect(starX, starY, pixelSize, pixelSize);
    }
  }

  // 🌱 地面 & 树底
  push();
  translate(width / 2, height / 2 + 200);
  fill('#65C18D');
  stroke('#373A7D');
  strokeWeight(2);
  rect(-262, 0, 523, 86);

  fill('#FFF28C');
  noStroke();
  rect(-115, 0, 225, 70);
  pop();
}

// Generate Apple Tree
function drawApple() {
  // Redraw background
  drawBackground();
  // Clear existing apple array
  allCircles = [];

  push();
  // Translate origin to lower center of canvas
  translate(width / 2, height / 2 + 200);
  
  // Generate apples on each line segment
  for (let lineSegment of lines) {
    drawCirclesOnLine(lineSegment.x1, lineSegment.y1, lineSegment.x2, lineSegment.y2, allCircles);
  }

  // Draw tree branch lines
  stroke(234, 204, 70);
  strokeWeight(2);
  for (let lineSegment of lines) {
    line(lineSegment.x1, lineSegment.y1, lineSegment.x2, lineSegment.y2);
  }
  pop();
}

// Generate Apple Circles on Lines
function drawCirclesOnLine(x1, y1, x2, y2, allCircles) {
  // Calculate line length and direction vector
  let len = dist(x1, y1, x2, y2);
  let dx = (x2 - x1) / len; // Unit vector in x direction
  let dy = (y2 - y1) / len; // Unit vector in y direction
  let pos = 0; // Current position on line

  // Generate apples along the line
  while (pos < len) {
    // Random radius for apple (15–40 pixels)
    let r = random(15, 40);
    // Compute apple center
    let cx = x1 + dx * (pos + r);
    let cy = y1 + dy * (pos + r);

    // Check if beyond line end
    if (pos + r * 2 > len) {
      let remaining = len - pos;
      r = remaining / 2; // Adjust radius to fit space
      if (r < 3) break; // Stop if too small
      cx = x1 + dx * (pos + r);
      cy = y1 + dy * (pos + r);
    }

    // Check overlap with existing apples
    let overlapping = false;
    for (let c of allCircles) {
      // If too close and not near intersection, mark as overlapping
      if (dist(cx, cy, c.x, c.y) < (r + c.r) * 0.8 && !isNearIntersection(cx, cy)) {
        overlapping = true;
        break;
      }
    }
    
    while(overlapping){ //This technique is from https://www.w3schools.com/js/js_loop_while.asp
      // decrease circle radius
      r = r * 0.9; // decrease radius by 10%
      
      // if radius is too small, stop adding circles
      if (r < 20) {
        overlapping = false;
        break;
      }
      
      // calculate new position of the circle
      cx = x1 + dx * (pos + r);
      cy = y1 + dy * (pos + r);
      
      // check if the circle overlaps
      overlapping = false;
      for (let existingCircle of allCircles) {
        let distance = dist(cx, cy, existingCircle.x, existingCircle.y);
        let minDistance = r + existingCircle.r;
        
        // if too close and not at intersection, mark as overlapping
        if (distance < minDistance * 0.9) {
          // check if it is near an intersection
          let isIntersection = isNearIntersection(cx, cy);
          if (!isIntersection) {
            overlapping = true;
            break;
          }
        }
      }
      // update overlapping
    }

    // If not overlapping, create new apple
    if (!overlapping) {
      // Compute angle of the line
      let angle = atan2(dy, dx);
      // Randomize color order
      let isRedFirst = random() > 0.5;
      let color1 = isRedFirst ? [232, 80, 78] : [120, 161, 100]; // red or green
      let color2 = isRedFirst ? [120, 161, 100] : [232, 80, 78]; // opposite

      // Add to apple array
      allCircles.push({x: cx, y: cy, r: r, angle: angle, color1, color2});
    }

    // Move to next position (minus 2px for denser packing)
    pos += r * 2 - 2;
  }
}

// Check Proximity to Intersections
function isNearIntersection(x, y) {
  let threshold = 10; // Distance threshold for intersections
  
  // Define all key intersection coordinates
  let intersections = [
    // Key intersection points based on tree structure
    {x: 0, y: 0},          // line 1 & 8 (bottom center)
    {x: 0, y: -340},       // line 1 & 5 (top of trunk)
    {x: -120, y: -250},    // line 2 & 3 (left main branch)
    {x: 130, y: -250},     // line 2 & 4 (right main branch)
    {x: -54, y: -340},     // line 5 & 6 (left small branch)
    {x: 54, y: -340},      // line 5 & 7 (right small branch)
    {x: -135, y: -430},    // line 3 & 9 (upper left)
    {x: 130, y: -420},     // line 4 & 10 (upper right)
    {x: 180, y: -421},     // line 10 & 11 (far right)
    {x: -220, y: -410},    // line 9 & 12 (far left)
    
    // Important line endpoints
    {x: -54, y: -380},     // line 6 endpoint
    {x: 54, y: -370},      // line 7 endpoint
    {x: 190, y: -520},     // line 11 endpoint
    {x: -220, y: -440},    // line 12 endpoint
    {x: -100, y: 0},       // line 8 left endpoint
    {x: 100, y: 0}         // line 8 right endpoint
  ];
  
  // Check if point is within threshold of any intersection
  for (let p of intersections) {
    if (dist(x, y, p.x, p.y) < threshold) return true;
  }
  return false;
}

// Music Control
function toggleSound() {
  // Toggle play/pause
  if (sound.isPlaying()) {
    sound.pause(); // Pause if playing
  } else {
    sound.loop(); // Loop if paused
  }
}

function draw() {
  // Redraw background
  drawBackground();

  // Get low frequency audio energy for color effect
  let spectrum = fft.analyze(); // Analyze audio spectrum
  let lowEnergy = fft.getEnergy(20, 200); // Get 20–200Hz energy
  let t = map(lowEnergy, 0, 255, 0, 1); // Map energy to 0–1

  push();
  translate(width / 2, height / 2 + 200);
  noStroke();
  
  // Draw all apples with music-reactive color
  for (let c of allCircles) {
    // Create color interpolation
    let from1 = color(...c.color1);
    let to1 = color(...c.color2);
    let lerped1 = lerpColor(from1, to1, t); // Interpolate based on energy

    let from2 = color(...c.color2);
    let to2 = color(...c.color1);
    let lerped2 = lerpColor(from2, to2, t);

    // Draw two half-arcs for each apple
    fill(lerped1);
    arc(c.x, c.y, c.r * 2, c.r * 2, c.angle, c.angle + PI); // first half

    fill(lerped2);
    arc(c.x, c.y, c.r * 2, c.r * 2, c.angle + PI, c.angle + TWO_PI); // second half
  }

  // Draw tree branch lines
  stroke(234, 204, 70);
  strokeWeight(2);
  for (let lineSegment of lines) {
    line(lineSegment.x1, lineSegment.y1, lineSegment.x2, lineSegment.y2);
  }
  pop();
}
 
 