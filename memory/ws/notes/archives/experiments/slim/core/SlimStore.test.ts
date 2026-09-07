import { createSlimStore } from '../../../slim/SlimStore';

describe('Store Updates Integration', () => {
    test('store updates trigger component updates', async () => {
        const store = createSlimStore({
            initial: { hover: null, components: new Map() }
        });
        
        let updateCount = 0;
        store.subscribe(() => updateCount++);
        
        await store.transition('layoutComputing');
        expect(updateCount).toBe(1);
    });

    test('multiple store updates batch correctly', async () => {
        const store = createSlimStore({/*...*/});
        const updates = [];
        
        store.subscribe((state) => updates.push(state.machine.currentState));
        
        await Promise.all([
            store.transition('layoutComputing'),
            store.transition('componentsComputing')
        ]);
        
        expect(updates).toEqual(['idle', 'layoutComputing', 'componentsComputing']);
    });

    test('store updates maintain consistency during transitions', async () => {
        const store = createSlimStore({/*...*/});
        const states = [];
        
        store.subscribe((state) => states.push({
            machineState: state.machine.currentState,
            components: state.components.size
        }));
        
        await store.transition('layoutComputing');
        expect(states.every(s => s.machineState === 'idle' || s.machineState === 'layoutComputing')).toBe(true);
    });
});
