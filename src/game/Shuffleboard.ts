import { Container, Sprite, Graphics, Text, Assets, Texture } from "pixi.js";
import { engine } from "../app/getEngine";
import { stakeAPI } from "./stakeAPI";

export class Shuffleboard extends Container {
  private puck?: Sprite;
  private puck2?: Sprite;
  private currentPuckIndex: number = 0; // 0 for puck.png, 1 for puck2.png
  private activePucks: Sprite[] = []; // Track active pucks
  private boardContainer: Container;
  private board?: Container;  // Changed from Sprite to Container
  private playbar?: Container;  // Changed from Sprite to Container
  private autoButton?: Container;  // Auto button container
  private winModal?: Container;  // Win display modal
  private winAmountText?: Text;  // Reference to win amount text
  private multiplierText?: Text;  // Reference to multiplier text
  private welcomeTitleText?: Text;  // Reference to welcome title text
  private welcomeInstructionText?: Text;  // Reference to welcome instruction text
  private welcomeStatsText?: Text;  // Reference to welcome stats text
  private winTitleText?: Text;  // Reference to "LAST WIN" title text
  private boardBorder?: Graphics;
  private isAutoMode: boolean = false;
  private autoInterval?: number;
  private lastWinAmount: number = 0;
  private lastWinMultiplier: number = 0;
  private keyboardHandler?: (event: KeyboardEvent) => void;
  private gameScreenRef?: any; // Reference to GameScreen for bet controls

  constructor() {
    super();
    this.boardContainer = new Container();
    this.addChild(this.boardContainer);
  }

  public async init() {
    try {
      console.log("Shuffleboard: Starting initialization");
      // Use the new UI assets instead of drawing with graphics
      this.createGameTitle(); // Add game title first
      this.createBoard();
      await this.createPuck(); // Create puck first so it's behind the playbar (now async)
      this.createWinModal(); // Add win modal
      this.createPlaybar();
      this.createAutoButton(); // Create auto button
      this.createCombinedBorder();
      this.setupKeyboardControls(); // Add keyboard controls
      console.log("Shuffleboard: Initialization completed successfully");
    } catch (error) {
      console.error("Shuffleboard: Error during initialization:", error);
      throw error;
    }
  }

  private createBoard() {
    try {
      console.log("Shuffleboard: Creating board with colored graphics");

      // Define the multiplier values and their corresponding colors (red to blue gradient)
      const multiplierZones = [
        { value: "DROP", color: 0x000000 }, // Black drop-off zone at top
        { value: 1000, color: 0xFF0000 }, // Red (highest)
        { value: 0, color: 0x0000FF },    // Blue (no score) between 1000 and 500
        { value: 500, color: 0xFF4500 },  // Red-Orange
        { value: 100, color: 0xFF8C00 },  // Dark Orange
        { value: 25, color: 0xFFA500 },   // Orange
        { value: 10, color: 0xFFD700 },   // Gold
        { value: 5, color: 0xFFFF00 },    // Yellow
        { value: 1, color: 0x9AFF9A },    // Light Green
        { value: 0, color: 0x0000FF },    // Blue (no score)
        { value: 0, color: 0x0000FF },    // Blue (no score)
        { value: 0, color: 0x0000FF }     // Blue (no score)
      ];

      // Create container for the board
      this.board = new Container();
      this.board.x = 0;
      this.board.y = 50; // Move board halfway back down for smaller gap with drop zone

      const tileWidth = 450;   // Width of each zone (reduced by 1/3: 675 * 2/3)
      const tileHeight = 60;   // Height of each zone (2/3 height: 90 * 2/3)
      const boardHeight = tileHeight * multiplierZones.length;

      // Create each zone as a colored rectangle with text
      for (let i = 0; i < multiplierZones.length; i++) {
        const zone = multiplierZones[i];

        // Create the colored rectangle background
        const rect = new Graphics();
        rect.rect(-tileWidth / 2, -tileHeight / 2, tileWidth, tileHeight);
        rect.fill(zone.color);
        rect.stroke({ color: 0x000000, width: 2 }); // Black border

        // Position the rectangle
        rect.x = 0;
        rect.y = i * tileHeight - (boardHeight / 2) + (tileHeight / 2);

        // Create text label for the multiplier value
        const displayText = zone.value === "DROP" ? "💀 DROP OFF ZONE 💀" : zone.value.toString() + "x";
        const text = new Text(displayText, {
          fontSize: zone.value === "DROP" ? 24 : 36, // Smaller font for longer DROP text
          fontWeight: 'bold',
          fill: zone.value === "DROP" ? 0xFFFFFF : (zone.value === 0 ? 0xFFFFFF : 0x000000), // White text for DROP and blue 0x zones
          align: 'center'
        });
        text.anchor.set(0.5);
        text.x = rect.x;
        text.y = rect.y;

        this.board.addChild(rect);
        this.board.addChild(text);
      }

      this.boardContainer.addChild(this.board);
      console.log("Shuffleboard: Board created with colored graphics, dimensions:", {
        width: tileWidth,
        height: boardHeight,
        zoneCount: multiplierZones.length
      });
    } catch (error) {
      console.error("Shuffleboard: Error creating board:", error);
    }
  }

  private createGameTitle() {
    try {
      console.log("Shuffleboard: Creating game title");

      // Create container for the title words
      const titleContainer = new Container();

      // Split title into words and create each on its own row
      const words = ["MULTIPLIER", "SHUFFLE"];
      const wordSpacing = 80; // Vertical spacing between words

      words.forEach((word, index) => {
        // Create the word text
        const wordText = new Text(word, {
          fontSize: 48, // Smaller font size for side placement
          fontWeight: 'bold',
          fill: 0x87CEEB, // Baby blue color
          align: 'left',
          fontFamily: 'Arial, sans-serif'
        });

        wordText.anchor.set(0, 0.5); // Left-aligned, center vertically
        wordText.x = 0;
        wordText.y = index * wordSpacing - (wordSpacing / 2); // Center the group vertically

        // Create shadow for each word
        const wordShadow = new Text(word, {
          fontSize: 48,
          fontWeight: 'bold',
          fill: 0x000000, // Black shadow
          align: 'left',
          fontFamily: 'Arial, sans-serif'
        });

        wordShadow.anchor.set(0, 0.5);
        wordShadow.x = 2; // Slightly offset for shadow effect
        wordShadow.y = (index * wordSpacing - (wordSpacing / 2)) + 2; // Slightly offset for shadow effect
        wordShadow.alpha = 0.3; // Make shadow semi-transparent

        // Add shadow first, then word (so word appears on top)
        titleContainer.addChild(wordShadow);
        titleContainer.addChild(wordText);
      });

      // Position title container on the left side
      titleContainer.x = -400; // Left side position (will be adjusted in resize)
      titleContainer.y = -200; // Upper area

      this.boardContainer.addChild(titleContainer);

      console.log("Shuffleboard: Game title created on left side at:", { x: titleContainer.x, y: titleContainer.y });
    } catch (error) {
      console.error("Shuffleboard: Error creating game title:", error);
    }
  }

  private createWinModal() {
    try {
      console.log("Shuffleboard: Creating win modal");

      // Create win modal container
      this.winModal = new Container();

      // Modal background with rounded rectangle - make it wider for more content
      const modalBg = new Graphics();
      const modalWidth = 350;
      const modalHeight = 160;
      modalBg.roundRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 15);
      modalBg.fill({ color: 0x000000, alpha: 0.8 }); // Semi-transparent black background
      modalBg.stroke({ color: 0x87CEEB, width: 3 }); // Baby blue border

      // Title text - show loading message initially
      this.welcomeTitleText = new Text("WELCOME TO MULTIPLIER SHUFFLE", {
        fontSize: 18,
        fontWeight: 'bold',
        fill: 0x87CEEB, // Baby blue color
        align: 'center',
        fontFamily: 'Arial, sans-serif'
      });
      this.welcomeTitleText.anchor.set(0.5);
      this.welcomeTitleText.x = 0;
      this.welcomeTitleText.y = -55;

      // Loading instruction
      this.welcomeInstructionText = new Text("Click LAUNCH to send puck\nto multiplier heaven!", {
        fontSize: 16,
        fill: 0xFFFFFF, // White color
        align: 'center',
        fontFamily: 'Arial, sans-serif'
      });
      this.welcomeInstructionText.anchor.set(0.5);
      this.welcomeInstructionText.x = 0;
      this.welcomeInstructionText.y = -20;

      // Game stats
      this.welcomeStatsText = new Text("Max Win: 1000X  •  RTP: 98%", {
        fontSize: 14,
        fontWeight: 'bold',
        fill: 0x87CEEB, // Baby blue color
        align: 'center',
        fontFamily: 'Arial, sans-serif'
      });
      this.welcomeStatsText.anchor.set(0.5);
      this.welcomeStatsText.x = 0;
      this.welcomeStatsText.y = 15;

      // Win amount text (initially hidden)
      this.winAmountText = new Text(`$${this.lastWinAmount.toFixed(2)}`, {
        fontSize: 28,
        fontWeight: 'bold',
        fill: 0x87CEEB, // Baby blue color
        align: 'center',
        fontFamily: 'Arial, sans-serif'
      });
      this.winAmountText.anchor.set(0.5);
      this.winAmountText.x = 0;
      this.winAmountText.y = -10;
      this.winAmountText.visible = false; // Hidden initially

      // Multiplier text (initially hidden)
      this.multiplierText = new Text(`${this.lastWinMultiplier}x`, {
        fontSize: 22,
        fontWeight: 'bold',
        fill: 0x87CEEB, // Baby blue color
        align: 'center',
        fontFamily: 'Arial, sans-serif'
      });
      this.multiplierText.anchor.set(0.5);
      this.multiplierText.x = 0;
      this.multiplierText.y = 25;
      this.multiplierText.visible = false; // Hidden initially

      // Add all elements to modal container
      this.winModal.addChild(modalBg);
      this.winModal.addChild(this.welcomeTitleText);
      this.winModal.addChild(this.welcomeInstructionText);
      this.winModal.addChild(this.welcomeStatsText);
      this.winModal.addChild(this.winAmountText);
      this.winModal.addChild(this.multiplierText);

      // Position at top of board (will be repositioned in resize)
      this.winModal.x = 0; // Center horizontally with board
      this.winModal.y = -400; // Move higher up from board area

      this.boardContainer.addChild(this.winModal);

      console.log("Shuffleboard: Win modal created at top of board:", { x: this.winModal.x, y: this.winModal.y });
    } catch (error) {
      console.error("Shuffleboard: Error creating win modal:", error);
    }
  }

  private createPlaybar() {
    // Create a custom button instead of using playbar.png sprite
    const buttonWidth = 200;
    const buttonHeight = 60;

    // Create button container
    const buttonContainer = new Container();
    // Initial position - will be updated in resize
    buttonContainer.x = 400;
    buttonContainer.y = 200;

    // Create button background
    const button = new Graphics();
    button.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
    button.fill({ color: 0x4CAF50 }); // Green background
    button.stroke({ color: 0xFFFFFF, width: 2 }); // White border

    // Create button text
    const buttonText = new Text("LAUNCH", {
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xFFFFFF, // White text
      align: 'center'
    });
    buttonText.anchor.set(0.5);
    buttonText.x = 0;
    buttonText.y = 0;

    // Add elements to button container
    buttonContainer.addChild(button);
    buttonContainer.addChild(buttonText);

    // Make button interactive
    buttonContainer.interactive = true;
    buttonContainer.cursor = "pointer";

    // Add click handler to launch the puck
    buttonContainer.on("pointerdown", () => {
      // Only allow manual launch if auto mode is off
      if (!this.isAutoMode) {
        this.launchPuck();
      }
    });

    // Add hover effects
    buttonContainer.on("pointerover", () => {
      button.clear();
      button.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
      button.fill({ color: 0x45A049 }); // Darker green on hover
      button.stroke({ color: 0x00AFF0, width: 3 }); // Blue border on hover
    });

    buttonContainer.on("pointerout", () => {
      button.clear();
      button.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
      button.fill({ color: 0x4CAF50 }); // Normal green
      button.stroke({ color: 0xFFFFFF, width: 2 }); // White border normally
    });

    // Store reference as playbar for compatibility
    this.playbar = buttonContainer;
    this.boardContainer.addChild(buttonContainer);

    console.log("Shuffleboard: Custom launch button created at:", { x: buttonContainer.x, y: buttonContainer.y });
  }

  private createAutoButton() {
    // Create auto button similar to launch button but smaller
    const buttonWidth = 160;
    const buttonHeight = 50;

    // Create button container
    const autoButtonContainer = new Container();
    // Initial position - will be updated in resize (positioned below launch button)
    autoButtonContainer.x = 500;
    autoButtonContainer.y = 280; // Below the launch button

    // Create button background
    const button = new Graphics();
    button.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
    button.fill({ color: this.isAutoMode ? 0xFF6B35 : 0x2196F3 }); // Orange when active, blue when inactive
    button.stroke({ color: 0xFFFFFF, width: 2 }); // White border

    // Create button text
    const buttonText = new Text(this.isAutoMode ? "AUTO ON" : "AUTO OFF", {
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xFFFFFF, // White text
      align: 'center'
    });
    buttonText.anchor.set(0.5);
    buttonText.x = 0;
    buttonText.y = 0;

    // Add elements to button container
    autoButtonContainer.addChild(button);
    autoButtonContainer.addChild(buttonText);

    // Make button interactive
    autoButtonContainer.interactive = true;
    autoButtonContainer.cursor = "pointer";

    // Add click handler to toggle auto mode
    autoButtonContainer.on("pointerdown", () => {
      this.toggleAutoMode(button, buttonText);
    });

    // Add hover effects
    autoButtonContainer.on("pointerover", () => {
      button.clear();
      button.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      button.fill({ color: this.isAutoMode ? 0xFF8C69 : 0x42A5F5 }); // Lighter shade on hover
      button.stroke({ color: 0x00AFF0, width: 3 }); // Blue border on hover
    });

    autoButtonContainer.on("pointerout", () => {
      button.clear();
      button.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      button.fill({ color: this.isAutoMode ? 0xFF6B35 : 0x2196F3 }); // Normal color
      button.stroke({ color: 0xFFFFFF, width: 2 }); // White border normally
    });

    // Store reference
    this.autoButton = autoButtonContainer;
    this.boardContainer.addChild(autoButtonContainer);

    console.log("Shuffleboard: Auto button created at:", { x: autoButtonContainer.x, y: autoButtonContainer.y });
  }

  private async createPuck() {
    // Create white circular launch pad first - make it bigger than the puck
    const launchPad = new Graphics();
    launchPad.circle(0, 0, 30); // Circle with 30px radius (bigger than puck)
    launchPad.fill({ color: 0xFFFFFF }); // White color
    launchPad.stroke({ color: 0x000000, width: 2 }); // Black border
    launchPad.x = 0; // Center on the board
    launchPad.y = 443; // Position for launch pad (438 + 5px)
    this.boardContainer.addChild(launchPad);

    try {
      // Load puck textures using Assets API
      console.log("Loading puck textures...");

      const puckTexture = await Assets.load('/puck.png');
      const puck2Texture = await Assets.load('/puck2.png');

      console.log("Textures loaded successfully");

      // Create first puck with loaded texture
      this.puck = new Sprite(puckTexture);
      this.puck.anchor.set(0.5);
      this.puck.scale.set(0.8);
      this.puck.x = 0;
      this.puck.y = 443;
      this.boardContainer.addChild(this.puck);
      console.log("Puck 1 created successfully");

      // Create second puck with loaded texture
      this.puck2 = new Sprite(puck2Texture);
      this.puck2.anchor.set(0.5);
      this.puck2.scale.set(0.8);
      this.puck2.x = 0;
      this.puck2.y = 443;
      this.puck2.visible = false; // Hide initially
      this.boardContainer.addChild(this.puck2);
      console.log("Puck 2 created successfully");

    } catch (error) {
      console.error("Error loading puck textures:", error);
      console.log("Creating fallback colored circles...");

      // Create fallback red circle for puck 1
      const fallbackPuck = new Graphics();
      fallbackPuck.circle(0, 0, 15);
      fallbackPuck.fill({ color: 0xFF0000 });
      fallbackPuck.x = 0;
      fallbackPuck.y = 443;
      this.boardContainer.addChild(fallbackPuck);
      this.puck = fallbackPuck as any;

      // Create fallback blue circle for puck 2
      const fallbackPuck2 = new Graphics();
      fallbackPuck2.circle(0, 0, 15);
      fallbackPuck2.fill({ color: 0x0000FF });
      fallbackPuck2.x = 0;
      fallbackPuck2.y = 443;
      fallbackPuck2.visible = false;
      this.boardContainer.addChild(fallbackPuck2);
      this.puck2 = fallbackPuck2 as any;

      console.log("Fallback pucks created (red and blue circles)");
    }

    // Initialize active pucks array
    this.activePucks = [];

    console.log("Shuffleboard: Both pucks created with alternating system");
  }

  private createCombinedBorder() {
    // Create borders around the game area - move down by 2/3 of drop zone height (40px)
    const boardHeight = 720; // Increased height for 12 zones (12 zones * 60px each)
    const borderWidth = 470; // Width to contain the 450px wide zones with padding
    const borderHeight = boardHeight + 80; // Increased padding for board height
    const borderX = -borderWidth / 2; // Center the border
    const borderY = -borderHeight / 2 + 90; // Shift down by 90px (50px + 40px for 2/3 drop zone height)

    // Inner border (white border around game)
    this.boardBorder = new Graphics();
    this.boardBorder.rect(borderX, borderY, borderWidth, borderHeight);
    this.boardBorder.stroke({ color: 0xFFFFFF, width: 2 });
    this.boardContainer.addChild(this.boardBorder);

    // Outer border (decorative grey border)
    const outerBorder = new Graphics();
    const outerPadding = 15;
    outerBorder.rect(borderX - outerPadding, borderY - outerPadding, borderWidth + (outerPadding * 2), borderHeight + (outerPadding * 2));
    outerBorder.stroke({ color: 0x888888, width: 3 }); // Grey outer border
    this.boardContainer.addChild(outerBorder);

    // Add hover effect for the border when button is hovered
    if (this.playbar) {
      this.playbar.on("pointerover", () => {
        if (this.boardBorder) {
          this.boardBorder.clear();
          this.boardBorder.rect(borderX, borderY, borderWidth, borderHeight);
          this.boardBorder.stroke({ color: 0x00AFF0, width: 3 }); // Blue on hover
        }
      });

      this.playbar.on("pointerout", () => {
        if (this.boardBorder) {
          this.boardBorder.clear();
          this.boardBorder.rect(borderX, borderY, borderWidth, borderHeight);
          this.boardBorder.stroke({ color: 0xFFFFFF, width: 2 }); // White normally
        }
      });
    }

    console.log("Shuffleboard: Fixed borders created to properly contain board");
  }

  private toggleAutoMode(button: Graphics, buttonText: Text) {
    this.isAutoMode = !this.isAutoMode;

    // Update button appearance
    const buttonWidth = 160;
    const buttonHeight = 50;

    button.clear();
    button.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
    button.fill({ color: this.isAutoMode ? 0xFF6B35 : 0x2196F3 }); // Orange when active, blue when inactive
    button.stroke({ color: 0xFFFFFF, width: 2 });

    // Update button text
    buttonText.text = this.isAutoMode ? "AUTO ON" : "AUTO OFF";

    if (this.isAutoMode) {
      // Start auto mode - launch first puck
      this.launchPuck();
      console.log("Auto mode enabled - turbo shooting activated");
    } else {
      // Stop auto mode
      if (this.autoInterval) {
        clearInterval(this.autoInterval);
        this.autoInterval = undefined;
      }
      console.log("Auto mode disabled");
    }
  }

  private async launchPuck() {
    // Allow multiple pucks to be launched without waiting
    console.log("Launching puck - alternating system allows immediate shooting");

    // Get the current puck to use (alternate between puck and puck2)
    const currentPuck = this.currentPuckIndex === 0 ? this.puck : this.puck2;
    if (!currentPuck) {
      console.error("Current puck not available");
      return;
    }

    // Check if current puck is available (not already in flight)
    const isPuckInFlight = this.activePucks.includes(currentPuck);
    if (isPuckInFlight) {
      console.log("Current puck is in flight, switching to other puck");
      // Switch to the other puck
      this.currentPuckIndex = this.currentPuckIndex === 0 ? 1 : 0;
      const alternatePuck = this.currentPuckIndex === 0 ? this.puck : this.puck2;
      if (!alternatePuck || this.activePucks.includes(alternatePuck)) {
        console.log("Both pucks are in flight, waiting...");
        return;
      }
      // Use the alternate puck instead
      this.launchSpecificPuck(alternatePuck);
      return;
    }

    // Launch the current puck
    this.launchSpecificPuck(currentPuck);

    // Switch to the other puck for next launch
    this.currentPuckIndex = this.currentPuckIndex === 0 ? 1 : 0;
  }

  private async launchSpecificPuck(puck: Sprite) {
    // Clear win modal when launching puck
    this.clearWinModal();

    try {
      // Add puck to active pucks list
      this.activePucks.push(puck);
      puck.visible = true;

      // Get bet amount from GameScreen
      const betAmount = this.gameScreenRef?.getBetAmount() || 1.00;
      const betAmountMicro = stakeAPI.toMicroUnits(betAmount);

      console.log("Launching specific puck with bet:", betAmount);

      // Track game event
      await stakeAPI.trackEvent('puck_launch');

      // Call Stake API to play round
      const playResponse = await stakeAPI.play(betAmountMicro);
      const currentRound = playResponse.round;

      // Update balance in GameScreen
      if (this.gameScreenRef?.updateBalance) {
        const newBalance = stakeAPI.fromMicroUnits(playResponse.balance.amount);
        this.gameScreenRef.updateBalance(newBalance);
      }

      // Extract game result from round data
      const { multiplier, finalPosition, winAmount } = playResponse.round;
      const targetZone = finalPosition || 0;

      // Start puck animation to target zone
      this.animateSpecificPuckToZone(puck, targetZone, multiplier, stakeAPI.fromMicroUnits(winAmount || 0), currentRound);

    } catch (error) {
      console.error("Error launching specific puck:", error);

      // Remove from active list on error
      const index = this.activePucks.indexOf(puck);
      if (index > -1) {
        this.activePucks.splice(index, 1);
      }

      // Fallback: use local simulation
      this.simulateLocalGameForPuck(puck);
    }
  }

  private animateSpecificPuckToZone(puck: Sprite, targetZone: number, multiplier: number, winAmount: number, currentRound: any) {
    if (!puck || !engine().ticker.started) return;

    console.log(`Animating puck to zone ${targetZone}, multiplier: ${multiplier}x, win: $${winAmount}`);

    // Calculate target Y position based on zone
    const zoneHeight = 60;
    const totalZones = 12;
    const boardHeight = zoneHeight * totalZones;
    const startY = 443; // Launch pad position
    const targetY = targetZone * zoneHeight - (boardHeight / 2) + (zoneHeight / 2) + 50; // Board offset

    // Store animation state
    const animationData = {
      startY: startY,
      targetY: targetY,
      currentY: startY,
      progress: 0,
      multiplier: multiplier,
      winAmount: winAmount,
      duration: 2000 + Math.random() * 1000, // 2-3 seconds
      startTime: Date.now(),
      puck: puck,
      round: currentRound
    };

    // Smooth animation function with easing
    const animatePuck = () => {
      if (!puck || !puck.parent) {
        engine().ticker.remove(animatePuck, this);
        return;
      }

      const elapsed = Date.now() - animationData.startTime;
      const progress = Math.min(elapsed / animationData.duration, 1);

      // Ease out cubic for realistic physics
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // Update puck position with some horizontal drift for realism
      const drift = Math.sin(progress * Math.PI * 2) * 15;
      puck.y = animationData.startY + (animationData.targetY - animationData.startY) * easeProgress;
      puck.x = drift;

      // Animation complete
      if (progress >= 1) {
        engine().ticker.remove(animatePuck, this);
        this.onSpecificPuckLanded(puck, animationData.multiplier, animationData.winAmount, animationData.round);
      }
    };

    // Start animation
    engine().ticker.add(animatePuck, this);
  }

  private async onSpecificPuckLanded(puck: Sprite, multiplier: number, winAmount: number, currentRound: any) {
    console.log(`Puck landed! Multiplier: ${multiplier}x, Win: $${winAmount}`);

    try {
      // Track landing event
      await stakeAPI.trackEvent('puck_landed');

      // Update win display
      this.updateWinDisplay(winAmount, multiplier);

      // If there's a win, we need to call endRound to complete the bet
      if (winAmount > 0 && currentRound) {
        console.log("Win detected, calling endRound to complete bet...");

        // Add small delay for dramatic effect
        setTimeout(async () => {
          try {
            const endRoundResponse = await stakeAPI.endRound();

            // Update balance after payout
            if (this.gameScreenRef?.updateBalance) {
              const finalBalance = stakeAPI.fromMicroUnits(endRoundResponse.balance.amount);
              this.gameScreenRef.updateBalance(finalBalance);
            }

            console.log("Round completed successfully");
          } catch (error) {
            console.error("Error ending round:", error);
          }
        }, 1000);
      }

    } catch (error) {
      console.error("Error in puck landed handler:", error);
    } finally {
      // Reset puck position and remove from active list
      this.resetSpecificPuckPosition(puck);

      // Remove puck from active list
      const index = this.activePucks.indexOf(puck);
      if (index > -1) {
        this.activePucks.splice(index, 1);
      }

      // Continue auto mode if it's enabled
      if (this.isAutoMode) {
        setTimeout(() => {
          if (this.isAutoMode) { // Check again in case auto was turned off
            this.launchPuck();
          }
        }, 100); // Shorter delay for rapid fire mode
      }
    }
  }

  private resetSpecificPuckPosition(puck: Sprite) {
    if (puck) {
      puck.x = 0;
      puck.y = 443; // Launch pad position
      // Don't hide the puck, keep it visible for next launch
    }
  }

  private simulateLocalGameForPuck(puck: Sprite) {
    console.log("Using local game simulation for specific puck");

    // Define multiplier zones (same as createBoard)
    const multiplierZones = [0, 1000, 0, 500, 100, 25, 10, 5, 1, 0, 0, 0]; // Skip DROP zone
    const randomZone = Math.floor(Math.random() * multiplierZones.length);
    const multiplier = multiplierZones[randomZone];
    const betAmount = this.gameScreenRef?.getBetAmount() || 1.00;
    const winAmount = betAmount * multiplier;

    // Animate to the randomly selected zone
    this.animateSpecificPuckToZone(puck, randomZone, multiplier, winAmount, null);
  }

  private clearWinModal() {
    // Reset win modal to show welcome message instead of win results
    console.log("Clearing win modal - resetting to welcome state");

    // Show welcome content
    if (this.welcomeTitleText) {
      this.welcomeTitleText.visible = true;
      console.log("Welcome title text shown");
    }

    if (this.welcomeInstructionText) {
      this.welcomeInstructionText.visible = true;
      console.log("Welcome instruction text shown");
    }

    if (this.welcomeStatsText) {
      this.welcomeStatsText.visible = true;
      console.log("Welcome stats text shown");
    }

    // Hide win content
    if (this.winTitleText) {
      this.winTitleText.visible = false;
      console.log("Win title text hidden");
    }

    if (this.winAmountText) {
      this.winAmountText.visible = false;
      console.log("Win amount text hidden");
    }

    if (this.multiplierText) {
      this.multiplierText.visible = false;
      console.log("Multiplier text hidden");
    }

    console.log("Win modal cleared - showing welcome message");
  }

  public updateWinDisplay(winAmount: number, multiplier: number) {
    this.lastWinAmount = winAmount;
    this.lastWinMultiplier = multiplier;

    console.log("Updating win display - hiding welcome, showing win results");

    // Hide welcome content
    if (this.welcomeTitleText) {
      this.welcomeTitleText.visible = false;
    }

    if (this.welcomeInstructionText) {
      this.welcomeInstructionText.visible = false;
    }

    if (this.welcomeStatsText) {
      this.welcomeStatsText.visible = false;
    }

    // Create or show "LAST WIN" title
    if (!this.winTitleText && this.winModal) {
      this.winTitleText = new Text("LAST WIN", {
        fontSize: 24,
        fontWeight: 'bold',
        fill: 0x87CEEB, // Baby blue color
        align: 'center',
        fontFamily: 'Arial, sans-serif'
      });
      this.winTitleText.anchor.set(0.5);
      this.winTitleText.x = 0;
      this.winTitleText.y = -35;
      this.winModal.addChild(this.winTitleText);
      console.log("Created LAST WIN title");
    }

    if (this.winTitleText) {
      this.winTitleText.visible = true;
    }

    // Show win results
    if (this.winAmountText) {
      this.winAmountText.text = `$${winAmount.toFixed(2)}`;
      this.winAmountText.visible = true;
    }

    if (this.multiplierText) {
      this.multiplierText.text = `${multiplier}x`;
      this.multiplierText.visible = true;
    }

    // Play cashout sound for big wins (100x multiplier or more, or $100+ win)
    if (multiplier >= 100 || winAmount >= 100) {
      console.log("Big win detected - would play cashout sound");
    }

    console.log("Win display updated:", { winAmount, multiplier });
  }

  private setupKeyboardControls() {
    try {
      console.log("Shuffleboard: Setting up keyboard controls");

      // Add keyboard event listener for spacebar and arrow keys
      const handleKeyDown = (event: KeyboardEvent) => {
        // Check if spacebar was pressed (keyCode 32 or key === ' ')
        if (event.code === 'Space' || event.key === ' ') {
          event.preventDefault(); // Prevent page scroll on spacebar

          // Only allow launch if auto mode is off (same logic as click handler)
          if (!this.isAutoMode) {
            this.launchPuck();
            console.log("Spacebar pressed - launching puck");
          } else {
            console.log("Spacebar pressed but auto mode is active - ignoring");
          }
        }
        // Handle up arrow for bet increase
        else if (event.code === 'ArrowUp' || event.key === 'ArrowUp') {
          event.preventDefault(); // Prevent page scroll
          if (this.gameScreenRef && this.gameScreenRef.increaseBet) {
            this.gameScreenRef.increaseBet();
            console.log("Up arrow pressed - increasing bet");
          }
        }
        // Handle down arrow for bet decrease
        else if (event.code === 'ArrowDown' || event.key === 'ArrowDown') {
          event.preventDefault(); // Prevent page scroll
          if (this.gameScreenRef && this.gameScreenRef.decreaseBet) {
            this.gameScreenRef.decreaseBet();
            console.log("Down arrow pressed - decreasing bet");
          }
        }
      };

      // Add the event listener to the document
      document.addEventListener('keydown', handleKeyDown);

      // Store reference to remove listener later
      this.keyboardHandler = handleKeyDown;

      console.log("Shuffleboard: Keyboard controls setup complete - spacebar launches, arrows control bet");
    } catch (error) {
      console.error("Shuffleboard: Error setting up keyboard controls:", error);
    }
  }

  public setGameScreenReference(gameScreen: any) {
    this.gameScreenRef = gameScreen;
    console.log("Shuffleboard: GameScreen reference set for bet controls");
  }

  public resize(width: number, height: number) {
    console.log("Shuffleboard resize called:", { width, height });

    // Always center the shuffleboard in the screen
    this.x = width / 2; // Center shuffleboard horizontally
    this.y = height / 2;

    console.log("Shuffleboard positioned at:", { x: this.x, y: this.y });

    // Define responsive breakpoints (media query style)
    const isMobile = width < 768; // Mobile: < 768px
    const isTablet = width >= 768 && width < 1024; // Tablet: 768px - 1023px
    const isDesktop = width >= 1024; // Desktop: >= 1024px
    const isLandscape = width > height;
    const isPortrait = height > width;

    console.log("Device type:", { isMobile, isTablet, isDesktop, isLandscape, isPortrait });

    // Position launch button based on device type and orientation
    if (this.playbar) {
      if (isMobile) {
        if (isPortrait) {
          // Mobile Portrait: Bottom right corner (relative to shuffleboard center)
          this.playbar.x = (width / 2) - 120; // Offset from shuffleboard center
          this.playbar.y = (height / 2) - 120; // Offset from shuffleboard center
        } else {
          // Mobile Landscape: Right side, centered vertically
          this.playbar.x = (width / 2) - 140; // Offset from shuffleboard center
          this.playbar.y = 0; // Center relative to shuffleboard
        }
      } else if (isTablet) {
        if (isPortrait) {
          // Tablet Portrait: Bottom right with more space
          this.playbar.x = (width / 2) - 150; // Offset from shuffleboard center
          this.playbar.y = (height / 2) - 140; // Offset from shuffleboard center
        } else {
          // Tablet Landscape: Right side, upper area
          this.playbar.x = (width / 2) - 160; // Offset from shuffleboard center
          this.playbar.y = -(height / 6); // Upper area relative to shuffleboard
        }
      } else {
        // Desktop: Right side with generous spacing
        if (isLandscape) {
          this.playbar.x = (width / 2) - 200; // Offset from shuffleboard center
          this.playbar.y = -(height / 4); // Upper area relative to shuffleboard
        } else {
          this.playbar.x = (width / 2) - 160; // Offset from shuffleboard center
          this.playbar.y = (height / 2) - 160; // Offset from shuffleboard center
        }
      }
      console.log("Launch button positioned at:", { x: this.playbar.x, y: this.playbar.y });
    }

    // Position auto button relative to launch button
    if (this.autoButton && this.playbar) {
      if (isMobile) {
        if (isPortrait) {
          // Mobile Portrait: Horizontally aligned, left of launch button
          this.autoButton.x = this.playbar.x - 200; // 200px left of launch button
          this.autoButton.y = this.playbar.y; // Same vertical position
        } else {
          // Mobile Landscape: Below launch button
          this.autoButton.x = this.playbar.x; // Same horizontal position
          this.autoButton.y = this.playbar.y + 80; // 80px below launch button
        }
      } else if (isTablet) {
        if (isPortrait) {
          // Tablet Portrait: Horizontally aligned, more space
          this.autoButton.x = this.playbar.x - 220; // 220px left of launch button
          this.autoButton.y = this.playbar.y; // Same vertical position
        } else {
          // Tablet Landscape: Below launch button with more space
          this.autoButton.x = this.playbar.x; // Same horizontal position
          this.autoButton.y = this.playbar.y + 100; // 100px below launch button
        }
      } else {
        // Desktop: Below launch button with generous spacing
        this.autoButton.x = this.playbar.x; // Same horizontal position
        this.autoButton.y = this.playbar.y + 120; // 120px below launch button
      }
      console.log("Auto button positioned at:", { x: this.autoButton.x, y: this.autoButton.y });
    }

    // Position win modal at the top of the board (fixed position)
    if (this.winModal) {
      // Always position at top center of the board, regardless of device
      this.winModal.x = 0; // Center horizontally with board
      this.winModal.y = -400; // Fixed position higher up from board
      console.log("Win modal positioned at top of board:", { x: this.winModal.x, y: this.winModal.y });
    }

    // Scale board for different screen sizes
    if (this.board) {
      let boardScale = 1.0;

      if (isMobile) {
        boardScale = isPortrait ? 0.6 : 0.7; // Smaller on mobile
      } else if (isTablet) {
        boardScale = isPortrait ? 0.8 : 0.9; // Medium on tablet
      } else {
        boardScale = 1.0; // Full size on desktop
      }

      this.board.scale.set(boardScale);
      console.log("Board scaled to:", boardScale);
    }

    // Scale and position game title for different screen sizes
    if (this.boardContainer.children.length > 1) {
      // Find the game title container
      for (let child of this.boardContainer.children) {
        if (child instanceof Container) {
          // Check if this container has title text
          let hasTitle = false;
          for (let grandchild of child.children) {
            if (grandchild instanceof Text && (grandchild.text === "MULTIPLIER" || grandchild.text === "SHUFFLE")) {
              hasTitle = true;
              break;
            }
          }

          if (hasTitle) {
            let titleScale = 1.0;
            let titleX = -(width / 2) + 100; // Left side positioning

            if (isMobile) {
              titleScale = isPortrait ? 0.6 : 0.7; // Smaller on mobile
              titleX = -(width / 2) + 50; // Closer to edge on mobile
            } else if (isTablet) {
              titleScale = isPortrait ? 0.8 : 0.9; // Medium on tablet
              titleX = -(width / 2) + 80; // Medium spacing on tablet
            } else {
              titleScale = 1.0; // Full size on desktop
              titleX = -(width / 2) + 120; // More spacing on desktop
            }

            child.scale.set(titleScale);
            child.x = titleX;
            console.log("Game title scaled and positioned:", { scale: titleScale, x: titleX });
            break;
          }
        }
      }
    }

    // Log board dimensions for debugging
    if (this.board) {
      console.log("Board container dimensions:", {
        width: this.board.width,
        height: this.board.height,
        x: this.board.x,
        y: this.board.y
      });
    }
  }

  public destroy() {
    // Clean up auto mode
    this.isAutoMode = false;
    if (this.autoInterval) {
      clearInterval(this.autoInterval);
      this.autoInterval = undefined;
    }

    // Clean up keyboard event listener
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = undefined;
      console.log("Shuffleboard: Keyboard controls cleaned up");
    }

    super.destroy();
  }
}
