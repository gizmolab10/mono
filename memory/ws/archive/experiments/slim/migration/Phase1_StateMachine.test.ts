import { StateMachine } from '../../../slim/StateMachine';

describe('Phase 1 - Basic State Machine', () => {
    it('creates machine with initial state', () => {
        const machine = new StateMachine({
            states: ['idle', 'layoutComputing', 'componentsComputing', 'done'],
            transitions: {
                idle: ['layoutComputing'],
                layoutComputing: ['componentsComputing'],
                componentsComputing: ['done']
            }
        }, 'idle');
        
        expect(machine.getState()).toBe('idle');
    });

    it('allows valid transitions', async () => {
        const machine = new StateMachine({
            states: ['idle', 'layoutComputing'],
            transitions: {
                idle: ['layoutComputing']
            }
        }, 'idle');

        await machine.transition('layoutComputing');
        expect(machine.getState()).toBe('layoutComputing');
    });

    it('prevents invalid transitions', async () => {
        const machine = new StateMachine({
            states: ['idle', 'layoutComputing'],
            transitions: {
                idle: ['layoutComputing']
            }
        }, 'idle');

        await expect(machine.transition('done'))
            .rejects
            .toThrow('Invalid transition');
    });
});
