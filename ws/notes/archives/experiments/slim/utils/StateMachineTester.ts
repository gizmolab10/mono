export class StateMachineTester {
    constructor(private machine: any) {}

    async runTransitionTests(cases: TestCase[]) {
        for (const testCase of cases) {
            await this.runSingleTest(testCase);
        }
    }

    private async runSingleTest(testCase: TestCase) {
        const { initialState, actions, expectedState } = testCase;
        this.machine.setState(initialState);
        
        for (const action of actions) {
            await this.machine.transition(action);
        }
        
        expect(this.machine.currentState).toBe(expectedState);
    }
}
