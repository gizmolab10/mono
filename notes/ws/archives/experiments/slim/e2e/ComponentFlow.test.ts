import { createTestComponent } from '../../utils/TestHelpers';
import { createSlimStore } from '../../../slim/SlimStore';

describe('End-to-End Component Flow', () => {
    test('complete component lifecycle', async () => {
        const component = createTestComponent();
        const store = createSlimStore({/*...*/});
        
        await component.mount();
        await store.transition('layoutComputing');
        await component.update();
        await store.transition('componentsComputing');
        await component.unmount();
        
        expect(component.getLifecycleEvents()).toEqual([
            'mount',
            'layout',
            'update',
            'compute',
            'unmount'
        ]);
    });
});
