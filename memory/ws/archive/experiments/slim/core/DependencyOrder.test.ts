import { createStateMachine } from '../../../slim/StateMachine';

describe('Dependency Ordering', () => {
    test('enforces correct transition order', async () => {
        const machine = createStateMachine({/*...*/}, 'idle');
        
        await expect(async () => {
            await machine.transition('componentsComputing');
        }).rejects.toThrow('Required state layoutComputing not completed');
    });

    test('handles concurrent transitions correctly', async () => {
        const machine = createStateMachine({/*...*/}, 'idle');
        
        const promises = [
            machine.transition('layoutComputing'),
            machine.transition('componentsComputing')
        ];
        
        await expect(Promise.all(promises)).rejects.toThrow();
    });

    test('maintains order under load', async () => {
        const machine = createStateMachine({/*...*/}, 'idle');
        const operations = Array(100).fill(null).map(() => 
            machine.transition('layoutComputing')
        );
        
        await Promise.all(operations);
        expect(machine.currentState).toBe('layoutComputing');
    });
});
