export interface TestCase {
    initialState: string;
    actions: string[];
    expectedState: string;
    shouldThrow?: boolean;
}

export const standardTestCases: TestCase[] = [
    {
        initialState: 'idle',
        actions: ['layoutComputing'],
        expectedState: 'layoutComputing'
    },
    {
        initialState: 'layoutComputing',
        actions: ['componentsComputing'],
        expectedState: 'componentsComputing'
    }
];
