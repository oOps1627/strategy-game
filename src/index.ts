import "./styles.css";
import { loadRedactor } from "./map-redactor";
import { loadGame } from "./game";
import {LEVEL_1_MAP} from "./game/maps/level1.map";
import {loadMenu} from "./menu/menu";

// loadRedactor();
// loadMenu();
loadGame(LEVEL_1_MAP);

