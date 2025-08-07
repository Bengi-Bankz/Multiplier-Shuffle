import { Container, Sprite, Graphics, Text, Assets } from "pixi.js";
import { engine } from "../app/getEngine";
import { stakeAPI } from "./stakeAPI";

export class Shuffleboard extends Container {
  private puckTexture?: any; // Store loaded texture
  private puck2Texture?: any; // Store loaded texture
  private currentPuckIndex: number = 0; // 0 for puck.png, 1 for puck2.png
  private activePucks: Sprite[] = []; // Track active pucks
  private boardContainer: Container;
  private board?: Container;  // Changed from Sprite to Container
  private buttonPanel?: Container;  // New container for all UI buttons
  private playbar?: Container;  // Changed from Sprite to Container
  private autoButton?: Container;  // Auto button container
  private turboButton?: Container; // Turbo button container
  private boardBorder?: Graphics;
  private isAutoMode: boolean = false;
  private isTurboMode: boolean = false;
  private autoInterval?: number;
  private keyboardHandler?: (event: KeyboardEvent) => void;
  private clickHandler?: (event: PointerEvent) => void; // Global click handler for menu
  private clickHandlerActive: boolean = false; // Track if click handler should be active
  private gameScreenRef?: any; // Reference to GameScreen for bet controls
  private menuDropdown?: Container; // Dropdown menu container
  private isMenuOpen: boolean = false; // Track menu state

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
      await this.createPuck(); // Create puck first so it's behind the playbar (now async)
      this.createButtonPanel(); // Create the polished button panel
      this.createCombinedBorder();
      this.setupKeyboardControls(); // Add keyboard controls
      this.setupGlobalClickHandler(); // Add global click handler for menu

      // Initialize controls state
      this.updateControlsState();

      // Initialize win display with default values
      this.updatePanelWinDisplay(0, 0);

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

  private createButtonPanel() {
    console.log("Shuffleboard: Creating polished button panel");

    // Create main button panel container
    this.buttonPanel = new Container();

    // Panel background with rounded corners and semi-transparent background
    const panelBg = new Graphics();
    const panelWidth = 220;
    const panelHeight = 600; // Increased height to accommodate both AUTO and TURBO buttons
    panelBg.roundRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 20);
    panelBg.fill({ color: 0x000000, alpha: 0.8 }); // Semi-transparent black
    panelBg.stroke({ color: 0x87CEEB, width: 3 }); // Baby blue border
    this.buttonPanel.addChild(panelBg);

    // Button configuration with improved spacing
    const buttonConfig = {
      width: 180,
      height: 50,
      spacing: 70, // Adjusted spacing for 5 buttons
      cornerRadius: 12
    };

    let currentY = -250; // Start higher to accommodate increased panel height

    // 1. LAUNCH Button (Main action)
    this.playbar = this.createStyledButton({
      text: "LAUNCH",
      x: 0,
      y: currentY,
      width: buttonConfig.width,
      height: buttonConfig.height,
      backgroundColor: 0x4CAF50, // Green
      hoverColor: 0x45A049, // Darker green
      fontSize: 24,
      fontWeight: 'bold',
      cornerRadius: buttonConfig.cornerRadius,
      onClick: () => {
        // Check if controls are disabled before launching
        if (this.gameScreenRef?.isControlsDisabled && this.gameScreenRef.isControlsDisabled()) {
          console.log("Launch button clicked but controls disabled - bet exceeds balance");
          return;
        }

        if (!this.isAutoMode && !this.isTurboMode) {
          this.launchPuck();
        }
      }
    });
    this.buttonPanel.addChild(this.playbar);
    currentY += buttonConfig.spacing;

    // 2. BET Controls Container (with extra spacing)
    const betContainer = this.createBetControls(0, currentY);
    this.buttonPanel.addChild(betContainer);
    currentY += buttonConfig.spacing + 10; // Extra spacing after bet controls for visual separation

    // 3. AUTO Button (Half speed mode)
    this.autoButton = this.createStyledButton({
      text: "AUTO",
      x: 0,
      y: currentY,
      width: buttonConfig.width,
      height: buttonConfig.height,
      backgroundColor: 0x2196F3, // Blue when inactive
      hoverColor: 0x42A5F5,
      fontSize: 20,
      fontWeight: 'bold',
      cornerRadius: buttonConfig.cornerRadius,
      onClick: (button, buttonText) => {
        // Check if controls are disabled before toggling auto
        if (this.gameScreenRef?.isControlsDisabled && this.gameScreenRef.isControlsDisabled()) {
          console.log("Auto button clicked but controls disabled - bet exceeds balance");
          return;
        }

        this.toggleAutoMode(button!, buttonText!);
      }
    });
    this.buttonPanel.addChild(this.autoButton);
    currentY += buttonConfig.spacing;

    // 4. TURBO Button (Ultra fast mode)
    this.turboButton = this.createStyledButton({
      text: "TURBO",
      x: 0,
      y: currentY,
      width: buttonConfig.width,
      height: buttonConfig.height,
      backgroundColor: 0xFF9800, // Orange when inactive
      hoverColor: 0xFFB74D,
      fontSize: 20,
      fontWeight: 'bold',
      cornerRadius: buttonConfig.cornerRadius,
      onClick: (button, buttonText) => {
        // Check if controls are disabled before toggling turbo
        if (this.gameScreenRef?.isControlsDisabled && this.gameScreenRef.isControlsDisabled()) {
          console.log("Turbo button clicked but controls disabled - bet exceeds balance");
          return;
        }

        this.toggleTurboMode(button!, buttonText!);
      }
    });
    this.buttonPanel.addChild(this.turboButton);
    currentY += buttonConfig.spacing;

    // 5. Menu Button
    const menuButton = this.createStyledButton({
      text: "MENU",
      x: 0,
      y: currentY,
      width: buttonConfig.width,
      height: buttonConfig.height,
      backgroundColor: 0x795548, // Brown
      hoverColor: 0x5D4037, // Darker brown
      fontSize: 18,
      fontWeight: 'bold',
      cornerRadius: buttonConfig.cornerRadius,
      onClick: () => {
        console.log("🔧 DEBUG: Menu button clicked!");
        this.toggleMenuDropdown();
      }
    });
    this.buttonPanel.addChild(menuButton);
    currentY += buttonConfig.spacing + 20; // Extra spacing before win display

    // 6. Win Display Area
    const winDisplayContainer = this.createWinDisplay(0, currentY);
    this.buttonPanel.addChild(winDisplayContainer);

    // Position the panel on the right side (will be adjusted in resize)
    this.buttonPanel.x = 400; // Initial position, will be updated in resize
    this.buttonPanel.y = 0;

    // Add the button panel to the main container
    this.addChild(this.buttonPanel);

    // Initialize button states
    this.updateLaunchButtonState();
    this.updateAutoButtonState();
    this.updateTurboButtonState();

    console.log("Shuffleboard: Polished button panel created with 5 buttons (LAUNCH, BET, AUTO, TURBO, MENU) and win display area");
  }

  private createStyledButton(config: {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    backgroundColor: number;
    hoverColor: number;
    fontSize: number;
    fontWeight: string;
    cornerRadius: number;
    onClick: (button?: Graphics, buttonText?: Text) => void;
  }): Container {
    const buttonContainer = new Container();
    buttonContainer.x = config.x;
    buttonContainer.y = config.y;

    // Create button background
    const button = new Graphics();
    button.roundRect(-config.width / 2, -config.height / 2, config.width, config.height, config.cornerRadius);
    button.fill({ color: config.backgroundColor });
    button.stroke({ color: 0xFFFFFF, width: 2 }); // White border

    // Create button text
    const buttonText = new Text(config.text, {
      fontSize: config.fontSize,
      fontWeight: config.fontWeight as any,
      fill: 0xFFFFFF, // White text
      align: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    buttonText.anchor.set(0.5);
    buttonText.x = 0;
    buttonText.y = 0;

    // Add elements to button container
    buttonContainer.addChild(button);
    buttonContainer.addChild(buttonText);

    // Store initial state color for hover effects
    (button as any)._currentStateColor = config.backgroundColor;

    // Make button interactive
    buttonContainer.interactive = true;
    buttonContainer.cursor = "pointer";

    // Add click handler
    buttonContainer.on("pointerdown", () => {
      console.log("🔧 DEBUG: Button clicked, disabled state:", (buttonContainer as any)._isDisabled);
      // Don't execute click if button is disabled
      if ((buttonContainer as any)._isDisabled) {
        console.log("🔧 DEBUG: Button click blocked - button is disabled");
        return;
      }
      console.log("🔧 DEBUG: Executing onClick callback");
      config.onClick(button, buttonText);
    });

    // Add hover effects
    buttonContainer.on("pointerover", () => {
      // Don't show hover effects if button is disabled
      if ((buttonContainer as any)._isDisabled) {
        return;
      }

      // Get current background color instead of using config.hoverColor always
      const currentColor = (button as any)._fillStyle?.color || config.backgroundColor;
      const hoverColor = currentColor === 0x2196F3 ? 0x42A5F5 : // Blue -> light blue
        currentColor === 0x32CD32 ? 0x00FF00 : // Green -> bright green (auto active)
          currentColor === 0xFF9800 ? 0xFFB74D : // Orange -> light orange
            currentColor === 0xFF1744 ? 0xFF5722 : // Red -> light red (turbo active)
              config.hoverColor; // Fallback to original hover color

      button.clear();
      button.roundRect(-config.width / 2, -config.height / 2, config.width, config.height, config.cornerRadius);
      button.fill({ color: hoverColor });
      button.stroke({ color: 0x00AFF0, width: 3 }); // Blue border on hover
    });

    buttonContainer.on("pointerout", () => {
      // Don't change appearance if button is disabled
      if ((buttonContainer as any)._isDisabled) {
        return;
      }

      // Restore the current state color, not the original config color
      const currentColor = (button as any)._currentStateColor || config.backgroundColor;
      button.clear();
      button.roundRect(-config.width / 2, -config.height / 2, config.width, config.height, config.cornerRadius);
      button.fill({ color: currentColor });
      button.stroke({ color: 0xFFFFFF, width: 2 }); // White border normally
    });

    return buttonContainer;
  }

  private createBetControls(x: number, y: number): Container {
    const betContainer = new Container();
    betContainer.x = x;
    betContainer.y = y;

    // Bet controls background
    const betBg = new Graphics();
    betBg.roundRect(-90, -35, 180, 70, 10);
    betBg.fill({ color: 0x333333, alpha: 0.9 });
    betBg.stroke({ color: 0x87CEEB, width: 2 });
    betContainer.addChild(betBg);

    // Bet amount display
    const betAmountText = new Text("$1.00", {
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0x87CEEB,
      align: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    betAmountText.anchor.set(0.5);
    betAmountText.x = 0;
    betAmountText.y = -15;
    betContainer.addChild(betAmountText);

    // Store reference to bet text for keyboard controls
    (this as any).betAmountText = betAmountText;

    // Label
    const betLabel = new Text("BET", {
      fontSize: 12,
      fill: 0xCCCCCC,
      align: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    betLabel.anchor.set(0.5);
    betLabel.x = 0;
    betLabel.y = 15;
    betContainer.addChild(betLabel);

    // Decrease button
    const decreaseBtn = new Graphics();
    decreaseBtn.circle(-50, 0, 15);
    decreaseBtn.fill({ color: 0xFF5722 });
    decreaseBtn.stroke({ color: 0xFFFFFF, width: 2 });

    const decreaseText = new Text("-", {
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center'
    });
    decreaseText.anchor.set(0.5);
    decreaseText.x = -50;
    decreaseText.y = 0;

    betContainer.addChild(decreaseBtn);
    betContainer.addChild(decreaseText);

    // Increase button
    const increaseBtn = new Graphics();
    increaseBtn.circle(50, 0, 15);
    increaseBtn.fill({ color: 0x4CAF50 });
    increaseBtn.stroke({ color: 0xFFFFFF, width: 2 });

    const increaseText = new Text("+", {
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center'
    });
    increaseText.anchor.set(0.5);
    increaseText.x = 50;
    increaseText.y = 0;

    betContainer.addChild(increaseBtn);
    betContainer.addChild(increaseText);

    // Store references for updating disabled state
    (this as any).betDecreaseBtn = decreaseBtn;
    (this as any).betIncreaseBtn = increaseBtn;
    (this as any).betDecreaseText = decreaseText;
    (this as any).betIncreaseText = increaseText;

    // Make buttons interactive
    const decreaseContainer = new Container();
    decreaseContainer.addChild(decreaseBtn);
    decreaseContainer.addChild(decreaseText);
    decreaseContainer.interactive = true;
    decreaseContainer.cursor = "pointer";
    decreaseContainer.on("pointerdown", () => {
      // Check if controls are disabled
      if (this.gameScreenRef?.isControlsDisabled && this.gameScreenRef.isControlsDisabled()) {
        console.log("Bet controls disabled - bet exceeds balance");
        return;
      }

      if (this.gameScreenRef?.decreaseBet) {
        this.gameScreenRef.decreaseBet();
        // Update display
        const newBet = this.gameScreenRef.getBetAmount() || 1.00;
        betAmountText.text = `$${newBet.toFixed(2)}`;
        // Update controls state after bet change
        this.updateControlsState();
      }
    });

    const increaseContainer = new Container();
    increaseContainer.addChild(increaseBtn);
    increaseContainer.addChild(increaseText);
    increaseContainer.interactive = true;
    increaseContainer.cursor = "pointer";
    increaseContainer.on("pointerdown", () => {
      // Check if controls are disabled
      if (this.gameScreenRef?.isControlsDisabled && this.gameScreenRef.isControlsDisabled()) {
        console.log("Bet controls disabled - bet exceeds balance");
        return;
      }

      if (this.gameScreenRef?.increaseBet) {
        this.gameScreenRef.increaseBet();
        // Update display
        const newBet = this.gameScreenRef.getBetAmount() || 1.00;
        betAmountText.text = `$${newBet.toFixed(2)}`;
        // Update controls state after bet change
        this.updateControlsState();
      }
    });

    betContainer.addChild(decreaseContainer);
    betContainer.addChild(increaseContainer);

    // Store references for disabled state management
    (this as any).betDecreaseContainer = decreaseContainer;
    (this as any).betIncreaseContainer = increaseContainer;

    return betContainer;
  }

  private createWinDisplay(x: number, y: number): Container {
    const winContainer = new Container();
    winContainer.x = x;
    winContainer.y = y;

    // Win display background
    const winBg = new Graphics();
    winBg.roundRect(-90, -45, 180, 90, 10);
    winBg.fill({ color: 0x1a1a1a, alpha: 0.9 }); // Dark background
    winBg.stroke({ color: 0xFFD700, width: 2 }); // Gold border
    winContainer.addChild(winBg);

    // "LAST WIN" title
    const winTitle = new Text("LAST WIN", {
      fontSize: 14,
      fontWeight: 'bold',
      fill: 0xFFD700, // Gold color
      align: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    winTitle.anchor.set(0.5);
    winTitle.x = 0;
    winTitle.y = -25;
    winContainer.addChild(winTitle);

    // Win amount display
    const winAmountText = new Text("$0.00", {
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0x00FF00, // Green for win amount
      align: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    winAmountText.anchor.set(0.5);
    winAmountText.x = 0;
    winAmountText.y = -5;
    winContainer.addChild(winAmountText);

    // Multiplier display
    const multiplierText = new Text("0x", {
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0x87CEEB, // Baby blue for multiplier
      align: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    multiplierText.anchor.set(0.5);
    multiplierText.x = 0;
    multiplierText.y = 15;
    winContainer.addChild(multiplierText);

    // Store references for updating
    (this as any).panelWinAmountText = winAmountText;
    (this as any).panelMultiplierText = multiplierText;
    (this as any).winDisplayContainer = winContainer;

    return winContainer;
  }

  private toggleMenuDropdown() {
    console.log("🔧 DEBUG: toggleMenuDropdown called, isMenuOpen:", this.isMenuOpen);
    if (this.isMenuOpen) {
      this.closeMenuDropdown();
    } else {
      this.openMenuDropdown();
    }
  }

  private openMenuDropdown() {
    console.log("🔧 DEBUG: openMenuDropdown called");
    if (this.menuDropdown) {
      this.closeMenuDropdown(); // Close existing menu first
    }

    // Temporarily disable global click handler
    this.clickHandlerActive = false;

    this.isMenuOpen = true;
    this.menuDropdown = this.createMenuDropdown();
    console.log("🔧 DEBUG: menuDropdown created:", this.menuDropdown);

    // Position dropdown over the win display area
    this.menuDropdown.x = 0;
    this.menuDropdown.y = 90; // Position higher up (was 115)

    this.buttonPanel!.addChild(this.menuDropdown);
    console.log("🔧 DEBUG: menuDropdown added to buttonPanel");
    console.log("Menu dropdown opened");

    // Enable global click handler after a short delay to prevent immediate closure
    setTimeout(() => {
      this.clickHandlerActive = true;
      console.log("🔧 DEBUG: Global click handler now active for menu");
    }, 200);
  }

  private closeMenuDropdown() {
    if (this.menuDropdown && this.buttonPanel) {
      this.buttonPanel.removeChild(this.menuDropdown);
      this.menuDropdown.destroy();
      this.menuDropdown = undefined;
      this.isMenuOpen = false;
      this.clickHandlerActive = false; // Disable click handler when menu is closed
      console.log("Menu dropdown closed");
    }
  }

  private createMenuDropdown(): Container {
    console.log("🔧 DEBUG: createMenuDropdown called");
    const dropdown = new Container();

    // Dropdown background - overlay style
    const dropdownBg = new Graphics();
    const dropdownWidth = 220; // Slightly wider to match button panel width
    const dropdownHeight = 275; // Taller to ensure Exit option fits (was 250)

    // Add shadow effect first
    const shadow = new Graphics();
    shadow.roundRect(-dropdownWidth / 2 + 3, 3, dropdownWidth, dropdownHeight, 8);
    shadow.fill({ color: 0x000000, alpha: 0.4 }); // Shadow
    dropdown.addChild(shadow);

    // Main dropdown background
    dropdownBg.roundRect(-dropdownWidth / 2, 0, dropdownWidth, dropdownHeight, 8);
    dropdownBg.fill({ color: 0x1a1a1a, alpha: 0.98 }); // Almost solid dark background
    dropdownBg.stroke({ color: 0x87CEEB, width: 3 }); // Thicker baby blue border
    dropdown.addChild(dropdownBg);

    console.log("🔧 DEBUG: Dropdown background created with size:", dropdownWidth, "x", dropdownHeight);

    // Menu items configuration
    const menuItems = [
      { text: "Game Info", action: () => this.showGameInfo() },
      { text: "RTP/Odds", action: () => this.showRTPOdds() },
      { text: "History", action: () => this.showHistory() },
      { text: "Exit", action: () => this.handleExit() }
    ];

    // Create menu items
    const itemHeight = 55; // Slightly taller items
    const itemSpacing = 8; // More spacing between items

    menuItems.forEach((item, index) => {
      const itemContainer = new Container();
      const yPos = (index * (itemHeight + itemSpacing)) + 15; // Start from top with small margin

      // Item background (for hover effect)
      const itemBg = new Graphics();
      itemBg.roundRect(-dropdownWidth / 2 + 8, 0, dropdownWidth - 16, itemHeight - 2, 6);
      itemBg.fill({ color: 0x333333, alpha: 0.8 });
      itemContainer.addChild(itemBg);

      // Item text
      const itemText = new Text(item.text, {
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        align: 'center',
        fontFamily: 'Arial, sans-serif'
      });
      itemText.anchor.set(0.5);
      itemText.x = 0;
      itemText.y = itemHeight / 2;
      itemContainer.addChild(itemText);

      // Position item
      itemContainer.x = 0;
      itemContainer.y = yPos;

      // Make item interactive
      itemContainer.interactive = true;
      itemContainer.cursor = "pointer";

      // Add hover effects
      itemContainer.on("pointerover", () => {
        itemBg.clear();
        itemBg.roundRect(-dropdownWidth / 2 + 8, 0, dropdownWidth - 16, itemHeight - 2, 6);
        itemBg.fill({ color: 0x4a4a4a, alpha: 0.9 }); // Lighter on hover
        itemText.style.fill = 0x87CEEB; // Baby blue text on hover
      });

      itemContainer.on("pointerout", () => {
        itemBg.clear();
        itemBg.roundRect(-dropdownWidth / 2 + 8, 0, dropdownWidth - 16, itemHeight - 2, 6);
        itemBg.fill({ color: 0x333333, alpha: 0.8 }); // Original color
        itemText.style.fill = 0xFFFFFF; // White text normally
      });

      // Add click handler
      itemContainer.on("pointerdown", () => {
        this.closeMenuDropdown(); // Close menu first
        item.action(); // Then execute action
      });

      dropdown.addChild(itemContainer);
    });

    console.log("🔧 DEBUG: createMenuDropdown finished, returning dropdown with", dropdown.children.length, "children");
    return dropdown;
  }

  private showGameInfo() {
    console.log("📋 Game Info selected");
    this.createModal("Game Information", this.getGameInfoContent());
  }

  private showRTPOdds() {
    console.log("📊 RTP/Odds selected");
    this.createModal("RTP & Odds Information", this.getRTPOddsContent());
  }

  private showHistory() {
    console.log("📈 History selected");
    this.createModal("Game History", this.getHistoryContent());
  }

  private handleExit() {
    console.log("🚪 Exit selected");
    const confirmExit = confirm("Are you sure you want to exit the game?");
    if (confirmExit) {
      // TODO: Implement proper exit logic - could navigate to main menu
      console.log("User confirmed exit");
      // For now, just reload the page
      window.location.reload();
    }
  }

  private createModal(title: string, content: Container) {
    // Create modal overlay
    const modalOverlay = new Container();
    modalOverlay.name = "modalOverlay";

    // Get actual viewport dimensions
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Modal dimensions (50% of viewport)
    const modalWidth = screenWidth * 0.5;
    const modalHeight = screenHeight * 0.5;

    // Background overlay (covers entire viewport)
    const overlay = new Graphics();
    overlay.rect(0, 0, screenWidth, screenHeight);
    overlay.fill({ color: 0x000000, alpha: 0.7 }); // Semi-transparent black
    overlay.interactive = true; // Block clicks behind modal
    overlay.cursor = "default";
    modalOverlay.addChild(overlay);

    // Modal background (centered)
    const modalBg = new Graphics();
    modalBg.roundRect(0, 0, modalWidth, modalHeight, 15);
    modalBg.fill({ color: 0x1a1a1a, alpha: 0.95 }); // Dark semi-transparent
    modalBg.stroke({ color: 0x87CEEB, width: 4 }); // Baby blue border
    modalBg.x = (screenWidth - modalWidth) / 2;
    modalBg.y = (screenHeight - modalHeight) / 2;
    modalOverlay.addChild(modalBg);

    // Drop shadow (positioned behind modal)
    const shadow = new Graphics();
    shadow.roundRect(0, 0, modalWidth, modalHeight, 15);
    shadow.fill({ color: 0x000000, alpha: 0.5 });
    shadow.x = (screenWidth - modalWidth) / 2 + 5;
    shadow.y = (screenHeight - modalHeight) / 2 + 5;
    modalOverlay.addChildAt(shadow, 1); // Insert behind modal background

    // Modal header
    const header = new Container();

    // Header background - positioned relative to header container
    const headerBg = new Graphics();
    headerBg.roundRect(0, 0, modalWidth, 60, 15);
    headerBg.fill({ color: 0x2a2a2a, alpha: 0.9 });
    headerBg.x = 0;
    headerBg.y = 0;
    header.addChild(headerBg);

    // Title text - positioned relative to header container
    const titleText = new Text(title, {
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0x87CEEB,
      align: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    titleText.anchor.set(0.5);
    titleText.x = modalWidth / 2;
    titleText.y = 30;
    header.addChild(titleText);

    // Close button
    const closeButton = new Container();
    const closeBg = new Graphics();
    closeBg.circle(0, 0, 20);
    closeBg.fill({ color: 0xFF5722 });
    closeBg.stroke({ color: 0xFFFFFF, width: 2 });
    closeButton.addChild(closeBg);

    const closeText = new Text("✕", {
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    closeText.anchor.set(0.5);
    closeButton.addChild(closeText);

    closeButton.x = modalWidth - 30;
    closeButton.y = 30;
    closeButton.interactive = true;
    closeButton.cursor = "pointer";
    closeButton.on("pointerdown", () => {
      this.closeModal(modalOverlay);
    });

    // Hover effect for close button
    closeButton.on("pointerover", () => {
      closeBg.clear();
      closeBg.circle(0, 0, 20);
      closeBg.fill({ color: 0xFF7043 });
      closeBg.stroke({ color: 0xFFFFFF, width: 3 });
    });

    closeButton.on("pointerout", () => {
      closeBg.clear();
      closeBg.circle(0, 0, 20);
      closeBg.fill({ color: 0xFF5722 });
      closeBg.stroke({ color: 0xFFFFFF, width: 2 });
    });

    header.addChild(closeButton);

    // Position header container absolutely
    header.x = (screenWidth - modalWidth) / 2;
    header.y = (screenHeight - modalHeight) / 2;
    modalOverlay.addChild(header);

    // Content area - position content absolutely
    content.x = (screenWidth - modalWidth) / 2 + 20;
    content.y = (screenHeight - modalHeight) / 2 + 80; // Position below header
    modalOverlay.addChild(content);

    // Position modal overlay at origin (all children are already positioned absolutely)
    modalOverlay.x = 0;
    modalOverlay.y = 0;

    // Add to stage (highest level)
    engine().stage.addChild(modalOverlay);

    // Click outside to close
    overlay.on("pointerdown", () => {
      this.closeModal(modalOverlay);
    });
  }

  private closeModal(modalOverlay: Container) {
    if (modalOverlay && modalOverlay.parent) {
      modalOverlay.parent.removeChild(modalOverlay);
      modalOverlay.destroy();
    }
  }

  private getGameInfoContent(): Container {
    const content = new Container();

    // LEFT COLUMN - Game Info and Game Mechanics
    const leftColumn = new Container();
    leftColumn.x = 20;
    leftColumn.y = 0;

    // Game info sections for left column
    const leftSections = [
      {
        title: "Multiplier Shuffle",
        subtitle: "Version 1.0.0",
        items: [
          "🎯 Launch pucks to win multiplier rewards",
          "🚀 Use SPACEBAR to launch or click LAUNCH button",
          "⬆️⬇️ Arrow keys control bet amount",
          "🎮 AUTO mode for continuous play",
          "⚡ TURBO mode for ultra-fast gameplay"
        ]
      },
      {
        title: "Game Mechanics",
        items: [
          "• Pucks travel down the board to land in multiplier zones",
          "• Higher multipliers are rarer but offer bigger rewards",
          "• Your bet is multiplied by the zone you land in",
          "• Avoid the DROP zone at the top for maximum rewards"
        ]
      }
    ];

    let yOffset = 0;

    leftSections.forEach((section) => {
      // Section title
      const sectionTitle = new Text(section.title, {
        fontSize: 18,
        fontWeight: 'bold',
        fill: 0xFFD700, // Gold
        fontFamily: 'Arial, sans-serif'
      });
      sectionTitle.x = 0;
      sectionTitle.y = yOffset;
      leftColumn.addChild(sectionTitle);
      yOffset += 30;

      // Subtitle if exists
      if (section.subtitle) {
        const subtitle = new Text(section.subtitle, {
          fontSize: 14,
          fill: 0x87CEEB,
          fontFamily: 'Arial, sans-serif'
        });
        subtitle.x = 0;
        subtitle.y = yOffset;
        leftColumn.addChild(subtitle);
        yOffset += 25;
      }

      // Section items
      section.items.forEach((item) => {
        const itemText = new Text(item, {
          fontSize: 14,
          fill: 0xFFFFFF,
          fontFamily: 'Arial, sans-serif'
        });
        itemText.x = 10;
        itemText.y = yOffset;
        leftColumn.addChild(itemText);
        yOffset += 22;
      });

      yOffset += 15; // Extra spacing between sections
    });

    content.addChild(leftColumn);

    return content;
  }

  private getRTPOddsContent(): Container {
    const content = new Container();

    // LEFT COLUMN - RTP Section
    const leftColumn = new Container();
    leftColumn.x = 20;
    leftColumn.y = 0;

    const rtpTitle = new Text("Return to Player (RTP)", {
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xFFD700,
      fontFamily: 'Arial, sans-serif'
    });
    rtpTitle.x = 0;
    rtpTitle.y = 0;
    leftColumn.addChild(rtpTitle);

    const rtpValue = new Text("96.5%", {
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0x00FF00,
      fontFamily: 'Arial, sans-serif'
    });
    rtpValue.x = 0;
    rtpValue.y = 25;
    leftColumn.addChild(rtpValue);

    const rtpDesc = new Text("Theoretical return over extended play", {
      fontSize: 12,
      fill: 0xCCCCCC,
      fontFamily: 'Arial, sans-serif'
    });
    rtpDesc.x = 0;
    rtpDesc.y = 55;
    leftColumn.addChild(rtpDesc);

    // Additional RTP info
    const rtpDetails = new Text("This percentage represents\nthe expected return to\nplayers over many rounds\nof gameplay.", {
      fontSize: 11,
      fill: 0xCCCCCC,
      fontFamily: 'Arial, sans-serif'
    });
    rtpDetails.x = 0;
    rtpDetails.y = 80;
    leftColumn.addChild(rtpDetails);

    content.addChild(leftColumn);

    // RIGHT COLUMN - Odds Table
    const rightColumn = new Container();
    rightColumn.x = 250; // Position to the right of left column
    rightColumn.y = 0;

    const oddsTitle = new Text("Multiplier Probabilities", {
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xFFD700,
      fontFamily: 'Arial, sans-serif'
    });
    oddsTitle.x = 0;
    oddsTitle.y = 0;
    rightColumn.addChild(oddsTitle);

    const oddsData = [
      { multiplier: "1000x", probability: "0.1%", color: 0xFF0000 },
      { multiplier: "500x", probability: "0.2%", color: 0xFF4500 },
      { multiplier: "100x", probability: "1.0%", color: 0xFF8C00 },
      { multiplier: "25x", probability: "3.0%", color: 0xFFA500 },
      { multiplier: "10x", probability: "5.0%", color: 0xFFD700 },
      { multiplier: "5x", probability: "10.0%", color: 0xFFFF00 },
      { multiplier: "1x", probability: "30.0%", color: 0x9AFF9A },
      { multiplier: "No Win", probability: "50.7%", color: 0x0000FF }
    ];

    let yPos = 30;
    oddsData.forEach((item) => {
      // Multiplier
      const multText = new Text(item.multiplier, {
        fontSize: 13,
        fontWeight: 'bold',
        fill: item.color,
        fontFamily: 'Arial, sans-serif'
      });
      multText.x = 0;
      multText.y = yPos;
      rightColumn.addChild(multText);

      // Probability
      const probText = new Text(item.probability, {
        fontSize: 13,
        fill: 0xFFFFFF,
        fontFamily: 'Arial, sans-serif'
      });
      probText.x = 80;
      probText.y = yPos;
      rightColumn.addChild(probText);

      yPos += 22;
    });

    content.addChild(rightColumn);

    // Add disclaimer below both columns
    this.addDisclaimer(content, 220);

    return content;
  }

  private getHistoryContent(): Container {
    const content = new Container();

    // Coming soon message
    const title = new Text("Game History", {
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xFFD700,
      fontFamily: 'Arial, sans-serif'
    });
    title.x = 20;
    title.y = 0;
    content.addChild(title);

    const subtitle = new Text("Feature Coming Soon!", {
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0x87CEEB,
      fontFamily: 'Arial, sans-serif'
    });
    subtitle.x = 20;
    subtitle.y = 35;
    content.addChild(subtitle);

    const description = new Text("This section will display your recent game results including:", {
      fontSize: 14,
      fill: 0xFFFFFF,
      fontFamily: 'Arial, sans-serif'
    });
    description.x = 20;
    description.y = 70;
    content.addChild(description);

    const features = [
      "• Last 50 game results with timestamps",
      "• Win/loss statistics and percentages",
      "• Biggest wins and multipliers achieved",
      "• Total amount wagered and won",
      "• Performance analytics and trends",
      "• Export functionality for record keeping"
    ];

    let yPos = 100;
    features.forEach((feature) => {
      const featureText = new Text(feature, {
        fontSize: 14,
        fill: 0xCCCCCC,
        fontFamily: 'Arial, sans-serif'
      });
      featureText.x = 30;
      featureText.y = yPos;
      content.addChild(featureText);
      yPos += 25;
    });

    // Add disclaimer
    this.addDisclaimer(content, yPos + 20);

    return content;
  }

  private addDisclaimer(content: Container, yOffset: number): void {
    // Disclaimer section
    const disclaimerBg = new Graphics();
    disclaimerBg.roundRect(10, yOffset - 5, 420, 80, 8);
    disclaimerBg.fill({ color: 0x333333, alpha: 0.8 });
    disclaimerBg.stroke({ color: 0x666666, width: 1 });
    content.addChild(disclaimerBg);

    const disclaimerTitle = new Text("Important Notice", {
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0xFFD700,
      fontFamily: 'Arial, sans-serif'
    });
    disclaimerTitle.x = 20;
    disclaimerTitle.y = yOffset + 5;
    content.addChild(disclaimerTitle);

    const disclaimerText = new Text(
      "Visual graphics and animations are for entertainment purposes only.\nAll game outcomes are determined by secure server-side calculations.\nGraphical malfunctions do not affect actual game results or balance updates.",
      {
        fontSize: 11,
        fill: 0xCCCCCC,
        fontFamily: 'Arial, sans-serif',
        wordWrap: true,
        wordWrapWidth: 400
      }
    );
    disclaimerText.x = 20;
    disclaimerText.y = yOffset + 25;
    content.addChild(disclaimerText);
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
      // Load puck textures using Assets API and store them for on-demand creation
      console.log("Loading puck textures...");

      this.puckTexture = await Assets.load('/puck.png');
      this.puck2Texture = await Assets.load('/puck2.png');

      console.log("Textures loaded successfully - ready for on-demand puck creation");

    } catch (error) {
      console.error("Error loading puck textures:", error);
      console.log("Will use fallback colored circles for puck creation");

      // Set fallback textures to null so we know to use Graphics
      this.puckTexture = null;
      this.puck2Texture = null;
    }

    // Initialize active pucks array
    this.activePucks = [];

    console.log("Shuffleboard: Puck system ready for unlimited rapid-fire shooting");
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

  private toggleAutoMode(button: Graphics, _buttonText: Text) {
    // If turbo is active, turn it off first
    if (this.isTurboMode) {
      this.isTurboMode = false;
      this.updateTurboButtonAppearance();
      this.updateLaunchButtonState();
    }

    this.isAutoMode = !this.isAutoMode;

    // Update button appearance (only color, not text)
    const buttonWidth = 180;
    const buttonHeight = 50;
    const newColor = this.isAutoMode ? 0x32CD32 : 0x2196F3; // Green when active, blue when inactive

    button.clear();
    button.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
    button.fill({ color: newColor });
    button.stroke({ color: 0xFFFFFF, width: 2 });

    // Store current state color for hover effects
    (button as any)._currentStateColor = newColor;

    // Update all button states
    this.updateLaunchButtonState();
    this.updateTurboButtonState(); // Disable/enable turbo button

    if (this.isAutoMode) {
      // Start auto mode - launch first puck
      this.launchPuck();
      console.log("Auto mode enabled - medium speed");
    } else {
      // Stop auto mode
      if (this.autoInterval) {
        clearInterval(this.autoInterval);
        this.autoInterval = undefined;
      }
      console.log("Auto mode disabled");
    }
  }

  private toggleTurboMode(button: Graphics, _buttonText: Text) {
    // If auto is active, turn it off first
    if (this.isAutoMode) {
      this.isAutoMode = false;
      if (this.autoInterval) {
        clearInterval(this.autoInterval);
        this.autoInterval = undefined;
      }
      this.updateAutoButtonAppearance();
      this.updateLaunchButtonState();
    }

    this.isTurboMode = !this.isTurboMode;

    // Update button appearance (only color, not text)
    const buttonWidth = 180;
    const buttonHeight = 50;
    const newColor = this.isTurboMode ? 0xFF1744 : 0xFF9800; // Red when active, orange when inactive

    button.clear();
    button.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
    button.fill({ color: newColor });
    button.stroke({ color: 0xFFFFFF, width: 2 });

    // Store current state color for hover effects
    (button as any)._currentStateColor = newColor;

    // Update all button states
    this.updateLaunchButtonState();
    this.updateAutoButtonState(); // Disable/enable auto button

    if (this.isTurboMode) {
      // Start turbo mode - launch first puck
      this.launchPuck();
      console.log("Turbo mode enabled - ultra fast");
    } else {
      // Stop turbo mode
      console.log("Turbo mode disabled");
    }
  }

  private updateAutoButtonAppearance() {
    if (this.autoButton) {
      const button = this.autoButton.children[0] as Graphics;
      const buttonText = this.autoButton.children[1] as Text;
      const buttonWidth = 180;
      const buttonHeight = 50;
      const isDisabled = this.isTurboMode || (this.gameScreenRef?.isControlsDisabled && this.gameScreenRef.isControlsDisabled()); // Disabled when turbo is active or bet exceeds balance

      let backgroundColor: number;
      let textColor: number;
      let borderColor: number;

      if (isDisabled) {
        // Disabled state
        backgroundColor = 0x666666; // Gray
        textColor = 0x999999; // Light gray text
        borderColor = 0x888888; // Gray border
      } else {
        // Normal state
        backgroundColor = this.isAutoMode ? 0x32CD32 : 0x2196F3; // Green when active, blue when inactive
        textColor = 0xFFFFFF; // White text
        borderColor = 0xFFFFFF; // White border
      }

      button.clear();
      button.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
      button.fill({ color: backgroundColor });
      button.stroke({ color: borderColor, width: 2 });

      // Update text color
      buttonText.style.fill = textColor;

      // Store current state color for hover effects
      (button as any)._currentStateColor = backgroundColor;

      // Update interactive state
      this.autoButton.interactive = !isDisabled;
      this.autoButton.cursor = isDisabled ? "default" : "pointer";
      (this.autoButton as any)._isDisabled = isDisabled;
    }
  }

  private updateAutoButtonState() {
    this.updateAutoButtonAppearance();
  }

  private updateTurboButtonAppearance() {
    if (this.turboButton) {
      const button = this.turboButton.children[0] as Graphics;
      const buttonText = this.turboButton.children[1] as Text;
      const buttonWidth = 180;
      const buttonHeight = 50;
      const isDisabled = this.isAutoMode || (this.gameScreenRef?.isControlsDisabled && this.gameScreenRef.isControlsDisabled()); // Disabled when auto is active or bet exceeds balance

      let backgroundColor: number;
      let textColor: number;
      let borderColor: number;

      if (isDisabled) {
        // Disabled state
        backgroundColor = 0x666666; // Gray
        textColor = 0x999999; // Light gray text
        borderColor = 0x888888; // Gray border
      } else {
        // Normal state
        backgroundColor = this.isTurboMode ? 0xFF1744 : 0xFF9800; // Red when active, orange when inactive
        textColor = 0xFFFFFF; // White text
        borderColor = 0xFFFFFF; // White border
      }

      button.clear();
      button.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
      button.fill({ color: backgroundColor });
      button.stroke({ color: borderColor, width: 2 });

      // Update text color
      buttonText.style.fill = textColor;

      // Store current state color for hover effects
      (button as any)._currentStateColor = backgroundColor;

      // Update interactive state
      this.turboButton.interactive = !isDisabled;
      this.turboButton.cursor = isDisabled ? "default" : "pointer";
      (this.turboButton as any)._isDisabled = isDisabled;
    }
  }

  private updateTurboButtonState() {
    this.updateTurboButtonAppearance();
  }

  private updateLaunchButtonState() {
    if (this.playbar) {
      const button = this.playbar.children[0] as Graphics;
      const buttonText = this.playbar.children[1] as Text;
      const buttonWidth = 180;
      const buttonHeight = 50;
      const isDisabled = this.isAutoMode || this.isTurboMode || (this.gameScreenRef?.isControlsDisabled && this.gameScreenRef.isControlsDisabled());

      // Update appearance based on state
      const backgroundColor = isDisabled ? 0x666666 : 0x4CAF50; // Gray when disabled, green when enabled
      const textColor = isDisabled ? 0x999999 : 0xFFFFFF; // Lighter text when disabled

      button.clear();
      button.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
      button.fill({ color: backgroundColor });
      button.stroke({ color: isDisabled ? 0x888888 : 0xFFFFFF, width: 2 });

      // Update text color
      buttonText.style.fill = textColor;

      // Store current state color for hover effects
      (button as any)._currentStateColor = backgroundColor;

      // Update interactive state
      this.playbar.interactive = !isDisabled;
      this.playbar.cursor = isDisabled ? "default" : "pointer";
      (this.playbar as any)._isDisabled = isDisabled;
    }
  }

  private createNewPuck(useAlternateTexture: boolean = false): Sprite {
    let newPuck: Sprite;

    // Check if we have loaded textures
    if (this.puckTexture && this.puck2Texture) {
      // Use loaded textures
      const texture = useAlternateTexture ? this.puck2Texture : this.puckTexture;
      newPuck = new Sprite(texture);
    } else {
      // Create fallback Graphics puck
      const fallbackPuck = new Graphics();
      fallbackPuck.circle(0, 0, 15);
      fallbackPuck.fill({ color: useAlternateTexture ? 0x0000FF : 0xFF0000 }); // Blue or Red
      newPuck = fallbackPuck as any;
    }

    // Set up the puck
    newPuck.anchor.set(0.5);
    newPuck.scale.set(0.8);
    newPuck.x = 0;
    newPuck.y = 443; // Launch pad position

    this.boardContainer.addChild(newPuck);
    return newPuck;
  }

  private async launchPuck() {
    const clickTime = performance.now();

    // Check if controls are disabled (bet exceeds balance)
    if (this.gameScreenRef?.isControlsDisabled && this.gameScreenRef.isControlsDisabled()) {
      console.log("🚫 Launch blocked - bet amount exceeds available balance");
      return;
    }

    // Reduced logging for performance in auto mode
    if (!this.isAutoMode) {
      console.log(`🚀 CLICK! Starting launch at ${clickTime.toFixed(2)}ms`);
    }

    // INSTANT BALANCE SUBTRACTION - Subtract bet amount immediately for instant feedback
    const betAmount = this.gameScreenRef?.getBetAmount() || 1.00;
    if (this.gameScreenRef?.updateBalance) {
      const currentBalance = this.gameScreenRef.getBalance() || 0;
      const newBalance = Math.max(0, currentBalance - betAmount); // Prevent negative balance
      this.gameScreenRef.updateBalance(newBalance);
      console.log(`💰 INSTANT: Subtracted $${betAmount} from balance immediately`);
    }

    // Create a new puck on-demand (alternate texture for visual distinction)
    const useAlternateTexture = this.currentPuckIndex === 1;
    const newPuck = this.createNewPuck(useAlternateTexture);

    if (!this.isAutoMode) {
      console.log(`🎯 Created new ${useAlternateTexture ? 'blue' : 'red'} puck for instant launch`);
    }

    // Launch the newly created puck INSTANTLY
    this.launchSpecificPuckInstant(newPuck, clickTime);

    // Switch texture for next puck (visual alternation)
    this.currentPuckIndex = this.currentPuckIndex === 0 ? 1 : 0;
  }

  private launchSpecificPuckInstant(puck: Sprite, clickTime: number) {
    // INSTANT VISUAL FEEDBACK - Start animation immediately!
    const animationStartTime = performance.now();
    console.log(`🎯 INSTANT ANIMATION! Started ${(animationStartTime - clickTime).toFixed(2)}ms after click`);

    // Add puck to active pucks list
    this.activePucks.push(puck);
    puck.visible = true;

    // Start the visual animation IMMEDIATELY with a random target for now
    const tempTargetZone = Math.floor(Math.random() * 12);
    const tempMultiplier = [0, 1000, 0, 500, 100, 25, 10, 5, 1, 0, 0, 0][tempTargetZone];
    const betAmount = this.gameScreenRef?.getBetAmount() || 1.00;

    // Start animation instantly with temporary data
    this.startInstantAnimation(puck, tempTargetZone, tempMultiplier, betAmount * tempMultiplier, clickTime);

    // Handle API calls in the background (non-blocking)
    this.handleBackgroundAPICall(puck, betAmount, clickTime);
  }

  private async handleBackgroundAPICall(_puck: Sprite, betAmount: number, clickTime: number) {
    try {
      const apiStartTime = performance.now();
      console.log(`📡 API CALL: Started ${(apiStartTime - clickTime).toFixed(2)}ms after click`);

      const betAmountMicro = stakeAPI.toMicroUnits(betAmount);

      // Track game event (background)
      stakeAPI.trackEvent('puck_launch').catch(console.error);

      // Call Stake API to play round
      const playResponse = await stakeAPI.play(betAmountMicro);
      const apiEndTime = performance.now();
      console.log(`📡 API RESPONSE: Received ${(apiEndTime - clickTime).toFixed(2)}ms after click (took ${(apiEndTime - apiStartTime).toFixed(2)}ms)`);

      // Update with the REAL balance from server (this corrects any discrepancies)
      // Only update if the server balance is significantly different from our prediction
      if (this.gameScreenRef?.updateBalance) {
        const serverBalance = stakeAPI.fromMicroUnits(playResponse.balance.amount);
        const currentDisplayBalance = this.gameScreenRef.getBalance() || 0;
        const expectedBalance = currentDisplayBalance; // We already subtracted the bet
        const difference = Math.abs(serverBalance - expectedBalance);

        // Only update if there's a significant difference (more than $0.01)
        // This prevents the jarring jump back to the old balance
        if (difference > 0.01) {
          this.gameScreenRef.updateBalance(serverBalance);
          console.log(`💰 SERVER: Balance corrected from $${currentDisplayBalance} to $${serverBalance} (diff: $${difference.toFixed(2)})`);
        } else {
          console.log(`💰 SERVER: Balance matches expectation ($${serverBalance}), no update needed`);
        }
      }

      // Extract real game result from round data
      const { multiplier, finalPosition, winAmount } = playResponse.round;
      const realTargetZone = finalPosition || 0;

      console.log(`🎲 REAL RESULT: Zone ${realTargetZone}, ${multiplier}x, $${stakeAPI.fromMicroUnits(winAmount || 0)}`);

      // The animation is already running with temp data, we could potentially update it
      // or just let it complete with the temp result for instant feedback

    } catch (error) {
      console.error("Error in background API call:", error);
      // If API fails, we should restore the balance since we pre-subtracted
      if (this.gameScreenRef?.updateBalance) {
        const currentBalance = this.gameScreenRef.getBalance() || 0;
        const restoredBalance = currentBalance + betAmount;
        this.gameScreenRef.updateBalance(restoredBalance);
        console.log(`💰 RESTORE: API failed, restored $${betAmount} to balance`);
      }
    }
  }

  private startInstantAnimation(puck: Sprite, targetZone: number, multiplier: number, winAmount: number, clickTime: number) {
    if (!puck || !engine().ticker.started) return;

    const animationStartTime = performance.now();
    console.log(`🎬 ANIMATION: Starting ${(animationStartTime - clickTime).toFixed(2)}ms after click`);

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
      duration: this.isTurboMode ? 200 + Math.random() * 100 : // TURBO: 0.2-0.3 seconds (ultra fast)
        this.isAutoMode ? 400 + Math.random() * 200 : // AUTO: 0.4-0.6 seconds (medium speed)
          1500 + Math.random() * 500, // MANUAL: 1.5-2 seconds (normal speed)
      startTime: performance.now(),
      puck: puck,
      clickTime: clickTime
    };

    // Ultra-smooth animation function with easing
    const animatePuck = () => {
      if (!puck || !puck.parent) {
        engine().ticker.remove(animatePuck, this);
        return;
      }

      const elapsed = performance.now() - animationData.startTime;
      const progress = Math.min(elapsed / animationData.duration, 1);

      // Ease out cubic for realistic physics (faster initial movement)
      const easeProgress = 1 - Math.pow(1 - progress, 2.5); // More aggressive easing

      // Update puck position with some horizontal drift for realism
      const drift = Math.sin(progress * Math.PI * 3) * 12; // Faster oscillation, less drift
      puck.y = animationData.startY + (animationData.targetY - animationData.startY) * easeProgress;
      puck.x = drift;

      // Animation complete
      if (progress >= 1) {
        const landTime = performance.now();
        console.log(`🎯 LANDED: ${(landTime - clickTime).toFixed(2)}ms total from click to land`);

        engine().ticker.remove(animatePuck, this);
        this.onInstantPuckLanded(puck, animationData.multiplier, animationData.winAmount);
      }
    };

    // Start animation immediately
    engine().ticker.add(animatePuck, this);

    console.log(`⚡ INSTANT: Animation started immediately, targeting zone ${targetZone} (${multiplier}x)`);
  }

  private async onInstantPuckLanded(puck: Sprite, multiplier: number, winAmount: number) {
    console.log(`🏆 RESULT: ${multiplier}x multiplier, $${winAmount.toFixed(2)} win`);

    // Update win display in control panel
    this.updatePanelWinDisplay(winAmount, multiplier);

    try {
      // Track landing event (background)
      stakeAPI.trackEvent('puck_landed').catch(console.error);

      // Handle wins in background
      if (winAmount > 0) {
        setTimeout(async () => {
          try {
            const endRoundResponse = await stakeAPI.endRound();
            if (this.gameScreenRef?.updateBalance) {
              const finalBalance = stakeAPI.fromMicroUnits(endRoundResponse.balance.amount);
              this.gameScreenRef.updateBalance(finalBalance);
            }
          } catch (error) {
            console.error("Error ending round:", error);
          }
        }, 100); // Very quick payout
      }

    } catch (error) {
      console.error("Error in instant puck landed handler:", error);
    } finally {
      // Remove puck from active list
      const index = this.activePucks.indexOf(puck);
      if (index > -1) {
        this.activePucks.splice(index, 1);
      }

      // Remove the puck from the board and destroy it (since it was created on-demand)
      if (puck.parent) {
        puck.parent.removeChild(puck);
      }
      puck.destroy();
      console.log("🗑️ Puck cleaned up and destroyed");

      // Continue auto or turbo mode if enabled
      if (this.isAutoMode || this.isTurboMode) {
        const delay = this.isTurboMode ? 2 : 5; // 2ms for turbo, 5ms for auto
        setTimeout(() => {
          if (this.isAutoMode || this.isTurboMode) {
            this.launchPuck();
          }
        }, delay);
      }
    }
  }

  private setupKeyboardControls() {
    try {
      console.log("Shuffleboard: Setting up keyboard controls");

      // Add keyboard event listener for spacebar and arrow keys
      const handleKeyDown = (event: KeyboardEvent) => {
        // Check if spacebar was pressed (keyCode 32 or key === ' ')
        if (event.code === 'Space' || event.key === ' ') {
          event.preventDefault(); // Prevent page scroll on spacebar

          // Only allow launch if both auto and turbo modes are off AND controls are not disabled
          if (!this.isAutoMode && !this.isTurboMode && !(this.gameScreenRef?.isControlsDisabled && this.gameScreenRef.isControlsDisabled())) {
            this.launchPuck();
            console.log("Spacebar pressed - launching puck");
          } else {
            if (this.gameScreenRef?.isControlsDisabled && this.gameScreenRef.isControlsDisabled()) {
              console.log("Spacebar pressed but controls disabled - bet exceeds balance");
            } else {
              console.log("Spacebar pressed but auto/turbo mode is active - ignoring");
            }
          }
        }
        // Handle up arrow for bet increase
        else if (event.code === 'ArrowUp' || event.key === 'ArrowUp') {
          event.preventDefault(); // Prevent page scroll

          // Check if controls are disabled
          if (this.gameScreenRef?.isControlsDisabled && this.gameScreenRef.isControlsDisabled()) {
            console.log("Up arrow pressed but controls disabled - bet exceeds balance");
            return;
          }

          if (this.gameScreenRef && this.gameScreenRef.increaseBet) {
            this.gameScreenRef.increaseBet();
            // Update visual bet display
            const newBet = this.gameScreenRef.getBetAmount() || 1.00;
            if ((this as any).betAmountText) {
              (this as any).betAmountText.text = `$${newBet.toFixed(2)}`;
            }
            // Update controls state after bet change
            this.updateControlsState();
            console.log("Up arrow pressed - increasing bet to", newBet);
          }
        }
        // Handle down arrow for bet decrease
        else if (event.code === 'ArrowDown' || event.key === 'ArrowDown') {
          event.preventDefault(); // Prevent page scroll

          // Check if controls are disabled
          if (this.gameScreenRef?.isControlsDisabled && this.gameScreenRef.isControlsDisabled()) {
            console.log("Down arrow pressed but controls disabled - bet exceeds balance");
            return;
          }

          if (this.gameScreenRef && this.gameScreenRef.decreaseBet) {
            this.gameScreenRef.decreaseBet();
            // Update visual bet display
            const newBet = this.gameScreenRef.getBetAmount() || 1.00;
            if ((this as any).betAmountText) {
              (this as any).betAmountText.text = `$${newBet.toFixed(2)}`;
            }
            // Update controls state after bet change
            this.updateControlsState();
            console.log("Down arrow pressed - decreasing bet to", newBet);
          }
        }
        // Handle ESC key to close menu
        else if (event.code === 'Escape' || event.key === 'Escape') {
          event.preventDefault();
          if (this.isMenuOpen) {
            this.closeMenuDropdown();
            console.log("ESC pressed - closing menu");
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

  private setupGlobalClickHandler() {
    try {
      console.log("Shuffleboard: Setting up global click handler for menu");

      // Add global click handler to close menu when clicking outside
      const handleGlobalClick = (_event: PointerEvent) => {
        if (this.isMenuOpen && this.menuDropdown && this.clickHandlerActive) {
          console.log("🔧 DEBUG: Global click detected while menu is open - closing menu");
          this.closeMenuDropdown();
        }
      };

      // Add the event listener to the document
      document.addEventListener('pointerdown', handleGlobalClick as any);

      // Store reference to remove listener later
      this.clickHandler = handleGlobalClick as any;

      console.log("Shuffleboard: Global click handler setup complete");
    } catch (error) {
      console.error("Shuffleboard: Error setting up global click handler:", error);
    }
  }

  public setGameScreenReference(gameScreen: any) {
    this.gameScreenRef = gameScreen;
    console.log("Shuffleboard: GameScreen reference set for bet controls");
  }

  public updateControlsState() {
    const isDisabled = this.gameScreenRef?.isControlsDisabled && this.gameScreenRef.isControlsDisabled();

    if (isDisabled) {
      console.log("Controls disabled - bet amount exceeds balance");
    }

    // Update launch button state
    this.updateLaunchButtonState();

    // Update auto/turbo button states
    this.updateAutoButtonState();
    this.updateTurboButtonState();

    // Update bet control buttons appearance
    this.updateBetControlsAppearance(isDisabled);
  }

  private updateBetControlsAppearance(isDisabled: boolean) {
    // Update decrease button appearance
    if ((this as any).betDecreaseBtn && (this as any).betDecreaseText && (this as any).betDecreaseContainer) {
      const decreaseBtn = (this as any).betDecreaseBtn;
      const decreaseText = (this as any).betDecreaseText;
      const decreaseContainer = (this as any).betDecreaseContainer;

      decreaseBtn.clear();
      decreaseBtn.circle(-50, 0, 15);
      decreaseBtn.fill({ color: isDisabled ? 0x666666 : 0xFF5722 });
      decreaseBtn.stroke({ color: isDisabled ? 0x888888 : 0xFFFFFF, width: 2 });
      decreaseText.style.fill = isDisabled ? 0x999999 : 0xFFFFFF;
      decreaseContainer.interactive = !isDisabled;
      decreaseContainer.cursor = isDisabled ? "default" : "pointer";
    }

    // Update increase button appearance
    if ((this as any).betIncreaseBtn && (this as any).betIncreaseText && (this as any).betIncreaseContainer) {
      const increaseBtn = (this as any).betIncreaseBtn;
      const increaseText = (this as any).betIncreaseText;
      const increaseContainer = (this as any).betIncreaseContainer;

      increaseBtn.clear();
      increaseBtn.circle(50, 0, 15);
      increaseBtn.fill({ color: isDisabled ? 0x666666 : 0x4CAF50 });
      increaseBtn.stroke({ color: isDisabled ? 0x888888 : 0xFFFFFF, width: 2 });
      increaseText.style.fill = isDisabled ? 0x999999 : 0xFFFFFF;
      increaseContainer.interactive = !isDisabled;
      increaseContainer.cursor = isDisabled ? "default" : "pointer";
    }
  }

  private updatePanelWinDisplay(winAmount: number, multiplier: number) {
    // Update win amount text in control panel
    if ((this as any).panelWinAmountText) {
      (this as any).panelWinAmountText.text = `$${winAmount.toFixed(2)}`;

      // Color coding based on win amount
      if (winAmount === 0) {
        (this as any).panelWinAmountText.style.fill = 0x888888; // Gray for no win
      } else if (winAmount < 10) {
        (this as any).panelWinAmountText.style.fill = 0x00FF00; // Green for small wins
      } else if (winAmount < 100) {
        (this as any).panelWinAmountText.style.fill = 0xFFD700; // Gold for medium wins
      } else {
        (this as any).panelWinAmountText.style.fill = 0xFF4500; // Orange-red for big wins
      }
    }

    // Update multiplier text in control panel
    if ((this as any).panelMultiplierText) {
      (this as any).panelMultiplierText.text = `${multiplier}x`;

      // Color coding based on multiplier
      if (multiplier === 0) {
        (this as any).panelMultiplierText.style.fill = 0x888888; // Gray for no multiplier
      } else if (multiplier <= 10) {
        (this as any).panelMultiplierText.style.fill = 0x87CEEB; // Baby blue for low multiplier
      } else if (multiplier <= 100) {
        (this as any).panelMultiplierText.style.fill = 0xFFD700; // Gold for medium multiplier
      } else {
        (this as any).panelMultiplierText.style.fill = 0xFF0000; // Red for high multiplier
      }
    }

    // Update win display background color based on win results
    if ((this as any).winDisplayContainer) {
      const winContainer = (this as any).winDisplayContainer;
      const winBg = winContainer.children[0] as Graphics; // First child is the background

      // Clear and redraw background with new color
      winBg.clear();
      winBg.roundRect(-90, -45, 180, 90, 10);

      if (winAmount === 0) {
        // No win - keep original dark background
        winBg.fill({ color: 0x1a1a1a, alpha: 0.9 });
        winBg.stroke({ color: 0xFFD700, width: 2 }); // Gold border
      } else if (multiplier >= 100) {
        // 100x or higher - blue background for big multiplier wins
        winBg.fill({ color: 0x0066CC, alpha: 0.9 }); // Blue background
        winBg.stroke({ color: 0x00AAFF, width: 3 }); // Bright blue border
        console.log(`🔵 BIG MULTIPLIER WIN! ${multiplier}x - Blue background activated`);
      } else {
        // Regular win - green background
        winBg.fill({ color: 0x006600, alpha: 0.9 }); // Green background
        winBg.stroke({ color: 0x00FF00, width: 3 }); // Bright green border
        console.log(`🟢 WIN! $${winAmount.toFixed(2)} - Green background activated`);
      }
    }

    console.log(`Panel win display updated: $${winAmount.toFixed(2)}, ${multiplier}x`);
  }

  public resize(width: number, height: number) {
    console.log("Shuffleboard resize called:", { width, height });

    // Define responsive breakpoints (media query style)
    const isMobile = width < 768; // Mobile: < 768px
    const isTablet = width >= 768 && width < 1024; // Tablet: 768px - 1023px
    const isDesktop = width >= 1024; // Desktop: >= 1024px
    const isLandscape = width > height;
    const isPortrait = height > width;

    console.log("Device type:", { isMobile, isTablet, isDesktop, isLandscape, isPortrait });

    // Calculate board and panel scales first
    let boardScale = 1.0;
    let panelScale = 1.0;

    if (isMobile) {
      boardScale = isPortrait ? 0.5 : 0.6; // Smaller on mobile
      panelScale = isPortrait ? 0.7 : 0.6;
    } else if (isTablet) {
      boardScale = isPortrait ? 0.7 : 0.8; // Medium on tablet
      panelScale = isPortrait ? 0.85 : 0.9;
    } else {
      boardScale = 1.0; // Full size on desktop
      panelScale = 1.0;
    }

    // Position shuffleboard container and components
    if (isMobile && isPortrait) {
      // Mobile Portrait: Stack vertically with no overlap
      this.x = width / 2;
      this.y = height * 0.35; // Position board higher

      if (this.buttonPanel) {
        // Position panel against the right edge with small margin
        this.buttonPanel.x = (width / 2) - 20; // Right side with 20px margin
        this.buttonPanel.y = height * 0.4; // Position panel below board with safe margin
        this.buttonPanel.scale.set(panelScale);
      }

      if (this.board) {
        this.board.scale.set(boardScale);
        // Adjust board position to prevent overlap
        this.boardContainer.y = -height * 0.15;
        this.boardContainer.scale.set(boardScale); // Scale the entire board container including borders
      }
    } else if (isMobile && isLandscape) {
      // Mobile Landscape: Side by side with tight spacing
      this.x = width * 0.35; // Move board left
      this.y = height / 2;

      if (this.buttonPanel) {
        // Position panel against the right edge
        this.buttonPanel.x = (width / 2) - 10; // Right edge with 10px margin
        this.buttonPanel.y = 0;
        this.buttonPanel.scale.set(panelScale);
      }

      if (this.board) {
        this.board.scale.set(boardScale);
        this.boardContainer.y = 0;
        this.boardContainer.scale.set(boardScale); // Scale the entire board container including borders
      }
    } else if (isTablet && isPortrait) {
      // Tablet Portrait: Side by side with medium spacing
      this.x = width * 0.4;
      this.y = height / 2;

      if (this.buttonPanel) {
        // Position panel against the right side with small margin
        this.buttonPanel.x = (width / 2) - 30; // Right side with 30px margin
        this.buttonPanel.y = 0;
        this.buttonPanel.scale.set(panelScale);
      }

      if (this.board) {
        this.board.scale.set(boardScale);
        this.boardContainer.y = 0;
        this.boardContainer.scale.set(boardScale); // Scale the entire board container including borders
      }
    } else {
      // Tablet Landscape and Desktop: Standard side by side layout
      this.x = width / 2;
      this.y = height / 2;

      if (this.buttonPanel) {
        let panelX = isDesktop ? (width / 2) - 200 : (width / 2) - 160;
        this.buttonPanel.x = panelX;
        this.buttonPanel.y = 0;
        this.buttonPanel.scale.set(panelScale);
      }

      if (this.board) {
        this.board.scale.set(boardScale);
        this.boardContainer.y = 0;
        this.boardContainer.scale.set(1.0); // Full scale for desktop
      }
    }

    console.log("Shuffleboard positioned at:", { x: this.x, y: this.y });

    if (this.buttonPanel) {
      console.log("Button panel positioned at:", {
        x: this.buttonPanel.x,
        y: this.buttonPanel.y,
        scale: panelScale
      });
    }

    if (this.board) {
      console.log("Board scaled to:", boardScale);
      console.log("Board container scaled to:", this.boardContainer.scale.x);
      console.log("Board container dimensions:", {
        width: this.board.width,
        height: this.board.height,
        x: this.board.x,
        y: this.board.y
      });
    }
  }

  public destroy() {
    // Clean up auto and turbo modes
    this.isAutoMode = false;
    this.isTurboMode = false;
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

    // Clean up global click handler
    if (this.clickHandler) {
      document.removeEventListener('pointerdown', this.clickHandler as any);
      this.clickHandler = undefined;
      console.log("Shuffleboard: Global click handler cleaned up");
    }

    // Clean up menu dropdown
    this.closeMenuDropdown();

    super.destroy();
  }
}
