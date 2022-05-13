export function getRandomInteger(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}
