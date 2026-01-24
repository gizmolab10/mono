import { StateMachine } from '../../../slim/StateMachine';
import { T_Signal } from '../../../../src/lib/ts/common/Enumerations';

describe('Phase 4 - Parallel Operation', () => {
    const mockSignals = {
        signal_reposition_widgets_from: jest.fn(),
        signal_isInFlight_for: jest.fn().mockReturnValue(false)
    };

    const mockSignalHandler = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('allows state machine and signals to operate independently', async () => {
        // Set up state machine
        const machine = new StateMachine({
            states: ['idle', 'layoutComputing'],
            transitions: {
                idle: ['layoutComputing']
            }
        }, 'idle');

        // Run operations in parallel
        await Promise.all([
            machine.transition('layoutComputing'),
            mockSignals.signal_reposition_widgets_from()
        ]);

        // Verify both systems worked
        expect(machine.getState()).toBe('layoutComputing');
        expect(mockSignals.signal_reposition_widgets_from).toHaveBeenCalled();
    });

    it('maintains signal system integrity during state transitions', async () => {
        const machine = new StateMachine({
            states: ['idle', 'layoutComputing'],
            transitions: {
                idle: ['layoutComputing']
            }
        }, 'idle');

        // Transition shouldn't interfere with signal in-flight tracking
        await machine.transition('layoutComputing');
        expect(mockSignals.signal_isInFlight_for).not.toHaveBeenCalled();
    });
});
