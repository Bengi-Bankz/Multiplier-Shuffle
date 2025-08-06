import { Container, Sprite, Graphics, Text } from "pixi.js";
import { engine } from "../app/getEngine";

export class Shuffleboard extends Container {
  private puck?: Sprite;
  private boardContainer: Container;
  private board?: Container;  // Changed from Sprite to Container
  private playbar?: Container;  // Changed from Sprite to Container
  private boardBorder?: Graphics;

  constructor() {
    super();
    this.boardContainer = new Container();
    this.addChild(this.boardContainer);
  }

  public async init() {
    try {
      console.log("Shuffleboard: Starting initialization");
      // Use the new UI assets instead of drawing with graphics
      this.createBoard();
      this.createPuck(); // Create puck first so it's behind the playbar
      this.createPlaybar();
      this.createCombinedBorder();
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
      this.board.y = 0;
      
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

  private createPlaybar() {
    // Create a custom button instead of using playbar.png sprite
    const buttonWidth = 200;
    const buttonHeight = 60;
    
    // Create button container
    const buttonContainer = new Container();
    buttonContainer.x = 400; // Move further right
    buttonContainer.y = 200; // Move down from center
    
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
      // animate puck movement up the board
      engine().ticker.add(this.slideUp, this);
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

  private createPuck() {
    // Use the properly sized puck.png (22x23px) and scale it down
    this.puck = Sprite.from("puck.png");
    this.puck.anchor.set(0.5);
    this.puck.scale.set(0.8); // Scale down by 60% (was 2.0, now 0.8)
    this.puck.x = 0; // Center on the board (not with the button)
    this.puck.y = 400; // Start from further down, below the board
    // Remove interactivity from puck since button handles launching

    this.boardContainer.addChild(this.puck);
    console.log("Shuffleboard: Puck created below board:", { x: this.puck.x, y: this.puck.y, scale: this.puck.scale.x });
  }

  private createCombinedBorder() {
    // Create borders around the game area - fix dimensions to properly contain board
    const boardHeight = 720; // Increased height for 12 zones (12 zones * 60px each)
    const borderWidth = 470; // Width to contain the 450px wide zones with padding
    const borderHeight = boardHeight + 80; // Increased padding for board height
    const borderX = -borderWidth/2; // Center the border
    const borderY = -borderHeight/2; // Center vertically with more padding
    
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
      // Reset puck position to playbar
      this.puck.y = 384;
    }
  }

  public resize(width: number, height: number) {
    console.log("Shuffleboard resize called:", { width, height });
    
    // Position the entire shuffleboard container to the left side
    this.x = width / 3; // Move to left third of screen
    this.y = height / 2;
    
    console.log("Shuffleboard positioned at:", { x: this.x, y: this.y });
    
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
    engine().ticker.remove(this.slideUp, this);
    super.destroy();
  }
}
