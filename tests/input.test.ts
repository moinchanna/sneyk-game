import { describe, it, expect, beforeEach } from 'vitest';
import { InputManager } from '../src/game/InputManager';

describe('InputManager Buffering Tests', () => {
  let input: InputManager;

  beforeEach(() => {
    input = new InputManager();
  });

  it('should initialize with default direction RIGHT', () => {
    // Call nextDirection to check initial
    expect(input.nextDirection()).toBe('RIGHT');
  });

  it('should accept valid turns', () => {
    // Send event keydown for ArrowUp
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    window.dispatchEvent(event);

    expect(input.nextDirection()).toBe('UP');
  });

  it('should reject direct reverse movement (180 degree turn)', () => {
    // Moving RIGHT (default), try to move LEFT
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    window.dispatchEvent(event);

    // Should ignore and stay RIGHT
    expect(input.nextDirection()).toBe('RIGHT');
  });

  it('should buffer rapid key presses correctly', () => {
    // Default moving RIGHT
    // Press UP, then LEFT in rapid succession (before game tick updates)
    const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });

    window.dispatchEvent(upEvent);
    window.dispatchEvent(leftEvent);

    // Check buffer length (should be 2: UP and LEFT)
    expect(input.getBufferLength()).toBe(2);

    // On first game tick, direction shifts to UP
    expect(input.nextDirection()).toBe('UP');

    // On second game tick, direction shifts to LEFT (which is now legal because we are moving UP!)
    expect(input.nextDirection()).toBe('LEFT');
  });
});
