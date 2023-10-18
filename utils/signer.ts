import NDK from '@nostr-dev-kit/ndk'
import { EventSigner, NostrEvent } from '@snort/system'

export class NDKEvnetSigner implements EventSigner {
  private ndk: NDK
  constructor(ndk: NDK) {
    this.ndk = ndk
  }
  init(): Promise<void> {
    return this.ndk.connect()
  }
  getPubKey(): Promise<string> {
    return this.ndk.signer!.user().then((user) => user.hexpubkey)
  }
  nip4Encrypt(content: string, key: string): Promise<string> {
    throw new Error('Method not implemented.')
  }
  nip4Decrypt(content: string, otherKey: string): Promise<string> {
    throw new Error('Method not implemented.')
  }
  nip44Encrypt(content: string, key: string): Promise<string> {
    throw new Error('Method not implemented.')
  }
  nip44Decrypt(content: string, otherKey: string): Promise<string> {
    throw new Error('Method not implemented.')
  }
  async sign(ev: NostrEvent): Promise<NostrEvent> {
    const sig = await this.ndk.signer!.sign(ev)
    ev.sig = sig
    return ev
  }
  get supports(): string[] {
    throw new Error('Method not implemented.')
  }
}
