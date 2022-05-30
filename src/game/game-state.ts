import {IMap} from "./maps/map";

interface IGameState {
    currentMap: IMap | null;
}

export const GAME_STATE: IGameState = {
    currentMap: null,
}