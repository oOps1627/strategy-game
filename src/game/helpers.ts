import { IPosition } from "./models";

export function getRandomInteger(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

export function isSamePosition(position1: IPosition, position2: IPosition): boolean {
    return position1.x === position2.x && position1.y === position2.y;
}

export function getPositionAfterMoving(startPosition: IPosition, targetPosition: IPosition, steps: number): IPosition {
    const distance = Math.sqrt(Math.pow(startPosition.x - targetPosition.x, 2) + Math.pow(startPosition.y - targetPosition.y, 2));
    const stepsInPercentFromDistance = steps * 100 / distance;

    let XOffset = stepsInPercentFromDistance * Math.abs(startPosition.x - targetPosition.x) / 100;
    let YOffset = stepsInPercentFromDistance * Math.abs(startPosition.y - targetPosition.y) / 100;
    YOffset = startPosition.y - targetPosition.y < 0 ? YOffset : -YOffset;
    XOffset = startPosition.x - targetPosition.x < 0 ? XOffset : -XOffset;

    return {x: startPosition.x + XOffset, y: startPosition.y + YOffset};
}

export function getAngleForRotation(startPosition: IPosition, targetPosition: IPosition): number {
    return Math.atan2(startPosition.y - targetPosition.y, startPosition.x - targetPosition.x) * 180 / Math.PI
}
