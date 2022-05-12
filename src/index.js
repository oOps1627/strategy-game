"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const world_1 = require("./world/world");
const map_1 = require("./world/map");
const world = new world_1.World({ map: map_1.DEFAULT_MAP });
start(world);
function start(world) {
    world.render();
    setInterval(() => world.update(), 10);
}
//# sourceMappingURL=index.js.map