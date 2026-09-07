import { createTestComponent } from '../../utils/TestHelpers';

describe('Component Lifecycle', () => {
    test('handles mount/unmount correctly', () => {
        const component = createTestComponent();
        component.mount();
        
        expect(component.isMounted).toBe(true);
        
        component.unmount();
        expect(component.isMounted).toBe(false);
    });

    test('manages state during lifecycle', () => {
        const component = createTestComponent();
        component.mount();
        component.update();
        
        expect(component.getState()).toEqual(expectedState);
    });
});
