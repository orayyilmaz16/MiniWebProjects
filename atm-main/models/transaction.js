// models/transaction.js
export class Transaction {
  constructor({ id, type, amount, sourceAccountId, targetAccountId, timestamp = Date.now() }) {
    this.id = id;
    this.type = type;
    this.amount = amount;
    this.sourceAccountId = sourceAccountId;
    this.targetAccountId = targetAccountId ?? null;
    this.timestamp = timestamp;
  }
}
