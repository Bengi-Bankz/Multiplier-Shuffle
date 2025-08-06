import { setEngine } from "./app/getEngine";
import { LoadScreen } from "./app/screens/LoadScreen";
import { GameScreen } from "./app/screens/main/GameScreen";
import { userSettings } from "./app/utils/userSettings";
import { CreationEngine } from "./engine/engine";

/**
 * Importing these modules will automatically register there plugins with the engine.
 */
// import "@pixi/sound";
// import "@esotericsoftware/spine-pixi-v8";

// Create a new creation engine instance
const engine = new CreationEngine();
setEngine(engine);

(async () => {
  // Initialize the creation engine instance
  await engine.init({
    background: "#2C2C2C", // Dark grey background
    resizeOptions: { minWidth: 768, minHeight: 1024, letterbox: false },
  });

  // Initialize the user settings
  userSettings.init();

  console.log("Main: Starting LoadScreen");
  // Show the load screen
  await engine.navigation.showScreen(LoadScreen);
  console.log("Main: LoadScreen completed, starting GameScreen");
  // Show the game screen once the load screen is dismissed
  await engine.navigation.showScreen(GameScreen);
  console.log("Main: GameScreen should now be visible");
})();
