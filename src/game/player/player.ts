export class Player {
    coins: number;
    team: string;

    constructor(params: {team: string; startCoins?: number}) {
        this.team = params.team;
        this.coins = params.startCoins ?? 0;
    }

    addCoins(count: number): void {
        this.coins += count;
    }

    removeCoins(count: number): void {
        this.coins -= count;
    }

    isSameTeam(team: string): boolean {
        return this.team === team;
    }
}
