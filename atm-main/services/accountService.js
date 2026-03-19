import { Transaction } from "../models/transaction.js";

export class AccountService {
  constructor(repo, idGen = () => crypto.randomUUID?.() || String(Date.now())) {
    this.repo = repo; this.idGen = idGen;
  }
  getBalance(accountId) {
    const acc = this.repo.getAccount(accountId);
    if (!acc) return { ok: false, reason: 'HESAP_YOK' };
    return { ok: true, balance: acc.balance };
  }
  deposit(accountId, amount) {
    const acc = this.repo.getAccount(accountId);
    if (!acc) return { ok: false, reason: 'HESAP_YOK' };
    const res = acc.deposit(amount);
    if (!res.ok) return res;
    const tx = new Transaction({ id: this.idGen(), type: 'DEPOSIT', amount, sourceAccountId: accountId });
    this.repo.addTransaction(tx);
    return { ok: true, balance: acc.balance, tx };
  }
  withdraw(accountId, amount) {
    const acc = this.repo.getAccount(accountId);
    if (!acc) return { ok: false, reason: 'HESAP_YOK' };
    const res = acc.withdraw(amount);
    if (!res.ok) return res;
    const tx = new Transaction({ id: this.idGen(), type: 'WITHDRAW', amount, sourceAccountId: accountId });
    this.repo.addTransaction(tx);
    return { ok: true, balance: acc.balance, tx };
  }
  transfer(sourceId, targetId, amount) {
    const src = this.repo.getAccount(sourceId);
    const dst = this.repo.getAccount(targetId);
    if (!src || !dst) return { ok: false, reason: 'HESAP_YOK' };
    const check = src.canWithdraw(amount);
    if (!check.ok) return check;
    if (amount <= 0) return { ok: false, reason: 'GEÇERSİZ_TUTAR' };
    src.balance -= amount;
    dst.balance += amount;
    const tx = new Transaction({ id: this.idGen(), type: 'TRANSFER', amount, sourceAccountId: sourceId, targetAccountId: targetId });
    this.repo.addTransaction(tx);
    return { ok: true, srcBalance: src.balance, dstBalance: dst.balance, tx };
  }
  history(accountId) { return this.repo.listTransactionsByAccount(accountId); }
}
