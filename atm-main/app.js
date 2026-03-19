import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { MemoryRepo } from './ınfra/memoryRepo.js';
import { Account } from './models/account.js';
import { Card } from './models/card.js';
import { AuthService } from './services/authService.js';
import { AccountService } from './services/accountService.js';

const repo = new MemoryRepo();

// Demo verileri
const acc1 = new Account({ id: 'ACC-1', ownerName: 'Oray', balance: 5000, dailyWithdrawLimit: 3000 });
repo.addAccount(acc1);
repo.addCard(new Card({ cardNumber: '4111-1111-1111-1111', pin: '1234', accountId: acc1.id }));

const auth = new AuthService(repo);
const accountSvc = new AccountService(repo);

const rl = readline.createInterface({ input, output });

async function main() {
  console.log('ATM Uygulaması (CLI)');
  const cardNumber = await rl.question('Kart numarası: ');
  const pin = await rl.question('PIN: ');
  const res = auth.authenticate(cardNumber.trim(), pin.trim());
  if (!res.ok) {
    console.log('Giriş başarısız:', res.reason);
    return rl.close();
  }
  const accountId = res.accountId;
  console.log('Giriş başarılı. Hoş geldiniz!');
  let exit = false;
  while (!exit) {
    console.log('\nMenü: 1-Bakiye 2-Çekme 3-Yatırma 4-Transfer 5-Hareketler 0-Çıkış');
    const choice = await rl.question('Seçiminiz: ');
    try {
      switch (choice.trim()) {
        case '1': {
          const b = accountSvc.getBalance(accountId);
          console.log(b.ok ? `Bakiye: ${b.balance}` : `Hata: ${b.reason}`);
          break;
        }
        case '2': {
          const amt = Number(await rl.question('Çekilecek tutar: '));
          const r = accountSvc.withdraw(accountId, amt);
          console.log(r.ok ? `Yeni bakiye: ${r.balance}` : `Hata: ${r.reason}`);
          break;
        }
        case '3': {
          const amt = Number(await rl.question('Yatırılacak tutar: '));
          const r = accountSvc.deposit(accountId, amt);
          console.log(r.ok ? `Yeni bakiye: ${r.balance}` : `Hata: ${r.reason}`);
          break;
        }
        case '4': {
          const target = await rl.question('Hedef hesap ID: ');
          const amt = Number(await rl.question('Transfer tutarı: '));
          const r = accountSvc.transfer(accountId, target.trim(), amt);
          console.log(r.ok ? `Kaynak: ${r.srcBalance} | Hedef: ${r.dstBalance}` : `Hata: ${r.reason}`);
          break;
        }
        case '5': {
          const hist = accountSvc.history(accountId);
          console.table(hist.map(h => ({ id: h.id, type: h.type, amount: h.amount, ts: new Date(h.timestamp).toISOString() })));
          break;
        }
        case '0':
          exit = true; break;
        default:
          console.log('Geçersiz seçim.');
      }
    } catch (err) {
      console.error('Beklenmeyen hata:', err.message);
    }
  }
  console.log('Güle güle.');
  rl.close();
}

main();
