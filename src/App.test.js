import { render } from '@testing-library/react';
import App from './App';

// Mock all child components to avoid canvas issues
jest.mock('./components/graph/GraphCanvas', () => {
  return function MockGraphCanvas() {
    return <div>Graph Canvas Mock</div>;
  };
});

jest.mock('./components/LeftPane', () => {
  return function MockLeftPane() {
    return <div>Left Pane Mock</div>;
  };
});

jest.mock('./components/PropertiesPane', () => {
  return function MockPropertiesPane() {
    return <div>Properties Pane Mock</div>;
  };
});

test('renders without crashing', () => {
  // Just verify the component renders without errors
  render(<App />);
});
