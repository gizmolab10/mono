import { createStateMachine } from '../../../slim/StateMachine';

describe('State Machine Core', () => {
    test('creates machine with valid initial state', () => {
        const machine = createStateMachine({
            states: ['idle', 'layoutComputing', 'componentsComputing', 'done'],
            transitions: {
                idle: ['layoutComputing'],
                layoutComputing: ['componentsComputing'],
                componentsComputing: ['done']
            }
        }, 'idle');
        
        expect(machine.currentState).toBe('idle');
    });

    test('allows valid transitions', () => {
        const machine = createStateMachine({/*...*/}, 'idle');
        machine.transition('layoutComputing');
        expect(machine.currentState).toBe('layoutComputing');
    });

    test('prevents invalid transitions', () => {
        const machine = createStateMachine({/*...*/}, 'idle');
        expect(() => machine.transition('done')).toThrow();
    });

    test('maintains transition history', () => {
        const machine = createStateMachine({/*...*/}, 'idle');
        machine.transition('layoutComputing');
        expect(machine.history).toEqual(['idle', 'layoutComputing']);
    });
});
