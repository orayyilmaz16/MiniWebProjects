export class AuthService {
  constructor(repo) { this.repo = repo; }
  authenticate(cardNumber, pin) {
    const card = this.repo.getCard(cardNumber);
    if (!card) return { ok: false, reason: 'KART_YOK' };
    const res = card.verifyPin(pin);
    if (!res.ok) return res;
    const account = this.repo.getAccount(card.accountId);
    if (!account) return { ok: false, reason: 'HESAP_YOK' };
    return { ok: true, accountId: account.id };
  }
}
