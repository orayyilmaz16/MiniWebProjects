// models/card.js
export class Card {
  constructor({ cardNumber, pin, accountId, locked = false, pinAttempts = 0 }) {
    this.cardNumber = cardNumber;
    this.pinHash = hashPin(pin);
    this.accountId = accountId;
    this.locked = locked;
    this.pinAttempts = pinAttempts;
  }
  verifyPin(pin) {
    if (this.locked) return { ok: false, reason: 'KART_KİLİTLİ' };
    if (hashPin(pin) !== this.pinHash) {
      this.pinAttempts += 1;
      if (this.pinAttempts >= 3) this.locked = true;
      return { ok: false, reason: 'YANLIŞ_PIN', attempts: this.pinAttempts };
    }
    this.pinAttempts = 0;
    return { ok: true };
  }
}

function hashPin(pin) {
  // Demo amaçlı basit hash; gerçekte kriptografik kullanın
  return String(pin).split('').reverse().join('');
}
