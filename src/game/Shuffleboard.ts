import { Container, Sprite, Graphics, Text } from "pixi.js";
import { engine } from "../app/getEngine";
import { sound } from "@pixi/sound";

export class Shuffleboard extends Container {
  private puck?: Sprite;
  private boardContainer: Container;
  private board?: Container;  // Changed from Sprite to Container
  private playbar?: Container;  // Changed from Sprite to Container
  private autoButton?: Container;  // Auto button container
  private winModal?: Container;  // Win display modal
  private winAmountText?: Text;  // Reference to win amount text
  private multiplierText?: Text;  // Reference to multiplier text
  private boardBorder?: Graphics;
  private isAutoMode: boolean = false;
  private autoInterval?: number;
  private lastWinAmount: number = 0;
  private lastWinMultiplier: number = 0;
  private keyboardHandler?: (event: KeyboardEvent) => void;

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
      this.createPuck(); // Create puck first so it's behind the playbar
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
        rect.rect(-tileWidth/2, -tileHeight/2, tileWidth, tileHeight);
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
      
      // Create the game title text
      const gameTitle = new Text("MULTIPLIER SHUFFLE", {
        fontSize: 64,
        fontWeight: 'bold',
        fill: 0x87CEEB, // Baby blue color
        align: 'center',
        fontFamily: 'Arial, sans-serif'
      });
      
      gameTitle.anchor.set(0.5);
      gameTitle.x = 0; // Center horizontally
      gameTitle.y = -420; // Position above the board (board starts at y=50, so -420 gives good spacing)
      
      // Add a subtle text shadow effect by creating a duplicate text slightly offset
      const titleShadow = new Text("MULTIPLIER SHUFFLE", {
        fontSize: 64,
        fontWeight: 'bold',
        fill: 0x000000, // Black shadow
        align: 'center',
        fontFamily: 'Arial, sans-serif'
      });
      
      titleShadow.anchor.set(0.5);
      titleShadow.x = 2; // Slightly offset for shadow effect
      titleShadow.y = -418; // Slightly offset for shadow effect
      titleShadow.alpha = 0.3; // Make shadow semi-transparent
      
      // Add shadow first, then title (so title appears on top)
      this.boardContainer.addChild(titleShadow);
      this.boardContainer.addChild(gameTitle);
      
      console.log("Shuffleboard: Game title created at:", { x: gameTitle.x, y: gameTitle.y });
    } catch (error) {
      console.error("Shuffleboard: Error creating game title:", error);
    }
  }

  private createWinModal() {
    try {
      console.log("Shuffleboard: Creating win modal");
      
      // Create win modal container
      this.winModal = new Container();
      
      // Modal background with rounded rectangle
      const modalBg = new Graphics();
      const modalWidth = 280;
      const modalHeight = 120;
      modalBg.roundRect(-modalWidth/2, -modalHeight/2, modalWidth, modalHeight, 15);
      modalBg.fill({ color: 0x000000, alpha: 0.8 }); // Semi-transparent black background
      modalBg.stroke({ color: 0x87CEEB, width: 3 }); // Baby blue border
      
      // Title text
      const titleText = new Text("LAST WIN", {
        fontSize: 24,
        fontWeight: 'bold',
        fill: 0x87CEEB, // Baby blue color
        align: 'center',
        fontFamily: 'Arial, sans-serif'
      });
      titleText.anchor.set(0.5);
      titleText.x = 0;
      titleText.y = -35;
      
      // Win amount text
      this.winAmountText = new Text(`$${this.lastWinAmount.toFixed(2)}`, {
        fontSize: 28,
        fontWeight: 'bold',
        fill: 0x87CEEB, // Baby blue color
        align: 'center',
        fontFamily: 'Arial, sans-serif'
      });
      this.winAmountText.anchor.set(0.5);
      this.winAmountText.x = 0;
      this.winAmountText.y = 0;
      
      // Multiplier text
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
      
      // Add all elements to modal container
      this.winModal.addChild(modalBg);
      this.winModal.addChild(titleText);
      this.winModal.addChild(this.winAmountText);
      this.winModal.addChild(this.multiplierText);
      
      // Position above where the launch button will be (will be repositioned in resize)
      this.winModal.x = 400;
      this.winModal.y = 100;
      
      this.boardContainer.addChild(this.winModal);
      
      console.log("Shuffleboard: Win modal created at:", { x: this.winModal.x, y: this.winModal.y });
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
    button.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 12);
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
      button.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 12);
      button.fill({ color: 0x45A049 }); // Darker green on hover
      button.stroke({ color: 0x00AFF0, width: 3 }); // Blue border on hover
    });
    
    buttonContainer.on("pointerout", () => {
      button.clear();
      button.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 12);
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
    button.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
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
      button.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
      button.fill({ color: this.isAutoMode ? 0xFF8C69 : 0x42A5F5 }); // Lighter shade on hover
      button.stroke({ color: 0x00AFF0, width: 3 }); // Blue border on hover
    });
    
    autoButtonContainer.on("pointerout", () => {
      button.clear();
      button.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
      button.fill({ color: this.isAutoMode ? 0xFF6B35 : 0x2196F3 }); // Normal color
      button.stroke({ color: 0xFFFFFF, width: 2 }); // White border normally
    });
    
    // Store reference
    this.autoButton = autoButtonContainer;
    this.boardContainer.addChild(autoButtonContainer);
    
    console.log("Shuffleboard: Auto button created at:", { x: autoButtonContainer.x, y: autoButtonContainer.y });
  }

  private createPuck() {
    // Create white circular launch pad first - make it bigger than the puck
    const launchPad = new Graphics();
    launchPad.circle(0, 0, 30); // Circle with 30px radius (bigger than puck)
    launchPad.fill({ color: 0xFFFFFF }); // White color
    launchPad.stroke({ color: 0x000000, width: 2 }); // Black border
    launchPad.x = 0; // Center on the board
    launchPad.y = 443; // Position for launch pad (438 + 5px)
    this.boardContainer.addChild(launchPad);
    
    // Use the properly sized puck.png (22x23px) and scale it down
    this.puck = Sprite.from("puck.png");
    this.puck.anchor.set(0.5);
    this.puck.scale.set(0.8); // Scale down by 60% (was 2.0, now 0.8)
    this.puck.x = 0; // Center on the board (not with the button)
    this.puck.y = 443; // Start from bottom of the board area (438 + 5px)
    // Remove interactivity from puck since button handles launching

    this.boardContainer.addChild(this.puck);
    console.log("Shuffleboard: Puck created on larger white launch pad:", { x: this.puck.x, y: this.puck.y, scale: this.puck.scale.x });
  }

  private createCombinedBorder() {
    // Create borders around the game area - move down by 2/3 of drop zone height (40px)
    const boardHeight = 720; // Increased height for 12 zones (12 zones * 60px each)
    const borderWidth = 470; // Width to contain the 450px wide zones with padding
    const borderHeight = boardHeight + 80; // Increased padding for board height
    const borderX = -borderWidth/2; // Center the border
    const borderY = -borderHeight/2 + 90; // Shift down by 90px (50px + 40px for 2/3 drop zone height)
    
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

  private slideUp = () => {
    if (!this.puck) return;
    
    this.puck.y -= 10;
    if (this.puck.y < -300) {
      engine().ticker.remove(this.slideUp, this);
      // Reset puck position to the white launch pad
      this.puck.y = 443; // Reset to launch pad position (438 + 5px)
      
      // If in auto mode, start the next shot after a short delay
      if (this.isAutoMode) {
        setTimeout(() => {
          if (this.isAutoMode) { // Check again in case auto was turned off
            this.launchPuck();
          }
        }, 200); // 200ms delay for turbo speed
      }
    }
  }

  private toggleAutoMode(button: Graphics, buttonText: Text) {
    this.isAutoMode = !this.isAutoMode;
    
    // Update button appearance
    const buttonWidth = 160;
    const buttonHeight = 50;
    
    button.clear();
    button.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
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

  private launchPuck() {
    // Same animation as manual launch but called automatically
    if (!engine().ticker.started) return;
    engine().ticker.add(this.slideUp, this);
  }

  public updateWinDisplay(winAmount: number, multiplier: number) {
    this.lastWinAmount = winAmount;
    this.lastWinMultiplier = multiplier;
    
    if (this.winAmountText) {
      this.winAmountText.text = `$${winAmount.toFixed(2)}`;
    }
    
    if (this.multiplierText) {
      this.multiplierText.text = `${multiplier}x`;
    }
    
    // Play cashout sound for big wins (100x multiplier or more, or $100+ win)
    if (multiplier >= 100 || winAmount >= 100) {
      this.playBigWinSound();
    }
    
    console.log("Win display updated:", { winAmount, multiplier });
  }

  private playBigWinSound() {
    try {
      // Play the cashout sound for big wins - single play, no loop
      sound.play("cashout", {
        loop: false,
        volume: 1.0
      });
      console.log("Playing big win sound: cashout.mp3 (single play)");
    } catch (error) {
      console.error("Error playing big win sound:", error);
    }
  }

  private setupKeyboardControls() {
    try {
      console.log("Shuffleboard: Setting up keyboard controls");
      
      // Add keyboard event listener for spacebar
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
      };
      
      // Add the event listener to the document
      document.addEventListener('keydown', handleKeyDown);
      
      // Store reference to remove listener later
      this.keyboardHandler = handleKeyDown;
      
      console.log("Shuffleboard: Keyboard controls setup complete - spacebar will launch puck");
    } catch (error) {
      console.error("Shuffleboard: Error setting up keyboard controls:", error);
    }
  }

  public resize(width: number, height: number) {
    console.log("Shuffleboard resize called:", { width, height });
    
    // Always center the shuffleboard in the screen
    this.x = width / 2; // Center shuffleboard horizontally
    this.y = height / 2;
    
    console.log("Shuffleboard positioned at:", { x: this.x, y: this.y });
    
    // Detect landscape mode and reposition launch button
    const isLandscape = width > height;
    
    if (this.playbar) {
      if (isLandscape) {
        // In landscape, position launch button to the right of center with more spacing
        this.playbar.x = (width / 4) + 100; // Right of center
        this.playbar.y = 100; // More space from top (was 50)
        console.log("Launch button positioned for landscape at:", { x: this.playbar.x, y: this.playbar.y });
      } else {
        // In portrait, position at bottom right in horizontal row
        this.playbar.x = width - 120; // Far right, 120px from edge
        this.playbar.y = height - 120; // More space from bottom (was 80)
        console.log("Launch button positioned for portrait at:", { x: this.playbar.x, y: this.playbar.y });
      }
    }
    
    // Position auto button below launch button with more spacing
    if (this.autoButton) {
      if (isLandscape) {
        // In landscape, position auto button below the launch button with more space
        this.autoButton.x = (width / 4) + 100; // Same x as launch button
        this.autoButton.y = 200; // More space below launch button (was 120)
        console.log("Auto button positioned for landscape at:", { x: this.autoButton.x, y: this.autoButton.y });
      } else {
        // In portrait, position at bottom center-right in horizontal row
        this.autoButton.x = width - 300; // Center-right, 300px from right edge (to left of play button)
        this.autoButton.y = height - 120; // Same y as play button
        console.log("Auto button positioned for portrait at:", { x: this.autoButton.x, y: this.autoButton.y });
      }
    }
    
    // Position win modal above launch button with more spacing
    if (this.winModal) {
      if (isLandscape) {
        // In landscape, position win modal above the launch button with more space
        this.winModal.x = (width / 4) + 100; // Same x as launch button
        this.winModal.y = -50; // More space above launch button
        console.log("Win modal positioned for landscape at:", { x: this.winModal.x, y: this.winModal.y });
      } else {
        // In portrait, position above the launch button area with more spacing
        this.winModal.x = width - 120; // Same x as launch button
        this.winModal.y = height - 280; // More space above launch button (was -200)
        console.log("Win modal positioned for portrait at:", { x: this.winModal.x, y: this.winModal.y });
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
    
    engine().ticker.remove(this.slideUp, this);
    super.destroy();
  }
}
