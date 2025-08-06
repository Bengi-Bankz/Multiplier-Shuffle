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
  }

  /** Prepare the screen just before showing */
  public async prepare() {
    console.log("GameScreen: Prepare method called");
    await this.shuffleboard.init();
    console.log("GameScreen: Shuffleboard initialized");
    this.mainContainer.addChild(this.shuffleboard);
    console.log("GameScreen: Shuffleboard added to container");
  }

  /** Update the screen */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {
    // Game updates would go here
  }

  /** Fully reset */
  public reset() {}

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    console.log("GameScreen resize called:", { width, height });
    
    // Don't center the mainContainer - let the shuffleboard handle its own positioning
    this.mainContainer.x = 0;
    this.mainContainer.y = 0;
    console.log("MainContainer positioned at origin");

    this.shuffleboard.resize(width, height);
    
    // Update bet area position to be relative to the shuffleboard position
    // Shuffleboard positions itself at width/3, height/2
    if (this.betContainer) {
      this.betContainer.x = (width / 3) + 400; // Same x as the launch button (400px offset in shuffleboard)
      this.betContainer.y = (height / 2) + 120; // Above the launch button (launch button is at +200, so 80px above)
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
  public async hide() {}

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

  private increaseBet() {
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

  private decreaseBet() {
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
}
