import instaloader
import getpass

def takip_analizi(kullanici_adi, sifre):
    L = instaloader.Instaloader()

    print(f"[{kullanici_adi}] hesabına giriş yapılıyor...")

    try:
        # Giriş yapma işlemi
        L.login(kullanici_adi, sifre)
        print("Giriş başarılı! Veriler çekiliyor, bu işlem takipçi sayına göre zaman alabilir...")

        # Profil nesnesini oluştur
        profile = instaloader.Profile.from_username(L.context, kullanici_adi)

        # Takipçileri (Seni takip edenler) çek
        print("Takipçiler yükleniyor...")
        takipçiler = set()
        for follower in profile.get_followers():
            takipçiler.add(follower.username)

        # Takip Edilenleri (Senin takip ettiklerin) çek
        print("Takip edilenler yükleniyor...")
        takip_edilenler = set()
        for followee in profile.get_followees():
            takip_edilenler.add(followee.username)

        # Analiz: Seni takip etmeyenleri bul (Takip Ettiklerin - Takipçilerin)
        vefasizlar = takip_edilenler - takipçiler
        
        # Analiz: Senin takip etmediğin hayranların (Takipçilerin - Takip Ettiklerin)
        hayranlar = takipçiler - takip_edilenler

        print("\n" + "="*40)
        print(f" ANALİZ SONUCU ({len(vefasizlar)} Kişi Seni Geri Takip Etmiyor)")
        print("="*40)

        # Sonuçları ekrana yazdır
        for kisi in vefasizlar:
            print(f"- {kisi}")

        # İstersen dosyaya kaydet
        with open("takip_etmeyenler.txt", "w") as f:
            for kisi in vefasizlar:
                f.write(kisi + "\n")
        
        print(f"\nListe 'takip_etmeyenler.txt' dosyasına da kaydedildi.")

    except instaloader.TwoFactorAuthRequiredException:
        print("İki faktörlü doğrulama hatası! Lütfen 2FA'yı geçici kapatıp deneyin veya session dosyası kullanın.")
    except instaloader.BadCredentialsException:
        print("Hatalı kullanıcı adı veya şifre.")
    except instaloader.ConnectionException as e:
        print(f"Bağlantı hatası: {e}")
    except Exception as e:
        print(f"Beklenmedik bir hata oluştu: {e}")

if __name__ == "__main__":
    print("--- INSTAGRAM TAKİP DEDEKTÖRÜ ---")
    k_adi = input("Kullanıcı Adı: ")
    # Şifreyi gizli almak için getpass kullanıyoruz (Pycharm gibi bazı IDE'lerde çalışmayabilir, terminalde çalışır)
    sifre = getpass.getpass("Şifre: ") 
    
    takip_analizi(k_adi, sifre)