import "./styles.css";
import { loadRedactor } from "./map-redactor";
import {LEVEL_1_MAP} from "./game/maps/level1.map";
import {loadMenu} from "./menu/menu";
import { loadGame } from "./game/game";

// loadRedactor();
// loadMenu();
loadGame(LEVEL_1_MAP);

