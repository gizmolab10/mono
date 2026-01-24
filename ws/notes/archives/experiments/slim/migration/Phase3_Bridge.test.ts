import { StateMachine } from '../../../slim/StateMachine';
import { T_Signal } from '../../../common/Enumerations';

describe('Phase 3 - First Bridge Point', () => {
    // Mock the signals system
    const mockSignals = {
        signal_reposition_widgets_from: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('triggers reposition signal on layout transition', async () => {
        // Create a bridged state machine
        const machine = new StateMachine({
            states: ['idle', 'layoutComputing'],
            transitions: {
                idle: ['layoutComputing']
            }
        }, 'idle');

        // Add signal bridge behavior
        const bridgedMachine = {
            ...machine,
            async transition(newState: string) {
                await machine.transition(newState);
                if (newState === 'layoutComputing') {
                    mockSignals.signal_reposition_widgets_from();
                }
            }
        };

        // Test the bridge
        await bridgedMachine.transition('layoutComputing');
        expect(mockSignals.signal_reposition_widgets_from).toHaveBeenCalled();
    });
});
