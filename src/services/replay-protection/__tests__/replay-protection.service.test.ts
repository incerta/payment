import { ReplayProtectionService, type NonceStore } from '../replay-protection.service';

class InMemoryNonceStore implements NonceStore {
  private readonly values = new Set<string>();

  public async reserveNonce(nonce: string): Promise<boolean> {
    if (this.values.has(nonce)) {
      return false;
    }

    this.values.add(nonce);
    return true;
  }
}

describe('replay protection service', () => {
  test('rejects old timestamps', () => {
    const service = new ReplayProtectionService(new InMemoryNonceStore(), 300, 300);

    expect(() => service.validateTimestamp('1000', 2000)).toThrow('outside allowed time window');
  });

  test('rejects duplicate nonce', async () => {
    const service = new ReplayProtectionService(new InMemoryNonceStore(), 300, 300);

    await service.ensureUniqueNonce('nonce-1');
    await expect(service.ensureUniqueNonce('nonce-1')).rejects.toThrow('replay detected');
  });
});
