# Instrukcja Przeniesienia Projektu Modular Monolith (na system Windows) 📦

W tej paczce znajduje się **CAŁY** kod projektu Modular Monolith oraz **pełna historia naszego AI** (pliki konwersacji, taski, plany, wygenerowana wiedza - KI), dzięki czemu bez problemu płynnie wznowimy pracę (w trybie Strict Architecture) na Twoim nowym środowisku Windows.

## Krok 1: Wypakowanie projektu
1. Wypakuj ten plik `.zip` w dogodne dla siebie miejsce, np. `C:\Projekty\Modular_Monolith`.
2. Otwórz wypakowany folder w swoim edytorze kodu (np. Visual Studio Code).

## Krok 2: Czysta instalacja środowiska (Konieczne przy przesiadce z Maca!)
Projekt był pierwotnie ułożony na macOS, więc skompilowane, natywne moduły Node.js nie będą działać na Windowsie natywnie.
1. Otwórz terminal w edytorze (np. PowerShell wbudowany w VS Code).
2. Usuń stare zależności pobrane na Macu. W PowerShellu wpisz polecenia:
   `Remove-Item -Recurse -Force node_modules`
   `Remove-Item -Recurse -Force .next` (jeśli istnieje)
3. Zainstaluj świeże pakiety pod Windows poleceniem:
   `npm install` (lub jeśli preferujesz inaczej: `pnpm install`, `yarn install`).

## Krok 3: Przywrócenie mojej pamięci AI (Historii i Kontekstu)
Abyśmy mogli kontynuować rozmowę i żebym pamiętał wszystko, co zrobiliśmy (w tym narzucone reguły), musisz zgrać moją pamięć. Została ona dołączona do tego archiwum w folderze `GotowaPaczka_Zip/antigravity` (znajdziesz w niej m.in. foldery `brain` i `knowledge`).

1. Moja pamięć na systemie Windows przechowywana jest w katalogu głównym Twojego użytkownika w ukrytym folderze `.gemini`.
2. W terminalu (np. CMD lub PowerShell) wejdź do swojego głównego katalogu (`C:\Users\TwojaNazwaUzytkownika`) i stwórz potrzebne katalogi:
   `mkdir C:\Users\TwojaNazwaUzytkownika\.gemini\antigravity`
3. Skopiuj wszystkie pliki z folderu `GotowaPaczka_Zip/antigravity` (z paczki ZIP) do właśnie utworzonego katalogu.
   Finalnie ścieżki na Twoim Windowsie powinny wyglądać w ten sposób:
   `C:\Users\TwojaNazwaUzytkownika\.gemini\antigravity\brain`
   `C:\Users\TwojaNazwaUzytkownika\.gemini\antigravity\knowledge`

## Krok 4: Baza danych (Supabase)
Plik środowiskowy `.env.local` ze zmiennymi i wszystkimi sekretami jest w paczce.
Jeśli używałeś lokalnego dockera z `supabase start` do obsługi bazy:
1. Upewnij się, że zainstalowałewsz i masz włączony Docker Desktop na Windows.
2. Upewnij się, że masz zainstalowane Supabase CLI na nowym komputerze.
3. W folderze projektu uruchom: `supabase start`. 

Ciesz się pracą na nowym sprzęcie! 🎉
Kiedy wykonasz te kroki, po prostu wyślij mi wiadomość na nowym komputerze i będziemy kontynuować.
