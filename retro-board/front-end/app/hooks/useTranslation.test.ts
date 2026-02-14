import { renderHook } from '@testing-library/react';
import { useTranslation } from './useTranslation';

describe('useTranslation', () => {
  it('should return t function, i18n instance, and rest', () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current).toHaveProperty('t');
    expect(result.current).toHaveProperty('i18n');
  });

  it('should accept a namespace', () => {
    const { result } = renderHook(() => useTranslation('common'));
    expect(result.current.t).toBeDefined();
  });

  it('should accept an array of namespaces', () => {
    const { result } = renderHook(() => useTranslation(['common', 'auth']));
    expect(result.current.t).toBeDefined();
  });
});
