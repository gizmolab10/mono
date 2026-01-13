export class DependencyTester {
    constructor(private machine: any) {}

    async verifyDependencyOrder(dependencies: string[][]) {
        for (const [dependent, dependency] of dependencies) {
            await this.verifyDependency(dependent, dependency);
        }
    }

    private async verifyDependency(dependent: string, dependency: string) {
        await expect(async () => {
            await this.machine.transition(dependent);
        }).rejects.toThrow(`Required state ${dependency} not completed`);
    }
}
