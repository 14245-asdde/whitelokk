# Правила Firestore для WhiteLok

Скопируй и вставь эти правила в Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Пользователи
    match /users/{userId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
    }

    // Инвайты
    match /invites/{inviteId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if false;
    }

    // Логи просмотров
    match /viewLogs/{logId} {
      allow read: if request.auth != null;
      allow create: if true;
      allow update: if false;
      allow delete: if false;
    }

    // Кастомные бейджи
    match /customBadges/{badgeId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }

    // Ключи бейджей
    match /badgeKeys/{keyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if false;
    }
  }
}
```

# Что нужно включить в Firebase Console:
1. Authentication → Sign-in method → Email/Password → Включить
2. Firestore Database → Создать базу данных (в режиме production)
3. Вставить правила выше
```
