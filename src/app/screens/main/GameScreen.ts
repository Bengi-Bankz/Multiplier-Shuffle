import type { Ticker } from "pixi.js";
import { Container, Text, TextStyle, Graphics } from "pixi.js";

import { Shuffleboard } from "../../../game/Shuffleboard";

/** The screen that holds the shuffleboard game */
export class GameScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  public mainContainer: Container;
  private shuffleboard: Shuffleboard;
  private balanceText: Text;
  private balance: number = 1000.00; // Starting balance

  // Bet area components
  private betContainer!: Container;
  private betText!: Text;
  private betUpArrow!: Container;
  private betDownArrow!: Container;
  private betAmount: number = 1.00; // Default bet amount
  private readonly minBet: number = 0.10;
  private readonly maxBet: number = 10000.00;

  // Menu components
  private menuContainer!: Container;
  private hamburgerButton!: Container;
  private dropdownMenu!: Container;
  private isMenuOpen: boolean = false;
  private gameInfoModal?: Container; // Game info modal

  constructor() {
    super();

    this.mainContainer = new Container();
    this.addChild(this.mainContainer);
    this.shuffleboard = new Shuffleboard();

    // Create balance text
    const balanceStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: '#ffffff',
      dropShadow: {
        color: '#000000',
        blur: 2,
        angle: Math.PI / 6,
        distance: 2,
      },
    });

    this.balanceText = new Text({
      text: this.getBalanceText(),
      style: balanceStyle,
    });

    // Position balance in top left corner
    this.balanceText.x = 20;
    this.balanceText.y = 20;

    // Add balance text directly to this screen (not mainContainer) so it stays fixed
    this.addChild(this.balanceText);

    // Create bet area
    this.createBetArea();

    // Create hamburger menu
    this.createHamburgerMenu();
  }

  /** Prepare the screen just before showing */
  public async prepare() {
    console.log("GameScreen: Prepare method called");
    await this.shuffleboard.init();
    console.log("GameScreen: Shuffleboard initialized");
    
    // Set GameScreen reference in Shuffleboard for keyboard controls
    this.shuffleboard.setGameScreenReference(this);
    console.log("GameScreen: Reference set in Shuffleboard for bet controls");
    
    this.mainContainer.addChild(this.shuffleboard);
    console.log("GameScreen: Shuffleboard added to container");
  }

  /** Update the screen */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {
    // Game updates would go here
  }

  /** Fully reset */
  public reset() { }

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    console.log("GameScreen resize called:", { width, height });

    // Don't center the mainContainer - let the shuffleboard handle its own positioning
    this.mainContainer.x = 0;
    this.mainContainer.y = 0;
    console.log("MainContainer positioned at origin");

    this.shuffleboard.resize(width, height);

    // Define responsive breakpoints (media query style)
    const isMobile = width < 768; // Mobile: < 768px
    const isTablet = width >= 768 && width < 1024; // Tablet: 768px - 1023px
    const isDesktop = width >= 1024; // Desktop: >= 1024px
    const isLandscape = width > height;
    const isPortrait = height > width;
    
    console.log("GameScreen device type:", { isMobile, isTablet, isDesktop, isLandscape, isPortrait });

    // Position balance text responsively
    if (this.balanceText) {
      if (isMobile) {
        // Mobile: Top left with smaller spacing
        this.balanceText.x = 20;
        this.balanceText.y = 30;
        // Scale down text on mobile
        this.balanceText.scale.set(isPortrait ? 0.8 : 0.9);
      } else if (isTablet) {
        // Tablet: Top left with medium spacing
        this.balanceText.x = 30;
        this.balanceText.y = 40;
        this.balanceText.scale.set(0.9);
      } else {
        // Desktop: Top left with generous spacing
        this.balanceText.x = 50;
        this.balanceText.y = 50;
        this.balanceText.scale.set(1.0);
      }
      console.log("Balance text positioned at:", { x: this.balanceText.x, y: this.balanceText.y });
    }

    // Position bet area under auto button (coordinate to auto button positioning from Shuffleboard)
    if (this.betContainer) {
      // Get auto button position relative to shuffleboard center
      let autoButtonX = 0;
      let autoButtonY = 0;
      
      // Calculate auto button position (same logic as in Shuffleboard resize method)
      if (isMobile) {
        if (isPortrait) {
          // Mobile Portrait: Horizontally aligned, left of launch button
          autoButtonX = (width / 2) + ((width / 2) - 120 - 200); // Launch button X minus 200px
          autoButtonY = (height / 2) + ((height / 2) - 120); // Same as launch button Y
        } else {
          // Mobile Landscape: Below launch button
          autoButtonX = (width / 2) + ((width / 2) - 140); // Same as launch button X
          autoButtonY = (height / 2) + (0 + 80); // 80px below launch button
        }
        this.betContainer.scale.set(0.7);
      } else if (isTablet) {
        if (isPortrait) {
          // Tablet Portrait: Horizontally aligned, more space
          autoButtonX = (width / 2) + ((width / 2) - 150 - 220); // Launch button X minus 220px
          autoButtonY = (height / 2) + ((height / 2) - 140); // Same as launch button Y
        } else {
          // Tablet Landscape: Below launch button with more space
          autoButtonX = (width / 2) + ((width / 2) - 160); // Same as launch button X
          autoButtonY = (height / 2) + (-(height / 6) + 100); // 100px below launch button
        }
        this.betContainer.scale.set(0.8);
      } else {
        // Desktop: Below launch button with generous spacing
        autoButtonX = (width / 2) + ((width / 2) - 200); // Same as launch button X
        autoButtonY = (height / 2) + (-(height / 4) + 120); // 120px below launch button
        this.betContainer.scale.set(0.9);
      }
      
      // Position bet controls below auto button
      this.betContainer.x = autoButtonX;
      this.betContainer.y = autoButtonY + 80; // 80px below auto button
      
      console.log("Bet area positioned under auto button at:", { x: this.betContainer.x, y: this.betContainer.y });
    }

    // Position hamburger menu responsively
    if (this.menuContainer) {
      if (isMobile) {
        // Mobile: Top right with less spacing
        this.menuContainer.x = width - 60;
        this.menuContainer.y = 30;
        this.menuContainer.scale.set(0.8);
      } else if (isTablet) {
        // Tablet: Top right with medium spacing
        this.menuContainer.x = width - 80;
        this.menuContainer.y = 40;
        this.menuContainer.scale.set(0.9);
      } else {
        // Desktop: Top right with generous spacing
        this.menuContainer.x = width - 100;
        this.menuContainer.y = 50;
        this.menuContainer.scale.set(1.0);
      }
      console.log("Menu positioned at:", { x: this.menuContainer.x, y: this.menuContainer.y });
    }

    // Position game info modal responsively if it exists
    if (this.gameInfoModal) {
      let modalScale = 1.0;
      
      if (isMobile) {
        modalScale = isPortrait ? 0.7 : 0.8;
      } else if (isTablet) {
        modalScale = 0.9;
      }
      
      this.gameInfoModal.scale.set(modalScale);
      this.gameInfoModal.x = width / 2;
      this.gameInfoModal.y = height / 2;
      console.log("Game info modal scaled and positioned:", { scale: modalScale, x: this.gameInfoModal.x, y: this.gameInfoModal.y });
    }
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    console.log("GameScreen showing - game canvas should be visible now");

    // Debug canvas info
    const canvas = document.querySelector('#pixi-container canvas');
    if (canvas) {
      console.log("Canvas found:", {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
        rect: canvas.getBoundingClientRect()
      });
    } else {
      console.log("Canvas not found in DOM");
    }

    // Simple show without animations or audio
  }

  /** Hide screen with animations */
  public async hide() { }

  private getBalanceText(): string {
    return `Balance: $${this.balance.toFixed(2)}`;
  }

  public updateBalance(newBalance: number) {
    this.balance = newBalance;
    this.balanceText.text = this.getBalanceText();
  }

  public getBalance(): number {
    return this.balance;
  }

  public addToBalance(amount: number) {
    this.balance += amount;
    this.balanceText.text = this.getBalanceText();
  }

  public subtractFromBalance(amount: number) {
    this.balance -= amount;
    this.balanceText.text = this.getBalanceText();
  }

  private createBetArea() {
    // Create container for the entire bet area
    this.betContainer = new Container();

    // Position bet area on top of the launch button
    // Will be properly positioned in resize method
    this.betContainer.x = 800; // Temporary position, will be updated in resize
    this.betContainer.y = 120; // Temporary position, will be updated in resize

    // Create "Bet" label at the top
    const betLabelStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 24, // Scaled up by 50% (16 * 1.5)
      fontWeight: 'bold',
      fill: '#ffffff',
      dropShadow: {
        color: '#000000',
        blur: 3,
        angle: Math.PI / 6,
        distance: 3,
      },
    });

    const betLabel = new Text({
      text: 'Bet',
      style: betLabelStyle,
    });
    betLabel.anchor.set(0.5); // Center the label
    betLabel.x = 0;
    betLabel.y = -22; // Position above the amount and arrows (scaled up)
    this.betContainer.addChild(betLabel);

    // Create left arrow button
    this.betDownArrow = this.createArrowButton(false);
    this.betDownArrow.x = -75; // Much wider spacing to accommodate up to 5 digits ($10,000.00)
    this.betDownArrow.y = 0; // Center aligned with bet text
    this.betContainer.addChild(this.betDownArrow);

    // Create bet amount text in the center
    const betAmountStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 27, // Scaled up by 50% (18 * 1.5)
      fontWeight: 'bold',
      fill: '#00ff00', // Green color for bet amount
      dropShadow: {
        color: '#000000',
        blur: 3,
        angle: Math.PI / 6,
        distance: 3,
      },
    });

    this.betText = new Text({
      text: this.getBetText(),
      style: betAmountStyle,
    });
    this.betText.anchor.set(0.5); // Center the text
    this.betText.x = 0; // Perfect center position
    this.betText.y = 0; // Center aligned with arrows
    this.betContainer.addChild(this.betText);

    // Create right arrow button
    this.betUpArrow = this.createArrowButton(true);
    this.betUpArrow.x = 75; // Much wider spacing to accommodate up to 5 digits ($10,000.00)
    this.betUpArrow.y = 0; // Center aligned with bet text
    this.betContainer.addChild(this.betUpArrow);

    // Add bet container to screen
    this.addChild(this.betContainer);
  }

  private createArrowButton(isUp: boolean): Container {
    const arrow = new Container();

    // Create arrow background - scaled up by 50%
    const bg = new Graphics();
    bg.roundRect(-15, -15, 30, 30, 3); // Scaled up from 20x20 to 30x30
    bg.fill({ color: 0x333333 });
    bg.stroke({ color: 0xffffff, width: 1.5 }); // Slightly thicker border

    // Create arrow shape - centered around (0,0) and scaled up
    const arrowShape = new Graphics();
    if (isUp) {
      // Up arrow (triangle pointing up) - scaled up
      arrowShape.moveTo(0, -6);
      arrowShape.lineTo(-6, 6);
      arrowShape.lineTo(6, 6);
      arrowShape.lineTo(0, -6);
    } else {
      // Down arrow (triangle pointing down) - scaled up
      arrowShape.moveTo(0, 6);
      arrowShape.lineTo(-6, -6);
      arrowShape.lineTo(6, -6);
      arrowShape.lineTo(0, 6);
    }
    arrowShape.fill({ color: 0xffffff });

    arrow.addChild(bg);
    arrow.addChild(arrowShape);

    // Make interactive
    arrow.interactive = true;
    arrow.cursor = 'pointer';

    // Add click handler
    arrow.on('pointerdown', () => {
      if (isUp) {
        this.increaseBet();
      } else {
        this.decreaseBet();
      }
    });

    // Add hover effects
    arrow.on('pointerover', () => {
      bg.clear();
      bg.roundRect(-15, -15, 30, 30, 3);
      bg.fill({ color: 0x555555 }); // Lighter on hover
      bg.stroke({ color: 0x00ff00, width: 3 }); // Green border on hover, thicker
    });

    arrow.on('pointerout', () => {
      bg.clear();
      bg.roundRect(-15, -15, 30, 30, 3);
      bg.fill({ color: 0x333333 });
      bg.stroke({ color: 0xffffff, width: 1.5 });
    });

    return arrow;
  }

  private getBetText(): string {
    return `$${this.betAmount.toFixed(2)}`;
  }

  public increaseBet() {
    let newBet = this.betAmount;

    // Increment logic based on current amount
    if (newBet < 1) {
      newBet += 0.10;
    } else if (newBet < 10) {
      newBet += 1;
    } else if (newBet < 100) {
      newBet += 10;
    } else if (newBet < 1000) {
      newBet += 100;
    } else {
      newBet += 1000;
    }

    // Ensure we don't exceed max bet
    if (newBet <= this.maxBet) {
      this.betAmount = Math.round(newBet * 100) / 100; // Round to 2 decimal places
      this.betText.text = this.getBetText();
    }
  }

  public decreaseBet() {
    let newBet = this.betAmount;

    // Decrement logic based on current amount
    if (newBet <= 1) {
      newBet -= 0.10;
    } else if (newBet <= 10) {
      newBet -= 1;
    } else if (newBet <= 100) {
      newBet -= 10;
    } else if (newBet <= 1000) {
      newBet -= 100;
    } else {
      newBet -= 1000;
    }

    // Ensure we don't go below min bet
    if (newBet >= this.minBet) {
      this.betAmount = Math.round(newBet * 100) / 100; // Round to 2 decimal places
      this.betText.text = this.getBetText();
    }
  }

  public getBetAmount(): number {
    return this.betAmount;
  }

  public setBetAmount(amount: number) {
    if (amount >= this.minBet && amount <= this.maxBet) {
      this.betAmount = Math.round(amount * 100) / 100; // Round to 2 decimal places
      this.betText.text = this.getBetText();
    }
  }

  private createHamburgerMenu() {
    // Create main menu container
    this.menuContainer = new Container();

    // Create hamburger button (three lines)
    this.hamburgerButton = new Container();
    
    // Create button background
    const buttonBg = new Graphics();
    buttonBg.roundRect(-25, -25, 50, 50, 8);
    buttonBg.fill({ color: 0x333333, alpha: 0.8 });
    buttonBg.stroke({ color: 0xffffff, width: 2 });
    
    // Create three horizontal lines
    const lineStyle = { color: 0xffffff, width: 3 };
    
    // Top line
    const line1 = new Graphics();
    line1.moveTo(-12, -8);
    line1.lineTo(12, -8);
    line1.stroke(lineStyle);
    
    // Middle line
    const line2 = new Graphics();
    line2.moveTo(-12, 0);
    line2.lineTo(12, 0);
    line2.stroke(lineStyle);
    
    // Bottom line
    const line3 = new Graphics();
    line3.moveTo(-12, 8);
    line3.lineTo(12, 8);
    line3.stroke(lineStyle);
    
    // Add all elements to hamburger button
    this.hamburgerButton.addChild(buttonBg);
    this.hamburgerButton.addChild(line1);
    this.hamburgerButton.addChild(line2);
    this.hamburgerButton.addChild(line3);
    
    // Make button interactive
    this.hamburgerButton.interactive = true;
    this.hamburgerButton.cursor = 'pointer';
    
    // Add click handler
    this.hamburgerButton.on('pointerdown', () => {
      this.toggleMenu();
    });
    
    // Add hover effects
    this.hamburgerButton.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.roundRect(-25, -25, 50, 50, 8);
      buttonBg.fill({ color: 0x555555, alpha: 0.9 });
      buttonBg.stroke({ color: 0x00ff00, width: 3 });
    });
    
    this.hamburgerButton.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.roundRect(-25, -25, 50, 50, 8);
      buttonBg.fill({ color: 0x333333, alpha: 0.8 });
      buttonBg.stroke({ color: 0xffffff, width: 2 });
    });
    
    // Create dropdown menu (initially hidden)
    this.dropdownMenu = new Container();
    this.dropdownMenu.visible = false;
    
    // Dropdown background
    const dropdownBg = new Graphics();
    dropdownBg.roundRect(-120, 0, 240, 200, 8); // Increased width from 160 to 240
    dropdownBg.fill({ color: 0x222222, alpha: 0.95 });
    dropdownBg.stroke({ color: 0xffffff, width: 2 });
    this.dropdownMenu.addChild(dropdownBg);
    
    // Create menu items
    const menuItems = [
      { text: "GAME INFO", action: () => this.showGameInfo() },
      { text: "RTP/ODDS", action: () => console.log("RTP/Odds clicked") },
      { text: "WHY STAKE ENGINE?", action: () => console.log("Why Stake Engine clicked") },
      { text: "EXIT", action: () => console.log("Exit clicked") }
    ];
    
    const itemStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 18,
      fontWeight: 'bold',
      fill: '#ffffff',
      align: 'center'
    });
    
    menuItems.forEach((item, index) => {
      const menuItem = new Container();
      
      // Item background
      const itemBg = new Graphics();
      itemBg.roundRect(-115, -15, 230, 30, 5); // Increased width from 150 to 230
      itemBg.fill({ color: 0x333333, alpha: 0.5 });
      
      // Item text
      const itemText = new Text({
        text: item.text,
        style: itemStyle,
      });
      itemText.anchor.set(0.5);
      itemText.x = 0;
      itemText.y = 0;
      
      menuItem.addChild(itemBg);
      menuItem.addChild(itemText);
      
      // Position item
      menuItem.x = 0;
      menuItem.y = 25 + (index * 40);
      
      // Make interactive
      menuItem.interactive = true;
      menuItem.cursor = 'pointer';
      
      // Add click handler
      menuItem.on('pointerdown', () => {
        item.action();
        this.toggleMenu(); // Close menu after clicking item
      });
      
      // Add hover effects
      menuItem.on('pointerover', () => {
        itemBg.clear();
        itemBg.roundRect(-115, -15, 230, 30, 5); // Increased width from 150 to 230
        itemBg.fill({ color: 0x555555, alpha: 0.8 });
      });
      
      menuItem.on('pointerout', () => {
        itemBg.clear();
        itemBg.roundRect(-115, -15, 230, 30, 5); // Increased width from 150 to 230
        itemBg.fill({ color: 0x333333, alpha: 0.5 });
      });
      
      this.dropdownMenu.addChild(menuItem);
    });
    
    // Add components to menu container
    this.menuContainer.addChild(this.hamburgerButton);
    this.menuContainer.addChild(this.dropdownMenu);
    
    // Position menu in top right (will be updated in resize)
    this.menuContainer.x = 800; // Temporary position
    this.menuContainer.y = 50;  // Temporary position
    
    // Add menu to screen
    this.addChild(this.menuContainer);
  }
  
  private toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.dropdownMenu.visible = this.isMenuOpen;
    
    console.log("Menu toggled:", this.isMenuOpen ? "opened" : "closed");
  }

  private showGameInfo() {
    console.log("Showing game info modal");
    this.createGameInfoModal();
  }

  private createGameInfoModal() {
    // Remove existing modal if it exists
    if (this.gameInfoModal) {
      this.removeChild(this.gameInfoModal);
      this.gameInfoModal.destroy();
    }

    // Create game info modal container
    this.gameInfoModal = new Container();
    
    // Modal background with rounded rectangle
    const modalWidth = 400;
    const modalHeight = 300;
    const modalBg = new Graphics();
    modalBg.roundRect(-modalWidth/2, -modalHeight/2, modalWidth, modalHeight, 15);
    modalBg.fill({ color: 0x000000, alpha: 0.9 }); // Semi-transparent black background
    modalBg.stroke({ color: 0x87CEEB, width: 3 }); // Baby blue border
    
    // Title text
    const titleText = new Text("GAME INFO", {
      fontSize: 28,
      fontWeight: 'bold',
      fill: 0x87CEEB, // Baby blue color
      align: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    titleText.anchor.set(0.5);
    titleText.x = 0;
    titleText.y = -120;
    
    // Game description
    const descText = new Text("Launch the puck up the board to hit multiplier zones.\nHigher zones give bigger wins!", {
      fontSize: 16,
      fill: 0xFFFFFF, // White color
      align: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    descText.anchor.set(0.5);
    descText.x = 0;
    descText.y = -80;
    
    // Keyboard controls section
    const controlsTitle = new Text("KEYBOARD CONTROLS", {
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0x87CEEB, // Baby blue color
      align: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    controlsTitle.anchor.set(0.5);
    controlsTitle.x = 0;
    controlsTitle.y = -30;
    
    // Spacebar control
    const spaceText = new Text("SPACEBAR - Launch Puck", {
      fontSize: 16,
      fill: 0xFFFFFF, // White color
      align: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    spaceText.anchor.set(0.5);
    spaceText.x = 0;
    spaceText.y = 10;
    
    // Arrow keys control
    const arrowText = new Text("↑↓ ARROWS - Adjust Bet Amount", {
      fontSize: 16,
      fill: 0xFFFFFF, // White color
      align: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    arrowText.anchor.set(0.5);
    arrowText.x = 0;
    arrowText.y = 40;
    
    // Close button
    const closeButton = new Container();
    const closeBg = new Graphics();
    closeBg.roundRect(-60, -20, 120, 40, 8);
    closeBg.fill({ color: 0x87CEEB }); // Baby blue background
    closeBg.stroke({ color: 0xFFFFFF, width: 2 }); // White border
    
    const closeText = new Text("CLOSE", {
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0x000000, // Black text
      align: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    closeText.anchor.set(0.5);
    closeText.x = 0;
    closeText.y = 0;
    
    closeButton.addChild(closeBg);
    closeButton.addChild(closeText);
    closeButton.x = 0;
    closeButton.y = 100;
    
    // Make close button interactive
    closeButton.interactive = true;
    closeButton.cursor = 'pointer';
    
    closeButton.on('pointerdown', () => {
      this.closeGameInfo();
    });
    
    closeButton.on('pointerover', () => {
      closeBg.clear();
      closeBg.roundRect(-60, -20, 120, 40, 8);
      closeBg.fill({ color: 0xA0D8F0 }); // Lighter blue on hover
      closeBg.stroke({ color: 0xFFFFFF, width: 2 });
    });
    
    closeButton.on('pointerout', () => {
      closeBg.clear();
      closeBg.roundRect(-60, -20, 120, 40, 8);
      closeBg.fill({ color: 0x87CEEB }); // Normal blue
      closeBg.stroke({ color: 0xFFFFFF, width: 2 });
    });
    
    // Add all elements to modal container
    this.gameInfoModal.addChild(modalBg);
    this.gameInfoModal.addChild(titleText);
    this.gameInfoModal.addChild(descText);
    this.gameInfoModal.addChild(controlsTitle);
    this.gameInfoModal.addChild(spaceText);
    this.gameInfoModal.addChild(arrowText);
    this.gameInfoModal.addChild(closeButton);
    
    // Center the modal on screen
    this.gameInfoModal.x = this.mainContainer.width / 2;
    this.gameInfoModal.y = this.mainContainer.height / 2;
    
    this.addChild(this.gameInfoModal);
    
    console.log("Game info modal created and displayed");
  }

  private closeGameInfo() {
    if (this.gameInfoModal) {
      this.removeChild(this.gameInfoModal);
      this.gameInfoModal.destroy();
      this.gameInfoModal = undefined;
      console.log("Game info modal closed");
    }
  }
}
