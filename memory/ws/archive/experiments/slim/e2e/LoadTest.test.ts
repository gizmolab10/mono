import { createTestComponent } from '../../utils/TestHelpers';
import { createSlimStore } from '../../../slim/SlimStore';

describe('Load Testing', () => {
    test('handles multiple concurrent components', async () => {
        const components = Array(100).fill(null).map(() => createTestComponent());
        const store = createSlimStore({/*...*/});
        
        await Promise.all(components.map(c => c.mount()));
        await store.transition('layoutComputing');
        
        expect(components.every(c => c.isMounted)).toBe(true);
        expect(store.getState().machine.currentState).toBe('layoutComputing');
    });
});
