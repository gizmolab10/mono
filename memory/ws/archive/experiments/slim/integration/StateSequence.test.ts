import { createStateMachine } from '../../../slim/StateMachine';

describe('State Sequences', () => {
    test('follows correct transition sequence', async () => {
        const machine = createStateMachine({/*...*/}, 'idle');
        
        await machine.transition('layoutComputing');
        await machine.transition('componentsComputing');
        await machine.transition('done');
        
        expect(machine.history).toEqual([
            'idle',
            'layoutComputing',
            'componentsComputing',
            'done'
        ]);
    });
});
