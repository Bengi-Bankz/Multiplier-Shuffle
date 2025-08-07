import type { Ticker } from "pixi.js";
import { Container, Text, TextStyle, Graphics } from "pixi.js";

import { Shuffleboard } from "../../../game/Shuffleboard";

/** The screen that holds the shuffleboard game */
export class GameScreen extends Container {
  public mainContainer: Container;
  private shuffleboard: Shuffleboard;
  private balanceText: Text;
  private balance: number = 1000.00; // Starting balance

  // Bet area components (REMOVED - now using button panel in Shuffleboard)
  // private betContainer!: Container;
  // private betText!: Text;
  // private betUpArrow!: Container;
  // private betDownArrow!: Container;
  private betAmount: number = 1.00; // Default bet amount
  private readonly minBet: number = 0.10;
  private readonly maxBet: number = 10000.00;

  // Menu components (REMOVED - now using button panel in Shuffleboard)
  // private menuContainer!: Container;
  // private hamburgerButton!: Container;
  // private dropdownMenu!: Container;
  // private isMenuOpen: boolean = false;
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

    // Create bet area (REMOVED - now using button panel in Shuffleboard)
    // this.createBetArea();

    // Create hamburger menu (REMOVED - now using button panel in Shuffleboard)
    // this.createHamburgerMenu();
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

    // Position bet area under auto button (REMOVED - now using button panel in Shuffleboard)
    // Old bet area positioning code removed

    // Position hamburger menu responsively (REMOVED - now using button panel in Shuffleboard)
    // Old hamburger menu positioning code removed

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

    // Update shuffleboard controls state when balance changes
    if (this.shuffleboard && (this.shuffleboard as any).updateControlsState) {
      (this.shuffleboard as any).updateControlsState();
    }
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

    // Ensure we don't exceed max bet and don't exceed balance
    if (newBet <= this.maxBet && newBet <= this.balance) {
      this.betAmount = Math.round(newBet * 100) / 100; // Round to 2 decimal places
      // Note: UI update now handled by Shuffleboard button panel
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
      // Note: UI update now handled by Shuffleboard button panel
    }
  }

  public getBetAmount(): number {
    return this.betAmount;
  }

  public setBetAmount(amount: number) {
    if (amount >= this.minBet && amount <= this.maxBet) {
      this.betAmount = Math.round(amount * 100) / 100; // Round to 2 decimal places
      // Note: UI update now handled by Shuffleboard button panel
    }
  }

  public isControlsDisabled(): boolean {
    return this.betAmount > this.balance;
  }

  // Game info modal methods (kept for functionality)
  public showGameInfo() {
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
    modalBg.roundRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 15);
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
