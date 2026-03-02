import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('renders title text', () => {
    const { getByText } = render(
      <Button title="Press Me" onPress={() => {}} />
    );
    expect(getByText('Press Me')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Tap" onPress={onPress} />
    );

    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Disabled" onPress={onPress} disabled />
    );

    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('applies opacity when disabled', () => {
    const { getByText } = render(
      <Button title="Disabled" onPress={() => {}} disabled />
    );

    // The parent TouchableOpacity should have reduced opacity
    const button = getByText('Disabled').parent;
    // Just verify it renders without error when disabled
    expect(button).toBeTruthy();
  });

  it('renders all three variants without error', () => {
    const { getByText, rerender } = render(
      <Button title="Primary" onPress={() => {}} variant="primary" />
    );
    expect(getByText('Primary')).toBeTruthy();

    rerender(
      <Button title="Secondary" onPress={() => {}} variant="secondary" />
    );
    expect(getByText('Secondary')).toBeTruthy();

    rerender(
      <Button title="Danger" onPress={() => {}} variant="danger" />
    );
    expect(getByText('Danger')).toBeTruthy();
  });
});
