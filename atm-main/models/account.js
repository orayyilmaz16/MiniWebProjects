export class Account{
    constructor({id, ownerName, balance = 0, dailyWithdrawalLimit = 2000}) {
        this.id = id;
        this.ownerName = ownerName;
        this.balance = balance;
        this.dailyWithdrawalLimit = dailyWithdrawalLimit;
        this.withdrawnToday = 0;
    }
    canWithdraw(amount) {
        if (amount <= 0) return { ok: false, reason: 'GEÇERSİZ_TUTAR' };
        if (amount > this.balance) return { ok: false, reason: 'YETERSİZ_BAKİYE' };
        if (this.dailyWithdrawn + amount > this.dailyWithdrawLimit) {
        return { ok: false, reason: 'GÜNLÜK_LİMİT_AŞILDI' };
        }
        return { ok: true };
    }

    withdraw(amount) {
        const check = this.canWithdraw(amount);
        if (!check.ok) return check;
        this.balance -= amount;
        this.dailyWithdrawn += amount;
        return { ok: true, balance: this.balance };
  }
   deposit(amount) {
        if (amount <= 0) return { ok: false, reason: 'GEÇERSİZ_TUTAR' };
        this.balance += amount;
        return { ok: true, balance: this.balance };
  }


}