import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";

import { Shuffleboard } from "../../../game/Shuffleboard";

/** The screen that holds the shuffleboard game */
export class GameScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  public mainContainer: Container;
  private shuffleboard: Shuffleboard;

  constructor() {
    super();

    this.mainContainer = new Container();
    this.addChild(this.mainContainer);
    this.shuffleboard = new Shuffleboard();
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
}
