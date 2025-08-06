import { Container } from "pixi.js";

export class LoadScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["preload"];

  private loaderImage: HTMLImageElement | null = null;

  constructor() {
    super();
  }

  /** Prepare the screen just before showing */
  public prepare() {
    // Show the stake-engine-loader.gif immediately
    this.showStakeEngineLoader();
  }

  private showStakeEngineLoader() {
    this.loaderImage = document.createElement("img");
    this.loaderImage.src = `/assets/main/stake-engine-loader.gif`;
    this.loaderImage.style.position = "fixed";
    this.loaderImage.style.top = "0";
    this.loaderImage.style.left = "0";
    this.loaderImage.style.width = "100vw";
    this.loaderImage.style.height = "100vh";
    this.loaderImage.style.objectFit = "cover";
    this.loaderImage.style.zIndex = "1000";
    this.loaderImage.style.backgroundColor = "#000000";
    document.body.appendChild(this.loaderImage);
    
    // Switch to static PNG after animation completes
    setTimeout(() => {
      if (this.loaderImage) {
        this.loaderImage.src = `/assets/main/stakeloader.png`;
      }
    }, 1500); // Half of the previous 3000ms
  }

  private async showOnlySpinsLoader() {
    // Remove the stake engine loader
    this.removeLoader();
    
    // Show the onlyspins loader full screen
    this.loaderImage = document.createElement("img");
    this.loaderImage.src = `/assets/main/onlyspinsloader.gif`;
    this.loaderImage.style.position = "fixed";
    this.loaderImage.style.top = "0";
    this.loaderImage.style.left = "0";
    this.loaderImage.style.width = "100vw";
    this.loaderImage.style.height = "100vh";
    this.loaderImage.style.objectFit = "cover";
    this.loaderImage.style.zIndex = "1000";
    this.loaderImage.style.backgroundColor = "#000000";
    document.body.appendChild(this.loaderImage);
    
    // Switch to static PNG after animation completes
    setTimeout(() => {
      if (this.loaderImage) {
        this.loaderImage.src = `/assets/main/onlyspinsloader.png`;
      }
    }, 3000); // Adjust based on actual GIF duration
    
    // Show for a bit
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  private async loadGameAssets() {
    // Assets are automatically loaded by the navigation system when GameScreen is shown
    // Just add a delay to show the loader
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  private removeLoader() {
    if (this.loaderImage && this.loaderImage.parentNode) {
      this.loaderImage.parentNode.removeChild(this.loaderImage);
      this.loaderImage = null;
    }
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    console.log("LoadScreen: Starting show method");
    // Load the assets and show the loader for a bit
    await this.loadGameAssets();
    console.log("LoadScreen: First loader completed");
    
    // Show the onlyspins loader after the first loader
    await this.showOnlySpinsLoader();
    console.log("LoadScreen: Second loader completed, LoadScreen should end now");
  }

  /** Hide screen with animations */
  public async hide() {
    this.removeLoader();
  }

  /** Resize the screen */
  public resize(_width: number, _height: number) {
    // No resize needed for loader
  }
}
