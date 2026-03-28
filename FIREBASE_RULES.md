# Firebase Firestore Rules

## ⚠️ ОБЯЗАТЕЛЬНО: Вставь эти правила в Firebase Console → Firestore → Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Профили пользователей
    match /users/{uid} {
      // Читать профиль может любой (для публичного просмотра)
      allow read: if true;
      // Писать может только сам пользователь
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update: if request.auth != null && request.auth.uid == uid;
      allow delete: if request.auth != null && request.auth.uid == uid;
    }

    // Инвайт-коды
    match /inviteCodes/{codeId} {
      // Читать могут только авторизованные
      allow read: if request.auth != null;
      // Создавать может только авторизованный пользователь
      allow create: if request.auth != null;
      // Обновлять (пометить использованным) может любой авторизованный
      allow update: if request.auth != null;
      // Удалять нельзя
      allow delete: if false;
    }

  }
}
```

## Шаги:
1. Firebase Console → Firestore Database → Rules
2. Удали старые правила
3. Вставь правила выше
4. Нажми "Publish"

## Authentication:
1. Firebase Console → Authentication → Sign-in method
2. Включи "Email/Password"
3. Сохрани

## Первый аккаунт:
Для создания первого аккаунта нужен инвайт-код.
Чтобы создать первый код вручную — добавь документ в Firestore:

Коллекция: `inviteCodes`
Поля:
- code: "ТВОЙ_КОД_20_СИМВОЛОВ"  (например: "aB3kLmNqRsTuVwXyZ012")
- isUsed: false
- createdAt: 1700000000000
- createdBy: "admin"
